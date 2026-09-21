# Zeshu staging Android shell

This is a **debug-only QA shell** for the isolated Cloudflare staging site:

`https://zeshu-web-staging.asif-mohammed0127.workers.dev`

It intentionally does not contain Supabase service-role keys, payment secrets, API tokens, or production configuration. It only permits in-WebView navigation on the staging host; other HTTPS links open in the user's browser. Cleartext HTTP is disabled.

The shell grants geolocation to the staging origin only after Android runtime permission is granted. It is not intended for Google Play or production release.

Build locally with a compatible Android SDK/JDK:

```bash
gradle -p android-shell assembleDebug
```

The debug APK is produced at:

`android-shell/app/build/outputs/apk/debug/app-debug.apk`
