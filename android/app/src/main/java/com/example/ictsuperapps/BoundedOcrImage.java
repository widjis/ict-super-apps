package com.example.ictsuperapps;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.*;

/** Owns the only compressed copy and performs bounds-first pixel allocation. No URI enters codecs. */
final class BoundedOcrImage {
    static final int MAX_BYTES = 20 * 1024 * 1024;
    private volatile boolean cancelled;
    private final long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(30);
    private File temporary;
    synchronized void cancel() {
        cancelled = true;
        if (temporary != null) temporary.delete();
    }
    void check() throws IOException {
        if (cancelled || System.nanoTime() >= deadline) throw new IOException("Scan ended");
    }
    Bitmap decode(InputStream source, File cache) throws IOException {
        File copy;
        OutputStream output;
        synchronized (this) {
            check();
            copy = File.createTempFile("ocr-decode-", ".image", cache);
            temporary = copy;
            // Open while holding the cancellation lock: never recreate an unlinked private copy.
            try { output = new FileOutputStream(copy); }
            catch (IOException error) { copy.delete(); temporary = null; throw error; }
        }
        try {
            try (OutputStream out = output) {
                byte[] buffer = new byte[8192];
                int count, total = 0;
                while (true) {
                    check();
                    count = source.read(buffer);
                    check();
                    if (count == -1) break;
                    total += count;
                    if (total > MAX_BYTES) throw new IOException("Image limit");
                    out.write(buffer, 0, count);
                }
            }
            check();
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(copy.getPath(), options);
            int width = options.outWidth, height = options.outHeight;
            if (width <= 0 || height <= 0) throw new IOException("Invalid image");
            // Bound codec row/scratch work as well as the sampled output allocation.
            if (width > 32768 || height > 32768 || (long) width * height > 100_000_000L) {
                throw new IOException("Image dimensions exceed limit");
            }
            options.inSampleSize = 1;
            while ((width + (long) options.inSampleSize - 1) / options.inSampleSize > 2048
                || (height + (long) options.inSampleSize - 1) / options.inSampleSize > 2048
                || ((width + (long) options.inSampleSize - 1) / options.inSampleSize)
                   * ((height + (long) options.inSampleSize - 1) / options.inSampleSize) > 4_000_000) {
                options.inSampleSize *= 2;
            }
            options.inJustDecodeBounds = false;
            options.inPreferredConfig = Bitmap.Config.ARGB_8888;
            android.graphics.Matrix transform = new android.graphics.Matrix();
            int orientation;
            try (InputStream in = new FileInputStream(copy)) {
                orientation = new android.media.ExifInterface(in).getAttributeInt(
                    android.media.ExifInterface.TAG_ORIENTATION, 1);
            }
            switch (orientation) {
                case 2: transform.setScale(-1, 1); break;
                case 3: transform.setRotate(180); break;
                case 4: transform.setScale(1, -1); break;
                case 5: transform.setRotate(90); transform.postScale(-1, 1); break;
                case 6: transform.setRotate(90); break;
                case 7: transform.setRotate(90); transform.postScale(1, -1); break;
                case 8: transform.setRotate(270); break;
                default: break;
            }
            check();
            Bitmap bitmap = BitmapFactory.decodeFile(copy.getPath(), options);
            if (bitmap == null) throw new IOException("Invalid image");
            if (bitmap.getWidth() > 2048 || bitmap.getHeight() > 2048
                || (long) bitmap.getWidth() * bitmap.getHeight() > 4_000_000) {
                bitmap.recycle(); throw new IOException("Image limit");
            }
            Bitmap rotated;
            try { rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), transform, true); }
            catch (RuntimeException | OutOfMemoryError error) { bitmap.recycle(); throw error; }
            if (rotated != bitmap) bitmap.recycle();
            try { check(); } catch (IOException ended) { rotated.recycle(); throw ended; }
            return rotated;
        } finally { synchronized (this) { copy.delete(); temporary = null; } }
    }
}
