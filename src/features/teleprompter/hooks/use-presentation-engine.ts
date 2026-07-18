import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface UsePresentationEngineOptions {
  active: boolean;
  textRef: RefObject<HTMLDivElement | null>;
  onComplete?: () => void;
}

export function usePresentationEngine({
  active,
  textRef,
  onComplete,
}: UsePresentationEngineOptions) {
  const [playing, setPlayingState] = useState(false);
  const offsetRef = useRef(0);
  const playingRef = useRef(false);
  const speedRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const applyOffset = useCallback(() => {
    if (textRef.current) {
      textRef.current.style.top = `${window.innerHeight * 0.25 - offsetRef.current}px`;
    }
  }, [textRef]);

  const setPlaying = useCallback((nextPlaying: boolean) => {
    playingRef.current = nextPlaying;
    lastTimestampRef.current = 0;
    setPlayingState(nextPlaying);
  }, []);

  const reset = useCallback(() => {
    offsetRef.current = 0;
    applyOffset();
    setPlaying(false);
  }, [applyOffset, setPlaying]);

  const setPosition = useCallback(
    (position: number) => {
      offsetRef.current = Math.max(0, position);
      applyOffset();
    },
    [applyOffset],
  );

  const loop = useCallback(
    (timestamp: number) => {
      const elapsedSeconds = lastTimestampRef.current
        ? (timestamp - lastTimestampRef.current) / 1000
        : 0;
      lastTimestampRef.current = timestamp;

      if (playingRef.current && textRef.current) {
        offsetRef.current += speedRef.current * elapsedSeconds;
        const maximumOffset = textRef.current.offsetHeight + window.innerHeight * 0.25;

        if (offsetRef.current >= maximumOffset) {
          offsetRef.current = maximumOffset;
          setPlaying(false);
          onCompleteRef.current?.();
        }

        applyOffset();
      }

      rafRef.current = requestAnimationFrame(loop);
    },
    [applyOffset, setPlaying, textRef],
  );

  useEffect(() => {
    if (!active) return;

    applyOffset();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, applyOffset, loop]);

  return {
    applyOffset,
    playing,
    reset,
    setPlaying,
    setPosition,
    speedRef,
  };
}
