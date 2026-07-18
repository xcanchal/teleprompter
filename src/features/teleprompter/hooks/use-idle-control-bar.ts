import { useEffect, useState, type RefObject } from 'react';

export function useIdleControlBar(active: boolean, stageRef: RefObject<HTMLElement | null>) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!active) {
      setIdle(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const reveal = () => {
      setIdle(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 2500);
    };

    reveal();
    const stage = stageRef.current;
    stage?.addEventListener('pointermove', reveal);
    stage?.addEventListener('pointerdown', reveal);

    return () => {
      stage?.removeEventListener('pointermove', reveal);
      stage?.removeEventListener('pointerdown', reveal);
      if (timer) clearTimeout(timer);
    };
  }, [active, stageRef]);

  return idle;
}
