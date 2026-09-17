package com.example.ictsuperapps;

import android.app.Activity;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.util.function.Consumer;
import com.getcapacitor.JSObject;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

@CapacitorPlugin(name = "MacOcr")
public class MacOcrPlugin extends Plugin {
    private volatile PluginCall active;
    private final android.os.Handler timer = new android.os.Handler(android.os.Looper.getMainLooper());
    private Runnable timeout;
    private File photo;
    private Uri photoUri;
    // Process-wide lane: a non-cooperative provider/SDK cannot accumulate threads or queued scans.
    private static final java.util.concurrent.atomic.AtomicBoolean decoding = new java.util.concurrent.atomic.AtomicBoolean();
    private static final java.util.concurrent.ExecutorService worker = new java.util.concurrent.ThreadPoolExecutor(1, 1, 0L, java.util.concurrent.TimeUnit.MILLISECONDS,
        new java.util.concurrent.ArrayBlockingQueue<>(1), r -> {
        Thread thread = new Thread(r, "mac-ocr"); thread.setDaemon(true); return thread;
    });
    private BoundedOcrImage job;

    @Override public void load() {
        if (decoding.get()) return;
        File[] copies = getContext().getCacheDir().listFiles((directory, name) -> name.startsWith("ocr-decode-") && name.endsWith(".image"));
        if (copies != null) for (File file : copies) file.delete();
        File[] abandoned = new File(getContext().getCacheDir(), "mac-ocr").listFiles();
        if (abandoned != null) for (File file : abandoned) file.delete();
    }
    @Override protected synchronized void handleOnDestroy() {
        PluginCall call = active;
        cleanup();
        if (call != null) call.reject("Scan cancelled", "CANCELLED");
    }
    protected void recognizeUri(Uri uri, Consumer<String> success, Runnable failure) {
        if (!decoding.compareAndSet(false, true)) { failure.run(); return; }
        BoundedOcrImage current = new BoundedOcrImage();
        job = current;
        worker.execute(() -> {
            android.graphics.Bitmap bitmap = null;
            String text = null;
            boolean succeeded = false;
            try {
                current.check();
                try (java.io.InputStream source = openSource(uri, current)) {
                    if (source == null) throw new java.io.IOException("Image unavailable");
                    bitmap = current.decode(source, getContext().getCacheDir());
                }
                current.check();
                com.google.android.gms.tasks.Task<String> task = recognizeBitmap(bitmap);
                // Cancellation only suppresses delivery; never recycle pixels still used by ML Kit.
                for (;;) {
                    try { text = com.google.android.gms.tasks.Tasks.await(task); break; }
                    catch (InterruptedException ignored) { /* retain ownership until task is terminal */ }
                }
                current.check();
                succeeded = true;
            } catch (Exception | OutOfMemoryError ignored) {
                // Never forward provider exception messages, URI, path or OCR text to logging.
            } finally {
                if (bitmap != null) bitmap.recycle();
                current.cancel();
                decoding.set(false);
            }
            String result = text;
            boolean ok = succeeded;
            timer.post(() -> { if (ok) success.accept(result); else failure.run(); });
        });
    }
    protected java.io.InputStream openSource(Uri uri, BoundedOcrImage current) throws java.io.IOException {
        android.os.ParcelFileDescriptor descriptor = getContext().getContentResolver().openFileDescriptor(uri, "r");
        if (descriptor == null) throw new java.io.IOException("Image unavailable");
        return new OcrImageInput(descriptor, current);
    }
    protected com.google.android.gms.tasks.Task<String> recognizeBitmap(android.graphics.Bitmap bitmap) {
        TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        try {
            return recognizer.process(InputImage.fromBitmap(bitmap, 0)).continueWith(Runnable::run, task -> {
                try { return task.getResult().getText(); }
                finally { recognizer.close(); }
            });
        } catch (RuntimeException | OutOfMemoryError error) { recognizer.close(); throw error; }
    }

    @ActivityCallback
    protected synchronized void imageSelected(PluginCall call, ActivityResult result) {
        if (call == null || call != active) return;
        if (result.getResultCode() != Activity.RESULT_OK) {
            cleanup(); call.reject("Image selection cancelled", "CANCELLED"); return;
        }
        Uri uri = photoUri != null ? photoUri : result.getData() == null ? null : result.getData().getData();
        if (uri == null || !"content".equals(uri.getScheme())) {
            cleanup(); call.reject("Image unavailable", "IMAGE_UNAVAILABLE"); return;
        }
        timeout = () -> {
            synchronized (this) {
                if (active != call) return;
                cleanup(); call.reject("Text recognition timed out", "OCR_FAILED");
            }
        };
        timer.postDelayed(timeout, 30000);
        recognizeUri(uri, text -> {
            synchronized (this) {
                if (active != call) return;
                cleanup();
                if (text == null || text.length() > 32768) call.reject("Text recognition failed", "OCR_FAILED");
                else call.resolve(new JSObject().put("text", text));
            }
        }, () -> {
            synchronized (this) {
                if (active != call) return;
                cleanup(); call.reject("Text recognition failed", "OCR_FAILED");
            }
        });
    }
    private void cleanup() {
        if (timeout != null) { timer.removeCallbacks(timeout); timeout = null; }
        if (job != null) { job.cancel(); job = null; }
        if (photoUri != null) getContext().revokeUriPermission(photoUri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        if (photo != null) photo.delete();
        photo = null; photoUri = null; active = null;
    }
    @PluginMethod public synchronized void recognize(PluginCall call) {
        String source = call.getString("source");
        if (!"camera".equals(source) && !"gallery".equals(source)) {
            call.reject("Unsupported image source", "INVALID_SOURCE"); return;
        }
        if (active != null || decoding.get()) { call.reject("A scan is already open", "BUSY"); return; }
        active = call;
        try {
            Intent intent;
            if ("camera".equals(source)) {
                File directory = new File(getContext().getCacheDir(), "mac-ocr");
                if (!directory.isDirectory() && !directory.mkdirs()) throw new java.io.IOException();
                photo = File.createTempFile("capture-", ".jpg", directory);
                photoUri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", photo);
                intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                intent.putExtra(MediaStore.EXTRA_OUTPUT, photoUri);
                intent.setClipData(ClipData.newRawUri("OCR capture", photoUri));
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } else {
                intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.setType("image/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
            }
            startActivityForResult(call, intent, "imageSelected");
        } catch (Exception ignored) {
            cleanup();
            call.reject("Camera or photo access unavailable", "IMAGE_UNAVAILABLE");
        }
    }
}
