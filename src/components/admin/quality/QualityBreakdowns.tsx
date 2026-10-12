import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { QualityReport } from '@/lib/adminApi';
import { SOURCE_LABELS, pct } from '@/components/admin/quality/qualityShared';
import { StackedBar, Legend } from '@/components/admin/quality/QualityCharts';

interface QualityBreakdownsProps {
  r: QualityReport;
}

export default function QualityBreakdowns({ r }: QualityBreakdownsProps) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">По источнику</h3>
          <div className="mt-4 space-y-4">
            {r.bySource.map((s) => (
              <div key={s.source}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{SOURCE_LABELS[s.source ?? 'unknown'] ?? s.source}</span>
                  <span className="font-mono-num text-muted-foreground">{s.total} · принято {pct(s.ok, s.total)}%</span>
                </div>
                <StackedBar row={s} />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Legend />
          </div>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">По дням</h3>
          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {r.byDay.map((d) => (
              <div key={d.day} className="grid grid-cols-[84px_1fr_40px] items-center gap-3 text-sm">
                <span className="font-mono-num text-xs text-muted-foreground">{d.day}</span>
                <StackedBar row={d} />
                <span className="text-right font-mono-num text-xs">{d.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Места, откуда много попыток</h3>
          <p className="mt-1 text-xs text-muted-foreground">Одна точка (±100 м) и много разных маршрутов — признак ввода номеров не из транспорта.</p>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Точка</TableHead>
                <TableHead>Попыток</TableHead>
                <TableHead>Принято</TableHead>
                <TableHead>Далеко</TableHead>
                <TableHead>Маршрутов</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.topPlaces.map((p) => (
                <TableRow key={`${p.lat},${p.lng}`}>
                  <TableCell>
                    <a href={`https://yandex.ru/maps/?pt=${p.lng},${p.lat}&z=15`} target="_blank" rel="noreferrer" className="font-mono-num text-xs text-primary underline">
                      {p.lat}, {p.lng}
                    </a>
                  </TableCell>
                  <TableCell>{p.attempts}</TableCell>
                  <TableCell>{p.ok}</TableCell>
                  <TableCell className={p.far ? 'text-destructive' : ''}>{p.far}</TableCell>
                  <TableCell title={p.routes.join(', ')}>{p.routes.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Номера ТС: признаки случайного ввода</h3>
          <p className="mt-1 text-xs text-muted-foreground">Один бортовой номер на разных маршрутах или у многих устройств.</p>
          {r.suspiciousVehicles.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Подозрительных номеров не найдено.</p>
          ) : (
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Номер ТС</TableHead>
                  <TableHead>Попыток</TableHead>
                  <TableHead>Отказов</TableHead>
                  <TableHead>Устройств</TableHead>
                  <TableHead>Маршруты</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.suspiciousVehicles.map((v) => (
                  <TableRow key={v.vehicle}>
                    <TableCell className="font-mono-num font-semibold">{v.vehicle}</TableCell>
                    <TableCell>{v.attempts}</TableCell>
                    <TableCell>{v.rejected}</TableCell>
                    <TableCell>{v.clients}</TableCell>
                    <TableCell className="text-xs">{v.routes.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
