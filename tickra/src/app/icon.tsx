import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="#FAFAF7" strokeWidth={1.75}>
          <rect x={4} y={9} width={3} height={10} rx={0.5} />
          <line x1={5.5} y1={5} x2={5.5} y2={9} />
          <line x1={5.5} y1={19} x2={5.5} y2={22} />
          <rect x={10.5} y={5} width={3} height={13} rx={0.5} fill="#FAFAF7" />
          <line x1={12} y1={2} x2={12} y2={5} />
          <line x1={12} y1={18} x2={12} y2={22} />
          <rect x={17} y={11} width={3} height={7} rx={0.5} />
          <line x1={18.5} y1={7} x2={18.5} y2={11} />
          <line x1={18.5} y1={18} x2={18.5} y2={21} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
