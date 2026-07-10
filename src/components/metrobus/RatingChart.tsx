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

type SeriesKey = 'bus' | 'tram' | 'trolley';

interface Props {
  data: MultiPoint[];
  detailed?: boolean;
  series?: SeriesKey[];
}

const ALL_SERIES = [
  { key: 'bus' as const, label: 'Автобус', color: 'hsl(var(--tr-bus))' },
  { key: 'tram' as const, label: 'Трамвай', color: 'hsl(var(--tr-tram))' },
  { key: 'trolley' as const, label: 'Троллейбус', color: 'hsl(var(--tr-trolley))' },
];

// Лёгкий SVG-график без внешних зависимостей.
// Показывает линии по видам транспорта одновременно, с легендой.
// series — какие виды транспорта отображать (по умолчанию все три).
// detailed=false — упрощённый (мобильный), detailed=true — с сеткой и точками (десктоп).
const COUNT_KEYS = {
  bus: 'busCount' as const,
  tram: 'tramCount' as const,
  trolley: 'trolleyCount' as const,
};

export default function RatingChart({ data, detailed = false, series }: Props) {
  const SERIES = series ? ALL_SERIES.filter((s) => series.includes(s.key)) : ALL_SERIES;
  const W = 640;
  const H = 220;
  const padX = 8;
  const padRight = detailed ? 34 : 8;
  const padTop = 16;
  const padBottom = 24;
  const min = 3.6;
  const max = 5.0;

  const plotW = W - padX - padRight;
  const stepX = plotW / Math.max(1, data.length - 1);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, stepX, series]);

  const gridLines = [4.0, 4.5, 5.0];

  const hasAnyData = seriesPaths.some((s) => s.points.length > 0);

  // Столбики количества оценок по дням (правая ось)
  const barCounts = useMemo(
    () =>
      data.map((d) =>
        SERIES.reduce((acc, s) => acc + (d[COUNT_KEYS[s.key]] ?? 0), 0)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, series]
  );
  const maxCount = Math.max(1, ...barCounts);
  const niceMax = Math.max(5, Math.ceil(maxCount / 5) * 5);
  const countAreaTop = padTop;
  const countAreaBottom = H - padBottom;
  const scaleCountY = (v: number) =>
    countAreaBottom - (v / niceMax) * (countAreaBottom - countAreaTop);
  const barWidth = Math.max(2, stepX * 0.5);
  const countTicks = [0, niceMax / 2, niceMax];

  // Хронология по оси X — подписи дней
  const dayTickEvery = data.length > 20 ? 5 : data.length > 10 ? 2 : 1;
  const xTicks = data
    .map((d, i) => ({ day: d.day, x: padX + i * stepX }))
    .filter((_, i) => i % dayTickEvery === 0);

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
                x2={W - padRight}
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

        {/* Хронология по оси X — вертикальная подсветка и подписи дней */}
        {detailed &&
          xTicks.map((t) => (
            <g key={`xtick-${t.day}`}>
              <line
                x1={t.x}
                x2={t.x}
                y1={padTop}
                y2={H - padBottom}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="1 3"
                opacity={0.5}
              />
              <text
                x={t.x}
                y={H - padBottom + 14}
                fontSize="10"
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                className="font-mono"
              >
                {t.day}
              </text>
            </g>
          ))}

        {/* Столбики количества оценок по дням, шкала — на правой стороне */}
        {detailed &&
          data.map((d, i) => {
            const x = padX + i * stepX;
            const count = barCounts[i];
            if (!count) return null;
            const y = scaleCountY(count);
            return (
              <rect
                key={`bar-${d.day}`}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={countAreaBottom - y}
                fill="hsl(var(--muted-foreground))"
                opacity={0.15}
                rx={1}
              />
            );
          })}

        {detailed &&
          countTicks.map((t) => (
            <g key={`count-tick-${t}`}>
              <text
                x={W - padRight + 6}
                y={scaleCountY(t) + 3}
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
                className="font-mono"
              >
                {Math.round(t)}
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