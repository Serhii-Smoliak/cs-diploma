import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getCroppedImage } from '../../utils/cropImage';

interface AvatarCropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: string) => Promise<void>;
  isSaving?: boolean;
}

export default function AvatarCropModal({
  imageSrc,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: AvatarCropModalProps) {
  const { t } = useTranslation(['profile']);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    const croppedImage = await getCroppedImage(imageSrc, croppedAreaPixels);
    await onSave(croppedImage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="cyber-panel w-full max-w-lg border border-cyber-border p-6"
      >
        <h2 className="font-heading font-bold text-xl text-cyber-primary mb-4">
          {t('cropTitle', { ns: 'profile' })}
        </h2>

        <div className="relative h-72 bg-cyber-background rounded-lg overflow-hidden border border-cyber-border">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm text-gray-400 mb-2">{t('zoom', { ns: 'profile' })}</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-cyber-primary"
          />
        </div>

        <p className="text-xs text-gray-500 mt-3">{t('cropHint', { ns: 'profile' })}</p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="cyber-button px-4 py-2 disabled:opacity-50"
          >
            {t('cancel', { ns: 'profile' })}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !croppedAreaPixels}
            className="cyber-button-success px-4 py-2 disabled:opacity-50"
          >
            {isSaving ? t('saving', { ns: 'profile' }) : t('save', { ns: 'profile' })}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
