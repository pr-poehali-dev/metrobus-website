import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

export default function CityRequestForm() {
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
        <p className="font-semibold text-foreground">Заявка принята</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Спасибо! Учтём ваш город при выборе следующей площадки запуска.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="city-request-city">Город</Label>
        <Input id="city-request-city" required placeholder="Например, Москва" className="h-11 text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="city-request-email">Email или телефон</Label>
        <Input id="city-request-email" required placeholder="Для обратной связи" className="h-11 text-base" />
      </div>
      <Button type="submit" className="h-11 w-full text-base">
        Хочу такой сервис у себя
        <Icon name="Send" size={16} className="ml-2" />
      </Button>
    </form>
  );
}
