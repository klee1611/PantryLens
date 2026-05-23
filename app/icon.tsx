import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Generates /icon.png — used as favicon by Next.js
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#D97706',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
      >
        <div style={{ fontSize: 20, lineHeight: 1 }}>🍳</div>
      </div>
    ),
    size,
  );
}
