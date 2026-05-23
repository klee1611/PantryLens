const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const baseConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!app/api/**',
  ],
  testMatch: ['**/__tests__/**/*.{ts,tsx}'],
};

// Wrap so we can inject @/ alias BEFORE next/jest defaults (which may not
// handle jest.mock() path resolution in all versions).
module.exports = async () => {
  const config = await createJestConfig(baseConfig)();
  return {
    ...config,
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
      ...(config.moduleNameMapper ?? {}),
    },
  };
};
