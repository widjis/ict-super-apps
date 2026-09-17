import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('Android registers local OCR bridge and disables Capacitor payload logging', () => {
  assert.match(read('android/app/src/main/java/com/example/ictsuperapps/MainActivity.java'), /registerPlugin\(MacOcrPlugin.class\)/);
  assert.match(read('capacitor.config.ts'), /loggingBehavior: 'none'/);
  assert.match(read('android/app/build.gradle'), /com.google.mlkit:text-recognition:16.0.1/);
});
test('ML Kit never receives a URI and native code never logs image exceptions', () => {
  const source = read('android/app/src/main/java/com/example/ictsuperapps/MacOcrPlugin.java');
  assert.doesNotMatch(source, /fromFilePath|Log\.|Logger\.|printStackTrace/);
  assert.match(source, /InputImage.fromBitmap\(bitmap, 0\)/);
});
