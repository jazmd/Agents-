/**
 * Minimal PDF 1.4 generator — zero dependency. Produces a single-page A4
 * landscape certificate. Uses standard 14 PDF fonts (Helvetica + Times-Bold)
 * so no font embedding is needed.
 *
 * Layout: title, recipient line, statement, and metadata. Kept intentionally
 * sober — Tickra editorial type vibe via Times-Bold for the headline.
 */

type CertificateInput = {
  recipientName: string;
  trackName: string;
  statement: string;       // "has completed the {track} track…" rendered string
  issuedOnLabel: string;
  issuedOnValue: string;
  verifyByLabel: string;
  verifyId: string;
  brand: string;           // "TICKRA"
  tagline: string;         // small line at the bottom
};

function escapePdf(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildCertificate(input: CertificateInput): Uint8Array {
  // A4 landscape: 842 × 595 pt
  const W = 842;
  const H = 595;

  // Build content stream with editorial layout.
  const contentLines: string[] = [];
  contentLines.push('q');

  // Thin border 24 pt inset
  contentLines.push('0.04 0.04 0.05 RG'); // ink colour
  contentLines.push('0.6 w');
  contentLines.push(`24 24 ${W - 48} ${H - 48} re S`);

  // Brand mono header
  contentLines.push('BT');
  contentLines.push('/F1 9 Tf'); // Helvetica
  contentLines.push('0.42 0.42 0.45 rg');
  contentLines.push(`60 ${H - 60} Td`);
  contentLines.push('250 Tc'); // tracking via Tc would need Tw, simpler to just space the brand below
  contentLines.push('0 Tc');
  contentLines.push(`(${escapePdf(input.brand)}) Tj`);
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F1 9 Tf');
  contentLines.push('0.42 0.42 0.45 rg');
  contentLines.push(`${W - 200} ${H - 60} Td`);
  contentLines.push(`(${escapePdf('CERTIFICATE OF COMPLETION')}) Tj`);
  contentLines.push('ET');

  // Big editorial display: track name
  contentLines.push('BT');
  contentLines.push('/F2 46 Tf'); // Times-Bold
  contentLines.push('0.04 0.04 0.05 rg');
  contentLines.push(`60 ${H - 170} Td`);
  contentLines.push(`(${escapePdf(input.trackName)}) Tj`);
  contentLines.push('ET');

  // Recipient
  contentLines.push('BT');
  contentLines.push('/F1 12 Tf');
  contentLines.push('0.36 0.36 0.39 rg');
  contentLines.push(`60 ${H - 230} Td`);
  contentLines.push(`(${escapePdf('Issued to')}) Tj`);
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F2 28 Tf');
  contentLines.push('0.04 0.04 0.05 rg');
  contentLines.push(`60 ${H - 270} Td`);
  contentLines.push(`(${escapePdf(input.recipientName)}) Tj`);
  contentLines.push('ET');

  // Statement
  contentLines.push('BT');
  contentLines.push('/F1 13 Tf');
  contentLines.push('0.04 0.04 0.05 rg');
  contentLines.push(`60 ${H - 330} Td`);
  // Wrap if too long: simple naive split at ~80 chars.
  const words = input.statement.split(' ');
  const lines: string[] = [''];
  for (const w of words) {
    if ((lines[lines.length - 1] + ' ' + w).length > 80) lines.push(w);
    else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim();
  }
  let y = H - 330;
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      contentLines.push('ET');
      y -= 20;
      contentLines.push('BT');
      contentLines.push('/F1 13 Tf');
      contentLines.push(`60 ${y} Td`);
    }
    contentLines.push(`(${escapePdf(lines[i])}) Tj`);
  }
  contentLines.push('ET');

  // Metadata bottom-left
  contentLines.push('BT');
  contentLines.push('/F1 9 Tf');
  contentLines.push('0.42 0.42 0.45 rg');
  contentLines.push(`60 90 Td`);
  contentLines.push(`(${escapePdf(input.issuedOnLabel + ': ' + input.issuedOnValue)}) Tj`);
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F1 9 Tf');
  contentLines.push('0.42 0.42 0.45 rg');
  contentLines.push(`60 72 Td`);
  contentLines.push(`(${escapePdf(input.verifyByLabel + ': ' + input.verifyId)}) Tj`);
  contentLines.push('ET');

  // Signature-style flourish bottom-right
  contentLines.push('BT');
  contentLines.push('/F2 11 Tf');
  contentLines.push('0.04 0.04 0.05 rg');
  contentLines.push(`${W - 220} 90 Td`);
  contentLines.push(`(${escapePdf('Tickra studio · Paris')}) Tj`);
  contentLines.push('ET');

  contentLines.push('BT');
  contentLines.push('/F1 9 Tf');
  contentLines.push('0.42 0.42 0.45 rg');
  contentLines.push(`${W - 220} 72 Td`);
  contentLines.push(`(${escapePdf(input.tagline)}) Tj`);
  contentLines.push('ET');

  contentLines.push('Q');

  const content = contentLines.join('\n');

  // PDF object assembly
  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`,
  );
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>');

  // Build the PDF binary
  let pdf = '%PDF-1.4\n%âãÏÓ\n';
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  // Convert to bytes (PDF is 7-bit ASCII safe for what we produce here).
  const encoder = new TextEncoder();
  return encoder.encode(pdf);
}
