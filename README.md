# Plunge Tracker

An offline-first, open-source cold plunge session tracker for Android.

Set a target duration, start the timer, and get an audible cue when you reach it.
Each session is logged with its duration and water temperature, and the whole
history can be exported to CSV. No account, no sync, no analytics, no ads.

## Privacy

The app makes **no network requests**. Everything it needs is bundled inside the
APK, and everything it records stays on the device:

- Session history is stored in IndexedDB via Dexie ([`src/lib/db.ts`](src/lib/db.ts))
- Preferences are stored in `localStorage` ([`src/lib/settings.tsx`](src/lib/settings.tsx))
- Chimes and ambient tracks are synthesised with the Web Audio API
  ([`src/lib/audio.ts`](src/lib/audio.ts)), not shipped as audio files
- The interface font is bundled locally rather than fetched from a font CDN

The only permission the app requests for itself is `INTERNET`. Capacitor
requires it because the WebView loads the bundled interface over an intercepted
`https://localhost` origin, which passes through Android's network stack even
though the bytes come from the APK's own assets. Nothing is ever sent off the
device, and
[`network_security_config.xml`](android/app/src/main/res/xml/network_security_config.xml)
enforces this by denying cleartext traffic and refusing user-installed
certificate authorities.

The built APK also lists a second entry,
`io.github.jherforth.plungetracker.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`.
That one is generated automatically by AndroidX Core, is namespaced to this
app's own package, and is declared `protectionLevel="signature"`, so only code
signed with the same key can ever hold it. It grants no access to the device or
to your data, and it is not something this project declares by hand.

## Safety

Cold water immersion carries real risks, including cold shock response, impaired
swimming ability, and hypothermia. This app is a timer and a notebook; it is not
medical advice and it cannot supervise you. Never plunge alone, build up
gradually, and speak to a doctor first if you have a heart condition, high blood
pressure, or are pregnant.

## Tech stack

React 19 + TypeScript + Vite for the interface, Tailwind CSS v4 for styling,
Dexie for storage, and Capacitor to package it as an Android app.

## Building

Requires Node.js 20+, a JDK 21, and the Android SDK.

```sh
npm ci                  # install exactly what package-lock.json pins
npm run dev             # run in a browser at http://localhost:3000
npm run lint            # typecheck
npm run build           # build web assets into dist/
npx cap sync android    # copy dist/ into the Android project
```

Then build the APK:

```sh
cd android && ./gradlew assembleRelease
```

`npm run sync:android` is a shortcut for `npm run build && cap sync android`.

Note that `dist/` and `android/app/src/main/assets/public/` are generated and are
deliberately not committed, so the published app is always built from source.

## Releasing to F-Droid

1. Bump `version` in [`package.json`](package.json) and both `versionCode` and
   `versionName` in [`android/app/build.gradle`](android/app/build.gradle).
   `versionCode` must increase on every release.
2. Add a changelog at `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt`.
3. Tag the release: `git tag -s v1.0.0 -m "Plunge Tracker 1.0.0" && git push origin v1.0.0`.
4. Copy [`fdroid/io.github.jherforth.plungetracker.yml`](fdroid/io.github.jherforth.plungetracker.yml)
   into a fork of [fdroiddata](https://gitlab.com/fdroid/fdroiddata) as
   `metadata/io.github.jherforth.plungetracker.yml` and open a merge request.

F-Droid builds the app itself from this repository and signs it with its own key,
so no signing key or `local.properties` should ever be committed here.

## Licence

[MIT](LICENSE).

The bundled interface font, [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P),
is © 2012 The Press Start 2P Project Authors and is used under the SIL Open Font
License 1.1 — see [`src/assets/fonts/OFL.txt`](src/assets/fonts/OFL.txt).
