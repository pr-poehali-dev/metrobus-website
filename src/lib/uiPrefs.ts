const PREFIX = 'mb_ui_collapsed_';

/**
 * Хранит состояние "свёрнуто/развёрнуто" служебных информационных блоков дашборда
 * (например "Служебная информация" под Топ-10) — привязано к storageKey блока,
 * сохраняется в localStorage и переживает перезагрузку страницы.
 */
export function getCollapsedPref(key: string, defaultValue = false): boolean {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return defaultValue;
    return raw === '1';
  } catch {
    return defaultValue;
  }
}

export function setCollapsedPref(key: string, collapsed: boolean) {
  try {
    localStorage.setItem(PREFIX + key, collapsed ? '1' : '0');
  } catch {
    // no-op: localStorage недоступен
  }
}
