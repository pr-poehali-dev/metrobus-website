import { useMemo } from 'react';

interface Point {
  day: number;
  value: number;
  count: number;
}

interface Props {
  data: Point[];
  detailed?: boolean;
}

// Лёгкий SVG-график без внешних зависимостей.
// detailed=false — упрощённый (мобильный), detailed=true — с сеткой и точками (десктоп).
export default function RatingChart({ data, detailed = false }: Props) {
  const W = 640;
  const H = 220;
  const padX = 8;
  const padTop = 16;
  const padBottom = 24;
  const min = 3.6;
  const max = 5.0;

  const { linePath, areaPath, points } = useMemo(() => {
    const stepX = (W - padX * 2) / (data.length - 1);
    const scaleY = (v: number) =>
      padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom);
    const pts = data.map((d, i) => ({
      x: padX + i * stepX,
      y: scaleY(d.value),
      ...d,
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H - padBottom} L${pts[0].x.toFixed(1)},${H - padBottom} Z`;
    return { linePath: line, areaPath: area, points: pts };
  }, [data]);

  const gridLines = [4.0, 4.5, 5.0];
  const scaleY = (v: number) =>
    padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`График средней оценки по дням месяца. Значения от ${min} до ${max}.`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--tr-bus))" stopOpacity="0.16" />
          <stop offset="100%" stopColor="hsl(var(--tr-bus))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {detailed &&
        gridLines.map((g) => (
          <g key={g}>
            <line
              x1={padX}
              x2={W - padX}
              y1={scaleY(g)}
              y2={scaleY(g)}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <text
              x={padX}
              y={scaleY(g) - 4}
              fontSize="11"
              fill="hsl(var(--muted-foreground))"
              className="font-mono"
            >
              {g.toFixed(1)}
            </text>
          </g>
        ))}

      <path d={areaPath} fill="url(#ratingFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="hsl(var(--tr-bus))"
        strokeWidth={detailed ? 2 : 2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {detailed &&
        points.map((p) => (
          <circle key={p.day} cx={p.x} cy={p.y} r="2.5" fill="hsl(var(--tr-bus))" />
        ))}

      {/* Крайние точки всегда видны */}
      {[points[0], points[points.length - 1]].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--tr-bus))" strokeWidth="2.5" />
      ))}
    </svg>
  );
}
