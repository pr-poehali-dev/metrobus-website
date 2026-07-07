import { useMemo } from 'react';

export interface MultiPoint {
  day: number;
  bus: number | null;
  tram: number | null;
  trolley: number | null;
  busCount?: number;
  tramCount?: number;
  trolleyCount?: number;
}

interface Props {
  data: MultiPoint[];
  detailed?: boolean;
}

const SERIES = [
  { key: 'bus' as const, label: 'Автобус', color: 'hsl(var(--tr-bus))' },
  { key: 'tram' as const, label: 'Трамвай', color: 'hsl(var(--tr-tram))' },
  { key: 'trolley' as const, label: 'Троллейбус', color: 'hsl(var(--tr-trolley))' },
];

// Лёгкий SVG-график без внешних зависимостей.
// Показывает три линии (автобус/трамвай/троллейбус) одновременно, с легендой.
// detailed=false — упрощённый (мобильный), detailed=true — с сеткой и точками (десктоп).
export default function RatingChart({ data, detailed = false }: Props) {
  const W = 640;
  const H = 220;
  const padX = 8;
  const padTop = 16;
  const padBottom = 24;
  const min = 3.6;
  const max = 5.0;

  const stepX = (W - padX * 2) / Math.max(1, data.length - 1);
  const scaleY = (v: number) =>
    padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom);

  const seriesPaths = useMemo(() => {
    return SERIES.map((s) => {
      const pts = data
        .map((d, i) => ({ x: padX + i * stepX, y: d[s.key], day: d.day }))
        .filter((p): p is { x: number; y: number; day: number } => p.y !== null);

      if (pts.length === 0) return { ...s, linePath: '', points: [] as { x: number; y: number; day: number }[] };

      let line = '';
      let prevDay: number | null = null;
      pts.forEach((p) => {
        const isBreak = prevDay !== null && p.day - prevDay > 1;
        line += `${line === '' || isBreak ? 'M' : 'L'}${p.x.toFixed(1)},${scaleY(p.y).toFixed(1)} `;
        prevDay = p.day;
      });

      return { ...s, linePath: line.trim(), points: pts.map((p) => ({ x: p.x, y: scaleY(p.y), day: p.day })) };
    });
  }, [data, stepX]);

  const gridLines = [4.0, 4.5, 5.0];

  const hasAnyData = seriesPaths.some((s) => s.points.length > 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`График средней оценки по дням месяца по видам транспорта. Значения от ${min} до ${max}.`}
        preserveAspectRatio="none"
      >
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

        {!hasAnyData && (
          <text
            x={W / 2}
            y={H / 2}
            fontSize="13"
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
          >
            Нет данных за этот период
          </text>
        )}

        {seriesPaths.map((s) => (
          <g key={s.key}>
            {s.linePath && (
              <path
                d={s.linePath}
                fill="none"
                stroke={s.color}
                strokeWidth={detailed ? 2 : 2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {detailed &&
              s.points.map((p) => (
                <circle key={`${s.key}-${p.day}`} cx={p.x} cy={p.y} r="2.5" fill={s.color} />
              ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
