import { QualityBreakdown } from '@/lib/adminApi';
import { REASONS, pct } from '@/components/admin/quality/qualityShared';

export function StatCard({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'bad' | 'good' }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono-num text-2xl font-bold ${tone === 'bad' ? 'text-destructive' : tone === 'good' ? 'text-transport-tram' : ''}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Bar({ label, hint, value, total, color }: { label: string; hint?: string; value: number; total: number; color: string }) {
  const p = pct(value, total);
  return (
    <div>
      <div className="flex justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="shrink-0 font-mono-num text-muted-foreground">{value} · {p}%</span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-1 h-2 rounded-full bg-secondary">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function StackedBar({ row }: { row: QualityBreakdown }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
      {REASONS.map((r) =>
        row[r.key] ? <div key={r.key} className={r.color} style={{ width: `${pct(row[r.key], row.total)}%` }} title={`${r.label}: ${row[r.key]}`} /> : null,
      )}
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {REASONS.map((r) => (
        <span key={r.key} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${r.color}`} />
          {r.label}
        </span>
      ))}
    </div>
  );
}
