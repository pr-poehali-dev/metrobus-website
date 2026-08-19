import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { fetchStatsCollectionSettings, setStatsCollectionEnabled } from '@/lib/adminApi';

function formatDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function StatsCollectionToggle() {
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStatsCollectionSettings().then((res) => {
      setStartedAt(res?.statsCollectionStartedAt ?? null);
      setLoading(false);
    });
  }, []);

  const handleChange = async (checked: boolean) => {
    setSaving(true);
    const res = await setStatsCollectionEnabled(checked);
    if (res) setStartedAt(res.statsCollectionStartedAt);
    setSaving(false);
  };

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="Loader2" size={13} className="animate-spin" />
        Загрузка настроек…
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Switch checked={!!startedAt} onCheckedChange={handleChange} disabled={saving} />
      <span className="text-muted-foreground">
        Сбор данных для графика
        {startedAt && <span className="ml-1">· с {formatDate(startedAt)}</span>}
      </span>
    </div>
  );
}
