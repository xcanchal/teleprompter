import { describe, expect, it } from 'vitest';
import { clampSpeed, DEFAULT_SETTINGS, readSettings } from '../../src/features/teleprompter/domain/settings';

describe('teleprompter settings', () => {
  it('keeps valid stored settings while filling in missing values', () => {
    expect(readSettings({ speed: 80, mirror: true })).toEqual({
      speed: 80,
      fontSize: DEFAULT_SETTINGS.fontSize,
      mirror: true,
      camera: false,
    });
  });

  it('keeps speed in the supported range', () => {
    expect(clampSpeed(5)).toBe(10);
    expect(clampSpeed(300)).toBe(200);
    expect(clampSpeed(65)).toBe(65);
  });
});
