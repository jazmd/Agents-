type LayoutOptions = {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  signoff?: string;
};

const BRAND = {
  ink: '#0A0A0C',
  canvas: '#FAFAF7',
  surface: '#FFFFFF',
  muted: '#5C5C64',
  subtle: '#71717A',
  line: '#E2E0DA',
};

const FONT_DISPLAY =
  '"Fraunces", "Iowan Old Style", "Apple Garamond", Georgia, serif';
const FONT_SANS = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
const FONT_MONO = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';

export function renderEmail({ preheader, title, bodyHtml, ctaLabel, ctaHref, signoff }: LayoutOptions): string {
  const ctaBlock =
    ctaLabel && ctaHref
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0 8px;">
        <tr>
          <td style="border-radius: 999px; background: ${BRAND.ink};">
            <a href="${ctaHref}"
               style="display: inline-block; padding: 14px 28px; font-family: ${FONT_SANS}; font-size: 15px; font-weight: 500; line-height: 1; color: ${BRAND.canvas}; text-decoration: none; letter-spacing: -0.01em;">
              ${escape(ctaLabel)} &nbsp;→
            </a>
          </td>
        </tr>
      </table>`
      : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${escape(title)}</title>
    <style>
      @media (prefers-color-scheme: dark) { body { background: ${BRAND.canvas} !important; color: ${BRAND.ink} !important; } }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: ${BRAND.canvas}; font-family: ${FONT_SANS}; color: ${BRAND.ink};">
    <span style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden;">
      ${escape(preheader)}
    </span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${BRAND.canvas};">
      <tr>
        <td align="center" style="padding: 56px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; background: ${BRAND.surface}; border: 1px solid ${BRAND.line}; border-radius: 4px;">
            <tr>
              <td style="padding: 28px 32px; border-bottom: 1px solid ${BRAND.line};">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 10px;">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${BRAND.ink}" stroke-width="1.75">
                        <rect x="4" y="9" width="3" height="10" rx="0.5" />
                        <line x1="5.5" y1="5" x2="5.5" y2="9" />
                        <line x1="5.5" y1="19" x2="5.5" y2="22" />
                        <rect x="10.5" y="5" width="3" height="13" rx="0.5" fill="${BRAND.ink}" />
                        <line x1="12" y1="2" x2="12" y2="5" />
                        <line x1="12" y1="18" x2="12" y2="22" />
                        <rect x="17" y="11" width="3" height="7" rx="0.5" />
                        <line x1="18.5" y1="7" x2="18.5" y2="11" />
                        <line x1="18.5" y1="18" x2="18.5" y2="21" />
                      </svg>
                    </td>
                    <td style="vertical-align: middle; font-family: ${FONT_SANS}; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: ${BRAND.ink};">
                      Tickra
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 32px 8px;">
                <h1 style="margin: 0; font-family: ${FONT_DISPLAY}; font-size: 32px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 500; color: ${BRAND.ink};">
                  ${escape(title)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 32px 40px; font-family: ${FONT_SANS}; font-size: 15.5px; line-height: 1.65; color: ${BRAND.muted};">
                ${bodyHtml}
                ${ctaBlock}
                <p style="margin: 36px 0 0; font-family: ${FONT_SANS}; font-size: 14.5px; color: ${BRAND.muted};">
                  ${escape(signoff ?? 'The Tickra team')}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; border-top: 1px solid ${BRAND.line}; font-family: ${FONT_MONO}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${BRAND.subtle};">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="font-family: ${FONT_MONO}; color: ${BRAND.subtle};">Tickra · Paris</td>
                    <td align="right" style="font-family: ${FONT_MONO}; color: ${BRAND.subtle};">tickra.com</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="margin: 24px auto 0; max-width: 480px; font-family: ${FONT_SANS}; font-size: 12px; line-height: 1.6; color: ${BRAND.subtle}; text-align: center;">
            Trading involves substantial risk of loss. Tickra is an educational platform; nothing in this email is investment advice.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderPlainText({ title, bodyText, ctaLabel, ctaHref, signoff }: {
  title: string;
  bodyText: string;
  ctaLabel?: string;
  ctaHref?: string;
  signoff?: string;
}): string {
  const parts = [
    `Tickra`,
    '',
    title,
    '',
    bodyText,
  ];
  if (ctaLabel && ctaHref) parts.push('', `${ctaLabel}: ${ctaHref}`);
  parts.push('', signoff ?? 'The Tickra team', '', '--', 'Tickra · Paris · tickra.com');
  return parts.join('\n');
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
