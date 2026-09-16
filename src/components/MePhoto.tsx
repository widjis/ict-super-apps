import { getAuthUserRaw } from '../auth/storage';
import { usePhotoUrl } from '../lib/usePhotoUrl';

type Props = {
  fallbackText: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

export default function MePhoto({ fallbackText, alt, className, imgClassName, fallbackClassName }: Props) {
  const key = getAuthUserRaw() ?? '';
  const src = usePhotoUrl(key ? `me:${key}` : '', '/api/me/photo');

  return (
    <div className={className}>
      {src ? (
        <img src={src} alt={alt ?? 'User photo'} className={imgClassName ?? 'w-full h-full object-cover'} />
      ) : (
        <span className={fallbackClassName}>{fallbackText}</span>
      )}
    </div>
  );
}
