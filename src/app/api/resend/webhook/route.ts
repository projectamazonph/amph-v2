'use server';

/**
 * Resend Webhook — email delivery tracking.
 *
 * Handles: delivered, bounced, complained (spam), unsubscribed events.
 * Signature verification is optional (enabled when RESEND_WEBHOOK_SECRET is set).
 *
 * Note: Resend may send events as type "text/plain" with raw JSON in the body,
 * so we handle both JSON and text/plain content types.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { logger } from '@/lib/logger';

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

interface ResendWebhookPayload {
  type: 'email.delivered' | 'email.bounced' | 'email.complained' | 'email.unsubscribed';
  data: {
    email_id: string;
    to: string | string[];
    tags?: { name: string; value: string }[];
  };
}

/**
 * Verify the Resend webhook signature (HMAC-SHA256).
 * Returns true if verification is disabled (no secret set) or valid.
 */
async function verifySignature(req: NextRequest): Promise<boolean> {
  if (!RESEND_WEBHOOK_SECRET) return true;

  const signature = req.headers.get('resend-signature') ?? '';
  if (!signature) return false;

  try {
    const payload = await req.text();
    const expectedSig = createHmac('sha256', RESEND_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    // Timing-safe comparison
    if (signature.length !== expectedSig.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!RESEND_WEBHOOK_SECRET) {
    logger.error('RESEND_WEBHOOK_SECRET not set — rejecting webhook');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  if (!(await verifySignature(req))) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let payload: ResendWebhookPayload;
  const contentType = req.headers.get('content-type') ?? '';

  try {
    const body = await req.text();
    payload = contentType.includes('text/plain')
      ? (JSON.parse(body) as ResendWebhookPayload)
      : (await import('stream').then(({ Readable }) => {
          // Re-parse from the text we already read
          return JSON.parse(body) as ResendWebhookPayload;
        }));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { type, data } = payload;
  const toAddresses = Array.isArray(data.to) ? data.to : [data.to];

  switch (type) {
    case 'email.delivered':
      logger.info({ emailId: data.email_id, to: toAddresses }, 'Email delivered');
      break;

    case 'email.bounced':
      logger.warn({ emailId: data.email_id, to: toAddresses }, 'Email bounced');
      break;

    case 'email.complained':
      logger.warn({ emailId: data.email_id, to: toAddresses }, 'Email spam complaint');
      break;

    case 'email.unsubscribed':
      logger.info({ emailId: data.email_id, to: toAddresses }, 'Email unsubscribed');
      break;

    default:
      logger.info({ type }, 'Unhandled resend webhook event');
  }

  return NextResponse.json({ received: true });
}
