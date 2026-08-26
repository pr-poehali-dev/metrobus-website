import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import {
  fetchChangelogAdmin,
  saveChangelogEntry,
  deleteChangelogEntry,
  ChangelogEntry,
} from '@/lib/adminApi';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface EditState {
  id?: number;
  entryDate: string;
  title: string;
  itemsText: string;
  published: boolean;
  sortOrder: number;
}

function emptyEdit(): EditState {
  return {
    entryDate: new Date().toISOString().slice(0, 10),
    title: '',
    itemsText: '',
    published: true,
    sortOrder: 0,
  };
}

export default function ChangelogManager() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<EditState>(emptyEdit());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchChangelogAdmin();
    setEntries(res ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEdit(emptyEdit());
    setDialogOpen(true);
  };

  const openEdit = (entry: ChangelogEntry) => {
    setEdit({
      id: entry.id,
      entryDate: entry.entryDate,
      title: entry.title,
      itemsText: entry.items.join('\n'),
      published: entry.published,
      sortOrder: entry.sortOrder,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const items = edit.itemsText.split('\n').map((s) => s.trim()).filter(Boolean);
    const ok = await saveChangelogEntry({
      id: edit.id,
      entryDate: edit.entryDate,
      title: edit.title,
      items,
      published: edit.published,
      sortOrder: edit.sortOrder,
    });
    setSaving(false);
    if (ok) {
      setDialogOpen(false);
      load();
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить эту запись из истории обновлений?')) return;
    const ok = await deleteChangelogEntry(id);
    if (ok) load();
  };

  const togglePublished = async (entry: ChangelogEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, published: !e.published } : e)));
    const ok = await saveChangelogEntry({
      id: entry.id,
      entryDate: entry.entryDate,
      title: entry.title,
      items: entry.items,
      published: !entry.published,
      sortOrder: entry.sortOrder,
    });
    if (!ok) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, published: entry.published } : e)));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Записи отображаются на публичной странице /changelog</p>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Icon name="Plus" size={14} />
          Добавить запись
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
      {!loading && entries.length === 0 && <p className="text-sm text-muted-foreground">Записей пока нет.</p>}

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono-num text-xs font-medium text-muted-foreground">
                    {formatDate(entry.entryDate)}
                  </span>
                  <Badge variant={entry.published ? 'default' : 'secondary'}>
                    {entry.published ? 'Опубликовано' : 'Черновик'}
                  </Badge>
                </div>
                <h3 className="mt-2 font-semibold">{entry.title}</h3>
                <ul className="mt-2 space-y-1">
                  {entry.items.map((item, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                      <Icon name="Dot" size={14} className="mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Switch checked={entry.published} onCheckedChange={() => togglePublished(entry)} />
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(entry)}>
                  <Icon name="Pencil" size={14} />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => remove(entry.id)}>
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{edit.id ? 'Редактировать запись' : 'Новая запись'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Дата</label>
              <Input
                type="date"
                value={edit.entryDate}
                onChange={(e) => setEdit((s) => ({ ...s, entryDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Заголовок</label>
              <Input
                value={edit.title}
                onChange={(e) => setEdit((s) => ({ ...s, title: e.target.value }))}
                placeholder="Например: Новая терминология дашборда"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Пункты изменений (по одному на строку)</label>
              <Textarea
                rows={6}
                value={edit.itemsText}
                onChange={(e) => setEdit((s) => ({ ...s, itemsText: e.target.value }))}
                placeholder={'Изменение первое\nИзменение второе'}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Опубликовано</label>
              <Switch
                checked={edit.published}
                onCheckedChange={(v) => setEdit((s) => ({ ...s, published: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={save} disabled={saving || !edit.title || !edit.itemsText.trim()}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
