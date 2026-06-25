import { describe, expect, it, vi } from 'vitest';
import { getCroppedImage } from './cropImage';

describe('getCroppedImage', () => {
  it('returns cropped image data url', async () => {
    const drawImage = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toDataURL: () => 'data:image/jpeg;base64,cropped',
    } as unknown as HTMLCanvasElement);

    vi.stubGlobal(
      'Image',
      class {
        addEventListener(event: string, handler: () => void) {
          if (event === 'load') {
            handler();
          }
        }
        setAttribute() {}
      }
    );

    await expect(
      getCroppedImage('image.png', { x: 0, y: 0, width: 100, height: 100 }, 128)
    ).resolves.toBe('data:image/jpeg;base64,cropped');

    expect(drawImage).toHaveBeenCalled();
  });

  it('rejects with Error when image fails to load', async () => {
    class ErrorImage {
      _handlers: Record<string, () => void> = {};
      addEventListener(event: string, handler: () => void) {
        this._handlers[event] = handler;
      }
      set src(_v: string) {
        if (this._handlers['error']) this._handlers['error']();
      }
      setAttribute() {}
    }
    vi.stubGlobal('Image', ErrorImage);

    await expect(getCroppedImage('bad.png', { x: 0, y: 0, width: 10, height: 10 })).rejects.toThrow(
      'Failed to load image'
    );
  });

  it('throws when canvas is unavailable', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => null,
    } as unknown as HTMLCanvasElement);

    vi.stubGlobal(
      'Image',
      class {
        addEventListener(_event: string, handler: () => void) {
          handler();
        }
        setAttribute() {}
      }
    );

    await expect(
      getCroppedImage('image.png', { x: 0, y: 0, width: 10, height: 10 })
    ).rejects.toThrow('Canvas is not supported');
  });
});
