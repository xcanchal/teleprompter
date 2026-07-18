interface RecordingDownloadProps {
  downloadUrl: string | null;
  downloadExtension: string;
  label: string;
}

export function RecordingDownload({
  downloadUrl,
  downloadExtension,
  label,
}: RecordingDownloadProps) {
  if (!downloadUrl) return null;

  return (
    <a className="tp-download" href={downloadUrl} download={`teleprompter-video.${downloadExtension}`}>
      ⬇ {label}
    </a>
  );
}
