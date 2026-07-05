import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Props {
  role: 'carrier' | 'regulator';
}

export default function AccessForm({ role }: Props) {
  const [sent, setSent] = useState(false);

  // Первая версия: форма собирает данные, но отправка на backend ещё не подключена.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-secondary/40 p-6 text-center animate-fade-in">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-transport-tram/10">
          <Icon name="Check" className="text-transport-tram" size={24} />
        </div>
        <p className="font-semibold text-foreground">Заявка отправлена</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Мы свяжемся с вами по указанным контактам.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${role}-org`}>Организация</Label>
        <Input id={`${role}-org`} required placeholder="Название организации" className="h-11 text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${role}-name`}>Контактное лицо</Label>
        <Input id={`${role}-name`} required placeholder="Имя и фамилия" className="h-11 text-base" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${role}-email`}>Email</Label>
          <Input id={`${role}-email`} type="email" required placeholder="name@company.ru" className="h-11 text-base" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${role}-phone`}>Телефон</Label>
          <Input id={`${role}-phone`} type="tel" placeholder="+7 900 000-00-00" className="h-11 text-base" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${role}-comment`}>Комментарий</Label>
        <Textarea
          id={`${role}-comment`}
          placeholder="Кратко опишите задачу"
          className="min-h-[88px] text-base"
        />
      </div>
      <input type="hidden" name="role" value={role} />
      <Button type="submit" className="h-11 w-full text-base">
        Отправить заявку
        <Icon name="Send" size={16} className="ml-2" />
      </Button>
      <p className="text-xs text-muted-foreground">
        Отправляя заявку, вы соглашаетесь на обработку контактных данных.
      </p>
    </form>
  );
}
