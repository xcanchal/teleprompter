import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseCameraOptions {
  active: boolean;
  enabled: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onError: () => void;
}

export function useCamera({ active, enabled, videoRef, onError }: UseCameraOptions) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active || !enabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
      return;
    }

    let cancelled = false;
    const getUserMedia = navigator.mediaDevices?.getUserMedia;
    if (!getUserMedia) {
      onError();
      return;
    }

    getUserMedia
      .call(navigator.mediaDevices, { video: { facingMode: 'user' }, audio: true })
      .then((nextStream) => {
        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = nextStream;
        setStream(nextStream);
        if (videoRef.current) videoRef.current.srcObject = nextStream;
      })
      .catch(onError);

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    };
  }, [active, enabled, onError, videoRef]);

  return stream;
}
