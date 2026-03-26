// This script sets up a Revolut webhook if it doesn't already exist
import axios from 'axios';

interface RevolutWebhook {
  id?: string;
  url: string;
  events?: string[];
  [key: string]: unknown;
}

const REVOLUT_API = process.env.REVOLUT_API!;
const REVOLUT_WEBHOOK_URL = `${REVOLUT_API}/api/1.0/webhooks`;

async function setupRevolutWebhook() {
  console.log({
    apiKey: process.env.REVOLUT_API_SECRET_KEY,
    webhookUrl: process.env.REVOLUT_WEBHOOK_URL,
  });
  const apiKey = process.env.REVOLUT_API_SECRET_KEY;
  const webhookUrl = process.env.REVOLUT_WEBHOOK_URL;
  if (!apiKey || !webhookUrl) {
    console.error('Missing REVOLUT_API_SECRET_KEY or REVOLUT_WEBHOOK_URL env vars');
    process.exit(1);
  }

  try {
    const { data } = await axios.get(REVOLUT_WEBHOOK_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const existing = Array.isArray(data)
      ? (data as RevolutWebhook[]).find((w) => w.url === webhookUrl)
      : null;
    if (existing) {
      console.log(existing);
      console.log('Revolut webhook already exists:', existing.id || existing.url);
      return;
    }

    console.log('Creating Revolut webhook...');
    const WEBHOOK_URL = process.env.REVOLUT_WEBHOOK_URL!;
    const webhook = await axios.post(
      REVOLUT_WEBHOOK_URL,
      {
        url: WEBHOOK_URL,
        events: ['ORDER_COMPLETED', 'ORDER_AUTHORISED', 'ORDER_CANCELLED'],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.REVOLUT_API_SECRET_KEY}`,
        },
      }
    );
    console.log('Webhook created:', webhook.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.log(err.response);
      console.error('Failed to list/create Revolut webhooks:', err.response?.data || err.message);
    } else if (err instanceof Error) {
      console.error('Error:', err.message);
    } else {
      console.error('Unknown error', err);
    }
    process.exit(1);
  }
}

setupRevolutWebhook().then(() => {
  console.log('Done');
  process.exit(0);
});
