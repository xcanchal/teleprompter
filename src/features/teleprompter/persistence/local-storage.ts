import {
  DEFAULT_SETTINGS,
  readSettings,
  type TeleprompterSettings,
} from '../domain/settings';

export const LOCAL_STORAGE_KEYS = {
  script: 'tp-script',
  settings: 'tp-settings',
} as const;

export interface StoredTeleprompterState {
  script: string | null;
  settings: TeleprompterSettings;
}

export function loadStoredTeleprompterState(): StoredTeleprompterState {
  try {
    const script = window.localStorage.getItem(LOCAL_STORAGE_KEYS.script);
    const rawSettings = window.localStorage.getItem(LOCAL_STORAGE_KEYS.settings);

    return {
      script,
      settings: rawSettings ? readSettings(JSON.parse(rawSettings)) : DEFAULT_SETTINGS,
    };
  } catch {
    return { script: null, settings: DEFAULT_SETTINGS };
  }
}

export function saveScript(script: string): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.script, script);
  } catch {
    // Storage is optional: the anonymous tool remains usable without it.
  }
}

export function saveSettings(settings: TeleprompterSettings): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    // Storage is optional: the anonymous tool remains usable without it.
  }
}
