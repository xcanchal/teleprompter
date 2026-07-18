export type PresentationCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'restart' }
  | { type: 'set-speed'; speed: number }
  | { type: 'adjust-speed'; delta: number }
  | { type: 'toggle-mirror' }
  | { type: 'seek'; position: number }
  | { type: 'exit' };
