import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// vitest doesn't know about Next's "server-only" convention
vi.mock('server-only', () => ({}));
