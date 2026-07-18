import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Teleprompter from '../../src/components/Teleprompter';
import { tpLabels } from '../../src/i18n/ui';

const labels = tpLabels.en;

function renderTeleprompter(defaultScript = 'A short script') {
  return render(<Teleprompter labels={labels} defaultScript={defaultScript} />);
}

describe('Teleprompter', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores the saved script and settings without overwriting them on load', async () => {
    window.localStorage.setItem('tp-script', 'Saved script');
    window.localStorage.setItem('tp-settings', JSON.stringify({ speed: 75, fontSize: 52, mirror: true }));

    renderTeleprompter('Default script');

    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('Saved script'));
    expect(screen.getAllByText('75')).toHaveLength(1);
    expect(screen.getByLabelText('Mirror mode')).toBeChecked();
    expect(window.localStorage.getItem('tp-script')).toBe('Saved script');
  });

  it('disables starting an empty script', () => {
    renderTeleprompter('');

    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
  });

  it('routes keyboard controls through the presentation commands', async () => {
    renderTeleprompter();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(screen.getByText('3')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.getAllByText('65')).toHaveLength(2);

    fireEvent.keyDown(window, { key: 'm' });
    expect(document.querySelector('.tp-stage')).toHaveClass('is-mirrored');

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('.tp-stage')).not.toBeInTheDocument());
  });

  it('continues into presentation if Wake Lock is unavailable', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: vi.fn().mockRejectedValue(new Error('not available')) },
    });
    renderTeleprompter();

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(document.querySelector('.tp-stage')).toBeInTheDocument();
  });

  it('records camera media locally and exposes a download when stopped', async () => {
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    const createObjectURL = vi.fn(() => 'blob:recording');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });

    class FakeMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      state: RecordingState = 'inactive';
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;

      constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}

      start() {
        this.state = 'recording';
      }

      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['video']) } as BlobEvent);
        this.onstop?.();
      }
    }
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);

    renderTeleprompter();
    fireEvent.click(screen.getByLabelText('Camera'));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: /Record/ }));
    expect(screen.getByRole('button', { name: /Stop/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Stop/ }));
    await waitFor(() => expect(screen.getByRole('link', { name: /Download video/ })).toHaveAttribute('href', 'blob:recording'));
    expect(createObjectURL).toHaveBeenCalledOnce();
  });
});
