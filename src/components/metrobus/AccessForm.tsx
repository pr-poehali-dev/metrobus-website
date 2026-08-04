import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface Props {
  role: 'carrier' | 'regulator';
}

const RECIPIENT_EMAIL = 'media@incode.ru';
const roleLabel: Record<Props['role'], string> = {
  carrier: 'Перевозчик',
  regulator: 'Регулятор',
};

export default function AccessForm({ role }: Props) {
  const [sent, setSent] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [org, setOrg] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');

  // Отправка заявки формирует письмо в почтовом клиенте пользователя.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    const subject = `Заявка на подключение: ${roleLabel[role]}`;
    const bodyLines = [
      `Роль: ${roleLabel[role]}`,
      `Организация: ${org}`,
      `Контактное лицо: ${name}`,
      `Email: ${email}`,
      `Телефон: ${phone || '—'}`,
      `Комментарий: ${comment || '—'}`,
    ];
    const mailtoUrl = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailtoUrl;

    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-secondary/40 p-6 text-center animate-fade-in">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-transport-tram/10">
          <Icon name="Check" className="text-transport-tram" size={24} />
        </div>
        <p className="font-semibold text-foreground">Письмо с заявкой сформировано</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Проверьте почтовый клиент на устройстве и отправьте письмо — мы свяжемся с вами по указанным контактам.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${role}-org`}>Организация</Label>
        <Input id={`${role}-org`} value={org} onChange={(e) => setOrg(e.target.value)} required placeholder="Название организации" className="h-11 text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${role}-name`}>Контактное лицо</Label>
        <Input id={`${role}-name`} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Имя и фамилия" className="h-11 text-base" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${role}-email`}>Email</Label>
          <Input id={`${role}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@company.ru" className="h-11 text-base" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${role}-phone`}>Телефон</Label>
          <Input id={`${role}-phone`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" className="h-11 text-base" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${role}-comment`}>Комментарий</Label>
        <Textarea
          id={`${role}-comment`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Кратко опишите задачу"
          className="min-h-[88px] text-base"
        />
      </div>
      <input type="hidden" name="role" value={role} />
      <div className="flex items-start gap-2">
        <Checkbox
          id={`${role}-agree`}
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor={`${role}-agree`} className="text-xs font-normal leading-relaxed text-muted-foreground">
          Я согласен с{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Пользовательским соглашением
          </a>{' '}
          и{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Политикой конфиденциальности
          </a>
        </Label>
      </div>
      <Button type="submit" disabled={!agreed} className="h-11 w-full text-base">
        Отправить заявку
        <Icon name="Send" size={16} className="ml-2" />
      </Button>
    </form>
  );
}