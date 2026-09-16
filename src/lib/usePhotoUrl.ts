import { useEffect, useState } from 'react';
import { authedGetBlob } from './http';

const missingUntil = new Map<string, number>();
const NEGATIVE_TTL_MS = 5 * 60 * 1000;
// Keep only negative responses globally. Object URLs belong to their mounted
// consumer, so concurrent photos cannot revoke each other's URLs or leak them.
export function usePhotoUrl(key: string, path: string) {
 const [photo, setPhoto] = useState<{ key: string; url: string } | null>(null);
 useEffect(() => {
  setPhoto(null);
  if (!key) return;
  const now = Date.now();
  for (const [entry, expiry] of missingUntil) if (expiry <= now) missingUntil.delete(entry);
  if ((missingUntil.get(key) ?? 0) > now) return;
  let active = true;
  let url: string | undefined;
  void authedGetBlob(path).then(blob => {
   if (!active) return;
   missingUntil.delete(key);
   url = URL.createObjectURL(blob);
   setPhoto({key,url});
  }).catch((error: unknown) => {
   if (!active) return;
   if ((error as {status?: number})?.status === 404) {
    // Bounded negative-only cache; evicting merely permits an early retry.
    if (missingUntil.size >= 2000) missingUntil.delete(missingUntil.keys().next().value!);
    missingUntil.set(key, Date.now() + NEGATIVE_TTL_MS);
   }
  });
  return () => { active = false; if (url) URL.revokeObjectURL(url); };
 }, [key, path]);
 return photo?.key === key ? photo.url : null;
}
