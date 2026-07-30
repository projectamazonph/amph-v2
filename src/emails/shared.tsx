/**
 * Shared building blocks for transactional email templates.
 *
 * Styled to match the "Field Manual" design system (docs/stitch-prompts.md):
 * warm off-white background, white card, orange accent, Space Grotesk
 * headings. Email clients strip most custom fonts, so headings declare
 * Space Grotesk via <Font> (progressive enhancement) with a system-font
 * fallback that still looks correct everywhere.
 */

import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'react-email';
import type { CSSProperties, ReactNode } from 'react';
import { BRAND_NAME } from '@/lib/brand';

export const colors = {
  bg: '#FAFAF7',
  card: '#FFFFFF',
  border: '#E5E5E0',
  text: '#171717',
  textSecondary: '#404040',
  textTertiary: '#737373',
  accent: '#FF6B35',
  accentSoft: '#FFE5D9',
  success: '#0E7C3A',
  error: '#B91C1C',
} as const;

const headingFont = "'Space Grotesk', Helvetica, Arial, sans-serif";
const bodyFont = 'Helvetica, Arial, sans-serif';

/** Full HTML document shell: off-white body, bordered white card, footer. */
export function EmailShell({
  previewText,
  eyebrow,
  children,
}: {
  previewText: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Space Grotesk"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7oUXskPMBBSSJLm2E.woff2',
            format: 'woff2',
          }}
          fontWeight={600}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: bodyFont, margin: 0, padding: '40px 20px' }}>
        <Container style={{ maxWidth: 560, margin: '0 auto' }}>
          <Text
            style={{
              fontFamily: headingFont,
              color: colors.accent,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            {eyebrow ?? BRAND_NAME}
          </Text>
          <Section
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 32,
            }}
          >
            {children}
          </Section>
          <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', margin: '20px 0 0' }}>
            {`${BRAND_NAME} · projectamazonph.com`}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({ children, color = colors.text }: { children: ReactNode; color?: string }) {
  return (
    <Text style={{ fontFamily: headingFont, color, fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>
      {children}
    </Text>
  );
}

export function EmailParagraph({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Text
      style={{ color: colors.textSecondary, fontSize: 15, lineHeight: '1.6', margin: '0 0 20px', ...style }}
    >
      {children}
    </Text>
  );
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: colors.accent,
        color: '#FFFFFF',
        textDecoration: 'none',
        fontFamily: headingFont,
        fontWeight: 600,
        fontSize: 14,
        padding: '12px 24px',
        borderRadius: 6,
      }}
    >
      {children}
    </Button>
  );
}

/** Boxed key/value detail rows, e.g. class schedule or payment line items. */
export function EmailDetailBox({ children }: { children: ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: '#F4F3EE',
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
        padding: 16,
        margin: '0 0 24px',
      }}
    >
      {children}
    </Section>
  );
}

export function EmailDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Text style={{ color: colors.textSecondary, fontSize: 14, margin: '0 0 4px' }}>
      <span style={{ color: colors.textTertiary }}>{label}: </span>
      {value}
    </Text>
  );
}

export function EmailDivider() {
  return <Hr style={{ borderColor: colors.border, margin: '24px 0' }} />;
}

export function EmailFootnote({ children }: { children: ReactNode }) {
  return (
    <Text style={{ color: colors.textTertiary, fontSize: 12, lineHeight: '1.6', margin: '20px 0 0' }}>
      {children}
    </Text>
  );
}
