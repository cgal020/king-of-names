# Platform and Vendor Feasibility for a Mobile-First PWA "People Memory" App (as of October 2026)

Research date: 7 October 2026. Version context: caniuse data fetched today lists iOS Safari up to 27.2 and Chrome for Android 154, so iOS 27 / Safari 27 is the current shipping generation ([caniuse Push API](https://caniuse.com/push-api)). Where a source predates iOS 26/27, this is flagged.

Note on method: the session's web-search budget ran out partway through. Several later items were checked by fetching primary pages directly, and some sub-questions are listed under Gaps because they could not be searched.

---

## 1. Web Push on iOS and Android (Phase 2 reminders)

### Takeaway
Web Push works on iOS only for web apps added to the Home Screen (iOS 16.4+), and the permission request must come from a user tap. Declarative Web Push (iOS/iPadOS 18.4+) makes iOS delivery sturdier because the notification shows even if service-worker code fails. Reliability on iOS is still reported as patchy (subscriptions silently going invalid), so reminders need a fallback channel. Chrome for Android supports push fully.

### Cited Findings
- iOS and iPadOS 16.4 added Web Push for Home Screen web apps: "A web app that has been added to the Home Screen can request permission to receive push notifications." — [WebKit: Web Push for Web Apps on iOS and iPadOS (16 Feb 2023)](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- The permission request must happen "in response to direct user interaction — such as tapping on a 'subscribe' button provided by the web app." Notifications appear on the Lock Screen, in Notification Center and on a paired Apple Watch. Home Screen web apps also got the Badging API in 16.4. — [WebKit blog 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- "Web Push only works if the web app is installed in the home screen; not available in Safari or other browsers" (iOS PWA compatibility notes; last updated June 2023, covers iOS 17 at most) — [firt.dev iOS PWA Compatibility](https://firt.dev/notes/pwa-ios/)
- caniuse marks Push API on Safari iOS as "Partial support" from 16.4 through 27.2, and as supported on Chrome for Android (154), Firefox for Android (157) and Samsung Internet. — [caniuse: Push API](https://caniuse.com/push-api)
- Declarative Web Push "allows web developers to request a Web Push subscription and display user visible notifications without requiring an installed service worker". It uses a fixed JSON payload (top-level `"web_push": 8030` plus a `notification` object with title, body, navigate URL and optional app badge). It is backwards-compatible: older browsers handle the same JSON in a service-worker push handler. — [WebKit: Meet Declarative Web Push (27 Mar 2025)](https://webkit.org/blog/16535/meet-declarative-web-push/)
- Declarative messages always produce a visible notification. "Unlike original Web Push, failed service worker processing doesn't trigger subscription revocation — the fallback notification displays instead." — [WebKit blog 16535](https://webkit.org/blog/16535/meet-declarative-web-push/)
- "Declarative Web Push is now available on iOS and iPadOS 18.4 for web apps added to the Home Screen." — [WebKit Features in Safari 18.4 (31 Mar 2025)](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/). Safari 18.5 / macOS 15.5 support is also reported. — [apfelpatient](https://www.apfelpatient.de/en/news/macos-15-5-safari-saves-power-with-new-web-push-feature); [WWDC25 session 235](https://developer.apple.com/videos/play/wwdc2025/235)
- Reliability: WebKit bug 273063, "iOS service worker - webPush subscription becomes invalid for few users" (`getSubscription()` sometimes returns null), was still NEW/unresolved at its last activity (July 2024). A WebKit engineer suggested the cause may be outside WebKit: "Web.app would handle the push, but then tell WebKit that the website didn't have permissions anymore." — [WebKit Bugzilla 273063](https://bugs.webkit.org/show_bug.cgi?id=273063)
- Developer reports include push endpoints that "expire in a week or two" and disappear from the installed PWA. Others see notifications stop after a few or after hundreds of messages, or the push service returns HTTP 200 while the service worker's push event never fires. — [Apple Developer Forums 786360](https://developer.apple.com/forums/thread/786360); [Apple Developer Forums 848080](https://developer.apple.com/forums/thread/848080); [Apple Developer Forums 728796](https://developer.apple.com/forums/thread/728796) (summarised from search results)
- With classic (non-declarative) Web Push, Safari does not allow invisible pushes. If the service worker fails to show a notification, Safari revokes the permission. — [webscraft.org: PWA push on iOS in 2026](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en) (secondary source)
- The Safari 27.0 release notes (17 Sep 2026) had no changes to Web Push, notifications, manifest features or web-app permissions, based on a fetched summary of a very long post. — [WebKit Features for Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)

### Inferences
- Phase 2 birthday and follow-up reminders can ship in a PWA today. They need: (a) users to install to the Home Screen on iOS; (b) a subscribe button the user taps, never an automatic prompt; (c) Declarative Web Push payloads, so iOS 18.4+ devices still show the notification if service-worker code fails; (d) detection of invalid subscriptions (re-subscribe on every app open and compare endpoints); (e) a fallback channel such as email or an in-app "due today" list. On iOS, push should not be the only delivery path.
- Chrome on Android does not need installation for push (caniuse shows full support), so Android is the lower-risk platform for reminders.
- Push sent from the server has no per-notification cost beyond hosting. Quotas and throttling come from browser push services, not from a vendor price list.

### Gaps
- No primary source found for published iOS notification-rate limits or quotas for Web Push. None appear to be documented.
- No source confirms whether iOS 26/27 fixed the subscription-invalidation reports. Bug 273063's last visible activity is 2024.
- No new 2026 Web Push features were found for iOS 26/27. If they matter, verify against the full Safari 26.x/27.0 release notes.

---

## 2. Microphone recording in an installed PWA

### Takeaway
MediaRecorder works on iOS. AAC in MP4 (`audio/mp4`) is the safe default. WebM/Opus recording arrived in Safari 18.4, but `audio/ogg` recording does not work. Chrome records WebM/Opus and has also recorded MP4 since Chrome 126. Microphone permission persistence in iOS Home Screen web apps is a known weak spot. Background or locked-screen recording should be assumed impossible; Screen Wake Lock (iOS 18.4+ in Home Screen apps) can keep the screen on while recording.

### Cited Findings
- MediaRecorder has been supported in iOS Safari since 14.5 (firt.dev, 2023). iOS Safari (14.3+) records "Container: mp4, Video: H264, and Stereo AAC @ 44.1kHz or 48kHz". Mobile Safari historically supported only `audio/mp4` for audio. — [firt.dev](https://firt.dev/notes/pwa-ios/); [WebKit: MediaRecorder API](https://webkit.org/blog/11353/mediarecorder-api/); [addpipe MediaRecorder demo](https://addpipe.com/media-recorder-api-demo/)
- "MediaRecorder in WebKit for Safari 18.4 now supports creating WebM files using the Opus audio codec and either VP8 or VP9 for video", plus fragmented MP4 (ISOBMFF) and ALAC/PCM. — [WebKit Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
- Safari 26 "adds support for ALAC and PCM audio in MediaRecorder." — [WebKit: News from WWDC25 (9 Jun 2025)](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)
- Creating a MediaRecorder with `audio/ogg;codecs=opus` fails in Safari 18.4, despite release-note wording. — [frequal.com: OggOpus still not working in Safari 18.4](https://frequal.com/java/OggOpusStillNotWorkingInSafari18_4.html)
- WebM video recorded by MediaRecorder on iOS 18.4 beta played back rotated 90 degrees, because WebM has no rotation metadata. This affects video, not audio-only. — [WebKit Bugzilla 290223](https://bugs.webkit.org/show_bug.cgi?id=290223); [WebKit Bugzilla 290002](https://bugs.webkit.org/show_bug.cgi?id=290002)
- Chrome added MP4 recording to MediaRecorder in "June 2024 with Chrome 126." MP4s from both Chrome and Safari are fragmented, and "the `moov` atom does not contain duration metadata" (zero duration fields), so they may need remuxing before playback in standard players. — [addpipe blog, updated 21 May 2026](https://blog.addpipe.com/duration-in-mp4-files-produced-by-chrome-safari/)
- OpenAI transcription accepts "`mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, and `webm`" up to 25 MB, so Safari `audio/mp4` and Chrome `audio/webm` can be sent directly. — [OpenAI speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text)
- Permission persistence: WebKit bug 215884, "getUserMedia recurring permissions prompts in standalone when hash changes", was resolved around iOS 14.5. Later comments (latest Feb 2026) say permission persistence across PWA restarts and reloads is still a problem. A WebKit engineer asked for a separate bug on persistent PWA permissions. — [WebKit Bugzilla 215884](https://bugs.webkit.org/show_bug.cgi?id=215884)
- Users report repeated camera-permission prompts in Safari web apps. In Safari, users can grant camera/microphone persistently through the Safari UI, but that setting reportedly does not carry over to Home Screen web apps. — [Apple Community thread 256081579](https://discussions.apple.com/thread/256081579); [WebKit Bugzilla 220416](https://bugs.webkit.org/show_bug.cgi?id=220416) (via search summary)
- "The Screen Wake Lock API now also works in Home Screen Web Apps on iOS and iPadOS 18.4." — [WebKit Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)

### Inferences
- Use `MediaRecorder.isTypeSupported()` and prefer `audio/mp4` (AAC) on iOS and `audio/webm;codecs=opus` on Chrome/Android. Never request `audio/ogg`. Both outputs go straight to OpenAI without transcoding.
- For 10-30 second notes, MP4 files with missing duration metadata are a playback-UI issue, not a transcription issue. Remux server-side only if in-app playback needs scrubbing.
- Expect iOS to show the microphone prompt again on some app launches. Keep recording in a single-page flow (no full navigations between pressing the button and recording) and call `getUserMedia` only on the big-button tap. Hold a Screen Wake Lock while recording so auto-lock does not cut a note off.

### Gaps
- Could not find a primary source on whether an installed iOS web app keeps recording when it goes to the background or the screen locks (search budget exhausted). Widely reported behaviour is that capture stops, but this is unverified here. Treat background recording as unavailable in a PWA.
- No primary data on whether Android Chrome keeps a granted microphone permission across installed-PWA sessions. It is generally persistent per origin, but not verified here.

---

## 3. Geolocation and EXIF GPS on uploaded photos

### Takeaway
Do not rely on photo EXIF for geotags. iOS strips GPS from photos uploaded through a file input, and photos taken with the camera from the file input are stripped unconditionally. Android hides photo location from apps by default (Android 10+ scoped storage), and a browser page cannot request the permission that reveals it. Stamp location with the Geolocation API when the note or photo is captured instead.

### Cited Findings
- WebKit bug "Uploading photos from iOS photo library strips EXIF data" (207088), and later reports: since iOS 16.4, GPS data is removed from photos uploaded via file input whether the camera format is Most Compatible or High Efficiency. — [WebKit Bugzilla 207088](https://bugs.webkit.org/show_bug.cgi?id=207088); [WebKit Bugzilla 257534](https://bugs.webkit.org/show_bug.cgi?id=257534)
- iOS 17 added an "options" menu in the photo picker that lets users include location for existing library photos. Photos taken with the camera from the file input still have GPS stripped. — [WebKit Bugzilla 257534](https://bugs.webkit.org/show_bug.cgi?id=257534) (via search summary); [iNaturalist forum](https://forum.inaturalist.org/t/am-i-doing-something-wrong-website-uploader-does-not-grab-date-location-info/22333)
- Android: "If your app uses scoped storage, the system hides location information by default" (Android 10 / API 29+). Unredacted EXIF needs the `ACCESS_MEDIA_LOCATION` runtime permission plus `MediaStore.setRequireOriginal()`, and "there is no guarantee that your app has access to unredacted EXIF metadata." — [Android Developers: Access media files from shared storage](https://developer.android.com/training/data-storage/shared/media)
- Web uploads through Chrome/Firefox on modern Android arrive without GPS EXIF, because the web page cannot declare `ACCESS_MEDIA_LOCATION`. — [technetexperts.com](https://www.technetexperts.com/fix-android-exif-data-upload/amp/) (low-authority secondary source; consistent with the Android docs above); [Google Issue Tracker 243294058](https://issuetracker.google.com/issues/243294058) (not fetched)

### Inferences
- Read `navigator.geolocation.getCurrentPosition()` (or a watch started when the user taps record) and store lat/lng/accuracy/timestamp on the note itself. Attach the same fix to photos taken in that session. "Geotagged photos" becomes "photos linked to a geotagged capture event". This works the same on iOS and Android.
- To place a photo picked later from the library, use a manual place search or pin-drop. EXIF may be usable only on iOS 17+ when the user explicitly includes location in the picker options. Treat it as optional.
- Roaming and patchy data do not block GPS fixes (GNSS works offline), but a cold start without network assistance can be slow or less accurate. Store the `accuracy` value and allow a quick fix-up.

### Gaps
- No primary 2025-2026 source found on how Geolocation permission persists in installed iOS web apps (re-prompt behaviour) or on accuracy differences in standalone mode (search budget exhausted).
- Did not verify whether Chrome on Android preserves GPS when the photo comes from the camera via `<input capture>` rather than the gallery.

---

## 4. Offline capture: storage, eviction, Background Sync and queueing

### Takeaway
Storage space is not the constraint: Home Screen web apps on iOS 17+ get the same origin quota as Safari, about 60% of disk. The constraints are eviction and the lack of background upload on iOS. Safari's 7-day deletion of script-written data targets sites used in the browser; Home Screen web apps are described as effectively exempt. Background Sync is not supported on iOS Safari at all, so queued recordings upload only while the app is open.

### Cited Findings
- WebKit storage policy (Safari 17 / iOS 17, 10 Aug 2023): browser apps get origin quota "up to 60% of total disk space" and overall "up to 80%". Home Screen web apps receive "the same origin quota and overall quota as when it is opened in a browser app." Eviction is least-recently-used, by last user interaction or storage operation. "Origins with active pages or persistent mode storage are excluded from eviction." — [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- `navigator.storage.persist()`: "WebKit currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App." `navigator.storage.estimate()` is supported. — [WebKit blog 14403](https://webkit.org/blog/14403/updates-to-storage-policy/)
- "Safari proactively evicts data when cross-site tracking prevention is turned on. If an origin has no user interaction, such as click or tap, in the last seven days of browser use, its data created from script will be deleted." Home Screen/Dock web apps use the browser-app origin quota (~60%). OPFS counts toward quota alongside IndexedDB and Cache API. — [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- For Home Screen web apps, only JavaScript-created cookies and cookies from third-party CNAME-cloaked responses should be capped at 7 days. Other HTML storage "should not be deleted for the main domain of Home Screen web apps." Home Screen apps have their own day counter, which will effectively never reach seven days. — [WebKit Bugzilla 211775](https://bugs.webkit.org/show_bug.cgi?id=211775) / [237350](https://bugs.webkit.org/show_bug.cgi?id=237350) (seen via search snippet; exact bug not fetched)
- Safari and most Chromium browsers "automatically approve or deny the [persist] request based on the user's history of interaction with the site and do not show any prompts." — [MDN storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria). Chrome's heuristics are site engagement, whether the site is installed or bookmarked, and whether notification permission is granted. — [web.dev: Persistent storage (2020)](https://web.dev/articles/persistent-storage)
- Chrome origin quota: "up to 60% of the total disk size in both persistent and best-effort modes." — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- Background Sync API: supported on Chrome for Android and Samsung Internet. Not supported on Safari iOS in any version, through 27.2. — [caniuse: Background Sync](https://caniuse.com/background-sync). Periodic Background Sync is supported in Chrome/Edge 80+ and not in Firefox or Safari. — [web.dev: Periodic background sync](https://web.dev/patterns/web-apps/periodic-background-sync)
- iOS PWA notes list Background Sync, Periodic Background Sync and Background Fetch as unsupported; OPFS ("FileSystem Access (origin private)") and persistent Storage Management are supported since iOS 15.2 (2023 snapshot). — [firt.dev](https://firt.dev/notes/pwa-ios/)

### Inferences
- A robust offline capture design: (1) write the audio Blob and metadata (GPS fix, timestamp, local UUID) to IndexedDB, or OPFS for blobs, as soon as recording stops; (2) call `navigator.storage.persist()` after the first saved note, ideally from a user gesture; (3) upload on app open, on the `online` event and on `visibilitychange`, with retries and idempotent server writes keyed by the local UUID; (4) on Chrome/Android, also register a Background Sync tag as an enhancement; (5) show a visible "3 notes waiting to upload" badge so users on roaming data know to reopen the app.
- Upload the raw audio first (small: about 30 KB to 0.5 MB for 10-30 s of AAC/Opus) and run transcription and extraction server-side. Review can happen later, which makes the core loop tolerant of patchy connectivity.
- Encourage Home Screen install on iOS. It unlocks push, a better chance of persistence and exemption from the 7-day script-storage deletion.

### Gaps
- No 2025-2026 primary source confirms the exact current eviction behaviour for iOS 26/27 Home Screen apps. The WebKit storage-policy post is from 2023 and the 7-day exemption comes from a bug-tracker comment.
- No source found on any iOS mechanism to run uploads after the PWA is closed (none appears to exist).

---

## 5. Contacts: Contact Picker, vCard and Web Share

### Takeaway
A PWA cannot write to the phone book on either platform. The Contact Picker API (read-only, user-selected) works only on Chrome for Android and is off by default on iOS through Safari 27.2. "Save to contacts" via a `.vcf` download works on iOS, but the preview sheet is confusing: the save buttons sit at the bottom and "Done" discards the contact. Web Share Level 2 (files) is supported on iOS 15+.

### Cited Findings
- Contact Picker API: experimental, HTTPS-only, read-only. It returns `name`, `email`, `tel`, `address`, `icon` for contacts the user picks, and "access to contacts is not persistent; the user must grant access every time." — [MDN: Contact Picker API](https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API)
- caniuse: ContactsManager supported on Chrome for Android (154). Safari on iOS "Disabled by default" for 14.5 through 27.2. Not supported in Firefox. Partial in some Samsung Internet versions. — [caniuse: ContactsManager](https://caniuse.com/mdn-api_contactsmanager); see also [firt.dev](https://firt.dev/notes/pwa-ios/) ("14.5 (experimental)")
- vCard on iOS Safari: opening a `.vcf` shows a preview sheet with "Done" and a share button at the top. "Create New Contact" and "Add to Existing Contact" are at the bottom, often below the fold, and "tapping Done closes the sheet and doesn't save the contact." — [HiHello: Dear Apple, let's improve contact saving (updated 11 Nov 2024)](https://hihello.com/blog/dear-apple-lets-improve-contact-saving)
- Older reports (iOS 13 era) describe the same unclear save path from Safari. — [keremerkan.net: vCard Getter development stopped](https://keremerkan.net/posts/vcard-getter-development-stopped/); [Apple Developer Forums 124193](https://developer.apple.com/forums/thread/124193)
- Web Share API is supported on iOS since 12.1, and Web Share 2.0 (files) since iOS 15.0. — [firt.dev](https://firt.dev/notes/pwa-ios/)

### Inferences
- Phase 2 "save to contacts" can ship now as a `.vcf` export, served with `Content-Type: text/vcard` and a filename. On iOS, add a one-line hint: "scroll down and tap Create New Contact". Optionally embed the photo (base64 `PHOTO`) and a `NOTE` field with how-we-met context.
- On Android, add an "Import from my contacts" button using the Contact Picker as a progressive enhancement. Hide it on iOS.
- Real two-way phone-book sync needs native code (Phase 4). See section 14.

### Gaps
- No source found describing current Android Chrome behaviour when a `.vcf` is downloaded (whether it opens the Contacts "add" screen directly or only via the downloads notification). Not verified.
- Not verified whether `navigator.share({files:[contact.vcf]})` on iOS offers Contacts as a share target. That could give a cleaner flow than a download and should be tested on a device.
- The iOS vCard UX source is a 2024 vendor blog. iOS 26/27 behaviour was not re-verified.

---

## 6. Quick-launch options (one-tap capture)

### Takeaway
On Android, manifest `shortcuts` (long-press icon menu) work for installed WebAPKs. On iOS, manifest shortcuts are not supported, and lock-screen widgets, Control Center controls and Action-button controls need native code. The PWA-compatible route on iOS is an Apple Shortcut ("Open URLs" to a deep link such as `/capture`) that users bind to the Action button or Back Tap. Whether that opens the installed web app or Safari was not verified.

### Cited Findings
- App shortcuts are "available on most desktop operating systems and Android with WebAPK" and appear in the icon's context menu. — [web.dev: Learn PWA, Enhancements](https://web.dev/learn/pwa/enhancements)
- iOS Web App Manifest "shortcuts" are listed as unsupported (2023 snapshot). — [firt.dev](https://firt.dev/notes/pwa-ios/). The Safari 26 and 27 release notes add nothing on manifest shortcuts. — [WebKit WWDC25](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/); [WebKit Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)
- iPhone users can run a shortcut with the Action button, or with Back Tap (Settings > Accessibility > Touch > Back Tap, double- or triple-tap). Shortcuts can open URLs with the Open URL action. — [Apple Shortcuts User Guide: run with Action button / Back Tap](https://support.apple.com/guide/shortcuts/apd897693606/ios); [Apple Shortcuts User Guide](https://support.apple.com/guide/shortcuts/apd621a1ad7a/ios)
- iOS 18 "Controls" (built on WidgetKit) extend an app into Control Center, the Lock Screen and the Action button. Widgets, Shortcuts actions and controls all run through App Intents. Third-party controls are native-app features. — [WWDC24 session 10157](https://developer.apple.com/videos/play/wwdc2024/10157/); [MacRumors: iOS 18 Control Center](https://macrumors.com/guide/ios-18-control-center)
- The Lock Screen can hold a control that runs any Shortcut, so a Shortcut that opens a URL can be placed on the Lock Screen without a native app. — [MacRumors: iOS 18 Control Center](https://macrumors.com/guide/ios-18-control-center)

### Inferences
- Phase 1, Android: add a manifest `shortcuts` entry "New voice note" pointing to `/capture?autostart=1`. Phase 1, iOS: publish a ready-made iCloud Shortcut link ("Open URL" to the capture deep link) with instructions to assign it to the Action button, Back Tap or a Lock Screen control. That gets close to one-tap capture without native code.
- Recording still needs a tap inside the page after launch on both platforms (user-activation for `getUserMedia`/MediaRecorder). True "press the Action button and it is already recording" needs a native App Intent (Phase 4).
- Android Quick Settings tiles and home-screen widgets need native code. Neither is available to a PWA.

### Gaps
- Not verified whether an iOS Shortcut "Open URLs" action opens the URL inside an installed Home Screen web app or in Safari (search budget exhausted). If it opens in Safari, the user lands outside the installed app, with separate storage and permissions. This must be tested on a device.
- No source fetched for Android Quick Settings tile APIs (native-only status is from general knowledge, not cited).

---

## 7. Install friction and storage persistence on iOS

### Takeaway
iOS still has no programmatic install prompt; users must use Share > Add to Home Screen. Since iOS 26, any site added to the Home Screen opens as a web app by default, with no manifest needed. Installing is the gate for push, better storage persistence and Wake Lock on iOS.

### Cited Findings
- iOS has no `beforeinstallprompt` (listed unsupported). — [firt.dev](https://firt.dev/notes/pwa-ios/)
- Since iOS/iPadOS 26, "By default, every website added to the Home Screen opens as a web app". Users can switch off "Open as Web App" to add a plain bookmark instead. Manifest benefits (icons and so on) still apply when present. — [WebKit: News from WWDC25 (9 Jun 2025)](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/); [heise: iOS 26 changed web app behaviour](https://heise.de/-10749652)
- Since 16.4, third-party browsers on iOS can add websites to the Home Screen from the Share menu. — [WebKit blog 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- `persist()` in WebKit is granted heuristically, including whether the site is opened as a Home Screen web app. — [WebKit blog 14403](https://webkit.org/blog/14403/updates-to-storage-policy/)

### Inferences
- Build an install coach (detect iOS Safari plus non-standalone, then show an animated Share > Add to Home Screen hint) and tie it to clear value: "turn on reminders", "keep your notes offline". The iOS 26 change removes the earlier failure where a site without the right meta tags opened in Safari.
- Data in the Safari tab and in the installed web app should be treated as separate. Do onboarding and login after install, or sync from the server, so notes captured in the browser are not stranded.

### Gaps
- Not verified whether iOS 26/27 share storage between the Safari tab and the installed web app for the same origin. Historically they were separate; confirm on a device.

---

## 8. WhatsApp Business Platform (Cloud API) for voice-note intake (Phase 3)

### Takeaway
Technically straightforward and close to free for this use case. Incoming messages are never charged, and free-form replies inside the 24-hour customer service window are free under per-message pricing (since 1 July 2025). Voice notes arrive as OGG/Opus media IDs that must be downloaded quickly (URLs expire after 5 minutes; webhook media IDs after 7 days) and transcoded before sending to OpenAI. The real constraint is policy (section 9), not cost.

### Cited Findings
- Per-message pricing has applied since 1 July 2025. Meta charges only when "a template message is delivered", varying by template category (marketing, utility, authentication) and recipient country code. — [Meta: WhatsApp Business Platform pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- "All non-template messages are free... Non-template messages can only be sent within an open customer service window." Utility templates are free inside an open customer service window or inside a 72-hour free entry point window. — [Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- The 24-hour customer service window opens when a user messages the business and lasts 24 hours from their last message. — [Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- "Messages sent from a WhatsApp user to a business are not charged." — [Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- 2026 pricing changes: India marketing rates up from 1 Jan 2026. Eight new billing currencies, including AED and SAR, from 1 Apr 2026. Rate-card updates from 1 Jul 2026. More market moves from 1 Oct 2026. Country rates are in downloadable rate cards. — [Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- Media: audio types are AAC, AMR, MP3, M4A and OGG ("OPUS codecs only; base audio/ogg not supported; mono input only"), max 16 MB. "Media URLs expire after 5 minutes." "Media IDs in webhooks expire after 7 days." Media persists 30 days. Downloading requires the access token. — [Meta: Media (business phone numbers)](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media)
- Phone number requirements: must "be owned by you" and "be able to receive voice calls or SMS". "Short codes are not supported." "Numbers already in use with WhatsApp cannot be registered unless they are deleted first." "New business portfolios are initially capped at two registered business phone numbers", rising to 20 after business verification or reaching a 2,000 messaging limit. Business verification is not required just to register. — [Meta: Phone numbers](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers)
- Throughput is 80 messages/second per number by default, up to 1,000 by automatic upgrade. — [Meta: Throughput](https://developers.facebook.com/documentation/business-messaging/whatsapp/throughput)
- Messaging limits: new unverified portfolios can send business-initiated messages to 250 unique users per rolling 24 hours. Limits have been per business portfolio since Oct 2025. Meta is removing the 2K/10K tiers so verified businesses jump to 100K (rollout expected Q2 2026). — [uptail.ai (secondary)](https://uptail.ai/blog/how-many-messages-can-you-send-on-whatsapp-business-limits-explained-for-2026)
- OpenAI's transcription endpoint lists `mp3, mp4, mpeg, mpga, m4a, wav, webm`. OGG is not listed. — [OpenAI speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text)

### Inferences
- Flow: user sends a voice note to the designated number, the webhook delivers a media ID, the server immediately fetches the URL and downloads (well inside 5 minutes), stores the file in Supabase Storage, transcodes OGG/Opus to WebM/Opus (container remux, no re-encode) or M4A with ffmpeg, transcribes, then replies with a free-form confirmation inside the 24-hour window. Cost to the business for this loop is $0 in Meta fees. Only proactive messages outside the window (for example a birthday nudge sent by WhatsApp) need paid templates.
- Users must link their WhatsApp number to their app account, for example via a one-time code. The 250 business-initiated limit does not matter because almost all traffic is user-initiated.
- Since 1 Apr 2026 Meta can bill in AED, which helps a UAE-based operator.

### Gaps
- Did not retrieve per-country utility or marketing template rates for UAE, Australia and Thailand (rate cards are downloadable CSV/PDF and were not fetched).
- Display-name approval rules and current business-verification document requirements were not confirmed from the primary page.

---

## 9. Meta's 2025-2026 AI chatbot policy on the WhatsApp Business Platform

### Takeaway
Since 15 January 2026, Meta's terms prohibit "AI Providers" from using the WhatsApp Business Platform where AI "is the primary (rather than incidental or ancillary) functionality". This targets general-purpose assistants (ChatGPT, Perplexity and similar). A business-specific bot that files a user's own voice notes into their account is a structured, ancillary use and looks permissible. An open-ended "ask the AI anything about your people" chat over WhatsApp is closer to the line. The EU has forced exceptions, but outside the EEA the restriction stands.

### Cited Findings
- Meta Terms for WhatsApp Business Platform, section 4.7 "AI Providers" (page shows last modified 23 Sep 2026). AI Providers are "providers and developers of artificial intelligence or machine learning technologies, including but not limited to large language models, generative artificial intelligence platforms, general-purpose artificial intelligence assistants". They are "strictly prohibited from accessing or using the WhatsApp Business Platform" for "providing, delivering, offering, selling, or otherwise making available such technologies when such technologies are the primary (rather than incidental or ancillary) functionality". The terms say such technologies "may be made available to businesses in certain countries as set forth" in Meta's developer docs, and businesses "may retain an AI Provider as your Solution Provider." — [Meta Terms for WhatsApp Business Platform](https://www.facebook.com/legal/Meta-Terms-for-WhatsApp-Business-Platform)
- The same terms bar letting "WhatsApp Business Platform Data... be used to create, develop, train, or improve any machine learning or artificial intelligence systems", except to "fine-tune an AI Model that is for your exclusive use." — [Meta Terms for WhatsApp Business Platform](https://www.facebook.com/legal/Meta-Terms-for-WhatsApp-Business-Platform)
- Timeline: the ban on general-purpose AI chatbots took effect 15 Jan 2026 and applied to new users from 15 Oct 2025. Allowed: structured bots for support, bookings, order tracking, notifications, sales. Banned: open-ended, assistant-style chatbots. — [respond.io: WhatsApp general-purpose chatbots ban](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban)
- Interpretation: "The chatbot's role must be ancillary to a legitimate business service, not the centerpiece of the interaction." "Automations that handle structured tasks — such as confirming orders, triaging support tickets, sending appointment reminders or authenticating logins — are explicitly permitted." — [respond.io: WhatsApp chatbot policy 2026 (updated 3 Nov 2025)](https://respond.io/blog/whatsapp-chatbot-policy-2026)
- EU/Italy: Italy's competition authority intervened in Dec 2025. The European Commission objected in Feb 2026. In March 2026 Meta offered to allow rival AI assistants in Europe for one year, for usage fees of €0.0490-€0.1323 per message. The Commission said this appeared to have the same exclusionary effect and signalled interim measures to restore pre-15-Oct-2025 access. — [eWeek](https://www.eweek.com/de/news/meta-whatsapp-ai-chatbots-eu-antitrust/); [arynews](https://arynews.tv/eu-warns-meta-whatsapp-ai-fee-breaches-antitrust-rules-orders-rollback); [CDO Magazine](https://www.cdomagazine.tech/aiml/meta-opens-whatsapp-to-rival-ai-chatbots-in-europe-for-one-year)
- On 13 May 2026, "general-purpose AI chatbots operating in the EEA will be given free access to the WhatsApp Business API for one month" while talks continued. — [MediaNama (13 May 2026)](https://www.medianama.com/2026/05/223-meta-free-whatsapp-access-ival-ai-chatbots-amid-eu-probe/)

### Inferences
- The Phase 3 intake bot is a capture channel for a people-memory product, not an AI service sold through WhatsApp. It transcribes and files the user's own notes and confirms receipt, so AI is incidental to a legitimate service and should be permitted. Keep WhatsApp replies structured ("Saved: Name, met at X, follow up Friday. Reply 1 to edit").
- Higher-risk design: a free-form "chat with your people assistant" inside WhatsApp. Even scoped to the user's own data, Meta could see it as an assistant whose primary function is AI. Safer to keep the conversational assistant in the PWA, and if it is offered in WhatsApp, frame it as narrow lookups ("who did I meet at...?") with structured answers.
- OpenAI API data is not used for training by default (section 12). Using OpenAI as a processor is therefore compatible with the clause against training on WhatsApp data, provided the app never fine-tunes shared models on WhatsApp content.
- The users (UAE, Australia, Thailand) are outside the EEA, so EU exceptions do not help, and the platform-wide rule applies.

### Gaps
- Could not find Meta's own developer-documentation page listing which "certain countries" allow AI-provider use, or any official examples of "incidental or ancillary".
- EU status after May 2026 (whether interim measures were imposed or a settlement reached) was not found.

---

## 10. Alternatives for messaging intake: Telegram, Apple Messages for Business, SMS

### Takeaway
A Telegram bot is the fastest and cheapest way to prototype "send a voice note to file it". Voice notes are OGG/Opus, downloads up to 20 MB, and there is no AI-chatbot ban comparable to Meta's. But Telegram's reach among the target users is likely lower than WhatsApp's. Apple Messages for Business is built for brand customer service, needs an approved provider and brand registration with Apple, and is a poor fit for a note-to-self capture channel.

### Cited Findings
- Telegram Bot API: `Voice` objects have `file_id`, `duration`, `mime_type`. `getFile` downloads are limited to 20 MB on the hosted Bot API, and a self-hosted local Bot API server removes the limit. The latest version is Bot API 10.3 (24 Aug 2026). — [Telegram Bot API](https://core.telegram.org/bots/api)
- Voice messages sent via `sendVoice` must be OGG/Opus, MP3 or M4A. Larger voice files may be treated as documents. — [gramio types docs (Bot API mirror)](https://jsr.io/@gramio/types@10.2.0/doc/~/TelegramObjects.TelegramFile); [fast.io](https://fast.io/resources/telegram-file-size-limit.md) (secondary)
- Apple Messages for Business requires an Apple-approved Messaging Service Provider (MSP). Businesses register through Apple Business Register, submitting brand details (addresses, logos) for Apple's approval, and each Business ID is tied to an MSP. — [Bird: How a business gets set up on Apple Messages for Business](https://bird.com/explained/apple-messages/how-does-a-business-get-set-up-on-apple-messages-for-business); [Bird: What is an MSP](https://bird.com/explained/apple-messages/what-is-a-messaging-service-provider-and-how-do-i-choose-one); [Zendesk: Apple Messages for Business channel](https://support.zendesk.com/hc/en-us/articles/8030634178458-Adding-and-configuring-the-Apple-Messages-for-Business-channel)

### Inferences
- Telegram intake could be pulled into Phase 1.5 as a near-zero-cost experiment, using the same transcription pipeline (OGG/Opus needs a remux, as with WhatsApp).
- An SMS or voice number (for example call-in voicemail) adds per-message or per-minute telecom costs and number-provisioning rules in the UAE, Australia and Thailand. Not researched here.

### Gaps
- Telegram Bot API pricing (free) is not explicitly stated on the fetched page. It is generally known to be free, but not verified from a primary statement here.
- No research done on SMS/voice-number options (Twilio and similar), costs or UAE/Thailand number regulation (search budget exhausted).
- No usage-share data for Telegram vs WhatsApp in the UAE, Australia and Thailand.

---

## 11. OpenAI transcription options, pricing and language suitability

### Takeaway
OpenAI's recommended model as of October 2026 is `gpt-transcribe` (released 28 July 2026, $0.0045/min). It supports keyword hints, multiple language hints and code-switching, which suits notes full of Arabic and Thai names spoken in accented English. The cheapest option is `gpt-4o-mini-transcribe` at $0.003/min. At 10-30 s per note, transcription costs a fraction of a cent per note on any OpenAI model.

### Cited Findings
- OpenAI pricing page (fetched Oct 2026): `gpt-transcribe` $0.0045/min. `gpt-4o-transcribe` $2.50 in / $10.00 out per 1M tokens, about $0.006/min. `gpt-4o-mini-transcribe` $1.25 / $5.00 per 1M tokens, about $0.003/min. `gpt-4o-transcribe-diarize` about $0.006/min. Whisper $0.006/min. Live/realtime: `gpt-realtime-whisper` and `gpt-live-transcribe` $0.017/min. — [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
- `gpt-transcribe` handles "file and Realtime input transcription" and "supports unstructured context, keyword hints, and multiple language hints", plus "code-switching" and streaming. It runs on `v1/audio/transcriptions` and `v1/realtime/transcription_sessions`. Rate limits start at 5,000 RPM (Build tier). — [OpenAI model page: gpt-transcribe](https://developers.openai.com/api/docs/models/gpt-transcribe)
- Release: GPT-Transcribe and GPT Live Transcribe were released 28 July 2026. `gpt-transcribe` is now recommended ahead of whisper-1, gpt-4o-transcribe and gpt-4o-mini-transcribe. — [GIGAZINE (29 Jul 2026)](https://gigazine.net/gsc_news/en/20260729-gpt-live-transcribe); [OpenAI speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text)
- The speech-to-text guide calls `gpt-transcribe` "the recommended model for transcribing recorded speech in its original language", and calls `gpt-4o-transcribe` / `gpt-4o-mini-transcribe` "legacy models with prompting support". "Use a prompt to improve recognition of names, acronyms, formatting, or recording-specific vocabulary"; whisper-1 prompts are limited to 224 tokens. Files up to 25 MB. Language codes accepted include ISO 639-1 and selected ISO 639-3. — [OpenAI speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text)
- Small text models for field extraction (per 1M tokens, input/output): gpt-5-nano $0.05/$0.40, gpt-5-mini $0.25/$2.00, gpt-4o-mini $0.15/$0.60, gpt-4.1-mini $0.40/$1.60. — [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

### Inferences
- Cost per note (30 s): about $0.00225 with gpt-transcribe, $0.0015 with gpt-4o-mini-transcribe. Extraction with gpt-5-mini at about 1,000 input and 300 output tokens is about $0.00085, or about $0.00017 with gpt-5-nano. All-in AI cost is roughly $0.001-0.003 per note, so 1,000 notes per user per year cost about $1-3.
- For names, send keyword or context hints built from the user's existing people list (recent contacts, frequent places, company names). This is the main accuracy lever for Arabic and Thai names in English speech. Also run a second LLM step to reconcile spelling against existing contacts.

### Gaps
- OpenAI's docs found here do not list language-level quality for Arabic or Thai, or WER on accented English. No independent 2026 benchmark for gpt-transcribe on Gulf/Levantine Arabic, Thai, or Arabic/Thai names inside English speech.
- Not verified whether per-minute billing is rounded (per second vs per minute). This matters slightly for 10-second notes.
- Exact mechanics of `gpt-transcribe`'s "keyword hints" parameter (vs the legacy `prompt` field) were not confirmed.

---

## 12. OpenAI API data usage, retention, residency and DPA (plus hosting regions)

### Takeaway
API data is not used for training by default. Abuse-monitoring logs are kept up to 30 days. Zero Data Retention (ZDR) and Modified Abuse Monitoring need sales approval, and `/v1/audio/transcriptions` is ZDR-eligible. Data residency now covers UAE and Australia, but Australia is storage-only (no in-region inference), and UAE in-region processing covers only selected GPT-5.x snapshots, apparently not the transcription models. Residency needs sales approval and adds a 10% surcharge for models released on or after 5 March 2026. Neither Supabase nor Vercel has a Middle East region; Singapore is the natural compromise for the UAE, Australia and Thailand together.

### Cited Findings
- "Data sent to the OpenAI API is not used to train or improve OpenAI models (unless you explicitly opt in to share data with us)" (since 1 Mar 2023). — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- Abuse-monitoring logs are kept "up to 30 days, unless longer retention is required by law, or is reasonably necessary to protect our services or any third party from harm." — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- ZDR and Modified Abuse Monitoring "require prior approval by OpenAI and acceptance of additional requirements", configured at organisation or project level, via sales. `/v1/audio/transcriptions`, `/v1/chat/completions`, `/v1/responses` and `/v1/embeddings` are ZDR-eligible. Assistants, Threads and Vector Stores keep data until deleted and are not ZDR-eligible. — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- Images flagged by the CSAM classifier are kept for manual review even under ZDR. — [ecorpit.com summary of OpenAI data controls](https://ecorpit.com/openai-zero-data-retention-limits-endpoints-india-residency-2026/) (secondary)
- Data residency regions: United States, Europe (EEA + Switzerland), Australia, Canada, Japan, India, Singapore, South Korea, United Kingdom, United Arab Emirates. Regional processing covers the US, Europe and UAE (limited models). Australia, Canada, Japan, India, Singapore, South Korea and the UK are storage-only. — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- UAE (`ae.api.openai.com`) regional-processing exceptions list only selected GPT-5.x snapshots (for example `gpt-5.5-2026-04-23`, `gpt-5.2-2025-12-11`). The transcription models are not listed for UAE in-region processing. Europe and the US support gpt-transcribe, gpt-4o-transcribe and gpt-4o-mini-transcribe in-region. — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data) (from a fetched summary of the region table; check the exact rows before relying on them)
- Data residency: "Contact our sales team to see if you're eligible"; configured per project when "creating a new project." "Regional processing (data residency) endpoints are charged a 10% uplift for models released on or after March 5, 2026." — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data); [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
- Supabase regions include Sydney (ap-southeast-2), Singapore (ap-southeast-1), Mumbai (ap-south-1), Tokyo and Seoul. No Middle East region is listed. — [Supabase: Available regions](https://supabase.com/docs/guides/platform/regions)
- Vercel has 19 compute regions, including bom1 Mumbai, sin1 Singapore, syd1 Sydney, hnd1 Tokyo, hkg1 Hong Kong and icn1 Seoul. No Middle East compute region. Functions default to iad1 (Washington, D.C.), and "Functions should be executed in the same region as your database" (page updated 11 Aug 2026). — [Vercel: Global network and regions](https://vercel.com/docs/regions)

### Inferences
- For a small startup, the default posture (no training, 30-day abuse logs) is likely acceptable. Disclose OpenAI as a sub-processor and the 30-day retention in the privacy policy. Apply for ZDR or Modified Abuse Monitoring once volume justifies a sales conversation.
- Users in the UAE and Australia cannot currently get in-country transcription from OpenAI (UAE processing excludes transcription models; Australia is storage-only). If a customer requires local processing, look at the alternatives in section 13 or on-device transcription in Phase 4.
- Put Supabase in ap-southeast-1 (Singapore) and pin Vercel functions to sin1. That is a single region with reasonable latency to Bangkok, Sydney and Dubai. Do not leave functions on the iad1 default.

### Gaps
- OpenAI's DPA page returned HTTP 403, so DPA availability and self-serve execution could not be confirmed from the primary source in this session.
- No primary source checked for UAE PDPL or Australian Privacy Act transfer requirements as they apply to voice notes about third parties. That is legal research outside this scope, but material.

---

## 13. Transcription alternatives and cost comparison (brief)

### Takeaway
Batch pricing is in the same band as OpenAI: AssemblyAI Universal-2 at $0.15/hr ($0.0025/min) is the cheapest found, Deepgram Nova-3 is $0.0043-0.0052/min, and OpenAI ranges from $0.003 to $0.006/min. Cost is not the deciding factor at 10-30 s per note; accuracy on names and data residency are. Apple's on-device SpeechAnalyzer (iOS 26) is attractive for the native phase, but its launch languages exclude Arabic and Thai, and it has no JavaScript binding for a PWA.

### Cited Findings
- AssemblyAI pre-recorded: Universal-3.5 Pro $0.21/hr, Universal-2 $0.15/hr; legacy `best` and `nano` route to these. Streaming: Universal-3.6 Pro Realtime $0.45/hr base, Universal-Streaming $0.15/hr. $50 free credit. — [AssemblyAI pricing](https://www.assemblyai.com/pricing)
- Deepgram pre-recorded: Nova-3 Monolingual $0.0043/min (Pay As You Go) or $0.0036/min (Growth). Nova-3 Multilingual $0.0052/min or $0.0043/min. Whisper Large $0.0048/min. $200 free credit. — [Deepgram pricing](https://deepgram.com/pricing)
- Apple SpeechAnalyzer/SpeechTranscriber: iOS/iPadOS/macOS/tvOS/visionOS 26, fully on-device with system-managed model download. Launch languages: Cantonese, Chinese, English, French, German, Italian, Japanese, Korean, Portuguese, Spanish ("Arabic and Thai are not included"). About 3x faster than Whisper Small. "No JavaScript binding exists; Safari's Web Speech API still relies on the older SFSpeechRecognizer." — [addpipe: A Quick Look at Apple's SpeechAnalyzer API (updated 20 Aug 2026)](https://blog.addpipe.com/apple-speechanalyzer-api/). Another source says support has expanded to about 30 languages / 40 locales, without listing Arabic or Thai. — [Anton Gubarenko: iOS 26 SpeechAnalyzer Guide](https://antongubarenko.substack.com/p/ios-26-speechanalyzer-guide) (conflicts with the launch-only list; check `SpeechTranscriber.supportedLocales` on device)

### Inferences
- Keep OpenAI (gpt-transcribe) as the primary engine for one-vendor simplicity, since the same key covers extraction. AssemblyAI or Deepgram are credible fallbacks, or regional-compliance options if their data-residency terms suit.
- For Phase 4 native, a hybrid works: SpeechAnalyzer on-device for English (offline and instant, good when roaming), with server-side gpt-transcribe when the detected language or names need it.

### Gaps
- Did not verify Arabic/Thai support, accuracy or data residency (EU/US/other) for AssemblyAI or Deepgram.
- Not researched: on-device Whisper in the browser (WebGPU via transformers.js and similar), its model sizes, and feasibility on iPhone Safari (search budget exhausted).

---

## 14. Native phase (Phase 4): Contacts sync, permissions, store rules and one-tap capture

### Takeaway
Native apps can do what the PWA cannot: write contacts (Android `ContactsContract` and the Insert intent; iOS Contacts framework) and offer Lock Screen, Control Center and Action-button controls via App Intents/WidgetKit. Constraints: iOS 18 lets users grant only limited contacts access. App Store rules require in-app account deletion. Guideline 5.1.2(iv) forbids using Contacts data to "build a contact database for your own use", which directly affects any design that uploads the phone book to the server.

### Cited Findings
- iOS 18 added `CNAuthorizationStatus.limited`: users can share only a subset of contacts and manage that set in Settings. With limited access, "fetch, edit, and delete operations only apply to contacts the user granted or the app created." `contactAccessPicker(isPresented:completionHandler:)` and `ContactAccessButton` let users add contacts to the shared set. — [Apple: Accessing the contact store](https://developer.apple.com/documentation/contacts/accessing-the-contact-store); [Apple: CNAuthorizationStatus.limited](https://developer.apple.com/documentation/contacts/cnauthorizationstatus/limited); [Apple: ContactAccessButton](https://developer.apple.com/documentation/contactsui/contactaccessbutton)
- Android Contacts Provider: Contacts / RawContacts / Data tables. `READ_CONTACTS` and `WRITE_CONTACTS` permissions. Batch inserts via `applyBatch()`. Custom account types need `AccountManager` registration and a sync adapter. `ContactsContract.Intents.Insert` lets the system Contacts app insert a contact with "No `WRITE_CONTACTS` permission required." — [Android Developers: Contacts Provider](https://developer.android.com/guide/topics/providers/contacts-provider)
- App Store guideline 5.1.1(v): "If your app supports account creation, you must also offer account deletion within the app." — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Guideline 5.1.2(iv): "Do not use information from Contacts, Photos, or other APIs that access user data to build a contact database for your own use or for sale/distribution to third parties". — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Guideline 4.2: apps should "elevate it beyond a repackaged website". A thin PWA wrapper risks rejection. — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- iOS 18 Controls (WidgetKit) appear in Control Center, on the Lock Screen and on the Action button. Widgets, Shortcuts actions and controls share App Intents. — [WWDC24 session 10157](https://developer.apple.com/videos/play/wwdc2024/10157/); [MacRumors](https://macrumors.com/guide/ios-18-control-center)
- Android 10+ hides photo location by default. Native apps can request `ACCESS_MEDIA_LOCATION` and use `setRequireOriginal()` to read GPS EXIF. — [Android Developers: media](https://developer.android.com/training/data-storage/shared/media)

### Inferences
- Phone-book sync should be designed as user-directed and per-contact: push a chosen person from the app into Contacts, or link an existing contact by identifier. Bulk-uploading the address book to the backend risks guideline 5.1.2(iv) and privacy trouble.
- Account deletion should exist from Phase 1 (also good practice under privacy laws), so the native app passes review without retrofitting.
- The native app's capture advantage is an App Intent ("Record a person note") on the Action button or Lock Screen that starts recording immediately, plus on-device transcription. These are the main reasons to move to native.

### Gaps
- Not verified: Apple's rules for App Intents that start audio recording from the Lock Screen without unlocking (privacy indicators, foreground requirements).
- Did not research Android 14/15/16 changes to contacts permissions (for example any partial-access model similar to iOS 18).

---

## 15. Which later-phase features can be pulled forward (synthesis)

### Takeaway
Several Phase 2 items can ship in the Phase 1 PWA: vCard export, Android Contact Picker import, web-push reminders with an email fallback, and Android manifest shortcuts. WhatsApp voice intake (Phase 3) is technically and financially ready to pilot, with policy risk limited if the bot stays structured. The in-app AI assistant over the user's own people can come forward because it has no platform constraint. Native-only items (Lock Screen/Action-button capture, phone-book sync, on-device transcription, background recording) cannot be pulled forward. Only partial workarounds exist (Apple Shortcut deep link).

### Cited Findings
- Web Push works now on Android, and on iOS 16.4+ when installed; Declarative Web Push on iOS 18.4+. — [WebKit 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); [WebKit 16574](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/); [caniuse Push API](https://caniuse.com/push-api)
- Contact Picker works on Chrome for Android only. — [caniuse ContactsManager](https://caniuse.com/mdn-api_contactsmanager)
- `.vcf` opens a save sheet on iOS (with UX caveats). — [HiHello](https://hihello.com/blog/dear-apple-lets-improve-contact-saving)
- WhatsApp inbound and in-window replies are free; voice media is retrievable via the Cloud API. — [Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing); [Meta media](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media)
- AI chatbot restrictions apply only where AI is the "primary (rather than incidental or ancillary) functionality." — [Meta Terms](https://www.facebook.com/legal/Meta-Terms-for-WhatsApp-Business-Platform)
- Manifest shortcuts work on Android WebAPK, not on iOS. — [web.dev](https://web.dev/learn/pwa/enhancements); [firt.dev](https://firt.dev/notes/pwa-ios/)
- Lock Screen, Control Center and Action-button controls are native (WidgetKit/App Intents); Shortcuts can be bound to the Action button or Back Tap. — [WWDC24 10157](https://developer.apple.com/videos/play/wwdc2024/10157/); [Apple Shortcuts guide](https://support.apple.com/guide/shortcuts/apd897693606/ios)

### Inferences
- Pull forward now (low effort, low risk): `.vcf` export; Android Contact Picker import; Android manifest shortcuts; Screen Wake Lock during recording; offline IndexedDB queue; Apple Shortcut deep-link recipe for iOS quick launch; account deletion.
- Pull forward with caveats: Web Push reminders (need a Home Screen install on iOS, a reliability fallback and Declarative payloads); a Telegram intake pilot (cheap, but lower reach); an in-PWA "ask about your people" assistant (no platform constraint; privacy and retention disclosures needed).
- Pilot soon, with policy guardrails: WhatsApp voice-note intake through a designated number, kept structured and capture-focused. Avoid an open-ended assistant persona in WhatsApp.
- Keep for native: true phone-book sync, one-press recording from the Lock Screen or Action button, on-device transcription, background or locked-screen recording, and reading GPS from library photos on Android.

### Gaps
- No source quantifies Home Screen install rates for iOS PWAs, which determine how many iOS users can receive push. Treat it as a key product metric to measure.
