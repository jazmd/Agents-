import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const body = [
    'Contact: mailto:security@tickra.com',
    'Expires: 2027-01-01T00:00:00.000Z',
    'Encryption: https://tickra.com/.well-known/pgp-key.txt',
    'Acknowledgments: https://tickra.com/en/security/hall-of-fame',
    'Preferred-Languages: en, fr',
    'Canonical: https://tickra.com/.well-known/security.txt',
    'Policy: https://tickra.com/en/security/policy',
    '',
  ].join('\n');

  return new NextResponse(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
}
