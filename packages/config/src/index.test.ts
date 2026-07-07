import { describe, it, expect } from 'vitest';
import { loadConfig, safeLoadConfig } from './index';

const validEnv = {
  CROO_API_URL: 'https://api.croo.network',
  CROO_WS_URL: 'wss://ws.croo.network',
  CROO_SDK_KEY: 'croo_sk_test_key',
} satisfies NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('parses a valid environment and applies the logLevel default', () => {
    const cfg = loadConfig(validEnv);
    expect(cfg.crooSdkKey).toBe('croo_sk_test_key');
    expect(cfg.crooApiUrl).toBe('https://api.croo.network');
    expect(cfg.logLevel).toBe('info');
    expect(cfg.anthropicApiKey).toBeUndefined();
  });

  it('honours an explicit logLevel', () => {
    const cfg = loadConfig({ ...validEnv, LOG_LEVEL: 'debug' });
    expect(cfg.logLevel).toBe('debug');
  });

  it('throws when a required var is missing', () => {
    expect(() => loadConfig({})).toThrow();
  });

  it('rejects a non-URL api endpoint', () => {
    expect(() => loadConfig({ ...validEnv, CROO_API_URL: 'not-a-url' })).toThrow();
  });
});

describe('safeLoadConfig', () => {
  it('reports success without throwing', () => {
    const result = safeLoadConfig(validEnv);
    expect(result.success).toBe(true);
  });

  it('reports failure without throwing', () => {
    const result = safeLoadConfig({});
    expect(result.success).toBe(false);
  });
});
