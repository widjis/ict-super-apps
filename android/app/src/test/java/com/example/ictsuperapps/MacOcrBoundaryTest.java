package com.example.ictsuperapps;

import static org.junit.Assert.*;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Looper;
import androidx.activity.result.ActivityResult;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.TaskCompletionSource;
import java.io.*;
import java.util.concurrent.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import org.robolectric.Shadows;
import org.robolectric.shadows.ShadowLog;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class MacOcrBoundaryTest {
    static final String PRIVATE_URI = "content://synthetic/private-secret";
    static class Boundary extends MacOcrPluginTest.TestPlugin {
        byte[] data;
        boolean revoked;
        volatile Bitmap pixels;
        volatile boolean onMain;
        final CountDownLatch recognized = new CountDownLatch(1);
        final TaskCompletionSource<String> completion = new TaskCompletionSource<>();
        @Override protected InputStream openSource(Uri uri, BoundedOcrImage job) {
            onMain = Looper.myLooper() == Looper.getMainLooper();
            if (revoked) throw new SecurityException(PRIVATE_URI);
            return new ByteArrayInputStream(data);
        }
        @Override protected Task<String> recognizeBitmap(Bitmap bitmap) {
            pixels = bitmap; recognized.countDown(); return completion.getTask();
        }
    }
    private MacOcrPluginTest.Call select(Boundary plugin) {
        MacOcrPluginTest.Call call = new MacOcrPluginTest.Call("gallery"); plugin.recognize(call);
        plugin.imageSelected(call, new ActivityResult(Activity.RESULT_OK, new Intent().setData(Uri.parse(PRIVATE_URI))));
        return call;
    }
    private void drainWorker() throws Exception {
        java.lang.reflect.Field field = MacOcrPlugin.class.getDeclaredField("worker"); field.setAccessible(true);
        ExecutorService executor = (ExecutorService) field.get(null);
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        for (;;) {
            try { executor.submit(() -> {}).get(5, TimeUnit.SECONDS); return; }
            catch (RejectedExecutionException full) {
                if (System.nanoTime() >= deadline) throw full;
                Thread.sleep(5);
            }
        }
    }
    private void pump() { Shadows.shadowOf(Looper.getMainLooper()).idle(); }
    @Test public void realDecodeKeepsBoundedBitmapAliveUntilTaskEndsAfterTimeoutAndIgnoresOldGeneration() throws Exception {
        Boundary plugin = new Boundary();
        Bitmap fixture = Bitmap.createBitmap(6000, 4000, Bitmap.Config.ARGB_8888);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream(); fixture.compress(Bitmap.CompressFormat.PNG, 100, bytes); fixture.recycle();
        plugin.data = bytes.toByteArray();
        MacOcrPluginTest.Call call = select(plugin);
        try {
            assertTrue(plugin.recognized.await(5, TimeUnit.SECONDS));
            assertFalse(plugin.onMain);
            assertTrue(plugin.pixels.getWidth() <= 2048);
            assertTrue((long) plugin.pixels.getWidth() * plugin.pixels.getHeight() <= 4_000_000);
            assertEquals(0, plugin.getContext().getCacheDir().listFiles((d, n) -> n.startsWith("ocr-decode-")).length);
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(java.time.Duration.ofSeconds(31));
            assertEquals("OCR_FAILED", call.code);
            assertFalse("Never recycle an in-flight SDK bitmap", plugin.pixels.isRecycled());
            MacOcrPluginTest.Call busy = new MacOcrPluginTest.Call("gallery"); plugin.recognize(busy); assertEquals("BUSY", busy.code);
        } finally { plugin.completion.setResult("late synthetic text"); drainWorker(); }
        assertTrue(plugin.pixels.isRecycled());
        MacOcrPluginTest.Call next = new MacOcrPluginTest.Call("gallery"); plugin.recognize(next);
        pump(); assertNull(next.code); assertNull(next.result); assertNull(call.result);
        plugin.destroyPlugin();
    }
    public static class RevokedProvider extends android.content.ContentProvider {
        @Override public boolean onCreate() { return true; }
        @Override public android.os.ParcelFileDescriptor openFile(Uri uri, String mode) { throw new SecurityException(PRIVATE_URI); }
        @Override public android.database.Cursor query(Uri u, String[] p, String s, String[] a, String o) { return null; }
        @Override public String getType(Uri u) { return "image/jpeg"; }
        @Override public Uri insert(Uri u, android.content.ContentValues v) { return null; }
        @Override public int delete(Uri u, String s, String[] a) { return 0; }
        @Override public int update(Uri u, android.content.ContentValues v, String s, String[] a) { return 0; }
    }
    @Test public void realContentResolverRevocationNeverLeaksUriToLogcat() throws Exception {
        ShadowLog.clear();
        RevokedProvider provider = new RevokedProvider();
        android.content.pm.ProviderInfo info = new android.content.pm.ProviderInfo(); info.authority = "synthetic";
        provider.attachInfo(org.robolectric.RuntimeEnvironment.getApplication(), info);
        org.robolectric.shadows.ShadowContentResolver.registerProviderInternal("synthetic", provider);
        MacOcrPluginTest.TestPlugin plugin = new MacOcrPluginTest.TestPlugin();
        MacOcrPluginTest.Call call = new MacOcrPluginTest.Call("gallery"); plugin.recognize(call);
        plugin.imageSelected(call, new ActivityResult(Activity.RESULT_OK, new Intent().setData(Uri.parse(PRIVATE_URI))));
        drainWorker(); pump(); assertEquals("OCR_FAILED", call.code); assertNull(call.result);
        for (ShadowLog.LogItem item : ShadowLog.getLogs()) {
            assertFalse(String.valueOf(item.msg).contains(PRIVATE_URI));
            assertFalse(String.valueOf(item.throwable).contains(PRIVATE_URI));
        }
    }
    @Test public void revokedUriAndCorruptImageFailWithoutLoggingUriOrPassingPixelsToMlKit() throws Exception {
        for (boolean revoked : new boolean[]{true, false}) {
            ShadowLog.clear(); Boundary plugin = new Boundary(); plugin.revoked = revoked; plugin.data = new byte[]{1, 2, 3};
            MacOcrPluginTest.Call call = select(plugin); drainWorker(); pump();
            assertEquals("OCR_FAILED", call.code); assertNull(call.result); assertNull(plugin.pixels);
            assertFalse(plugin.onMain);
            assertEquals(0, plugin.getContext().getCacheDir().listFiles((d, n) -> n.startsWith("ocr-decode-")).length);
            for (ShadowLog.LogItem item : ShadowLog.getLogs()) {
                assertFalse(String.valueOf(item.msg).contains(PRIVATE_URI));
                assertFalse(String.valueOf(item.throwable).contains(PRIVATE_URI));
            }
        }
    }
}
