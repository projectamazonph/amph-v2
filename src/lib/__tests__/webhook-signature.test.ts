import { describe, it, expect, beforeEach } from 'vitest';
import { verifyPayMongoSignature, PAYMONGO_SIGNATURE_HEADER } from '@/lib/webhook-signature';
import { createHmac } from 'node:crypto';

function sign(timestamp: string, body: string, secret: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

describe('webhook-signature.ts', () => {
  const SECRET = 'whsec_test_secret_key_12345';
  const BODY = '{"data":{"id":"evt_123"}}';
  const TS = '1712345678';
  const TEST_SIG = sign(TS, BODY, SECRET);

  beforeEach(() => {
    process.env.PAYMONGO_WEBHOOK_SECRET = SECRET;
  });

  describe('PAYMONGO_SIGNATURE_HEADER', () => {
    it('exports the header name', () => {
      expect(PAYMONGO_SIGNATURE_HEADER).toBe('paymongo-signature');
    });
  });

  describe('verifyPayMongoSignature', () => {
    it('accepts test signature (te=)', () => {
      const header = `t=${TS},te=${TEST_SIG}`;
      expect(verifyPayMongoSignature(BODY, header)).toEqual({ valid: true });
    });

    it('accepts live signature (li=)', () => {
      const header = `t=${TS},li=${TEST_SIG}`;
      expect(verifyPayMongoSignature(BODY, header)).toEqual({ valid: true });
    });

    it('rejects when secret is missing', () => {
      delete process.env.PAYMONGO_WEBHOOK_SECRET;
      expect(verifyPayMongoSignature(BODY, 't=x,te=x')).toEqual({
        valid: false, reason: 'missing-secret',
      });
    });

    it('rejects when header is missing', () => {
      expect(verifyPayMongoSignature(BODY, null)).toEqual({
        valid: false, reason: 'missing-header',
      });
    });

    it('rejects malformed header (no timestamp)', () => {
      expect(verifyPayMongoSignature(BODY, 'te=abc')).toEqual({
        valid: false, reason: 'malformed-header',
      });
    });

    it('rejects signature mismatch', () => {
      const header = `t=${TS},te=badbadbad`;
      expect(verifyPayMongoSignature(BODY, header)).toEqual({
        valid: false, reason: 'signature-mismatch',
      });
    });

    it('treats empty header string as missing', () => {
      expect(verifyPayMongoSignature(BODY, '')).toEqual({
        valid: false, reason: 'missing-header',
      });
    });

    it('handles whitespace in header segments', () => {
      const header = ` t=${TS}, te=${TEST_SIG} `;
      expect(verifyPayMongoSignature(BODY, header.trim())).toEqual({ valid: true });
    });

    it('rejects multi-byte signature with same character length', () => {
      const header = `t=${TS},te=${'\u00e9'.repeat(64)}`;
      expect(verifyPayMongoSignature(BODY, header)).toEqual({
        valid: false,
        reason: 'signature-mismatch',
      });
    });

    it('still works when body contains special characters', () => {
      const bodyWithUnicode = '{"msg":"ño"}';
      const sig = sign(TS, bodyWithUnicode, SECRET);
      const header = `t=${TS},te=${sig}`;
      expect(verifyPayMongoSignature(bodyWithUnicode, header)).toEqual({ valid: true });
    });
  });
});
