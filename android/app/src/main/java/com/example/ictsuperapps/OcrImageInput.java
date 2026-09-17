package com.example.ictsuperapps;

import android.os.ParcelFileDescriptor;
import android.system.ErrnoException;
import android.system.Os;
import android.system.OsConstants;
import android.system.StructPollfd;
import java.io.IOException;
import java.io.InputStream;

/** Nonblocking pipe/file reads, checked every 250 ms; provider open is isolated by the global worker lane. */
final class OcrImageInput extends InputStream {
    private final ParcelFileDescriptor descriptor;
    private final BoundedOcrImage job;
    private final InputStream regularFile;
    OcrImageInput(ParcelFileDescriptor descriptor, BoundedOcrImage job) {
        this.descriptor = descriptor;
        this.job = job;
        // Regular files have no readiness wait; some providers expose only a pipe (-1 size).
        this.regularFile = descriptor.getStatSize() >= 0 ? new ParcelFileDescriptor.AutoCloseInputStream(descriptor) : null;
    }
    private boolean configured;
    @Override public int read(byte[] bytes, int offset, int length) throws IOException {
        if (offset < 0 || length < 0 || offset > bytes.length - length) throw new IndexOutOfBoundsException();
        if (length == 0) return 0;
        try {
            job.check();
            if (regularFile != null) return regularFile.read(bytes, offset, length);
            if (!configured) {
                // fcntlInt is public only from API 30. Older Android supports regular-file
                // providers; fail closed for pipes rather than risk an uninterruptible read.
                if (android.os.Build.VERSION.SDK_INT < 30) throw new IOException("Unsupported image provider");
                int flags = Os.fcntlInt(descriptor.getFileDescriptor(), OsConstants.F_GETFL, 0);
                Os.fcntlInt(descriptor.getFileDescriptor(), OsConstants.F_SETFL, flags | OsConstants.O_NONBLOCK);
                configured = true;
            }
            StructPollfd poll = new StructPollfd();
            poll.fd = descriptor.getFileDescriptor();
            poll.events = (short) OsConstants.POLLIN;
            for (;;) {
                job.check();
                try {
                    if (Os.poll(new StructPollfd[]{poll}, 250) == 0) continue;
                    job.check();
                    int count = Os.read(descriptor.getFileDescriptor(), bytes, offset, length);
                    return count == 0 ? -1 : count;
                } catch (ErrnoException error) {
                    if (error.errno != OsConstants.EAGAIN && error.errno != OsConstants.EINTR) throw error;
                }
            }
        } catch (ErrnoException ignored) { throw new IOException("Image unavailable"); }
    }
    @Override public int read() throws IOException {
        byte[] one = new byte[1];
        return read(one, 0, 1) < 0 ? -1 : one[0] & 255;
    }
    @Override public void close() throws IOException {
        if (regularFile != null) regularFile.close(); else descriptor.close();
    }
}
