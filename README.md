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

### Notes on the build recipe

The recipe installs Node from Debian **forky** (nodejs 24.19.0, npm 11.16.0).
The buildserver's own nodejs is 18.x, which is too old: `@capacitor/cli`
requires `>=20.0.0` and `@vitejs/plugin-react` requires
`^20.19.0 || >=22.12.0`. `npm` is a separate Debian package, so both are
installed explicitly.

`commit:` is pinned to a full 40-character hash rather than a tag, at F-Droid's
request: a tag can be moved after review, a hash cannot.

The recipe file itself must be kept in canonical form or the `fdroid
rewritemeta` CI job fails. Two constraints follow from that, and neither is
obvious:

- **No comments.** `rewritemeta` rebuilds the file from parsed data rather than
  round-tripping it, so any comment is silently dropped and the resulting diff
  fails the job. That is why the reasoning above lives here and not in the YAML.
- **No line over 80 characters.** The writer sets an indent but never a width,
  so ruamel's 80-column default re-folds longer lines. Inside a build entry the
  usable budget is 72. `sudo` commands are joined with `; ` into a single shell,
  so a `cd` can be used to keep paths short.
- **LF line endings.** `rewritemeta` writes LF, so a CRLF copy diffs on every
  line. `.gitattributes` pins this repo to LF. GitLab's web editor preserves a
  file's existing endings, so a CRLF file there cannot be fixed by editing it -
  delete it and re-upload instead.

One more trap: **`init` runs in `subdir`, not the repository root.**
fdroidserver sets `root_dir = build_dir/subdir` and runs both `init` and
`prebuild` there, so with `subdir: android/app` the npm commands execute inside
the Android app module - where there is no `package.json`, and no `android/`
directory for `cap sync` to find. The recipe therefore starts `init` with
`cd ../..`; the commands are joined with `; ` into a single shell, so one `cd`
covers all of them.

F-Droid builds the app itself from this repository and signs it with its own key,
so no signing key or `local.properties` should ever be committed here.

## Licence

[MIT](LICENSE).

The bundled interface font, [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P),
is © 2012 The Press Start 2P Project Authors and is used under the SIL Open Font
License 1.1 — see [`src/assets/fonts/OFL.txt`](src/assets/fonts/OFL.txt).
