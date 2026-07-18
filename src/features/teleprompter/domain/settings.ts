export interface TeleprompterSettings {
  speed: number;
  fontSize: number;
  mirror: boolean;
  camera: boolean;
}

export const DEFAULT_SETTINGS: TeleprompterSettings = {
  speed: 60,
  fontSize: 48,
  mirror: false,
  camera: false,
};

export const MIN_SPEED = 10;
export const MAX_SPEED = 200;
export const SPEED_STEP = 5;

export function clampSpeed(speed: number): number {
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed));
}

export function readSettings(value: unknown): TeleprompterSettings {
  if (!value || typeof value !== 'object') return DEFAULT_SETTINGS;

  const saved = value as Partial<TeleprompterSettings>;
  return {
    speed: typeof saved.speed === 'number' ? clampSpeed(saved.speed) : DEFAULT_SETTINGS.speed,
    fontSize: typeof saved.fontSize === 'number' ? saved.fontSize : DEFAULT_SETTINGS.fontSize,
    mirror: typeof saved.mirror === 'boolean' ? saved.mirror : DEFAULT_SETTINGS.mirror,
    camera: typeof saved.camera === 'boolean' ? saved.camera : DEFAULT_SETTINGS.camera,
  };
}
