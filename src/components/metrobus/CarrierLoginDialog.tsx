import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Визуализация экрана входа для перевозчика. Логин и пароль выдаются
// организацией после подключения — здесь только демонстрация формы.
export default function CarrierLoginDialog({ open, onOpenChange }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setSubmitted(false);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            <Icon name="Lock" size={20} className="text-foreground" />
          </div>
          <DialogTitle className="text-center">Вход для перевозчика</DialogTitle>
          <DialogDescription className="text-center">
            Логин и пароль выдаются вашей организации после подключения к сервису.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="rounded-xl border border-border bg-secondary/40 p-5 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-transport-tram/10">
              <Icon name="Info" className="text-transport-tram" size={20} />
            </div>
            <p className="font-semibold">Это демонстрация экрана входа</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Реальный доступ появится после обработки заявки на подключение.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="carrier-login">Логин</Label>
              <Input id="carrier-login" placeholder="Выдаётся при подключении" className="h-11 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="carrier-password">Пароль</Label>
              <Input id="carrier-password" type="password" placeholder="••••••••" className="h-11 text-base" />
            </div>
            <Button type="submit" className="h-11 w-full text-base">
              Войти
              <Icon name="ArrowRight" size={16} className="ml-2" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Ещё нет доступа? Оставьте заявку на подключение ниже.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
