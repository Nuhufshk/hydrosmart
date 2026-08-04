import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

interface ChartProps {
  data: number[];
  color: string;
  height?: number;
  area?: boolean;
  min?: number;
  max?: number;
  strokeWidth?: number;
}

export const Chart = ({ data, color, height = 240, area = false, min, max, strokeWidth = 3 }: ChartProps) => {
  const W = 100;
  const pad = 2;
  const values = data.length ? data : [0, 0];
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const range = hi - lo || 1;
  const stepX = values.length > 1 ? (W - pad * 2) / (values.length - 1) : 0;

  const points = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - lo) / range) * (height - pad * 2),
  }));

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${line} L${last.x.toFixed(2)},${height} L${first.x.toFixed(2)},${height} Z`;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
      {area && (
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.3} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
      )}
      {area && <Path d={areaPath} fill="url(#chartGrad)" />}
      <Path
        d={line}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
