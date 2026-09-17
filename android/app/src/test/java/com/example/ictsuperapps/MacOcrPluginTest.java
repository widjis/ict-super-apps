package com.example.ictsuperapps;
import static org.junit.Assert.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class MacOcrPluginTest {
    @org.junit.Before public void resetFileProviderBetweenRobolectricSandboxes() throws Exception {
        java.lang.reflect.Field cache = androidx.core.content.FileProvider.class.getDeclaredField("sCache");
        cache.setAccessible(true); ((java.util.Map<?, ?>) cache.get(null)).clear();
    }
    static class Call extends PluginCall {
        String code; JSObject result;
        Call(String source) { super(null, "MacOcr", "test", "recognize", new JSObject().put("source", source)); }
        @Override public void reject(String message, String code) { this.code = code; }
        @Override public void resolve(JSObject result) { this.result = result; }
    }
    static class TestPlugin extends MacOcrPlugin {
        android.content.Intent launched;
        void destroyPlugin() { handleOnDestroy(); }
        @Override public android.content.Context getContext() { return org.robolectric.RuntimeEnvironment.getApplication(); }
        @Override public void startActivityForResult(PluginCall call, android.content.Intent intent, String callback) { launched = intent; }
    }
    @Test public void galleryUsesUserGrantedImagePickerAndRejectsParallelScan() {
        TestPlugin plugin = new TestPlugin();
        plugin.recognize(new Call("gallery"));
        assertNotNull("Must launch picker", plugin.launched);
        assertEquals(android.content.Intent.ACTION_GET_CONTENT, plugin.launched.getAction());
        assertEquals("image/*", plugin.launched.getType());
        assertFalse(plugin.launched.hasExtra(android.content.Intent.EXTRA_ALLOW_MULTIPLE));
        Call second = new Call("camera"); plugin.recognize(second); assertEquals("BUSY", second.code);
    }
    @Test public void cameraUsesPrivateTemporaryFullResolutionOutput() {
        TestPlugin plugin = new TestPlugin(); plugin.recognize(new Call("camera"));
        assertNotNull("Must launch camera", plugin.launched);
        assertEquals(android.provider.MediaStore.ACTION_IMAGE_CAPTURE, plugin.launched.getAction());
        assertNotNull(plugin.launched.getParcelableExtra(android.provider.MediaStore.EXTRA_OUTPUT));
        assertEquals(1, new java.io.File(plugin.getContext().getCacheDir(), "mac-ocr").listFiles().length);
    }
    @Test public void cancelDeletesCaptureAndAllowsRetry() throws Exception {
        TestPlugin plugin = new TestPlugin(); Call call = new Call("camera"); plugin.recognize(call);
        java.lang.reflect.Method callback = null;
        try { callback = MacOcrPlugin.class.getDeclaredMethod("imageSelected", PluginCall.class, androidx.activity.result.ActivityResult.class); } catch (NoSuchMethodException ignored) {}
        assertNotNull("Must handle camera results", callback);
        callback.setAccessible(true);
        callback.invoke(plugin, call, new androidx.activity.result.ActivityResult(android.app.Activity.RESULT_CANCELED, null));
        assertEquals("CANCELLED", call.code);
        assertEquals(0, new java.io.File(plugin.getContext().getCacheDir(), "mac-ocr").listFiles().length);
        Call retry = new Call("gallery"); plugin.recognize(retry); assertNull(retry.code);
    }
    static class RecognitionPlugin extends TestPlugin {
        boolean fail; String text = "Synthetic 02:AB:CD:EF:00:01"; android.net.Uri received;
        protected void recognizeUri(android.net.Uri uri, java.util.function.Consumer<String> success, Runnable failure) {
            received = uri; if (fail) failure.run(); else success.accept(text);
        }
    }
    @Test public void successfulCameraRecognizesSelectedUriThenDeletesPrivateCapture() {
        RecognitionPlugin plugin = new RecognitionPlugin(); Call call = new Call("camera"); plugin.recognize(call);
        plugin.imageSelected(call, new androidx.activity.result.ActivityResult(android.app.Activity.RESULT_OK, null));
        assertNotNull("Recognition must run", plugin.received);
        assertEquals(plugin.text, call.result.getString("text"));
        assertEquals(0, new java.io.File(plugin.getContext().getCacheDir(), "mac-ocr").listFiles().length);
    }
    @Test public void missingGalleryResultAndRecognizerFailuresAreSafe() {
        RecognitionPlugin plugin = new RecognitionPlugin(); Call missing = new Call("gallery"); plugin.recognize(missing);
        plugin.imageSelected(missing, new androidx.activity.result.ActivityResult(android.app.Activity.RESULT_OK, null));
        assertEquals("IMAGE_UNAVAILABLE", missing.code);
        for (boolean fail : new boolean[]{false, true}) {
            plugin.fail = fail; plugin.text = "x".repeat(32769);
            Call call = new Call("gallery"); plugin.recognize(call);
            android.content.Intent data = new android.content.Intent().setData(android.net.Uri.parse("content://synthetic/image"));
            plugin.imageSelected(call, new androidx.activity.result.ActivityResult(android.app.Activity.RESULT_OK, data));
            assertEquals("OCR_FAILED", call.code); assertNull(call.result);
        }
    }
    @Test public void launchFailureAndDestroyDeleteCaptureAndStartupSweepsAbandonedFiles() throws Exception {
        TestPlugin plugin = new TestPlugin() {
            @Override public void startActivityForResult(PluginCall c, android.content.Intent i, String s) { throw new SecurityException("private diagnostic"); }
        };
        Call call = new Call("camera"); plugin.recognize(call); assertEquals("IMAGE_UNAVAILABLE", call.code);
        java.io.File directory = new java.io.File(plugin.getContext().getCacheDir(), "mac-ocr");
        assertEquals(0, directory.listFiles().length);
        java.io.File abandoned = new java.io.File(directory, "capture-abandoned.jpg"); assertTrue(abandoned.createNewFile());
        java.io.File decoded = new java.io.File(plugin.getContext().getCacheDir(), "ocr-decode-abandoned.image");
        assertTrue(decoded.createNewFile());
        plugin.load(); assertFalse(abandoned.exists()); assertFalse("Sweep private decoder copies after process death", decoded.exists());
        TestPlugin active = new TestPlugin(); Call second = new Call("camera"); active.recognize(second);
        active.destroyPlugin(); assertEquals("CANCELLED", second.code); assertEquals(0, directory.listFiles().length);
    }
    @Test public void stalledRecognitionTimesOutAndLateTextIsIgnored() {
        final java.util.function.Consumer<String>[] complete = new java.util.function.Consumer[1];
        TestPlugin plugin = new TestPlugin() {
            @Override protected void recognizeUri(android.net.Uri uri, java.util.function.Consumer<String> success, Runnable failure) { complete[0] = success; }
        };
        Call call = new Call("camera"); plugin.recognize(call);
        plugin.imageSelected(call, new androidx.activity.result.ActivityResult(android.app.Activity.RESULT_OK, null));
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(java.time.Duration.ofSeconds(31));
        assertEquals("OCR_FAILED", call.code);
        assertEquals(0, new java.io.File(plugin.getContext().getCacheDir(), "mac-ocr").listFiles().length);
        complete[0].accept("late synthetic text"); assertNull(call.result);
    }
    static class BoundaryPlugin extends TestPlugin {
        final java.util.concurrent.CountDownLatch opened = new java.util.concurrent.CountDownLatch(1);
        final java.util.concurrent.CountDownLatch release = new java.util.concurrent.CountDownLatch(1);
        volatile boolean mainThread;
        protected java.io.InputStream openSource(android.net.Uri uri, BoundedOcrImage job) throws java.io.IOException {
            mainThread = android.os.Looper.myLooper() == android.os.Looper.getMainLooper();
            opened.countDown();
            try { release.await(); } catch (InterruptedException e) { throw new java.io.IOException("ended"); }
            throw new SecurityException("content://synthetic/private-secret");
        }
    }
    @Test public void providerOpenIsOffMainAndStuckWorkCannotAccumulateAfterTimeout() throws Exception {
        BoundaryPlugin plugin = new BoundaryPlugin(); Call call = new Call("gallery"); plugin.recognize(call);
        try {
            plugin.imageSelected(call, new androidx.activity.result.ActivityResult(android.app.Activity.RESULT_OK,
                new android.content.Intent().setData(android.net.Uri.parse("content://synthetic/private-secret"))));
            assertTrue("Real provider boundary must run", plugin.opened.await(2, java.util.concurrent.TimeUnit.SECONDS));
            assertFalse("Provider access must not block UI", plugin.mainThread);
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(java.time.Duration.ofSeconds(31));
            assertEquals("OCR_FAILED", call.code);
            Call retry = new Call("gallery"); plugin.recognize(retry);
            assertEquals("BUSY", retry.code);
        } finally { plugin.release.countDown(); }
    }
    @Test public void invalidSourceFailsWithoutOpeningAnyActivity() throws Exception {
        Class<?> type = null;
        try { type = Class.forName("com.example.ictsuperapps.MacOcrPlugin"); } catch (ClassNotFoundException ignored) {}
        assertNotNull("Native OCR plugin must exist", type);
        Object plugin = type.getConstructor().newInstance();
        Call call = new Call("arbitrary-path");
        type.getMethod("recognize", PluginCall.class).invoke(plugin, call);
        assertEquals("INVALID_SOURCE", call.code);
    }
}
