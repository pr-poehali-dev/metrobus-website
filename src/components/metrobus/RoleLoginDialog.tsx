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
import { loginWithCredentials, Role } from '@/lib/roleAuthApi';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

const ROLE_CONFIG: Record<Role, { title: string; description: string }> = {
  carrier: {
    title: 'Вход для перевозчика',
    description: 'Логин и пароль выдаются вашей организации после подключения к сервису.',
  },
  regulator: {
    title: 'Вход для заказчика',
    description: 'Логин и пароль выдаются вашему ведомству после подключения к сервису.',
  },
};

// Реальный вход по логину/паролю. Аккаунты для тестового входа выдаются
// вручную после обработки заявки на подключение. Личного кабинета с данными
// пока нет — после успешного входа показывается статус готовности.
export default function RoleLoginDialog({ open, onOpenChange, role }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);
  const config = ROLE_CONFIG[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await loginWithCredentials(role, login, password);
    setLoading(false);
    if (res.ok) {
      setOrgName(res.orgName ?? null);
    } else {
      setError(true);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setOrgName(null);
      setError(false);
      setLogin('');
      setPassword('');
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            <Icon name="Lock" size={20} className="text-foreground" />
          </div>
          <DialogTitle className="text-center">{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {orgName ? (
          <div className="rounded-xl border border-border bg-secondary/40 p-5 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-transport-tram/10">
              <Icon name="CheckCircle2" className="text-transport-tram" size={20} />
            </div>
            <p className="font-semibold">Вход выполнен: {orgName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Личный кабинет с данными пока в разработке и скоро появится. Мы сообщим вам, когда он будет готов.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${role}-login`}>Логин (email)</Label>
              <Input
                id={`${role}-login`}
                type="email"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="you@company.ru"
                required
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${role}-password`}>Пароль</Label>
              <Input
                id={`${role}-password`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 text-base"
              />
            </div>
            {error && (
              <p className="text-center text-sm text-destructive">Неверный логин или пароль</p>
            )}
            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? 'Проверка…' : 'Войти'}
              {!loading && <Icon name="ArrowRight" size={16} className="ml-2" />}
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
