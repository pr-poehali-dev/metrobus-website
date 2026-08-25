import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" aria-label="Переключить тему" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      size="icon"
      variant="outline"
      className="h-9 w-9 shrink-0"
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Icon name={isDark ? 'Sun' : 'Moon'} size={16} />
    </Button>
  );
}
