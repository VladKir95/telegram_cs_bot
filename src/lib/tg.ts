export type TgUser = {
  id?: number;
  first_name?: string;
};

type TgWebApp = {
  initDataUnsafe?: { user?: TgUser };
  ready?: () => void;
  expand?: () => void;
  openLink?: (url: string) => void;
  HapticFeedback?: { impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void };
};

export function getTelegramWebApp(): TgWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegram(): TgWebApp | null {
  const tg = getTelegramWebApp();
  if (!tg) return null;

  tg.ready?.();
  tg.expand?.();
  return tg;
}

export function getTelegramUser(tg: TgWebApp | null): TgUser | null {
  return tg?.initDataUnsafe?.user ?? null;
}

export function triggerWinHaptic(tg: TgWebApp | null): void {
  tg?.HapticFeedback?.impactOccurred?.('heavy');
}

export function triggerKnifeDropHaptic(tg: TgWebApp | null): void {
  if (tg?.HapticFeedback?.impactOccurred) {
    tg.HapticFeedback.impactOccurred('rigid');
    return;
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(120);
  }
}

export function openExternalLink(tg: TgWebApp | null, url: string): void {
  if (tg?.openLink) {
    tg.openLink(url);
    return;
  }
  window.location.href = url;
}
