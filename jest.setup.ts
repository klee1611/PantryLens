import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom doesn't ship TextEncoder/TextDecoder — polyfill from Node's util module
Object.assign(global, { TextEncoder, TextDecoder });
