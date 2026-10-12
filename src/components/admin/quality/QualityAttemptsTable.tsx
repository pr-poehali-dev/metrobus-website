import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { QualityReason, QualityReasonCounts, QualityRow } from '@/lib/adminApi';
import { REASONS, REASON_BY_KEY, formatDist } from '@/components/admin/quality/qualityShared';

interface QualityAttemptsTableProps {
  rows: QualityRow[];
  rc: QualityReasonCounts;
  filter: QualityReason | 'all' | 'rejected';
  setFilter: (v: QualityReason | 'all' | 'rejected') => void;
}

export default function QualityAttemptsTable({ rows, rc, filter, setFilter }: QualityAttemptsTableProps) {
  return (
    <>
      <div className="rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Все попытки ({rows.length})</h3>
          <div className="flex flex-wrap gap-1.5">
            {([['all', 'Все'], ['rejected', 'Все отказы']] as const).map(([k, label]) => (
              <Button key={k} variant={filter === k ? 'default' : 'outline'} size="sm" onClick={() => setFilter(k)}>
                {label}
              </Button>
            ))}
            {REASONS.filter((x) => rc[x.key] > 0).map((x) => (
              <Button key={x.key} variant={filter === x.key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(x.key)}>
                {x.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-3 max-h-[600px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Маршрут</TableHead>
                <TableHead>ТС</TableHead>
                <TableHead>Геопозиция</TableHead>
                <TableHead>До маршрута</TableHead>
                <TableHead>Устройство</TableHead>
                <TableHead>Причина</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((x) => {
                const info = REASON_BY_KEY[x.reason];
                return (
                  <TableRow key={x.id}>
                    <TableCell className="font-mono-num text-xs">{x.id}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{x.created_at?.slice(0, 16) ?? '—'}</TableCell>
                    <TableCell className="text-xs">{x.source_screen === 'inpad' ? 'ИНПАД' : x.source_screen === 'transport-card' ? 'Карточка' : x.source_screen ?? '—'}</TableCell>
                    <TableCell>{x.route_number ?? '—'}</TableCell>
                    <TableCell className="font-mono-num">{x.vehicle_number ?? '—'}</TableCell>
                    <TableCell>
                      {x.geo === 'real' && x.lat !== null ? (
                        <a href={`https://yandex.ru/maps/?pt=${x.lng},${x.lat}&z=16`} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                          На карте
                        </a>
                      ) : (
                        <Badge variant="destructive">{x.geo === 'fallback' ? 'Стандартная точка' : 'Нет'}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={(x.distance_to_route_m ?? 0) > 300 ? 'font-semibold text-destructive' : ''}>{formatDist(x.distance_to_route_m)}</TableCell>
                    <TableCell className="font-mono-num text-xs">{x.client ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={info?.bad ? 'destructive' : x.reason === 'ok' ? 'default' : 'secondary'}>
                        {x.reason === 'other' ? x.result_false : info?.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    Попыток нет.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
