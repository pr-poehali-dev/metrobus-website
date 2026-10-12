import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { fetchQualityReport, QualityReport, QualityReason } from '@/lib/adminApi';
import { BUCKETS } from '@/components/admin/quality/qualityShared';
import QualitySummary from '@/components/admin/quality/QualitySummary';
import QualityBreakdowns from '@/components/admin/quality/QualityBreakdowns';
import QualityAttemptsTable from '@/components/admin/quality/QualityAttemptsTable';

export default function AttemptsQuality({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<QualityReason | 'all' | 'rejected'>('all');

  const load = useCallback(() => {
    setLoading(true);
    fetchQualityReport(dateFrom || undefined, dateTo || undefined)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!report || loading || !report.truncated) return;
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [report, loading, load]);

  if (loading && !report) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Icon name="Loader2" size={16} className="animate-spin" />
        Собираю все попытки из ICQR…
      </div>
    );
  }

  if (!report) return <p className="py-12 text-sm text-muted-foreground">Не удалось получить данные.</p>;
  if (report.error) return <p className="py-12 text-sm text-destructive">Ошибка ICQR: {report.error}</p>;

  const r = report;
  const rc = r.reasonCounts;
  const withDistance = BUCKETS.reduce((s, b) => s + (r.distanceBuckets[b.key] ?? 0), 0);
  const farOver1k = (r.rejectedDistanceBuckets.k1_5 ?? 0) + (r.rejectedDistanceBuckets.k5_20 ?? 0) + (r.rejectedDistanceBuckets.k20_plus ?? 0);
  const rows = r.rows.filter((x) =>
    filter === 'all' ? true : filter === 'rejected' ? ['far', 'no_geo', 'not_found', 'other'].includes(x.reason) : x.reason === filter,
  );

  return (
    <div className="space-y-6">
      <QualitySummary r={r} rc={rc} withDistance={withDistance} farOver1k={farOver1k} load={load} loading={loading} />

      <QualityBreakdowns r={r} />

      <QualityAttemptsTable rows={rows} rc={rc} filter={filter} setFilter={setFilter} />
    </div>
  );
}
