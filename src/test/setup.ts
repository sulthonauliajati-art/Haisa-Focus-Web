import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as fc from 'fast-check';

// Configure fast-check globally
fc.configureGlobal({
  numRuns: 100,
  verbose: true,
});

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock performance.now() for timer tests
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
});
