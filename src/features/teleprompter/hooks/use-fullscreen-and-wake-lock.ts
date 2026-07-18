import { useEffect, useRef, type RefObject } from 'react';

interface UseFullscreenAndWakeLockOptions {
  active: boolean;
  stageRef: RefObject<HTMLElement | null>;
  onFullscreenExit: () => void;
}

interface WakeLockSentinelLike {
  release?: () => Promise<void>;
}

export function useFullscreenAndWakeLock({
  active,
  stageRef,
  onFullscreenExit,
}: UseFullscreenAndWakeLockOptions) {
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const onFullscreenExitRef = useRef(onFullscreenExit);

  useEffect(() => {
    onFullscreenExitRef.current = onFullscreenExit;
  }, [onFullscreenExit]);

  useEffect(() => {
    if (!active) return;

    stageRef.current?.requestFullscreen?.().catch(() => {});
    const wakeLock = (navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    }).wakeLock;
    wakeLock?.request('screen').then((lock) => (wakeLockRef.current = lock)).catch(() => {});

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) onFullscreenExitRef.current();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [active, stageRef]);
}

export function exitFullscreen(): void {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
