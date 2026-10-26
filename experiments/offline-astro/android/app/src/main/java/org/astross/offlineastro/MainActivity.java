package org.astross.offlineastro;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;

import androidx.annotation.Nullable;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

public final class MainActivity extends Activity {
    private static final String LOCAL_HOST = "appassets.androidplatform.net";
    private static final String LOCAL_ORIGIN = "https://" + LOCAL_HOST;
    private static final int CREATE_ARCHIVE_REQUEST = 40;
    private static final int PICK_IMAGE_REQUEST = 41;
    private static final int MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;
    private static final int MAX_BASE64_CHARS = ((MAX_ARCHIVE_BYTES + 2) / 3) * 4;

    private WebView webView;
    private byte[] pendingArchive;
    private ValueCallback<Uri[]> pendingFileChooser;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new LocalOnlyWebViewClient(assetLoader));
        webView.setWebChromeClient(new ImagePickerWebChromeClient());

        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            setContentView(webView);
            webView.loadDataWithBaseURL(LOCAL_ORIGIN,
                    "<!doctype html><meta name='viewport' content='width=device-width'><p>" +
                            "This Android System WebView is too old for secure ZIP export. Update it and reopen the app." +
                            "</p>", "text/html", "UTF-8", LOCAL_ORIGIN);
            return;
        }

        WebViewCompat.addWebMessageListener(webView, "AndroidArchive",
                Collections.singleton(LOCAL_ORIGIN), (view, message, sourceOrigin, isMainFrame, replyProxy) -> {
                    if (!isMainFrame || !isLocalOrigin(sourceOrigin)) {
                        replyProxy.postMessage(result("error", "Export is only available from the local editor."));
                        return;
                    }
                    handleArchiveMessage(message, replyProxy);
                });

        setContentView(webView);
        webView.loadUrl(LOCAL_ORIGIN + "/assets/www/demo.html");
    }

    private void handleArchiveMessage(WebMessageCompat message,
                                     androidx.webkit.JavaScriptReplyProxy replyProxy) {
        if (message.getType() != WebMessageCompat.TYPE_STRING) {
            replyProxy.postMessage(result("error", "The editor sent an invalid archive request."));
            return;
        }

        try {
            JSONObject request = new JSONObject(message.getData());
            if (!"saveArchive".equals(request.optString("type"))) {
                replyProxy.postMessage(result("error", "The editor sent an unsupported request."));
                return;
            }
            if (pendingArchive != null) {
                replyProxy.postMessage(result("error", "Finish the current save before starting another."));
                return;
            }

            String encoded = request.optString("archiveBase64", "");
            if (encoded.isEmpty() || encoded.length() > MAX_BASE64_CHARS ||
                    encoded.length() % 4 != 0 || !encoded.matches("[A-Za-z0-9+/]*={0,2}")) {
                replyProxy.postMessage(result("error", "The ZIP archive is too large or invalid. The limit is 20 MiB."));
                return;
            }
            byte[] archive = Base64.decode(encoded, Base64.NO_WRAP);
            if (archive.length == 0 || archive.length > MAX_ARCHIVE_BYTES ||
                    !Base64.encodeToString(archive, Base64.NO_WRAP).equals(encoded) ||
                    archive.length < 4 || archive[0] != 'P' || archive[1] != 'K' ||
                    archive[2] != 3 || archive[3] != 4) {
                replyProxy.postMessage(result("error", "The ZIP archive is too large or invalid. The limit is 20 MiB."));
                return;
            }

            pendingArchive = archive;
            activeReplyProxy = replyProxy;
            replyProxy.postMessage(result("pending", "Choose where to save the ZIP archive."));
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                    .addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("application/zip")
                    .putExtra(Intent.EXTRA_TITLE, "offline-site.zip");
            startActivityForResult(intent, CREATE_ARCHIVE_REQUEST);
        } catch (Exception error) {
            pendingArchive = null;
            activeReplyProxy = null;
            replyProxy.postMessage(result("error", "The ZIP archive could not be prepared for saving."));
        }
    }

    private androidx.webkit.JavaScriptReplyProxy activeReplyProxy;

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == CREATE_ARCHIVE_REQUEST) {
            if (resultCode != RESULT_OK || data == null || data.getData() == null) {
                pendingArchive = null;
                respondToPending(result("cancelled", "Save canceled."));
                return;
            }
            writeArchive(data.getData());
        } else if (requestCode == PICK_IMAGE_REQUEST) {
            if (pendingFileChooser != null) {
                Uri[] result = resultCode == RESULT_OK && data != null && data.getData() != null
                        ? new Uri[]{data.getData()} : null;
                pendingFileChooser.onReceiveValue(result);
                pendingFileChooser = null;
            }
        }
    }

    private void writeArchive(Uri destination) {
        if (pendingArchive == null) {
            respondToPending(result("error", "The ZIP archive is no longer available."));
            return;
        }
        try (OutputStream output = getContentResolver().openOutputStream(destination, "w")) {
            if (output == null) throw new IOException("No output stream");
            output.write(pendingArchive);
            output.flush();
            pendingArchive = null;
            respondToPending(result("saved", "ZIP archive saved successfully."));
        } catch (IOException | SecurityException error) {
            pendingArchive = null;
            respondToPending(result("error", "The ZIP archive could not be written to that location."));
        }
    }

    private void respondToPending(String message) {
        if (activeReplyProxy != null) {
            activeReplyProxy.postMessage(message);
            activeReplyProxy = null;
        }
    }

    private static String result(String status, String message) {
        try {
            return new JSONObject().put("status", status).put("message", message).toString();
        } catch (Exception impossible) {
            return "{\"status\":\"error\",\"message\":\"Save failed.\"}";
        }
    }

    private static boolean isLocalOrigin(Uri uri) {
        return uri != null && "https".equals(uri.getScheme()) &&
                LOCAL_HOST.equals(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443);
    }

    private static WebResourceResponse blockedResponse(int status, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason,
                Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
    }

    @Override
    protected void onDestroy() {
        if (pendingFileChooser != null) {
            pendingFileChooser.onReceiveValue(null);
            pendingFileChooser = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        pendingArchive = null;
        activeReplyProxy = null;
        super.onDestroy();
    }

    private final class LocalOnlyWebViewClient extends WebViewClientCompat {
        private final WebViewAssetLoader assetLoader;

        private LocalOnlyWebViewClient(WebViewAssetLoader assetLoader) {
            this.assetLoader = assetLoader;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return !isLocalOrigin(request.getUrl());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!isLocalOrigin(uri)) return blockedResponse(403, "Blocked");
            WebResourceResponse response = assetLoader.shouldInterceptRequest(uri);
            return response != null ? response : blockedResponse(404, "Not found");
        }
    }

    private final class ImagePickerWebChromeClient extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> filePathCallback,
                                         FileChooserParams fileChooserParams) {
            if (pendingFileChooser != null) pendingFileChooser.onReceiveValue(null);
            pendingFileChooser = filePathCallback;
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT)
                    .addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("image/*")
                    .putExtra(Intent.EXTRA_MIME_TYPES,
                            new String[]{"image/jpeg", "image/png", "image/webp"});
            try {
                startActivityForResult(intent, PICK_IMAGE_REQUEST);
            } catch (RuntimeException error) {
                pendingFileChooser.onReceiveValue(null);
                pendingFileChooser = null;
                return false;
            }
            return true;
        }
    }
}
