import { useEffect, useMemo, useState } from 'react';
import { authedGetBlob } from '../lib/http';

type Props = {
  employeeId?: string | null;
  fallbackText: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

const objectUrlCache = new Map<string, string>();
const notFoundSet = new Set<string>();

export default function EmployeePhoto({ employeeId, fallbackText, alt, className, imgClassName, fallbackClassName }: Props) {
  const key = useMemo(() => (typeof employeeId === 'string' ? employeeId.trim() : ''), [employeeId]);
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
    if (notFoundSet.has(key)) {
      setSrc(null);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const blob = await authedGetBlob(`/api/carddb/photos/${encodeURIComponent(key)}`);
        const url = URL.createObjectURL(blob);
        objectUrlCache.set(key, url);
        if (active) setSrc(url);
      } catch (err) {
        const status = (err as any)?.status;
        if (status === 404) notFoundSet.add(key);
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

