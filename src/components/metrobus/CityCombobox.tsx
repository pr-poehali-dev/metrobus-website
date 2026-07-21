import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Icon from '@/components/ui/icon';
import { RU_CITIES } from '@/lib/ruCities';
import { cn } from '@/lib/utils';

interface CityComboboxProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

export default function CityCombobox({ value, onChange, placeholder = 'Выберите город' }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = RU_CITIES.find((c) => c.label === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-11 w-full justify-between text-base font-normal"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <Icon name="ChevronsUpDown" size={16} className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Начните вводить город..." className="h-11" />
          <CommandList>
            <CommandEmpty>Город не найден</CommandEmpty>
            <CommandGroup>
              {RU_CITIES.map((c) => (
                <CommandItem
                  key={c.label}
                  value={c.label}
                  onSelect={(currentValue) => {
                    const match = RU_CITIES.find((city) => city.label.toLowerCase() === currentValue.toLowerCase());
                    onChange(match ? match.label : currentValue);
                    setOpen(false);
                  }}
                >
                  <Icon
                    name="Check"
                    size={16}
                    className={cn('mr-2', selected?.label === c.label ? 'opacity-100' : 'opacity-0')}
                  />
                  {c.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
