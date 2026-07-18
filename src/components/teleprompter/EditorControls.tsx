import type { TeleprompterSettings } from '../../features/teleprompter/domain/settings';
import type { TpLabels } from './types';
import { RecordingDownload } from './RecordingDownload';

interface EditorControlsProps {
  labels: TpLabels;
  settings: TeleprompterSettings;
  script: string;
  downloadUrl: string | null;
  downloadExtension: string;
  onSetSpeed: (speed: number) => void;
  onSetFontSize: (fontSize: number) => void;
  onSetMirror: (mirror: boolean) => void;
  onSetCamera: (camera: boolean) => void;
  onStart: () => void;
}

export function EditorControls({
  labels,
  settings,
  script,
  downloadUrl,
  downloadExtension,
  onSetSpeed,
  onSetFontSize,
  onSetMirror,
  onSetCamera,
  onStart,
}: EditorControlsProps) {
  return (
    <div className="tp-controls">
      <label className="tp-field">
        {labels.speed}
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={settings.speed}
          onChange={(event) => onSetSpeed(Number(event.target.value))}
        />
        <output>{settings.speed}</output>
      </label>

      <label className="tp-field">
        {labels.fontSize}
        <input
          type="range"
          min={24}
          max={96}
          step={2}
          value={settings.fontSize}
          onChange={(event) => onSetFontSize(Number(event.target.value))}
        />
        <output>{settings.fontSize}</output>
      </label>

      <label className="tp-toggle">
        <input
          type="checkbox"
          checked={settings.mirror}
          onChange={(event) => onSetMirror(event.target.checked)}
        />
        {labels.mirror}
      </label>

      <label className="tp-toggle">
        <input
          type="checkbox"
          checked={settings.camera}
          onChange={(event) => onSetCamera(event.target.checked)}
        />
        {labels.camera}
      </label>

      <RecordingDownload
        downloadUrl={downloadUrl}
        downloadExtension={downloadExtension}
        label={labels.download}
      />

      <button className="tp-start" onClick={onStart} disabled={!script.trim()}>
        {labels.start}
      </button>
    </div>
  );
}
