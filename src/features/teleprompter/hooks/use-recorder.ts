import { useCallback, useEffect, useRef, useState } from 'react';

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];

  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return '';
}

export function useRecorder(stream: MediaStream | null) {
  const [recording, setRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadExtension, setDownloadExtension] = useState('webm');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const downloadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!stream && recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
  }, [stream]);

  const toggleRecording = useCallback(() => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }

    if (!stream || typeof MediaRecorder === 'undefined') return;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const type = mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
      const nextDownloadUrl = URL.createObjectURL(blob);
      downloadUrlRef.current = nextDownloadUrl;
      setDownloadUrl(nextDownloadUrl);
      setDownloadExtension(type.includes('mp4') ? 'mp4' : 'webm');
      setRecording(false);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }, [recording, stream]);

  return { downloadExtension, downloadUrl, recording, toggleRecording };
}
