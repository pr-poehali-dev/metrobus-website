import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import CityCombobox from '@/components/metrobus/CityCombobox';
import { RU_CITIES } from '@/lib/ruCities';
import { SOCIAL_LINKS } from '@/lib/socialLinks';
import { fetchCityByIp, submitCityVote } from '@/lib/dashboardApi';

export default function CityRequestForm() {
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCityByIp().then((geo) => {
      if (cancelled) return;
      setDetecting(false);
      if (geo?.city) {
        const match = RU_CITIES.find((c) => c.city.toLowerCase() === geo.city!.toLowerCase());
        setDetectedCity(match ? match.city : geo.city);
        setSelectedCity(match ? match.label : geo.city!);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedEntry = RU_CITIES.find((c) => c.label === selectedCity);
  const isOwnCity =
    !!detectedCity &&
    !!selectedEntry &&
    selectedEntry.city.toLowerCase() === detectedCity.toLowerCase();

  const handleVote = async (network: keyof typeof SOCIAL_LINKS) => {
    if (!isOwnCity) return;
    await submitCityVote(selectedEntry!.city, selectedEntry!.region);
    setVoted(true);
    window.open(SOCIAL_LINKS[network], '_blank', 'noopener,noreferrer');
  };

  if (voted) {
    return (
      <div className="rounded-xl border border-border bg-secondary/40 p-6 text-center animate-fade-in">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-transport-tram/10">
          <Icon name="Check" className="text-transport-tram" size={24} />
        </div>
        <p className="font-semibold text-foreground">Голос учтён</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Спасибо! Учтём ваш город при выборе следующей площадки запуска.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Ваш город</Label>
        <CityCombobox value={selectedCity} onChange={setSelectedCity} />
        {detecting && (
          <p className="text-xs text-muted-foreground">Определяем ваш город по IP-адресу...</p>
        )}
        {!detecting && selectedCity && !isOwnCity && (
          <p className="text-xs text-destructive">
            Голосовать можно только за город, в котором вы сейчас находитесь.
          </p>
        )}
        {!detecting && isOwnCity && (
          <p className="text-xs text-muted-foreground">
            Город подтверждён по вашему IP-адресу.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">
          Проголосуйте делом — подпишитесь на нас
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Кнопки станут активны, когда вы выберете свой текущий город.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!isOwnCity}
            onClick={() => handleVote('telegram')}
            className="h-11 flex-col gap-1 text-xs"
          >
            <Icon name="Send" size={16} />
            Telegram
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!isOwnCity}
            onClick={() => handleVote('max')}
            className="h-11 flex-col gap-1 text-xs"
          >
            <Icon name="MessageCircle" size={16} />
            MAX
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!isOwnCity}
            onClick={() => handleVote('vk')}
            className="h-11 flex-col gap-1 text-xs"
          >
            <Icon name="Users" size={16} />
            VK
          </Button>
        </div>
      </div>
    </div>
  );
}
