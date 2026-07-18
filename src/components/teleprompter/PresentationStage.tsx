import type { RefObject } from 'react';
import type { PresentationCommand } from '../../features/teleprompter/domain/presentation-command';
import type { TeleprompterSettings } from '../../features/teleprompter/domain/settings';
import type { TpLabels } from './types';

interface PresentationStageProps {
  labels: TpLabels;
  script: string;
  settings: TeleprompterSettings;
  countdown: number | null;
  playing: boolean;
  idle: boolean;
  recording: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  textRef: RefObject<HTMLDivElement | null>;
  cameraRef: RefObject<HTMLVideoElement | null>;
  dispatch: (command: PresentationCommand) => void;
  onToggleRecording: () => void;
}

export function PresentationStage({
  labels,
  script,
  settings,
  countdown,
  playing,
  idle,
  recording,
  stageRef,
  textRef,
  cameraRef,
  dispatch,
  onToggleRecording,
}: PresentationStageProps) {
  const togglePlayback = () => dispatch({ type: playing ? 'pause' : 'play' });

  return (
    <div
      ref={stageRef}
      className={`tp-stage${settings.mirror ? ' is-mirrored' : ''}${idle && playing ? ' is-idle' : ''}`}
    >
      {settings.camera && <video ref={cameraRef} className="tp-cam" autoPlay muted playsInline />}

      <div className="tp-scroller" onClick={() => countdown === null && togglePlayback()}>
        <div
          ref={textRef}
          className="tp-text"
          style={{ fontSize: settings.fontSize, lineHeight: 1.45 }}
        >
          {script}
        </div>
      </div>

      <div className="tp-marker" aria-hidden="true" />
      {countdown !== null && countdown > 0 && (
        <div className="tp-countdown" aria-live="assertive">
          {countdown}
        </div>
      )}

      <div className="tp-bar" onClick={(event) => event.stopPropagation()}>
        <button onClick={togglePlayback}>{playing ? labels.pause : labels.resume}</button>
        <button onClick={() => dispatch({ type: 'restart' })}>{labels.restart}</button>
        <label className="tp-field">
          {labels.speed}
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={settings.speed}
            onChange={(event) => dispatch({ type: 'set-speed', speed: Number(event.target.value) })}
          />
          <output>{settings.speed}</output>
        </label>
        {settings.camera && (
          <button className={recording ? 'is-rec' : ''} onClick={onToggleRecording}>
            {recording ? `■ ${labels.stopRec}` : `● ${labels.record}`}
          </button>
        )}
        <button onClick={() => dispatch({ type: 'exit' })}>{labels.exit}</button>
        <span className="tp-hint">{labels.hint}</span>
      </div>
    </div>
  );
}
