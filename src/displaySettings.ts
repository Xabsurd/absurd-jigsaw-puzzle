export type DisplaySettings = {
  showStroke: boolean;
  borderColor: string;
  backgroundColor: string;
};

const STORAGE_KEY = 'absurd-jigsaw-display';

const defaults: DisplaySettings = {
  showStroke: true,
  borderColor: '#8bc5ff',
  backgroundColor: '#111111'
};

export function loadDisplaySettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<DisplaySettings>;
    return {
      showStroke: parsed.showStroke ?? defaults.showStroke,
      borderColor: parsed.borderColor || defaults.borderColor,
      backgroundColor: parsed.backgroundColor || defaults.backgroundColor
    };
  } catch {
    return { ...defaults };
  }
}

export function saveDisplaySettings(settings: DisplaySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
