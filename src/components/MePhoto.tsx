import { useEffect, useState } from 'react';
import { getAuthUserRaw } from '../auth/storage';
import { authedGetBlob } from '../lib/http';

type Props = {
  fallbackText: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

const objectUrlCache = new Map<string, string>();
const failedKeySet = new Set<string>();

export default function MePhoto({ fallbackText, alt, className, imgClassName, fallbackClassName }: Props) {
  const key = getAuthUserRaw() ?? '';
  const cached = key ? objectUrlCache.get(key) ?? null : null;
  const [src, setSrc] = useState<string | null>(cached);

  useEffect(() => {
    if (!key) {
      setSrc(null);
      return;
    }
    if (objectUrlCache.has(key)) {
      setSrc(objectUrlCache.get(key) ?? null);
      return;
    }
    if (failedKeySet.has(key)) {
      setSrc(null);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const blob = await authedGetBlob('/api/me/photo');
        const url = URL.createObjectURL(blob);
        objectUrlCache.set(key, url);
        if (active) setSrc(url);
      } catch (err) {
        const status = (err as any)?.status;
        if (status === 401 || status === 403 || status === 404) failedKeySet.add(key);
        if (active) setSrc(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [key]);

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
