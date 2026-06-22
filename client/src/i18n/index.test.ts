import { describe, expect, it, vi } from 'vitest';

const i18nMock = vi.hoisted(() => {
  const mock = {
    use: vi.fn(),
    init: vi.fn(),
  };
  mock.use.mockReturnValue(mock);
  mock.init.mockReturnValue(mock);
  return mock;
});

vi.mock('i18next', () => ({ default: i18nMock }));
vi.mock('react-i18next', () => ({ initReactI18next: {} }));
vi.mock('../locales/en.json', () => ({ default: { hello: 'Hello' } }));
vi.mock('../locales/uk.json', () => ({ default: { hello: 'Привіт' } }));

describe('i18n index bootstrap', () => {
  it('initializes i18next with bundled locales', async () => {
    await import('./index');
    expect(i18nMock.use).toHaveBeenCalled();
    expect(i18nMock.init).toHaveBeenCalled();
  });
});
