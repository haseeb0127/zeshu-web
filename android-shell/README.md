# Zeshu staging Android shell

This is a **debug-only QA shell** for the isolated Cloudflare staging site:

`https://zeshu-web-staging.asif-mohammed0127.workers.dev`

It intentionally does not contain Supabase service-role keys, payment secrets, API tokens, or production configuration. It only permits in-WebView navigation on the staging host; other HTTPS links open in the user's browser. Cleartext HTTP is disabled.

The shell grants geolocation to the staging origin only after Android runtime permission is granted. It is not intended for Google Play or production release.

The real glossy ZESHU icon is packaged in this staging APK as its adaptive launcher icon and Android startup screen. A native ivory overlay shows the centered logo until the first trusted staging page renders, then fades away. If offline, the shell offers retry without fabricating progress. This APK is for staging QA ONLY, not Google Play or production. The separately installed production Zeshu PWA is updated through the website manifest; Android may require uninstalling and reinstalling the PWA shortcut for its home-screen icon to refresh.

Build locally with a compatible Android SDK/JDK:

```bash
gradle -p android-shell assembleDebug
```

The debug APK is produced at:

`android-shell/app/build/outputs/apk/debug/app-debug.apk`
