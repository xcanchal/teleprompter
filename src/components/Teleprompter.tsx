import { useCallback, useEffect, useRef, useState } from 'react';

export interface TpLabels {
  bezel: string;
  standby: string;
  onAir: string;
  placeholder: string;
  speed: string;
  fontSize: string;
  mirror: string;
  camera: string;
  start: string;
  pause: string;
  resume: string;
  restart: string;
  record: string;
  stopRec: string;
  exit: string;
  download: string;
  hint: string;
  camError: string;
}

interface Settings {
  speed: number; // px per second
  fontSize: number; // px
  mirror: boolean;
  camera: boolean;
}

const DEFAULTS: Settings = { speed: 60, fontSize: 48, mirror: false, camera: false };
const LS_SCRIPT = 'tp-script';
const LS_SETTINGS = 'tp-settings';

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

export default function Teleprompter({ labels, defaultScript }: { labels: TpLabels; defaultScript: string }) {
  const [script, setScript] = useState(defaultScript);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [prompting, setPrompting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadExt, setDownloadExt] = useState('webm');
  const [idleBar, setIdleBar] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLVideoElement>(null);
  const offsetRef = useRef(0);
  const playingRef = useRef(false);
  const speedRef = useRef(DEFAULTS.speed);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const wakeLockRef = useRef<any>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  speedRef.current = settings.speed;

  /* ------------------------------ persistence ----------------------------- */
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_SCRIPT);
      if (s !== null) setScript(s);
      const cfg = localStorage.getItem(LS_SETTINGS);
      if (cfg) setSettings({ ...DEFAULTS, ...JSON.parse(cfg) });
    } catch {
      /* storage unavailable — run stateless */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SCRIPT, script);
    } catch {}
  }, [script]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  /* ------------------------------ scroll loop ----------------------------- */
  const applyOffset = useCallback(() => {
    if (textRef.current) {
      textRef.current.style.top = `${25 * (window.innerHeight / 100) - offsetRef.current}px`;
    }
  }, []);

  const loop = useCallback(
    (ts: number) => {
      const dt = lastTsRef.current ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      if (playingRef.current && textRef.current) {
        offsetRef.current += speedRef.current * dt;
        const max = textRef.current.offsetHeight + window.innerHeight * 0.25;
        if (offsetRef.current >= max) {
          offsetRef.current = max;
          playingRef.current = false;
          setPlaying(false);
        }
        applyOffset();
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [applyOffset],
  );

  const setPlay = useCallback((v: boolean) => {
    playingRef.current = v;
    lastTsRef.current = 0;
    setPlaying(v);
  }, []);

  /* --------------------------- enter/exit prompter ------------------------ */
  const enterPrompter = useCallback(async () => {
    setPrompting(true);
    offsetRef.current = 0;
    setCountdown(3);
  }, []);

  const exitPrompter = useCallback(() => {
    setPlay(false);
    setCountdown(null);
    setPrompting(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [setPlay]);

  // stage lifecycle: fullscreen, rAF, keys, wake lock, camera
  useEffect(() => {
    if (!prompting) return;

    applyOffset();
    rafRef.current = requestAnimationFrame(loop);

    stageRef.current?.requestFullscreen?.().catch(() => {});
    (navigator as any).wakeLock
      ?.request('screen')
      .then((l: any) => (wakeLockRef.current = l))
      .catch(() => {});

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (countdown === null) setPlay(!playingRef.current);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSettings((s) => ({ ...s, speed: Math.min(200, s.speed + 5) }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSettings((s) => ({ ...s, speed: Math.max(10, s.speed - 5) }));
      } else if (e.key.toLowerCase() === 'm') {
        setSettings((s) => ({ ...s, mirror: !s.mirror }));
      } else if (e.key === 'Escape') {
        exitPrompter();
      }
    };
    window.addEventListener('keydown', onKey);

    const onFsChange = () => {
      // leaving browser fullscreen (Esc) also exits the prompter
      if (!document.fullscreenElement) exitPrompter();
    };
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
      wakeLockRef.current?.release?.().catch?.(() => {});
      wakeLockRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompting, exitPrompter, loop, setPlay, countdown === null]);

  // countdown ticker → autoplay
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setPlay(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, setPlay]);

  // auto-hide the control bar while scrolling
  useEffect(() => {
    if (!prompting) return;
    const poke = () => {
      setIdleBar(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIdleBar(true), 2500);
    };
    poke();
    const stage = stageRef.current;
    stage?.addEventListener('pointermove', poke);
    stage?.addEventListener('pointerdown', poke);
    return () => {
      stage?.removeEventListener('pointermove', poke);
      stage?.removeEventListener('pointerdown', poke);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [prompting]);

  /* -------------------------------- camera -------------------------------- */
  useEffect(() => {
    if (!prompting || !settings.camera) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: true })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (camRef.current) camRef.current.srcObject = stream;
      })
      .catch(() => {
        alert(labels.camError);
        setSettings((s) => ({ ...s, camera: false }));
      });
    return () => {
      cancelled = true;
      recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop?.();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompting, settings.camera]);

  const toggleRecording = useCallback(() => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const type = mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      setDownloadUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      setDownloadExt(type.includes('mp4') ? 'mp4' : 'webm');
      setRecording(false);
    };
    rec.start();
    recorderRef.current = rec;
    setRecording(true);
  }, [recording]);

  /* --------------------------------- UI ----------------------------------- */
  const tallyLive = recording;

  return (
    <div className="tp">
      <div className="tp-bezel">
        <span className="tp-bezel-label">{labels.bezel}</span>
        <span className={`tp-tally${tallyLive ? ' is-live' : ''}`}>
          <i /> {tallyLive ? labels.onAir : labels.standby}
        </span>
      </div>

      <div className="tp-glass">
        <textarea
          className="tp-editor"
          value={script}
          placeholder={labels.placeholder}
          onChange={(e) => setScript(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="tp-controls">
        <label className="tp-field">
          {labels.speed}
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={settings.speed}
            onChange={(e) => setSettings((s) => ({ ...s, speed: +e.target.value }))}
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
            onChange={(e) => setSettings((s) => ({ ...s, fontSize: +e.target.value }))}
          />
          <output>{settings.fontSize}</output>
        </label>

        <label className="tp-toggle">
          <input
            type="checkbox"
            checked={settings.mirror}
            onChange={(e) => setSettings((s) => ({ ...s, mirror: e.target.checked }))}
          />
          {labels.mirror}
        </label>

        <label className="tp-toggle">
          <input
            type="checkbox"
            checked={settings.camera}
            onChange={(e) => setSettings((s) => ({ ...s, camera: e.target.checked }))}
          />
          {labels.camera}
        </label>

        {downloadUrl && (
          <a className="tp-download" href={downloadUrl} download={`teleprompter-video.${downloadExt}`}>
            ⬇ {labels.download}
          </a>
        )}

        <button className="tp-start" onClick={enterPrompter} disabled={!script.trim()}>
          {labels.start}
        </button>
      </div>

      {prompting && (
        <div
          ref={stageRef}
          className={`tp-stage${settings.mirror ? ' is-mirrored' : ''}${idleBar && playing ? ' is-idle' : ''}`}
        >
          {settings.camera && <video ref={camRef} className="tp-cam" autoPlay muted playsInline />}

          <div className="tp-scroller" onClick={() => countdown === null && setPlay(!playingRef.current)}>
            <div
              ref={textRef}
              className="tp-text"
              style={{ fontSize: settings.fontSize, lineHeight: 1.45 }}
            >
              {script}
            </div>
          </div>

          <div className="tp-marker" aria-hidden="true" />

          {countdown !== null && countdown > 0 && <div className="tp-countdown">{countdown}</div>}

          <div className="tp-bar" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPlay(!playing)}>{playing ? labels.pause : labels.resume}</button>
            <button
              onClick={() => {
                offsetRef.current = 0;
                applyOffset();
                setPlay(false);
                setCountdown(3);
              }}
            >
              {labels.restart}
            </button>
            <label className="tp-field">
              {labels.speed}
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={settings.speed}
                onChange={(e) => setSettings((s) => ({ ...s, speed: +e.target.value }))}
              />
              <output>{settings.speed}</output>
            </label>
            {settings.camera && (
              <button className={recording ? 'is-rec' : ''} onClick={toggleRecording}>
                {recording ? `■ ${labels.stopRec}` : `● ${labels.record}`}
              </button>
            )}
            <button onClick={exitPrompter}>{labels.exit}</button>
            <span className="tp-hint">{labels.hint}</span>
          </div>
        </div>
      )}
    </div>
  );
}
