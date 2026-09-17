import { Capacitor, registerPlugin } from '@capacitor/core';
export type ImageSource = 'camera' | 'gallery';
type OcrBridge = { recognize(options: { source: ImageSource }): Promise<{ text: string }> };
const nativeOcr = registerPlugin<OcrBridge>('MacOcr');
export async function scanMacImage(source: ImageSource, bridge: OcrBridge = nativeOcr): Promise<string[]> {
  if (Capacitor.getPlatform() !== 'android') throw new Error('Photo OCR is available in the Android app only.');
  const result = await bridge.recognize({ source });
  if (typeof result?.text !== 'string' || result.text.length > 32768) throw new Error('OCR result unavailable.');
  return extractMacCandidates(result.text).slice(0, 32);
}
// Deliberately no OCR character correction: candidates must be explicit unicast MACs.
export function extractMacCandidates(text: string): string[] {
  const matches = text.match(/(?<![\w:-])(?:[\da-f]{2}(?::[\da-f]{2}){5}|[\da-f]{2}(?:-[\da-f]{2}){5}|[\da-f]{12})(?![\w:-])/gi) ?? [];
  return [...new Set(matches.map(value => value.replace(/[:-]/g, '').toUpperCase())
    .filter(hex => hex !== '000000000000' && !(parseInt(hex.slice(0, 2), 16) & 1))
    .map(hex => hex.match(/.{2}/g)!.join(':')))];
}
