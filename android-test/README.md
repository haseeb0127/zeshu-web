# Zeshu Android staging test shell

This project builds a debug-only APK for device QA against the isolated Cloudflare staging site.

- No Supabase service-role key, Razorpay secret, API token, or other server secret is embedded.
- The in-app WebView only keeps Zeshu production/staging HTTPS hosts inside the app; other links open externally.
- The debug APK is not a Play Store release and should not be used as the production Android package.
