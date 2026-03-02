type RequestHeaders = Record<string, string | string[] | undefined>;

type VercelLikeRequest = {
  method?: string;
  headers: RequestHeaders;
  body?: unknown;
};

type VercelLikeResponse = {
  status: (code: number) => VercelLikeResponse;
  json: (payload: unknown) => void;
};

type TelegramMessage = {
  chat?: { id?: number };
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

const START_MESSAGE = [
  'UNBOX 3 CASES FOR FREE.',
  'No deposit, no keys. Test your luck right now.',
  'Pull a High-tier item and activate it as a secret bonus.',
].join('\n');

async function sendStartMessage(chatId: number): Promise<void> {
  const botToken = process.env.BOT_TOKEN;
  const webAppUrl = process.env.WEBAPP_URL;

  if (!botToken) {
    throw new Error('BOT_TOKEN is not set');
  }

  if (!webAppUrl) {
    throw new Error('WEBAPP_URL is not set');
  }

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: START_MESSAGE,
      reply_markup: {
        inline_keyboard: [[{ text: 'Відкрити Mini App', web_app: { url: webAppUrl } }]],
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}

function getHeaderValue(header: string | string[] | undefined): string {
  if (Array.isArray(header)) {
    return header[0] ?? '';
  }
  return header ?? '';
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerSecret = getHeaderValue(req.headers['x-telegram-bot-api-secret-token']);
    if (headerSecret !== webhookSecret) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
  }

  const update = req.body as TelegramUpdate;
  const chatId = update?.message?.chat?.id;
  const text = update?.message?.text?.trim() ?? '';

  if (chatId && text.startsWith('/start')) {
    try {
      await sendStartMessage(chatId);
    } catch (error) {
      console.error(error);
    }
  }

  res.status(200).json({ ok: true });
}
