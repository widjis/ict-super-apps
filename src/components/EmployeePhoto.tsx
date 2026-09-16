import { usePhotoUrl } from '../lib/usePhotoUrl';

type Props = {
  employeeId?: string | null;
  fallbackText: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

export default function EmployeePhoto({ employeeId, fallbackText, alt, className, imgClassName, fallbackClassName }: Props) {
  const key = typeof employeeId === 'string' ? employeeId.trim() : '';
  const src = usePhotoUrl(key ? `employee:${key}` : '', `/api/carddb/photos/${encodeURIComponent(key)}`);

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

