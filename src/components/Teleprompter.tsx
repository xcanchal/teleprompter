import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from './teleprompter/Editor';
import { EditorControls } from './teleprompter/EditorControls';
import { PresentationStage } from './teleprompter/PresentationStage';
import type { TpLabels } from './teleprompter/types';
import type { PresentationCommand } from '../features/teleprompter/domain/presentation-command';
import {
  clampSpeed,
  DEFAULT_SETTINGS,
  type TeleprompterSettings,
} from '../features/teleprompter/domain/settings';
import { useCamera } from '../features/teleprompter/hooks/use-camera';
import { exitFullscreen, useFullscreenAndWakeLock } from '../features/teleprompter/hooks/use-fullscreen-and-wake-lock';
import { useIdleControlBar } from '../features/teleprompter/hooks/use-idle-control-bar';
import { useKeyboardControls } from '../features/teleprompter/hooks/use-keyboard-controls';
import { usePresentationEngine } from '../features/teleprompter/hooks/use-presentation-engine';
import { useRecorder } from '../features/teleprompter/hooks/use-recorder';
import {
  loadStoredTeleprompterState,
  saveScript,
  saveSettings,
} from '../features/teleprompter/persistence/local-storage';

export type { TpLabels } from './teleprompter/types';

interface TeleprompterProps {
  labels: TpLabels;
  defaultScript: string;
}

export default function Teleprompter({ labels, defaultScript }: TeleprompterProps) {
  const [script, setScript] = useState(defaultScript);
  const [settings, setSettings] = useState<TeleprompterSettings>(DEFAULT_SETTINGS);
  const [storageReady, setStorageReady] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const stored = loadStoredTeleprompterState();
    if (stored.script !== null) setScript(stored.script);
    setSettings(stored.settings);
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (storageReady) saveScript(script);
  }, [script, storageReady]);

  useEffect(() => {
    if (storageReady) saveSettings(settings);
  }, [settings, storageReady]);

  const exitPresentation = useCallback(() => {
    setCountdown(null);
    setPrompting(false);
    exitFullscreen();
  }, []);

  const presentation = usePresentationEngine({
    active: prompting,
    textRef,
  });
  const idle = useIdleControlBar(prompting, stageRef);

  const handleCameraError = useCallback(() => {
    setCameraError(true);
    setSettings((current) => ({ ...current, camera: false }));
  }, []);
  const stream = useCamera({
    active: prompting,
    enabled: settings.camera,
    videoRef: cameraRef,
    onError: handleCameraError,
  });
  const recorder = useRecorder(stream);

  const dispatch = useCallback(
    (command: PresentationCommand) => {
      switch (command.type) {
        case 'play':
          presentation.setPlaying(true);
          break;
        case 'pause':
          presentation.setPlaying(false);
          break;
        case 'restart':
          presentation.reset();
          setCountdown(3);
          break;
        case 'set-speed':
          setSettings((current) => ({ ...current, speed: clampSpeed(command.speed) }));
          break;
        case 'adjust-speed':
          setSettings((current) => ({
            ...current,
            speed: clampSpeed(current.speed + command.delta),
          }));
          break;
        case 'toggle-mirror':
          setSettings((current) => ({ ...current, mirror: !current.mirror }));
          break;
        case 'seek':
          presentation.setPosition(command.position);
          break;
        case 'exit':
          presentation.setPlaying(false);
          exitPresentation();
          break;
      }
    },
    [exitPresentation, presentation],
  );

  useKeyboardControls({
    active: prompting,
    countdownActive: countdown !== null,
    dispatch,
  });
  useFullscreenAndWakeLock({
    active: prompting,
    stageRef,
    onFullscreenExit: () => dispatch({ type: 'exit' }),
  });

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      dispatch({ type: 'play' });
      return;
    }

    const timer = setTimeout(() => setCountdown((current) => (current === null ? null : current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, dispatch]);

  const enterPresentation = useCallback(() => {
    presentation.reset();
    setPrompting(true);
    setCountdown(3);
  }, [presentation]);

  const setCamera = useCallback((camera: boolean) => {
    if (camera) setCameraError(false);
    setSettings((current) => ({ ...current, camera }));
  }, []);

  return (
    <div className="tp">
      <div className="tp-bezel">
        <span className="tp-bezel-label">{labels.bezel}</span>
        <span className={`tp-tally${recorder.recording ? ' is-live' : ''}`}>
          <i /> {recorder.recording ? labels.onAir : labels.standby}
        </span>
      </div>

      <Editor script={script} placeholder={labels.placeholder} onChange={setScript} />
      {cameraError && <p className="tp-camera-error" role="alert">{labels.camError}</p>}
      <EditorControls
        labels={labels}
        settings={settings}
        script={script}
        downloadUrl={recorder.downloadUrl}
        downloadExtension={recorder.downloadExtension}
        onSetSpeed={(speed) => dispatch({ type: 'set-speed', speed })}
        onSetFontSize={(fontSize) => setSettings((current) => ({ ...current, fontSize }))}
        onSetMirror={(mirror) => setSettings((current) => ({ ...current, mirror }))}
        onSetCamera={setCamera}
        onStart={enterPresentation}
      />

      {prompting && (
        <PresentationStage
          labels={labels}
          script={script}
          settings={settings}
          countdown={countdown}
          playing={presentation.playing}
          idle={idle}
          recording={recorder.recording}
          stageRef={stageRef}
          textRef={textRef}
          cameraRef={cameraRef}
          dispatch={dispatch}
          onToggleRecording={recorder.toggleRecording}
        />
      )}
    </div>
  );
}
