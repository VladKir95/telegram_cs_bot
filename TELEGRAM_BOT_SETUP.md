# Telegram bot setup (Vercel)

## 1) Environment variables in Vercel
Set these in `Project -> Settings -> Environment Variables`:

- `BOT_TOKEN` = your Telegram bot token
- `WEBAPP_URL` = your Mini App URL (for this project it is `https://<PROJECT>.vercel.app`)
- `WEBHOOK_SECRET` = long random secret (recommended)

## 2) Deploy

1. Push this repository to GitHub.
2. Import project into Vercel.
3. Deploy.

Webhook endpoint after deploy:

- `https://<PROJECT>.vercel.app/api/webhook`

## 3) Register webhook in Telegram

Run once (replace placeholders):

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<PROJECT>.vercel.app/api/webhook",
    "secret_token": "<WEBHOOK_SECRET>"
  }'
```

Check webhook status:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

## 4) Test

1. Open your bot in Telegram.
2. Send `/start`.
3. Bot should reply with:

```text
UNBOX 3 CASES FOR FREE.
No deposit, no keys. Test your luck right now.
Pull a High-tier item and activate it as a secret bonus.
```

and an inline button `Відкрити Mini App`.
