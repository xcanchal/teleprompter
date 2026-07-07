import type { TpLabels } from '../components/Teleprompter';

export const tpLabels: Record<'es' | 'en', TpLabels> = {
  es: {
    bezel: 'Teleprompter online',
    standby: 'En espera',
    onAir: 'Grabando',
    placeholder: 'Pega aquí tu guion y pulsa Empezar…',
    speed: 'Velocidad',
    fontSize: 'Letra',
    mirror: 'Modo espejo',
    camera: 'Cámara',
    start: 'Empezar',
    pause: 'Pausar',
    resume: 'Reproducir',
    restart: 'Reiniciar',
    record: 'Grabar',
    stopRec: 'Detener',
    exit: 'Salir',
    download: 'Descargar vídeo',
    hint: 'Espacio: pausa · ↑↓: velocidad · M: espejo · Esc: salir',
    camError:
      'No se pudo acceder a la cámara. Revisa los permisos del navegador e inténtalo de nuevo.',
  },
  en: {
    bezel: 'Online teleprompter',
    standby: 'Standby',
    onAir: 'Recording',
    placeholder: 'Paste your script here and press Start…',
    speed: 'Speed',
    fontSize: 'Font',
    mirror: 'Mirror mode',
    camera: 'Camera',
    start: 'Start',
    pause: 'Pause',
    resume: 'Play',
    restart: 'Restart',
    record: 'Record',
    stopRec: 'Stop',
    exit: 'Exit',
    download: 'Download video',
    hint: 'Space: pause · ↑↓: speed · M: mirror · Esc: exit',
    camError: 'Could not access the camera. Check your browser permissions and try again.',
  },
};

export const defaultScript: Record<'es' | 'en', string> = {
  es: `Bienvenido a tu teleprompter online gratis.

Escribe o pega aquí tu guion. Cuando pulses Empezar, el texto se desplazará automáticamente en pantalla completa, con una cuenta atrás de tres segundos para que te prepares.

Usa la barra espaciadora para pausar, las flechas para ajustar la velocidad sobre la marcha y la tecla M para activar el modo espejo si usas un teleprompter físico.

Si activas la cámara, puedes grabarte mientras lees. El vídeo se procesa íntegramente en tu navegador: no se sube a ningún servidor.`,
  en: `Welcome to your free online teleprompter.

Type or paste your script here. When you press Start, the text will scroll automatically in full screen, with a three-second countdown so you can get ready.

Use the space bar to pause, the arrow keys to adjust speed on the fly, and the M key to enable mirror mode if you use physical teleprompter hardware.

If you turn on the camera, you can record yourself while reading. The video is processed entirely in your browser — nothing is uploaded to any server.`,
};
