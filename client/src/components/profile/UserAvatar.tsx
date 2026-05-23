import { resolveAssetUrl } from '../../services/api';

interface UserAvatarProps {
  username?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-base',
  md: 'w-24 h-24 text-3xl',
  lg: 'w-32 h-32 text-4xl',
};

export default function UserAvatar({
  username,
  avatarUrl,
  size = 'sm',
  className = '',
}: UserAvatarProps) {
  const initial = username?.[0]?.toUpperCase() || 'U';
  const sizeClass = sizeClasses[size];

  const resolvedAvatarUrl = resolveAssetUrl(avatarUrl);

  if (resolvedAvatarUrl) {
    return (
      <img
        src={resolvedAvatarUrl}
        alt={username || 'User avatar'}
        className={`${sizeClass} rounded-full object-cover border border-cyber-border cyber-glow ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-cyber-primary rounded-full flex items-center justify-center text-cyber-background font-bold cyber-glow ${className}`}
    >
      {initial}
    </div>
  );
}
