import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom doesn't ship TextEncoder/TextDecoder — polyfill from Node's util module
Object.assign(global, { TextEncoder, TextDecoder });

// jsdom doesn't implement matchMedia — stub it so PWABanner's useEffect doesn't throw.
// Guard with typeof check: API tests run in a Node environment where window is undefined.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}
