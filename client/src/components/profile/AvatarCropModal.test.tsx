import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AvatarCropModal from './AvatarCropModal';

const { getCroppedImage } = vi.hoisted(() => ({
  getCroppedImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,cropped'),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-easy-crop', () => ({
  default: ({
    onCropComplete,
    onZoomChange,
  }: {
    onCropComplete: (
      area: unknown,
      pixels: { x: number; y: number; width: number; height: number }
    ) => void;
    onZoomChange: (value: number) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onCropComplete({}, { x: 0, y: 0, width: 100, height: 100 })}
      >
        complete-crop
      </button>
      <input
        type="range"
        aria-label="zoom"
        defaultValue="1"
        onChange={(event) => onZoomChange(Number(event.target.value))}
      />
    </div>
  ),
}));

vi.mock('../../utils/cropImage', () => ({
  getCroppedImage,
}));

describe('AvatarCropModal', () => {
  it('saves cropped image and closes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <AvatarCropModal
        imageSrc="data:image/jpeg;base64,abc"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole('button', { name: 'complete-crop' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => {
      expect(getCroppedImage).toHaveBeenCalled();
      expect(onSave).toHaveBeenCalledWith('data:image/jpeg;base64,cropped');
    });
  });

  it('returns null when closed', () => {
    const { container } = render(
      <AvatarCropModal
        imageSrc="data:image/jpeg;base64,abc"
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
