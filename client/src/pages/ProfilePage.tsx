import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { getRankLabel } from '../utils/rank';
import UserAvatar from '../components/profile/UserAvatar';
import AvatarCropModal from '../components/profile/AvatarCropModal';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfilePage() {
  const { t } = useTranslation(['profile', 'ui']);
  const { user, logout, updateUser, refreshUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handlePickPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t('invalidFileType', { ns: 'profile' }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t('fileTooLarge', { ns: 'profile' }));
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropImageSrc(reader.result);
        setIsCropOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async (croppedImage: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const updatedUser = await api.uploadAvatar(croppedImage);
      updateUser(updatedUser);
      setIsCropOpen(false);
      setCropImageSrc(null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : t('uploadFailed', { ns: 'profile' })
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseCrop = () => {
    if (isSaving) return;
    setIsCropOpen(false);
    setCropImageSrc(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading font-bold text-3xl text-cyber-primary mb-8">
        {t('title', { ns: 'profile' })}
      </h1>

      <div className="cyber-panel p-6 space-y-6 max-w-xl">
        <div className="flex items-center gap-6">
          <div className="relative">
            <UserAvatar username={user?.username} avatarUrl={user?.avatarUrl} size="lg" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <h2 className="font-heading font-bold text-xl text-white">{user?.username}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <button
              type="button"
              onClick={handlePickPhoto}
              className="mt-3 text-sm text-cyber-primary hover:underline"
            >
              {t('changePhoto', { ns: 'profile' })}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-cyber-danger">{error}</p>}

        <div className="pt-4 border-t border-cyber-border">
          <h3 className="font-heading font-bold text-lg text-cyber-primary mb-4">
            {t('account', { ns: 'profile' })}
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">{t('username', { ns: 'profile' })}:</span>{' '}
              <span className="text-white">{user?.username}</span>
            </div>
            <div>
              <span className="text-gray-400">{t('email', { ns: 'profile' })}:</span>{' '}
              <span className="text-white">{user?.email}</span>
            </div>
            <div>
              <span className="text-gray-400">{t('rank', { ns: 'ui' })}:</span>{' '}
              <span className="text-cyber-primary">
                {user?.rank ? getRankLabel(user.rank, t) : ''}
              </span>
            </div>
            <div>
              <span className="text-gray-400">{t('xp', { ns: 'ui' })}:</span>{' '}
              <span className="text-cyber-success">{user?.xp}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-cyber-border">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="cyber-button-danger"
          >
            {t('logout', { ns: 'profile' })}
          </motion.button>
        </div>
      </div>

      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          isOpen={isCropOpen}
          onClose={handleCloseCrop}
          onSave={handleSaveAvatar}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
