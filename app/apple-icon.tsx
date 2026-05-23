import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Generates /apple-icon.png — auto-linked as <link rel="apple-touch-icon"> by Next.js
export default function AppleIcon() {
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
        }}
      >
        <div style={{ fontSize: 108, lineHeight: 1 }}>🍳</div>
      </div>
    ),
    size,
  );
}
