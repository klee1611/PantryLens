import PantryLensApp from '@/components/PantryLensApp';
import HomeContent from '@/components/HomeContent';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PantryLens',
  description:
    'AI-powered recipe generator. Photograph your fridge or pantry ingredients and receive an instant personalized recipe using only what you have.',
  url: 'https://pantrylens.app',
  applicationCategory: 'FoodApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI ingredient recognition from photos',
    'Instant streaming recipe generation',
    'Upload up to 3 photos per request',
    'No account or login required',
    'Camera capture support on mobile',
    'Progressive Web App — installable on iOS and Android',
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PantryLensApp />
      <HomeContent />
    </>
  );
}
