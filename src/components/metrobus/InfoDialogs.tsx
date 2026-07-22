import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import CityRequestForm from '@/components/metrobus/CityRequestForm';

interface InfoDialogsProps {
  aboutOpen: boolean;
  setAboutOpen: (open: boolean) => void;
  cityDialogOpen: boolean;
  setCityDialogOpen: (open: boolean) => void;
}

export default function InfoDialogs({
  aboutOpen,
  setAboutOpen,
  cityDialogOpen,
  setCityDialogOpen,
}: InfoDialogsProps) {
  return (
    <>
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>О компании</DialogTitle>
            <DialogDescription className="pt-2 text-left text-foreground">
              В 2023 году мы стали агентами СПб ГКУ «Организатор перевозок» по приему безналичных
              интернет-платежей в оплату разовых поездок в наземном городском пассажирском
              транспорте Санкт-Петербурга.
              <br />
              <br />
              С декабря 2023 года по январь 2026 год наши пользователи оплатили свои разовые
              поездки 30 000 раз — без мобильного приложения, без регистрации, без комиссии.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <a href="https://qr-number.ru" target="_blank" rel="noopener noreferrer" className="w-full">
              <Button className="w-full gap-2">
                Хочу узнать больше
                <Icon name="ArrowUpRight" size={16} />
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="MapPin" size={18} />
              Сервис работает в Санкт-Петербурге
            </DialogTitle>
            <DialogDescription className="pt-2 text-left text-foreground">
              Запустить цифровые сервисы в другом городе или регионе технически не сложно —
              способ оценки универсален, а технология — проверена, но на это требуется согласие
              властей или желание местных перевозчиков.
            </DialogDescription>
          </DialogHeader>
          <CityRequestForm />
        </DialogContent>
      </Dialog>
    </>
  );
}