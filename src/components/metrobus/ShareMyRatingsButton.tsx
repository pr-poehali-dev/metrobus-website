import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { buildMyRatingsShareUrl } from '@/lib/myRatingsToken';

export default function ShareMyRatingsButton({ token }: { token: string }) {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = buildMyRatingsShareUrl(token);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Мои оценки — МЕТРОБУС.РФ',
          text: 'Ссылка на мои оценки поездок и маршрутов',
          url,
        });
      } catch {
        // пользователь закрыл системное окно — ничего не делаем
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Ссылка скопирована', description: 'Отправьте её себе и откройте на компьютере — оценки подхватятся автоматически.' });
    } catch {
      toast({ variant: 'destructive', title: 'Не удалось скопировать ссылку' });
    }
  };

  return (
    <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-md px-3 text-xs" onClick={handleShare}>
      <Icon name="Monitor" size={14} />
      Открыть на компьютере
    </Button>
  );
}
