import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  metadataBase: new URL('https://pantrylens.app'),
  title: 'PantryLens — AI Recipe Generator from Fridge Photos',
  description:
    'Snap a photo of your fridge or pantry. PantryLens uses AI to instantly generate recipes from your ingredients. Free. No account needed.',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'PantryLens — AI Recipe Generator',
    description:
      'Snap your fridge. Get a recipe instantly. Free AI-powered recipe generator from your ingredients.',
    url: 'https://pantrylens.app',
    siteName: 'PantryLens',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PantryLens — Turn your fridge into recipes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PantryLens — AI Recipe Generator',
    description: 'Snap your fridge. Get a recipe instantly.',
    images: ['/og-image.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PantryLens',
  },
};

export const viewport: Viewport = {
  themeColor: '#D97706',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-amber-50 text-stone-800 min-h-screen antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
          }}
        />
      </body>
    </html>
  );
}
