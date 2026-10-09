package com.zeshu.staging

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var startupOverlay: FrameLayout
    private lateinit var startupMessage: TextView
    private val splashHandler = Handler(Looper.getMainLooper())
    private var firstPageVisible = false
    private var loadingFailed = false
    private var splashStartedAt = 0L
    private var pendingGeoOrigin: String? = null
    private var pendingGeoCallback: GeolocationPermissions.Callback? = null

    private val locationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
            val allowed = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
            pendingGeoCallback?.invoke(pendingGeoOrigin, allowed, false)
            pendingGeoOrigin = null
            pendingGeoCallback = null
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        splashStartedAt = SystemClock.uptimeMillis()

        // Show the actual ZESHU artwork centered on an ivory screen while the
        // trusted staging site loads. No fake progress indicator or fixed wait.
        val root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(252, 252, 249)) }
        webView = WebView(this).apply { visibility = View.INVISIBLE }
        root.addView(webView, FrameLayout.LayoutParams(-1, -1))
        startupOverlay = FrameLayout(this).apply {
            setBackgroundColor(Color.rgb(252, 252, 249))
        }
        val width = resources.displayMetrics.widthPixels
        val iconSize = minOf((240 * resources.displayMetrics.density).toInt(), (width * 0.56f).toInt())
        val icon = ImageView(this).apply {
            setImageResource(R.drawable.zeshu_glossy_icon)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Zeshu"
        }
        startupOverlay.addView(icon, FrameLayout.LayoutParams(iconSize, iconSize, Gravity.CENTER))
        startupMessage = TextView(this).apply {
            visibility = View.GONE
            textSize = 13f
            setTextColor(Color.rgb(75, 85, 99))
            gravity = Gravity.CENTER
            setPadding(24, 12, 24, 12)
        }
        startupOverlay.addView(startupMessage, FrameLayout.LayoutParams(-1, -2,
            Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
            bottomMargin = (100 * resources.displayMetrics.density).toInt()
        })
        root.addView(startupOverlay, FrameLayout.LayoutParams(-1, -1))
        setContentView(root)

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            setGeolocationEnabled(true)
            userAgentString = "$userAgentString ZeshuStagingAndroid/0.1"
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
            WebSettingsCompat.setSafeBrowsingEnabled(webView.settings, true)
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageCommitVisible(view: WebView, url: String) {
                if (url.startsWith(STAGING_ORIGIN)) revealFirstPage()
            }

            override fun onPageFinished(view: WebView, url: String) {
                if (url.startsWith(STAGING_ORIGIN)) revealFirstPage()
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: android.webkit.WebResourceError
            ) {
                if (request.isForMainFrame && !firstPageVisible) {
                    loadingFailed = true
                    startupMessage.text = "Unable to connect to Zeshu staging. Tap here to retry."
                    startupMessage.visibility = View.VISIBLE
                    startupMessage.setOnClickListener {
                        loadingFailed = false
                        startupMessage.visibility = View.GONE
                        webView.loadUrl(STAGING_ORIGIN)
                    }
                }
            }
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (uri.scheme == "https" && uri.host == STAGING_HOST) return false
                startActivity(Intent(Intent.ACTION_VIEW, uri))
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                if (origin != STAGING_ORIGIN || callback == null) {
                    callback?.invoke(origin, false, false)
                    return
                }

                val fineGranted = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                val coarseGranted = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (fineGranted || coarseGranted) {
                    callback.invoke(origin, true, false)
                    return
                }

                pendingGeoOrigin = origin
                pendingGeoCallback = callback
                locationPermissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    )
                )
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        val initialUrl = intent?.data
            ?.takeIf { it.scheme == "https" && it.host == STAGING_HOST }
            ?.toString()
            ?: STAGING_ORIGIN
        webView.loadUrl(initialUrl)
        splashHandler.postDelayed({
            if (!firstPageVisible && !loadingFailed) {
                startupMessage.text = "Zeshu is taking longer to load. Tap here to retry."
                startupMessage.visibility = View.VISIBLE
                startupMessage.setOnClickListener { webView.reload() }
            }
        }, 15000L)
    }

    private fun revealFirstPage() {
        if (firstPageVisible || loadingFailed) return
        firstPageVisible = true
        val minimumDisplay = maxOf(0L, 850L - (SystemClock.uptimeMillis() - splashStartedAt))
        splashHandler.postDelayed({
            if (!isFinishing && !isDestroyed) {
                webView.visibility = View.VISIBLE
                startupOverlay.animate().alpha(0f).setDuration(240L).withEndAction {
                    startupOverlay.visibility = View.GONE
                }.start()
            }
        }, minimumDisplay)
    }

    override fun onDestroy() {
        pendingGeoCallback?.invoke(pendingGeoOrigin, false, false)
        pendingGeoOrigin = null
        pendingGeoCallback = null
        splashHandler.removeCallbacksAndMessages(null)
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val STAGING_HOST = "zeshu-web-staging.asif-mohammed0127.workers.dev"
        private const val STAGING_ORIGIN = "https://zeshu-web-staging.asif-mohammed0127.workers.dev"
    }
}
