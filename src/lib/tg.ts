export type TgUser = {
  id?: number;
  first_name?: string;
};

type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotificationType = 'error' | 'success' | 'warning';
type HapticFeedbackPayload =
  | { type: 'impact'; impact_style: HapticImpactStyle }
  | { type: 'notification'; notification_type: HapticNotificationType }
  | { type: 'selection_change' };

declare global {
  interface Window {
    Android?: {
      vibrate?: (durationMs: number) => void;
    };
  }
}

type TgWebApp = {
  initDataUnsafe?: { user?: TgUser };
  ready?: () => void;
  expand?: () => void;
  openLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred?: (style: HapticImpactStyle) => void;
    notificationOccurred?: (type: HapticNotificationType) => void;
    selectionChanged?: () => void;
  };
};

export function getTelegramWebApp(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  return (window.Telegram?.WebApp as TgWebApp | undefined) ?? null;
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

function postTelegramEvent(eventType: string, eventData: Record<string, unknown>): boolean {
  const serialized = JSON.stringify(eventData);
  const telegramWindow = window as Window & {
    TelegramWebviewProxy?: {
      postEvent?: (type: string, data?: string) => void;
    };
  };
  const externalBridge = window.external as External & {
    notify?: (message: string) => void;
  };

  if (typeof window !== 'undefined' && typeof telegramWindow.TelegramWebviewProxy?.postEvent === 'function') {
    telegramWindow.TelegramWebviewProxy.postEvent(eventType, serialized);
    return true;
  }

  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
    window.parent.postMessage(
      JSON.stringify({
        eventType,
        eventData,
      }),
      'https://web.telegram.org',
    );
    return true;
  }

  if (typeof window !== 'undefined' && typeof externalBridge?.notify === 'function') {
    externalBridge.notify(
      JSON.stringify({
        eventType,
        eventData,
      }),
    );
    return true;
  }

  return false;
}

function triggerHapticFeedback(tg: TgWebApp | null, payload: HapticFeedbackPayload): void {
  if (payload.type === 'impact' && tg?.HapticFeedback?.impactOccurred) {
    tg.HapticFeedback.impactOccurred(payload.impact_style);
    return;
  }

  if (payload.type === 'notification' && tg?.HapticFeedback?.notificationOccurred) {
    tg.HapticFeedback.notificationOccurred(payload.notification_type);
    return;
  }

  if (payload.type === 'selection_change' && tg?.HapticFeedback?.selectionChanged) {
    tg.HapticFeedback.selectionChanged();
    return;
  }

  if (postTelegramEvent('web_app_trigger_haptic_feedback', payload)) {
    return;
  }

  if (typeof window !== 'undefined' && typeof window.Android?.vibrate === 'function') {
    window.Android.vibrate(payload.type === 'notification' ? 180 : 120);
    return;
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(payload.type === 'notification' ? 180 : 120);
  }
}

export function triggerWinHaptic(tg: TgWebApp | null): void {
  triggerHapticFeedback(tg, { type: 'notification', notification_type: 'success' });
}

export function triggerKnifeDropHaptic(tg: TgWebApp | null): void {
  triggerHapticFeedback(tg, { type: 'impact', impact_style: 'rigid' });
}

export function openExternalLink(tg: TgWebApp | null, url: string): void {
  if (tg?.openLink) {
    tg.openLink(url);
    return;
  }
  window.location.href = url;
}
