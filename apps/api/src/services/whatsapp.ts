import https from 'node:https';

interface BillLineItem {
  name: string;
  quantity: number;
  subtotal: number;
}

interface SendBillParams {
  phone: string;
  customerName: string | null;
  orderId: string;
  restaurantName: string;
  items: BillLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  tableNumber: string | null;
  paymentLink?: string | null;
  channel?: 'whatsapp' | 'sms';
}

function formatWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '');
  const normalized = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  return normalized.startsWith('whatsapp:') ? normalized : `whatsapp:${normalized}`;
}

function getTwilioConfig(channel: 'whatsapp' | 'sms' = 'whatsapp'): { accountSid: string; authToken: string; from: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) return null;

  if (channel === 'sms') {
    const fromRaw = process.env.TWILIO_SMS_FROM;
    if (!fromRaw) return null;
    const cleaned = fromRaw.replace(/\s+/g, '');
    return { accountSid, authToken, from: cleaned.startsWith('+') ? cleaned : `+${cleaned}` };
  }

  const fromRaw = process.env.TWILIO_WHATSAPP_FROM;
  if (!fromRaw) return null;
  return { accountSid, authToken, from: formatWhatsAppNumber(fromRaw) };
}

function postTwilioMessage(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams({
      From: params.from,
      To: params.to,
      Body: params.body,
    }).toString();

    const auth = Buffer.from(`${params.accountSid}:${params.authToken}`).toString('base64');
    const req = https.request(
      {
        hostname: 'api.twilio.com',
        method: 'POST',
        path: `/2010-04-01/Accounts/${encodeURIComponent(params.accountSid)}/Messages.json`,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        });
        res.on('end', () => {
          const statusCode = res.statusCode ?? 500;
          if (statusCode >= 200 && statusCode < 300) {
            resolve();
            return;
          }
          const responseBody = Buffer.concat(chunks).toString('utf8');
          reject(new Error(`Twilio request failed (${statusCode}): ${responseBody}`));
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function formatBillMessage({
  customerName,
  orderId,
  restaurantName,
  items,
  subtotal,
  tax,
  total,
  tableNumber,
  paymentLink,
}: SendBillParams): string {
  const name = customerName?.trim() || 'Customer';
  const shortOrderId = orderId.slice(0, 8).toUpperCase();
  const tableText = tableNumber ? `Table: ${tableNumber}\n` : '';
  const itemLines = items
    .map((item) => `• ${item.name} x${item.quantity}  Rs ${item.subtotal.toFixed(2)}`)
    .join('\n');

  const parts = [
    `Bill from ${restaurantName}`,
    '',
    `Hi ${name},`,
    tableText + `Order: #${shortOrderId}`,
    '',
    itemLines,
    '',
    `Subtotal: Rs ${subtotal.toFixed(2)}`,
    `Tax: Rs ${tax.toFixed(2)}`,
    `Total: Rs ${total.toFixed(2)}`,
  ];

  if (paymentLink) {
    parts.push('', `Pay now: ${paymentLink}`);
  }

  parts.push('', 'Thank you for dining with us.');
  return parts.join('\n');
}

export async function sendBillOnWhatsApp(params: SendBillParams): Promise<boolean> {
  const channel = params.channel ?? 'whatsapp';
  const config = getTwilioConfig(channel);
  if (!config) {
    console.log(`[WhatsApp] Twilio config missing for ${channel}; skipping bill send for order ${params.orderId}`);
    return false;
  }

  const body = formatBillMessage(params);
  const phone = params.phone.replace(/\s+/g, '');
  const to = channel === 'sms'
    ? (phone.startsWith('+') ? phone : `+${phone}`)
    : formatWhatsAppNumber(phone);

  await postTwilioMessage({
    accountSid: config.accountSid,
    authToken: config.authToken,
    from: config.from,
    to,
    body,
  });
  return true;
}
