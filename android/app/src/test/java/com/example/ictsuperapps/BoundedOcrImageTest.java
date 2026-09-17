package com.example.ictsuperapps;

import static org.junit.Assert.*;
import android.graphics.Bitmap;
import android.net.Uri;
import java.io.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class BoundedOcrImageTest {
    private File cache() { return org.robolectric.RuntimeEnvironment.getApplication().getCacheDir(); }
    private byte[] png(int width, int height) throws Exception {
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes); bitmap.recycle();
        return bytes.toByteArray();
    }
    @Test public void cancellationStopsCopyAndRemovesPrivateFile() throws Exception {
        BoundedOcrImage image = new BoundedOcrImage();
        java.lang.reflect.Method cancel = null;
        try { cancel = BoundedOcrImage.class.getDeclaredMethod("cancel"); } catch (NoSuchMethodException ignored) {}
        assertNotNull("Decoder needs cooperative cancellation", cancel);
        cancel.invoke(image);
        assertThrows(IOException.class, () -> image.decode(new ByteArrayInputStream(png(20, 10)), cache()));
        assertEquals(0, cache().listFiles((d, n) -> n.startsWith("ocr-decode-")).length);
    }
    @Test public void blockedReadCancellationUnlinksCopyBeforeProviderReturns() throws Exception {
        BoundedOcrImage image = new BoundedOcrImage();
        java.util.concurrent.CountDownLatch entered = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.CountDownLatch release = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.atomic.AtomicReference<Throwable> result = new java.util.concurrent.atomic.AtomicReference<>();
        InputStream blocked = new InputStream() {
            @Override public int read() { return -1; }
            @Override public int read(byte[] bytes) throws IOException {
                entered.countDown();
                try { release.await(); } catch (InterruptedException e) { throw new IOException(); }
                return -1;
            }
        };
        Thread thread = new Thread(() -> { try { image.decode(blocked, cache()); } catch (Throwable e) { result.set(e); } });
        thread.start();
        try {
            assertTrue(entered.await(2, java.util.concurrent.TimeUnit.SECONDS));
            image.cancel();
            assertEquals(0, cache().listFiles((d, n) -> n.startsWith("ocr-decode-")).length);
        } finally { release.countDown(); thread.join(2000); }
        assertTrue(result.get() instanceof IOException);
    }
    @Test public void providerPipeReadHonorsCancellationWithoutWriterClosing() throws Exception {
        Class<?> input = null;
        try { input = Class.forName("com.example.ictsuperapps.OcrImageInput"); } catch (ClassNotFoundException ignored) {}
        assertNotNull("Pipe reads need bounded polling", input);
        android.os.ParcelFileDescriptor[] pipe = android.os.ParcelFileDescriptor.createPipe();
        BoundedOcrImage image = new BoundedOcrImage();
        try (InputStream stream = (InputStream) input.getDeclaredConstructor(android.os.ParcelFileDescriptor.class, BoundedOcrImage.class)
            .newInstance(pipe[0], image)) {
            image.cancel();
            assertThrows(IOException.class, () -> stream.read(new byte[32]));
        } finally { pipe[1].close(); }
    }
    // Robolectric models createPipe using regular files and does not implement kernel poll/read.
    // Force unknown length here to test our polling/cancellation control flow; device pipe IO is a smoke gate.
    @org.robolectric.annotation.Implements(android.os.ParcelFileDescriptor.class)
    public static class PipeDescriptorShadow extends org.robolectric.shadows.ShadowParcelFileDescriptor {
        @org.robolectric.annotation.Implementation @Override protected long getStatSize() { return -1; }
    }
    @Test @Config(sdk = 30, shadows = PipeDescriptorShadow.class)
    public void idleProviderPipePollingControlExitsWhenCancelled() throws Exception {
        android.os.ParcelFileDescriptor[] pipe = android.os.ParcelFileDescriptor.createPipe();
        BoundedOcrImage job = new BoundedOcrImage();
        java.util.concurrent.atomic.AtomicReference<Throwable> outcome = new java.util.concurrent.atomic.AtomicReference<>();
        try (InputStream input = new OcrImageInput(pipe[0], job)) {
            Thread reader = new Thread(() -> { try { input.read(new byte[32]); } catch (Throwable error) { outcome.set(error); } });
            reader.setDaemon(true); reader.start();
            Thread.sleep(100);
            assertTrue("Fixture must reach the idle pipe wait, not fail opening it", reader.isAlive());
            job.cancel(); reader.join(2000);
            assertFalse("Idle pipe must not hold the worker indefinitely", reader.isAlive());
            assertTrue("Cancellation must exit as a safe IO failure: " + outcome.get(), outcome.get() instanceof IOException);
        } finally { pipe[1].close(); }
    }
    @Test @Config(sdk = 28, shadows = PipeDescriptorShadow.class)
    public void oldAndroidUnknownLengthProviderFailsClosedWithoutBlocking() throws Exception {
        android.os.ParcelFileDescriptor[] pipe = android.os.ParcelFileDescriptor.createPipe();
        try (InputStream input = new OcrImageInput(pipe[0], new BoundedOcrImage())) {
            assertThrows(IOException.class, () -> input.read(new byte[32]));
        } finally { pipe[1].close(); }
    }
    @Test public void fileDescriptorPathActuallyDecodesThroughPollingInput() throws Exception {
        File fixture = File.createTempFile("fixture-", ".png", cache());
        try {
            try (OutputStream out = new FileOutputStream(fixture)) { out.write(png(80, 40)); }
            BoundedOcrImage image = new BoundedOcrImage();
            android.os.ParcelFileDescriptor fd = android.os.ParcelFileDescriptor.open(fixture, android.os.ParcelFileDescriptor.MODE_READ_ONLY);
            try (InputStream input = new OcrImageInput(fd, image)) {
                Bitmap result = image.decode(input, cache());
                assertEquals(80, result.getWidth()); assertEquals(40, result.getHeight()); result.recycle();
            }
        } finally { fixture.delete(); }
    }
    @Test public void expiredBudgetRejectsBeforeAnyProviderRead() throws Exception {
        BoundedOcrImage image = new BoundedOcrImage();
        java.lang.reflect.Field deadline = BoundedOcrImage.class.getDeclaredField("deadline");
        deadline.setAccessible(true); deadline.setLong(image, 0L);
        InputStream unread = new InputStream() { @Override public int read() { fail("Expired jobs must not read provider data"); return -1; } };
        assertThrows(IOException.class, () -> image.decode(unread, cache()));
        assertEquals(0, cache().listFiles((d, n) -> n.startsWith("ocr-decode-")).length);
    }
    @Test public void byteCapAndCorruptImagesFailWithoutPrivateResidue() throws Exception {
        InputStream oversized = new InputStream() {
            int remaining = BoundedOcrImage.MAX_BYTES + 1;
            @Override public int read() { return remaining-- > 0 ? 0 : -1; }
            @Override public int read(byte[] b) { if (remaining <= 0) return -1; int count = Math.min(b.length, remaining); remaining -= count; return count; }
        };
        assertThrows(IOException.class, () -> new BoundedOcrImage().decode(oversized, cache()));
        assertThrows(IOException.class, () -> new BoundedOcrImage().decode(new ByteArrayInputStream(new byte[]{1, 2, 3}), cache()));
        assertEquals(0, cache().listFiles((d, n) -> n.startsWith("ocr-decode-")).length);
    }
    @Test public void pathologicalSourceDimensionsAreRejectedBeforePixelDecode() throws Exception {
        byte[] bytes = png(20, 10);
        java.nio.ByteBuffer header = java.nio.ByteBuffer.wrap(bytes);
        header.putInt(16, 100000); header.putInt(20, 100000);
        java.util.zip.CRC32 crc = new java.util.zip.CRC32(); crc.update(bytes, 12, 17);
        header.putInt(29, (int) crc.getValue());
        android.graphics.BitmapFactory.Options bounds = new android.graphics.BitmapFactory.Options(); bounds.inJustDecodeBounds = true;
        android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
        assertEquals("Fixture must reach dimension validation", 100000, bounds.outWidth);
        IOException error = assertThrows(IOException.class, () -> new BoundedOcrImage().decode(new ByteArrayInputStream(bytes), cache()));
        assertEquals("Image dimensions exceed limit", error.getMessage());
    }
    @Test public void exifRotationIsAppliedToSampledPixels() throws Exception {
        File jpeg = File.createTempFile("fixture", ".jpg", cache());
        try {
            Bitmap original = Bitmap.createBitmap(80, 40, Bitmap.Config.ARGB_8888);
            try (OutputStream out = new FileOutputStream(jpeg)) { original.compress(Bitmap.CompressFormat.JPEG, 90, out); }
            original.recycle();
            android.media.ExifInterface exif = new android.media.ExifInterface(jpeg.getPath());
            exif.setAttribute(android.media.ExifInterface.TAG_ORIENTATION, "6"); exif.saveAttributes();
            try (InputStream in = new FileInputStream(jpeg)) {
                Bitmap result = new BoundedOcrImage().decode(in, cache());
                assertEquals(40, result.getWidth()); assertEquals(80, result.getHeight()); result.recycle();
            }
        } finally { jpeg.delete(); }
    }
    @Test public void hugeImageIsActuallySampledBeforePixelAllocation() throws Exception {
        Class<?> decoder = null;
        try { decoder = Class.forName("com.example.ictsuperapps.BoundedOcrImage"); } catch (ClassNotFoundException ignored) {}
        assertNotNull("Application-owned bounded decoder must exist", decoder);
        Object job = decoder.getDeclaredConstructor().newInstance();
        Bitmap result = (Bitmap) decoder.getDeclaredMethod("decode", InputStream.class, File.class)
            .invoke(job, new ByteArrayInputStream(png(6000, 4000)), cache());
        assertTrue(result.getWidth() <= 2048);
        assertTrue(result.getHeight() <= 2048);
        assertTrue((long) result.getWidth() * result.getHeight() <= 4_000_000);
        result.recycle();
    }
}
