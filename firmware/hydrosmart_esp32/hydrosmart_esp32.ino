#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

// ----------------------------------------------------
// Hardware & Display Setup
// ----------------------------------------------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SH1106G display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

const int EC_PIN = 34; // GPIO 34 (ADC1)
const int PH_PIN = 35; // GPIO 35 (ADC1)

// L298N Motor Driver (Channel A = peristaltic pump, Channel B = solenoid valve)
const int PUMP_IN1 = 25;  // GPIO 25 -> L298N IN1
const int PUMP_IN2 = 26;  // GPIO 26 -> L298N IN2
const int VALVE_IN3 = 16; // GPIO 16 -> L298N IN3
const int VALVE_IN4 = 4;  // GPIO 4  -> L298N IN4

// ----------------------------------------------------
// WiFi & Server Configuration
// ----------------------------------------------------
const char* ssid = "Haruna's A05";
const char* password = "00001111";

#define WEBSOCKET_PORT 80
WebSocketsServer webSocket = WebSocketsServer(WEBSOCKET_PORT);

// State Management
enum ScreenState { STANDBY, CONNECTING, MONITORING };
ScreenState currentState = MONITORING;

float waterTemp = 23.7;
float ecValue = 0.0;
float phValue = 0.0;

unsigned long lastSensorBroadcast = 0;
unsigned long stateTransitionTimer = 0;
bool pendingStateChange = false;

const unsigned long IDLE_FLIP_MS = 10000;  // alternate screens when idle
const unsigned long CONNECT_IP_MS = 5000;  // show IP+port after a client connects
unsigned long lastIdleFlip = 0;
bool idleShowIp = false;

unsigned long lastWiFiRetry = 0;
bool wifiWasConnected = false;

// Device state exposed to the app
bool pump1 = false;
bool pump2 = false;
bool pump3 = false;
bool relay = false;
bool valve = false;
String currentMode = "AUTO";
float targetPH = 6.0;
float targetEC = 1.8;
int batteryPct = 87;
int pumpSpeedPct = 100;   // 0-100% PWM duty for the pump
int valveSpeedPct = 100;  // 0-100% PWM duty for the valve

char uptimeStr[16];

// ----------------------------------------------------
// Auto-Dosing
//   pump1 (acid solution) -> lowers pH, raises EC
//   valve (water)         -> raises pH, lowers EC
//   pH has priority; EC is handled while pH is in range
// ----------------------------------------------------
const float EC_HYSTERESIS = 0.05;   // mS/cm
const float PH_HYSTERESIS = 0.1;    // pH
const unsigned long DOSE_MAX_RUN_MS = 30000;  // safety stop per dose cycle
const unsigned long DOSE_COOLDOWN_MS = 15000; // min time between dose cycles

struct Doser {
  bool state = false;
  bool cooling = false;
  unsigned long started = 0;
  unsigned long cooldownStart = 0;
};

Doser acidDoser;
Doser waterDoser;

// ----------------------------------------------------
// Sensor Calibration (persisted in NVS)
//   pH model:  pH = phSlope * V + phOffset
//   EC model:  EC(mS/cm) = (V - ecOffset) * ecSlope / tempCoeff
// ----------------------------------------------------
float phSlope = 3.5;       // default pH per volt
float phOffset = 0.0;      // default pH at 0 V
float ecSlope = 13.36;     // default mS/cm per volt
float ecOffset = 0.0397;   // default zero-point voltage
float phVoltage = 0.0;     // latest raw pH ADC voltage
float ecVoltage = 0.0;     // latest raw EC ADC voltage
bool phCalibrated = false;
bool ecCalibrated = false;
bool phHaveFirst = false;  // true after 1st pH calibration point
float calPH1 = 0.0, calV1 = 0.0;
float calPH2 = 0.0, calV2 = 0.0;

Preferences prefs;

// ----------------------------------------------------
// Helper Function: Render OLED Display States
// ----------------------------------------------------
void updateDisplay() {
  display.clearDisplay();

  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor((SCREEN_WIDTH - (strlen("HYDROSMART MONITOR") * 6)) / 2, 0);
  display.println("HYDROSMART MONITOR");
  display.drawLine(0, 10, 128, 10, SH110X_WHITE);

  switch (currentState) {
    case STANDBY:
      display.setCursor(0, 20);
      if (WiFi.status() == WL_CONNECTED) {
        display.print("IP: ");
        display.println(WiFi.localIP());
      } else {
        display.println("IP: WiFi Offline");
      }

      display.setCursor(0, 40);
      display.print("PORT: ");
      display.println(WEBSOCKET_PORT);
      break;

    case CONNECTING:
      display.setCursor(0, 30);
      display.setTextSize(1);
      display.println("Connecting...");
      break;

    case MONITORING:
      display.setCursor(0, 12);
      display.setTextSize(1);
      display.print("pH : ");
      display.print(phValue, 2);

      display.setCursor(0, 22);
      display.print("EC : ");
      display.print(ecValue, 2);
      display.print(" mS/cm");

      display.setCursor(0, 32);
      display.print("Pump:");
      display.print(pump1 ? "ON" : "OFF");

      display.setCursor(0, 42);
      display.print("Valve:");
      display.print(valve ? "ON" : "OFF");
      break;
  }

  display.display();
}

void formatUptime() {
  unsigned long s = millis() / 1000;
  sprintf(uptimeStr, "%02lu:%02lu:%02lu", (s / 3600) % 100, (s / 60) % 60, s % 60);
}

// Send a full status snapshot back to a connected client
void sendStatus(uint8_t num, int id) {
  formatUptime();
  StaticJsonDocument<512> resp;
  resp["id"] = id;
  resp["type"] = "status";
  JsonObject data = resp.createNestedObject("data");
  data["ph"] = phValue;
  data["ec"] = ecValue;
  data["temperature"] = waterTemp;
  data["battery"] = batteryPct;
  data["wifi"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -100;
  data["pump1"] = pump1;
  data["pump2"] = pump2;
  data["pump3"] = pump3;
  data["relay"] = relay;
  data["valve"] = valve;
  data["mode"] = currentMode;
  data["pumpSpeed"] = pumpSpeedPct;
  data["valveSpeed"] = valveSpeedPct;
  data["uptime"] = uptimeStr;
  char respBuf[600];
  size_t respLen = serializeJson(resp, respBuf);
  webSocket.sendTXT(num, respBuf, respLen);
}

void sendOk(uint8_t num, int id) {
  StaticJsonDocument<128> ok;
  ok["id"] = id;
  ok["type"] = "ok";
  char okBuf[160];
  size_t okLen = serializeJson(ok, okBuf);
  webSocket.sendTXT(num, okBuf, okLen);
}

// ----------------------------------------------------
// L298N Output Control (PWM on IN1/IN3 sets speed; IN2/IN4 stay LOW)
// ----------------------------------------------------
void applyOutputs() {
  int pumpDuty = pump1 ? map(pumpSpeedPct, 0, 100, 0, 255) : 0;
  int valveDuty = valve ? map(valveSpeedPct, 0, 100, 0, 255) : 0;
  analogWrite(PUMP_IN1, pumpDuty);
  digitalWrite(PUMP_IN2, LOW);
  analogWrite(VALVE_IN3, valveDuty);
  digitalWrite(VALVE_IN4, LOW);
  Serial.printf("[OUTPUT] Pump: %s (%d%%) | Valve: %s (%d%%)\n",
                pump1 ? "ON" : "OFF", pumpSpeedPct, valve ? "ON" : "OFF", valveSpeedPct);
}

// Drive one dosing output toward its target with hysteresis.
// Returns true if the output state actually changed.
bool updateDoser(Doser& d, bool needsDose, bool reached, unsigned long now, bool* out, const char* name) {
  if (d.cooling) {
    if (now - d.cooldownStart >= DOSE_COOLDOWN_MS) d.cooling = false;
  } else if (d.state) {
    if (reached || now - d.started >= DOSE_MAX_RUN_MS) {
      d.state = false;
      d.cooling = true;
      d.cooldownStart = now;
      Serial.printf("[AUTO] %s dosing stopped%s\n", name, reached ? " (target reached)" : " (max run time)");
    }
  } else {
    if (needsDose) {
      d.state = true;
      d.started = now;
      Serial.printf("[AUTO] %s dosing started\n", name);
    }
  }
  bool changed = (*out != d.state);
  *out = d.state;
  return changed;
}

// Runs only in AUTO mode. Evaluates targets and drives the dosing outputs.
// pH has priority: pump1 (acid) lowers pH, valve (water) raises pH.
// When pH is in range the same outputs steer EC: acid solution raises EC,
// water dilutes it.
void runAutoDosing() {
  if (currentMode != "AUTO") return;
  unsigned long now = millis();

  bool acidWanted = false;
  bool waterWanted = false;
  if (phValue > targetPH + PH_HYSTERESIS) {
    acidWanted = true;                     // too alkaline -> dose acid
  } else if (phValue < targetPH - PH_HYSTERESIS) {
    waterWanted = true;                    // too acidic -> add water
  } else if (ecValue < targetEC - EC_HYSTERESIS) {
    acidWanted = true;                     // EC low -> dose solution
  } else if (ecValue > targetEC + EC_HYSTERESIS) {
    waterWanted = true;                    // EC high -> dilute with water
  }

  bool changed = updateDoser(acidDoser, acidWanted, !acidWanted, now, &pump1, "ACID");
  changed |= updateDoser(waterDoser, waterWanted, !waterWanted, now, &valve, "WATER");

  if (changed) applyOutputs();
}

// ----------------------------------------------------
// Calibration: pH (1- or 2-point) and EC (offset + slope)
// ----------------------------------------------------
void saveCalibration() {
  prefs.putFloat("phSlope", phSlope);
  prefs.putFloat("phOffset", phOffset);
  prefs.putFloat("ecSlope", ecSlope);
  prefs.putFloat("ecOffset", ecOffset);
  prefs.putBool("phCal", phCalibrated);
  prefs.putBool("ecCal", ecCalibrated);
}

void loadCalibration() {
  phSlope = prefs.getFloat("phSlope", 3.5);
  phOffset = prefs.getFloat("phOffset", 0.0);
  ecSlope = prefs.getFloat("ecSlope", 13.36);
  ecOffset = prefs.getFloat("ecOffset", 0.0397);
  phCalibrated = prefs.getBool("phCal", false);
  ecCalibrated = prefs.getBool("ecCal", false);
}

void resetCalibration(bool ecOnly) {
  if (!ecOnly) {
    phSlope = 3.5;
    phOffset = 0.0;
    phCalibrated = false;
    phHaveFirst = false;
  }
  ecSlope = 13.36;
  ecOffset = 0.0397;
  ecCalibrated = false;
  saveCalibration();
  Serial.println("Calibration reset to defaults.");
}

void calibratePH(float bufferPH, float voltage) {
  if (bufferPH <= 0.0) {
    Serial.println("PH CAL: invalid buffer value. Use e.g. 'calph 7' or 'calph 4'.");
    return;
  }
  if (phHaveFirst) {
    calPH2 = bufferPH;
    calV2 = voltage;
    if (fabs(calV2 - calV1) < 0.005) {
      Serial.println("PH CAL ERROR: voltages too close. Use a second, different buffer.");
      phHaveFirst = false;
      return;
    }
    phSlope = (calPH2 - calPH1) / (calV2 - calV1);
    phOffset = calPH1 - phSlope * calV1;
    phCalibrated = true;
    phHaveFirst = false;
    saveCalibration();
    Serial.printf("PH CAL DONE (2-point): slope=%.3f pH/V, offset=%.3f -> reads %.2f\n",
                  phSlope, phOffset, phSlope * voltage + phOffset);
  } else {
    phHaveFirst = true;
    calPH1 = bufferPH;
    calV1 = voltage;
    phOffset = bufferPH - phSlope * voltage;
    phCalibrated = true;
    saveCalibration();
    Serial.printf("PH CAL (1-point @ %.2f): offset=%.3f -> reads %.2f. Send 'calph <value>' in a second buffer for 2-point.\n",
                  bufferPH, phOffset, phSlope * voltage + phOffset);
  }
}

void calibrateEC(float standardUS, float voltage) {
  if (standardUS < 0.0) return;
  if (standardUS == 0.0) {
    ecOffset = voltage;
    ecCalibrated = true;
    saveCalibration();
    Serial.printf("EC ZERO/OFFSET SET: %.4f V. Now dip in a standard and send 'calec <uS/cm>'.\n", voltage);
    return;
  }
  float vDiff = voltage - ecOffset;
  if (fabs(vDiff) < 0.0005) {
    Serial.println("EC CAL ERROR: signal too low. Is the probe fully in the standard solution?");
    return;
  }
  ecSlope = (standardUS / 1000.0) / vDiff;
  ecCalibrated = true;
  saveCalibration();
  float tempCoeff = 1.0 + 0.02 * (waterTemp - 25.0);
  Serial.printf("EC CAL DONE: slope=%.4f (mS/cm per V) -> reads %.2f mS/cm\n",
                ecSlope, (voltage - ecOffset) * ecSlope / tempCoeff);
}

void printCalibration() {
  Serial.printf("pH: calibrated=%s, slope=%.3f, offset=%.3f, V=%.3f -> reads %.2f\n",
                phCalibrated ? "yes" : "no", phSlope, phOffset, phVoltage, phSlope * phVoltage + phOffset);
  Serial.printf("EC: calibrated=%s, slope=%.4f, offset=%.4f, V=%.4f -> reads %.2f mS/cm\n",
                ecCalibrated ? "yes" : "no", ecSlope, ecOffset, ecVoltage,
                (ecVoltage - ecOffset) * ecSlope / (1.0 + 0.02 * (waterTemp - 25.0)));
}

void printCalHelp() {
  Serial.println();
  Serial.println("--- HydroSmart Calibration ---");
  Serial.println("  pH: dip probe in buffer, wait for a stable value, then:");
  Serial.println("      calph 7      (1st point, also works alone as 1-point)");
  Serial.println("      calph 4      (2nd point -> 2-point slope+offset)");
  Serial.println("      calph reset  (back to defaults)");
  Serial.println("  EC: dip probe in clean water then a standard solution:");
  Serial.println("      calec 0      (set zero/offset in clean water - optional)");
  Serial.println("      calec 1413   (standard in uS/cm, e.g. 1413 uS/cm)");
  Serial.println("      calec reset  (back to defaults)");
  Serial.println("  cal              (show current calibration)");
  Serial.println("  pump on/off      (peristaltic pump)");
  Serial.println("  valve on/off     (solenoid valve)");
  Serial.println("------------------------------");
  Serial.println();
}

void handleSerialCommand() {
  while (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() == 0) continue;

    if (cmd == "help") {
      printCalHelp();
    } else if (cmd == "cal") {
      printCalibration();
    } else if (cmd.startsWith("calph")) {
      String val = cmd.substring(5);
      val.trim();
      if (val == "reset" || val == "clear") {
        resetCalibration(false);
      } else {
        calibratePH(val.toFloat(), phVoltage);
      }
    } else if (cmd.startsWith("calec")) {
      String val = cmd.substring(5);
      val.trim();
      if (val == "reset" || val == "clear") {
        resetCalibration(true);
      } else {
        calibrateEC(val.toFloat(), ecVoltage);
      }
    } else if (cmd == "pump on") {
      if (currentMode == "AUTO") { Serial.println("Manual control blocked in AUTO mode."); continue; }
      pump1 = true;
      valve = false;  // pump & valve are mutually exclusive
      applyOutputs();
    } else if (cmd == "pump off") {
      if (currentMode == "AUTO") { Serial.println("Manual control blocked in AUTO mode."); continue; }
      pump1 = false;
      applyOutputs();
    } else if (cmd == "valve on") {
      if (currentMode == "AUTO") { Serial.println("Manual control blocked in AUTO mode."); continue; }
      valve = true;
      pump1 = false;  // pump & valve are mutually exclusive
      applyOutputs();
    } else if (cmd == "valve off") {
      if (currentMode == "AUTO") { Serial.println("Manual control blocked in AUTO mode."); continue; }
      valve = false;
      applyOutputs();
    } else {
      Serial.println("Unknown command. Type 'help' for calibration instructions.");
    }
  }
}

// ----------------------------------------------------
// WebSocket Event Handler
// ----------------------------------------------------
void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] App Disconnected\n", num);
      if (webSocket.connectedClients() == 0) {
        currentState = MONITORING;
        pendingStateChange = false;
        idleShowIp = false;
        lastIdleFlip = millis();
        updateDisplay();
      }
      break;

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Client connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);

      // Show IP + port so the user can read/verify it, then go to monitoring
      currentState = STANDBY;
      updateDisplay();

      stateTransitionTimer = millis();
      pendingStateChange = true;

      String connectMsg = "{\"event\":\"CONNECTED\",\"status\":\"OK\"}";
      webSocket.sendTXT(num, connectMsg);
      break;
    }

    case WStype_TEXT: {
      StaticJsonDocument<512> doc;
      if (deserializeJson(doc, (const char*)payload, length)) break;

      int id = doc["id"] | -1;
      const char* command = doc["command"];

      if (command == nullptr) {
        // No command -> the app is requesting a status snapshot
        sendStatus(num, id);
        break;
      }

      if (!strcmp(command, "set_pump")) {
        if (currentMode == "AUTO") {
          Serial.println("[MODE] Manual pump control blocked in AUTO mode.");
        } else {
          int pump = doc["pump"] | 0;
          bool state = doc["state"] | false;
          if (pump == 1) {
            pump1 = state;
            if (state) valve = false;  // pump & valve are mutually exclusive
          }
          else if (pump == 2) pump2 = state;
          else if (pump == 3) pump3 = state;
          applyOutputs();
        }
      } else if (!strcmp(command, "set_relay")) {
        if (currentMode == "AUTO") {
          Serial.println("[MODE] Manual relay control blocked in AUTO mode.");
        } else {
          relay = doc["state"] | false;
        }
      } else if (!strcmp(command, "set_valve")) {
        if (currentMode == "AUTO") {
          Serial.println("[MODE] Manual valve control blocked in AUTO mode.");
        } else {
          valve = doc["state"] | false;
          if (valve) pump1 = false;  // pump & valve are mutually exclusive
          applyOutputs();
        }
      } else if (!strcmp(command, "set_speed")) {
        JsonObject speed = doc["speed"];
        if (speed.containsKey("pump")) {
          pumpSpeedPct = constrain((int)speed["pump"], 0, 100);
          prefs.putInt("pumpSpeed", pumpSpeedPct);
        }
        if (speed.containsKey("valve")) {
          valveSpeedPct = constrain((int)speed["valve"], 0, 100);
          prefs.putInt("valveSpeed", valveSpeedPct);
        }
        applyOutputs();
        Serial.printf("[SPEED] pump=%d%% valve=%d%%\n", pumpSpeedPct, valveSpeedPct);
      } else if (!strcmp(command, "set_mode")) {
        const char* mode = doc["mode"];
        if (mode != nullptr && (!strcmp(mode, "AUTO") || !strcmp(mode, "MANUAL"))) {
          currentMode = mode;
          prefs.putString("mode", currentMode);
          if (currentMode == "MANUAL") {
            // Stop any in-progress auto dosing and return control to manual
            acidDoser.state = false;
            acidDoser.cooling = false;
            waterDoser.state = false;
            waterDoser.cooling = false;
            applyOutputs();
          }
          Serial.printf("[MODE] Switched to %s mode\n", currentMode.c_str());
        }
      } else if (!strcmp(command, "set_settings")) {
        if (doc["settings"].containsKey("targetPH")) targetPH = doc["settings"]["targetPH"];
        if (doc["settings"].containsKey("targetEC")) targetEC = doc["settings"]["targetEC"];
        prefs.putFloat("targetPH", targetPH);
        prefs.putFloat("targetEC", targetEC);
        Serial.printf("[SETTINGS] targetPH=%.1f targetEC=%.1f\n", targetPH, targetEC);
      } else if (!strcmp(command, "calibrate")) {
        const char* sensor = doc["sensor"];
        const char* action = doc["action"];
        if (sensor != nullptr) {
          if (!strcmp(sensor, "ph")) {
            if (action != nullptr && !strcmp(action, "reset")) resetCalibration(false);
            else calibratePH(doc["value"] | 0.0, phVoltage);
          } else if (!strcmp(sensor, "ec")) {
            if (action != nullptr && !strcmp(action, "reset")) resetCalibration(true);
            else calibrateEC(doc["value"] | 0.0, ecVoltage);
          }
        }
      }

      sendOk(num, id);
      break;
    }

    case WStype_PONG:
      break;

    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  analogReadResolution(12);
  analogSetPinAttenuation(EC_PIN, ADC_11db);
  analogSetPinAttenuation(PH_PIN, ADC_11db);

  // L298N outputs (start everything OFF)
  pinMode(PUMP_IN1, OUTPUT);
  pinMode(PUMP_IN2, OUTPUT);
  pinMode(VALVE_IN3, OUTPUT);
  pinMode(VALVE_IN4, OUTPUT);
  applyOutputs();

  Wire.begin(21, 22);
  delay(250);
  if (!display.begin(0x3C, true)) {
    Serial.println("OLED Allocation Failed!");
  }

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");

    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SH110X_WHITE);
    display.setCursor(0, 0);
    display.println("HYDROSMART");
    display.drawLine(0, 10, 128, 10, SH110X_WHITE);
    display.setCursor(0, 22);
    display.println("Connecting WiFi...");
    display.setCursor(0, 42);
    for (int k = 0; k < (attempts % 10); k++) {
      display.print(".");
    }
    display.display();

    attempts++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.print("WiFi Connection Failed! Status: ");
    Serial.println(WiFi.status());
  }
  wifiWasConnected = (WiFi.status() == WL_CONNECTED);

  updateDisplay();

  prefs.begin("cal", false);
  loadCalibration();

  // Load persisted mode & dosing targets (fall back to MANUAL so nothing runs on boot)
  currentMode = prefs.getString("mode", "MANUAL");
  if (currentMode != "AUTO" && currentMode != "MANUAL") currentMode = "MANUAL";
  targetPH = prefs.getFloat("targetPH", 6.0);
  targetEC = prefs.getFloat("targetEC", 1.8);
  pumpSpeedPct = prefs.getInt("pumpSpeed", 100);
  valveSpeedPct = prefs.getInt("valveSpeed", 100);
  Serial.printf("[MODE] mode=%s targetPH=%.1f targetEC=%.1f speeds=%d%%/%d%%\n",
                currentMode.c_str(), targetPH, targetEC, pumpSpeedPct, valveSpeedPct);

  // Initialize WebSockets
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  // Enable Heartbeat Keep-Alive
  webSocket.enableHeartbeat(1500, 3000, 5);

  Serial.printf("WebSocket Server started on port %d with Heartbeat Enabled\n", WEBSOCKET_PORT);
  printCalHelp();
}

void loop() {
  // Auto-reconnect WiFi: retry every 10s if the network comes back
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiWasConnected) {
      wifiWasConnected = true;
      Serial.print("WiFi Connected! IP: ");
      Serial.println(WiFi.localIP());
      updateDisplay();
    }
  } else {
    wifiWasConnected = false;
    if (millis() - lastWiFiRetry >= 10000) {
      lastWiFiRetry = millis();
      Serial.println("[WiFi] Offline, retrying connection...");
      WiFi.begin(ssid, password);
      updateDisplay();
    }
  }

  webSocket.loop();
  handleSerialCommand();

  // Non-blocking UI state transition (show IP+port for a while after connect)
  if (pendingStateChange && (millis() - stateTransitionTimer >= CONNECT_IP_MS)) {
    pendingStateChange = false;
    currentState = MONITORING;
    updateDisplay();
  }

  // Idle: alternate monitoring and IP+port screens when no app is connected
  if (webSocket.connectedClients() == 0 && !pendingStateChange) {
    if (millis() - lastIdleFlip >= IDLE_FLIP_MS) {
      lastIdleFlip = millis();
      idleShowIp = !idleShowIp;
      currentState = idleShowIp ? STANDBY : MONITORING;
      updateDisplay();
    }
  }

  // Read sensors & stream data every 1 second
  if (millis() - lastSensorBroadcast >= 1000) {
    lastSensorBroadcast = millis();

    // 1. Read EC Sensor
    long sumEC = 0;
    for (int i = 0; i < 20; i++) {
      sumEC += analogRead(EC_PIN);
    }
    float rawEC = sumEC / 20.0;
    ecVoltage = (rawEC / 4095.0) * 3.3;
    float tempCoeff = 1.0 + 0.02 * (waterTemp - 25.0);
    
    // Unclamped EC calculation (prevents artificially sticking at 0.5)
    ecValue = (ecVoltage - ecOffset) * ecSlope / tempCoeff;
    if (ecValue < 0.0) ecValue = 0.0; // Keep non-negative

    // 2. Read pH Sensor
    long sumPH = 0;
    for (int i = 0; i < 20; i++) {
      sumPH += analogRead(PH_PIN);
    }
    float rawPH = sumPH / 20.0;
    phVoltage = (rawPH / 4095.0) * 3.3;
    
    // Unclamped pH calculation (prevents artificially sticking at 5.0)
    phValue = phSlope * phVoltage + phOffset;
    if (phValue < 0.0) phValue = 0.0;
    if (phValue > 14.0) phValue = 14.0;

    // Auto-dosing: drive pump/pH outputs toward targets in AUTO mode
    runAutoDosing();

    // Output live diagnostic voltages to Serial Monitor
    Serial.printf("[SENSORS] EC Pin V: %.3f V -> EC: %.2f mS/cm | pH Pin V: %.3f V -> pH: %.2f\n", 
                  ecVoltage, ecValue, phVoltage, phValue);

    // 3. Refresh display if active
    if (currentState == MONITORING) {
      updateDisplay();
    }

    // 4. Stream data payload
    String sensorPayload = "{\"event\":\"SENSOR_DATA\",\"ec\":" + String(ecValue, 2) + ",\"ph\":" + String(phValue, 2) + "}";
    webSocket.broadcastTXT(sensorPayload);
  }
}