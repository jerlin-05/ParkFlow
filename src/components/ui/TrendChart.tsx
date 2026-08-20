// Lightweight, dependency-free SVG bar chart. No charting library required —
// keeps the bundle untouched and matches the app's existing hand-rolled
// BarRow style, just as a proper time-series chart instead of static bars.

interface TrendPoint {
  label: string;
  value: number;
}

export function TrendChart({
  data,
  toneClass = "text-green",
  valuePrefix = "",
}: {
  data: TrendPoint[];
  toneClass?: string;
  valuePrefix?: string;
}) {
  const width = 640;
  const height = 160;
  const padBottom = 22;
  const padTop = 10;
  const barGap = 6;
  const barWidth = data.length ? (width - barGap * (data.length - 1)) / data.length : 0;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-40 w-full ${toneClass}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Hourly revenue trend"
    >
      <line x1="0" y1={height - padBottom} x2={width} y2={height - padBottom} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
      {data.map((d, i) => {
        const barHeight = ((height - padTop - padBottom) * d.value) / max;
        const x = i * (barWidth + barGap);
        const y = height - padBottom - barHeight;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, d.value > 0 ? 2 : 0)}
              rx="2.5"
              fill="currentColor"
              fillOpacity={d.value > 0 ? 0.85 : 0.12}
            >
              <title>
                {d.label}: {valuePrefix}
                {d.value}
              </title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={height - 7}
              textAnchor="middle"
              fontSize="9.5"
              fill="currentColor"
              fillOpacity="0.55"
              fontFamily="var(--font-plex), monospace"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
