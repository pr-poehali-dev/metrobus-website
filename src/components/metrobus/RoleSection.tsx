import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AccessForm from '@/components/metrobus/AccessForm';
import RoleLoginDialog from '@/components/metrobus/RoleLoginDialog';

export default function RoleSection({
  icon, title, value, bullets, role, showLoginActions,
}: {
  icon: string;
  title: string;
  value: string;
  bullets: string[];
  role: 'carrier' | 'regulator';
  showLoginActions?: boolean;
}) {
  const [loginOpen, setLoginOpen] = useState(false);
  const demoPath = role === 'carrier' ? '/carrier-demo' : '/regulator-demo';

  const seoHeadings = role === 'carrier'
    ? {
        h2: 'Оценка качества перевозок для перевозчиков общественного транспорта',
        h3: 'Личный кабинет перевозчика: мониторинг оценок автобусов, трамваев и троллейбусов',
      }
    : {
        h2: 'Независимый мониторинг перевозок для заказчиков транспортных услуг и регуляторов',
        h3: 'Контроль качества наземного общественного транспорта на основе оценок пассажиров',
      };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="sr-only">{seoHeadings.h2}</h2>
        <h3 className="sr-only">{seoHeadings.h3}</h3>
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="mt-3 text-base text-muted-foreground">{value}</p>
        <ul className="mt-5 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <Icon name="Check" size={18} className="mt-0.5 shrink-0 text-transport-tram" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {showLoginActions && (
          <div className="mt-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-5">
            <p className="text-sm font-medium text-foreground">Уже подключены к сервису?</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 w-full gap-2 text-base sm:w-auto" onClick={() => setLoginOpen(true)}>
                <Icon name="LogIn" size={18} />
                Вход в кабинет
              </Button>
              <Link to={demoPath} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full gap-2 border-2 border-primary text-base text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto"
                >
                  <Icon name="FlaskConical" size={18} />
                  Демо-режим
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      <div id={role === 'carrier' ? 'carrier-form' : 'regulator-form'} className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-semibold">Заявка на подключение</h3>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Оставьте контакты — мы расскажем о доступе к данным.
        </p>
        <AccessForm role={role} />
      </div>

      {showLoginActions && (
        <RoleLoginDialog open={loginOpen} onOpenChange={setLoginOpen} role={role} />
      )}
    </div>
  );
}