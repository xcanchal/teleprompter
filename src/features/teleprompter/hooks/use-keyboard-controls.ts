import { useEffect, useRef } from 'react';
import type { PresentationCommand } from '../domain/presentation-command';

interface UseKeyboardControlsOptions {
  active: boolean;
  countdownActive: boolean;
  dispatch: (command: PresentationCommand) => void;
}

export function useKeyboardControls({
  active,
  countdownActive,
  dispatch,
}: UseKeyboardControlsOptions) {
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (!countdownActive) dispatchRef.current({ type: 'play' });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        dispatchRef.current({ type: 'adjust-speed', delta: 5 });
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        dispatchRef.current({ type: 'adjust-speed', delta: -5 });
      } else if (event.key.toLowerCase() === 'm') {
        dispatchRef.current({ type: 'toggle-mirror' });
      } else if (event.key === 'Escape') {
        dispatchRef.current({ type: 'exit' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, countdownActive]);
}
