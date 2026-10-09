# Design handoff: King of Names UI/UX

For: Claude Design. From: the build team (Clockworke Digital). Updated 7 October 2026.
Attach the `screens/` folder next to this file; every screen below has a screenshot there.

## 1. What we need from you

Improve the UI and UX of a working mobile web app before we wire it to the real backend. Every screen exists and runs with sample data, including the newer photo, business card and Ask AI features; we want it all to feel calm, premium and fast.

Please deliver:

1. **Revised screens** for every screen in section 5 (light and dark), at 390 × 844.
2. **Refined designs for the newer features** in section 7 (photos, business card scanning, Ask AI) and designs for the not-yet-designed states in section 6.
3. **Tokens** we can drop into code: colour roles in OKLCH for light and dark, type scale, spacing, radii, shadows, motion durations and easings (format in section 9).
4. **Component specs** for anything new or changed, with every state (default, pressed, focus, disabled, loading, error).
5. **A short rationale** per screen: what changed and why, tied to the principles in section 3.

HTML/Tailwind mockups are the most useful format for us; annotated images are fine too.

## 2. Product in one paragraph

A private "people memory" app for a company owner (Cameron) who meets hundreds of people a year across Dubai, Australia and Thailand. He taps one big button and says, for example, "Met Daniel Reyes at the rooftop bar at Soho House, runs a logistics company, birthday March 3rd, number is …". The app stamps GPS and time, transcribes the note, fills in a profile with AI, and he glances, fixes and saves. Later he searches by any word, or opens the map, taps a city and sees everyone he met there. A few invited people get their own private accounts. It is a PWA, installed to the home screen on iPhone and Android.

**Moments of use** (design for these, literally):

- Standing in a dim rooftop bar right after a handshake, phone in one hand, maybe a drink in the other, seconds before the next conversation. Capture must work one-handed and at a glance.
- In a hotel lobby in a city months later, scrolling the map to remember who he knows there before a meeting.
- In bright daylight outdoors. Both light and dark modes must read well; the app follows the system setting.

## 3. Principles (agreed with the client)

1. **Capture beats everything.** The record button is always one tap away; nothing competes with it on the home screen. Speed of capture is the product.
2. **One job per screen, reachable by thumb.** Primary actions in the lower half; reading in the top half.
3. **Names first.** A person's name is the largest thing on any screen that shows them.
4. **Fix, don't fill.** Review is a glance and a correction, not a form. Empty optional fields stay quiet.
5. **Discreet by default.** It holds personal details about people who don't know they're in it. Nothing showy, public-looking or shareable.

**Feel:** a quiet utility, in the spirit of Apple Notes and Things: light, clean, fast, out of the way.
**Must not feel like:** a corporate CRM (Salesforce, HubSpot): fields everywhere, pipelines, stages, dashboards, lead scores. People here are people remembered, not leads.

## 4. Fixed constraints

From the client brief; please design within these or flag clearly if you think one should change.

- Mobile-first at 390 px wide, must still be usable on desktop (currently a centred column, max ~576 px).
- **Bottom tab bar with four tabs: Capture, People, Ask, Map.** (The brief had three; Ask was added on 7 Oct so Ask AI is one tap from anywhere.) Settings sits behind an icon.
- One accent colour. The app is called King of Names; the name and accent must stay changeable in one config file, so don't bake the name into artwork.
- Light and dark mode follow the system; no toggle.
- Skeletons, not spinners, where content is loading.
- No agency branding inside the app.
- Safe areas for notched phones (content respects `env(safe-area-inset-*)`).
- Tap targets at least 44 px. WCAG 2.2 AA contrast. Respect reduced motion. Never colour alone for state.
- Tech: Next.js, Tailwind CSS 4, shadcn/ui on Base UI, lucide icons, **system font stack** (SF Pro on iPhone, Roboto on Android; chosen for native feel and zero download, so propose a web font only with a strong reason).

## 5. Current screens

The grey strip at the top of every screenshot ("Preview with sample data. Nothing is saved.") is mockup-only; ignore it.

| # | Screen | Screenshot(s) | What it does now |
|---|---|---|---|
| 1 | **Capture** (home) | `01-capture`, `01-capture-dark` | App name + settings icon; "1 note needs review" strip; big question "Who did you just meet?"; large round record button in the lower third; "Add manually" link. |
| 2 | Capture, recording | `02-capture-recording`, `-dark` | Heading becomes "Listening…"; timer "0:02 / 1:30"; a halo grows with voice level; a ring fills toward the 90 s cap; the location chip shows "Dubai Marina · within 12 m". Tap again to stop. |
| 3 | Capture, processing | `03-capture-processing` | "Got it." with four steps ticking: Saving the recording, Transcribing, Picking out the details, Finding the place. Then opens Review. Real target: under 10 s. |
| 4 | **Review** | `04-review`, `05-review-full`, `04-review-dark` | Name in large type; amber hint when the AI wasn't sure of the name; "Already met?" duplicate prompt (update existing vs save new); where met; small map with pin and "Change" city; date/time; notes; follow-up; phone; birthday (day/month/optional year); company and role; "+ Email" chips for empty fields; recording player and collapsed transcript. Sticky Discard / Save bar above the tab bar. |
| 5 | Discard confirm | `06-review-discard-confirm` | Alert dialog. |
| 6 | **People** | `07-people`, `07-people-dark` | Title + add button + settings; search; City / Country / Any time filter chips (native selects); list grouped by month; row = name, date, city and first line of notes. |
| 7 | People search | `08-people-search` | Search matches name, notes, where met, place and city, accent-insensitive. |
| 8 | **Profile** | `09-profile-full`, `-dark`, `10-profile-no-gps` | Back / Edit; big name; role and company; "Met 4 Oct 2026 · Alserkal Avenue, Dubai"; Call button (tel:); follow-up callout; notes; details list (birthday, email, "in your words"); map of where you met with GPS accuracy (or "city set by hand"); original recording and transcript; Delete at the bottom. |
| 9 | Add person | `11-add-person` | Same form as Review without the recording; stamped with current time and place. |
| 10 | Edit person | `12-edit-person-full` | Same form, "Save changes". |
| 11 | **Map**, cities | `13-map-cities`, `-dark` | Full-bleed map (a drawn stand-in; the real one will be Mapbox) with city clusters that merge when close ("Bangkok +2"); "Near me" button; bottom panel listing cities by count. |
| 12 | Map, one city | `14-map-city`, `-dark` | Map flies to the city; panel lists everyone met there, including people with a city but no GPS pin. |
| 13 | Map, person card | `15-map-person-card` | Tap a pin: name label on the map, panel shows name, place, date, notes and "Open profile". |
| 14 | Map, near me | `16-map-near-me` | Radius circle around the current position, 1 / 5 / 25 km segmented control, list sorted by distance. |
| 15 | **Settings** | `17-settings-full` | Account; invite codes (copy, new code); install steps for iPhone and Android; export CSV/JSON; plain-language privacy note; sign out; delete account. |
| 16 | **Card scanner** | `18-card-scanner` | Full-screen camera with a card frame; QR codes are read automatically; shutter photographs the card; Library picks a photo. Shown here in its "camera off" state (photo fallback). |
| 17 | Card result | `19-card-result-qr`, `-dark` | Bottom sheet listing what was read (name, company, role, phone, email, LinkedIn, birthday) and where it came from ("Read from the QR code" or "Read from the card"); Scan again / Add to note. |
| 18 | Review after a card | `20-review-from-card-full` | The card photo sits in Photos; fields that came from the card carry a small "From card" label. |
| 19 | Photo viewer | `21-photo-viewer` | Full-screen, dark; place, time and location source ("from phone GPS", "from the photo", or "No location saved in this photo"); Them / Card / Place switch; delete; previous / next. |
| 20 | **Ask** tab | `22-ask-tab` | Its own tab. Heading "What do you want to know about your people?", suggested questions, and a question box pinned above the tab bar with a mic and a send button. |
| 21 | People, question typed | `23-people-question-row` | When search text reads like a question, an "Ask AI" row appears above results and opens the Ask tab with that question. |
| 22 | Ask, thinking / answer / thread | `24-ask-thinking`, `25-ask-answer`, `-dark`, `28-ask-thread` | Skeleton while thinking, then a short answer, the people it used (tappable rows with a reason line) and follow-up questions; further questions stack into a thread; Clear empties it. |
| 23 | Tags on Review | `26-review-tags` | Relationship (Business / Personal / Both) and "How they could help" chips, marked "Suggested" when the AI chose them. |
| 24 | People, tag filter | `27-people-tag-filter` | Type and Tag filter chips; here filtered to Investor. |
| 25 | Card QR that is only a link | `29-card-link-only` | Most digital cards (Blinq, Popl, HiHello…) put only a profile link in the QR. The sheet saves the link and offers "Photograph the card" to get the details. |
| 26 | Permission for a photo of a person | `30-photo-permission` | Choosing "Them" asks "Do you have their permission?" before the camera opens; card and place photos skip this. |
| 27 | AI consent | `31-ai-consent` | Shown once, before the first recording: what goes to OpenAI, Anthropic and Mapbox, where data is stored, Not now / I agree. |
| 28 | Profile with meetings | `32-profile-meetings-full` | "Last met … · first met …" in the header, Save to contacts under Call, and a "Met 2 times" timeline at the bottom (newest first, with recordings). |
| 29 | Met again | `33-met-again` | "Met again" opens an inline note (type or record) stamped with now and the current place. |
| 30 | People, Coming up | `07-people` | A Coming up box above the list: follow-ups (overdue first) and birthdays in the next six weeks. |
| 31 | Map, trip mode | `34-map-trip` | "Trip" picks a city and dates; the map flies there and the panel says who you know, open follow-ups, birthdays during the trip, and people you also met there. |
| 32 | Settings, Claude and ChatGPT | `35-settings-connectors` | Off-by-default switch, connector link with copy, setup steps for Claude and ChatGPT, what's shared, connected assistants. Settings also gained My card (your own QR) and Import contacts. |
| 33 | Install prompt (iPhone) | `36-install-prompt-iphone` | A one-line prompt at the top of Capture in phone browsers: "Add King of Names to your Home Screen", with How and a close button. Hidden on desktop and once installed. |
| 34 | Install steps (iPhone) | `37-install-steps-iphone`, `-dark` | "How" opens an instruction sheet: Share (or ⋯ first in newer Safari), Add to Home Screen, keep "Open as Web App" on. Android shows Chrome's install prompt when it's offered, otherwise the menu steps. |
| 35 | Waiting to send | `38-capture-waiting-to-send` | A note recorded with no signal (or when the upload fails) stays on the phone: toast "Saved on your phone" and a dashed "1 note waiting to send" strip with Send now. Sends by itself once back online. |
| 36 | Offline page | `39-offline-page` | Any page other than Capture opened without a connection: "You're offline", you can still record, "Record a note". |
| 37 | Event mode, start | `40-event-start` | "Event mode" under the record button opens a sheet: what it does, a name for the event (defaults to e.g. "Friday evening"), Start. |
| 38 | Event mode, running | `41-event-live` | A green banner (event name, takes saved, End). Heading "Who's next?". Each tap saves a take straight away ("Take 2 saved"), no processing screen. |
| 39 | Event takes | `42-event-takes` | After End: every take with the name and one detail the AI picked out, its status (waiting to send, picking out the details, ready, saved, discarded), Review next and Review later. |
| 40 | Sign in | `43-sign-in` | Also the signed-out landing: app mark, "Remember everyone you meet.", username or email, password (show/hide), forgot password, create an account. |
| 41 | Sign up | `44-sign-up-errors-full` | Invite code (prefilled from an invite link), name, username, email, password; errors under each field, everything typed kept. |
| 42 | Forgot password | `45-forgot-password` | Username or email, then the same answer whether or not the account exists. |
| 43 | Review, recording not transcribed | `46-review-transcription-failed` | Amber notice with Try again; the recording plays below; Save waits for a name. |
| 44 | Review, details not picked out | `47-review-extraction-failed-full` | Notice, and the transcript opens so the details can be typed from it. (`?state=place-failed` shows the "set the city" notice.) |
| 45 | Empty People and Ask | `48-people-empty`, `49-ask-empty` | Before anyone is saved, both point to recording a first note. |

Photos also appear on the Capture screen (Card and Photo buttons beside the record button, `01-capture`), on Review and Profile as a photo strip with an "Add photo" tile that asks Them / Card / Place, and as profile pictures (initials when none) in the People list, profile header, map pins and the map person card.

### Known weaknesses we'd like you to tackle

- **Bottom chrome on Review/Edit** stacks the action bar on top of the tab bar (~130 px). Should the tab bar hide during review and edit flows?
- **Review gets long** when the AI fills many fields. Is there a more glanceable layout (e.g. a summary card with tap-to-edit fields)?
- **Capture home has a lot of empty space** above the button. Keep it calm, but is there a better use (e.g. a confirmation of the last saved person) that doesn't compete with recording?
- **The voice level halo** is subtle; recording state should be unmistakable in a dark bar.
- **Processing** could preview the review card (skeleton) instead of a checklist.
- **Capture now has three controls** (Card, Record, Photo). Check that the record button still clearly dominates and that Card vs Photo is obvious at a glance.
- **Initials avatars** make the People list busier than before. Tune size, tone and spacing so names still lead.
- **Map** at city zoom is empty in the stand-in. Please specify a Mapbox style direction (light and dark) that matches the palette, plus pin, cluster and selected-pin designs.
- **Desktop** is a single centred column. A list + detail split may serve desktop better; your call.
- **Settings** is one long scroll.

## 6. States not designed yet

Sign-in, failure, empty, loading and rate-limit states are now built in a plain first version (screens 37 to 45). Please design over them. Still to design:

- **Permissions**: microphone denied is only a toast today; location denied shows "Location is off. You can set the city next." on Capture; camera denied falls back to choosing a photo.
- **Rate limit**: today a toast ("That's 60 notes in the last hour. This one is saved on your phone and goes in about 12 minutes.") and the waiting strip.
- **Loading skeletons** exist for People, Profile and the Map (`app/(app)/*/loading.tsx`) but only flash with sample data.
- **Toasts**: saved, updated, deleted, discarded, copied.

Add `?state=empty` to People or Ask, or `?state=transcription-failed`, `extraction-failed` or `place-failed` to Review, to see those states in the preview.

## 7. New features: built in the mockup, please refine

Photos, business card scanning and Ask AI now work in the mockup (screens 16 to 22) with simulated AI. They are approved for the build. Please refine them against the principles; they must not slow down the 5-second voice capture.

### 7.1 Photos with geotagging

Three kinds of photo per person: **them** (becomes their profile picture), **their business card**, and **the place or moment** (venue, event, group).

How it works now:

- **Photo** button beside the record button opens the camera directly; photos attach to the current note, before, during or after recording, and show as a small stack under the heading.
- Review and Profile have a photo strip; the "Add photo" tile asks Them / Card / Place first, then opens the camera or library.
- Location rule: a photo taken in the app gets the phone's GPS; a library photo only gets the GPS saved inside it; otherwise "No location saved in this photo". Phones often strip location from library photos, so the "no location" state is common and must look normal, not broken.
- Times show in local time where the photo was taken.

Please design: the photo strip and tile sizes, the kind label on thumbnails, the "Add photo" choice, the viewer, profile pictures and initials everywhere they appear, photo map pins, and the empty "no photos" state.

### 7.2 Business cards: QR and photo

How it works now:

- **Card** button beside the record button opens the scanner: live camera with a card frame. A QR code is read automatically (vCard, MECARD, phone, email, WhatsApp link, digital-card or LinkedIn link); the shutter photographs the card for the AI to read. Where the live camera isn't available, it falls back to "take a photo" and still reads any QR in the photo.
- A result sheet lists what was read and its source before anything goes into the note.
- On Review, printed details win over spoken ones for phone, email, company and role; the card's name replaces the spoken one only if that was missing or uncertain. Fields from the card carry a "From card" label; the card photo joins the note's photos.

Please design: the scanner (frame, detection feedback, the moment a QR is found, poor-light and blurry states), the result sheet, the "From card" provenance treatment on Review, and the "nothing readable" and camera-denied states.

### 7.3 Ask AI

Ask questions in plain language about your own people, typed or spoken, on the **Ask tab**:

- "Who did I meet in Dubai who works in shipping?"
- "Whose birthday is this month?"
- "What did I note about Omar?"
- "Who should I see while I'm in Bangkok?"

How it works now: the Ask tab opens on suggested questions and a question box pinned above the tab bar (typing, or the mic for voice). Each answer shows a skeleton while thinking, then a short answer, the people it used as tappable rows with a reason line, and follow-up questions; answers stack into a thread with a Clear button. Typing a question into People search offers an "Ask AI" row that carries it to the Ask tab. It says plainly when nothing matches and never invents people.

Please design: the Ask tab's empty state, the voice-question state, the answer layout and thread, no-results and error states, how a long answer with many people stays scannable, and the Ask icon in the tab bar.

### 7.4 Tags: relationship and how they could help

Every person can carry a **relationship** (Business, Personal or Both) and any number of **"how they could help" tags**. Starter tags are Investor, Client, Partner, Supplier, Connector, Advisor, Talent and Friend, and users add their own (e.g. "Logistics", "Bangkok intro").

How it works now:

- The AI suggests the relationship and tags from the voice note; on Review they show a small "Suggested" label until changed (`26-review-tags`). Tap a chip's × to remove, tap "+ Tag" to add one of five offered tags, or "New tag" to type one.
- Profiles and the map person card show the relationship as an outline pill and tags as tinted chips.
- People has Type (Business / Personal) and Tag filters (`27-people-tag-filter`); search also matches tags.
- Ask AI understands them: "Who are my investors?", "my personal contacts in Phuket" (`28-ask-investors`).
- Settings lists tags in use with counts.

Please design: the tag editor on Review (it must stay a glance, not a form), the tag display on profile, list rows (should rows show tags?), map pins or filters by tag, and tag management in Settings (rename, merge, delete).

### 7.5 Recommended features, now in the mockup

- **Save to contacts** on every profile: a contact file with a "Met at … on …" note, their photo and tags. iPhone shows "scroll down and tap Create New Contact" because tapping Done discards it.
- **Met again**: every meeting with a person on a timeline; recording from a profile adds a meeting instead of overwriting notes (screens 28, 29).
- **Coming up** on People: birthdays and follow-ups, overdue first. This is also the fallback for push reminders, which iOS only delivers to installed apps (screen 30).
- **Trip mode** on the Map (screen 31).
- **My card**: your own QR in Settings; the details sit in the code, so it scans without internet.
- **Import contacts** from a .vcf file or, on Android, the phone's contact picker, with a preview first.
- **AI consent** before the first recording (screen 27) and a **privacy pledge** in Settings.
- **Claude and ChatGPT connector** (screen 32): people can ask the assistant they already use about their own contacts. Read only, off by default.

Please design: the timeline (does it belong higher on the profile?), Coming up (is the People tab the right home, or the Capture screen?), the trip panel, the contact-import preview, the consent sheet, and the connector settings, including a "connected assistants" list with disconnect.

### 7.6 What the market research changes for design

The October 2026 market research (256 sources; full report at `docs/research/market-research-2026-10.md`) compared 30+ personal CRMs, card apps, voice tools and "where we met" apps, and the privacy rules in the UAE, Australia and Thailand. What matters for design:

- **Where and when you met is the differentiator.** Leading CRMs (Mesh, Dex, folk) don't stamp the meeting place, and the small apps that do are iOS-only or in beta. Let the place and date carry weight on profiles, the map and Ask ("who did I meet in Bangkok?").
- **Card scanning and AI search are now expected**, so they must feel faster and more trustworthy than rivals, not just present. Mesh's own docs warn its assistant can invent people; our answers must always show the people they used.
- **Trust is the price of entry.** UpHabit shut down, Clay became Mesh, Humane deleted everything. Make export and account deletion easy to find, and give the privacy pledge a visible home: no AI training on your notes, no enrichment or scraping, no face recognition.
- **Consent before AI.** Design an explicit screen before the first AI use and a short two-layer privacy notice naming the providers (OpenAI and Anthropic, processing outside the UAE, Australia and Thailand) and where data is hosted (Singapore). Also a plain public page for "if you've been saved in this app".
- **Photos of people are the legal hot spot.** In the UAE, taking or keeping someone's photo without consent is a crime (Cybercrime Law Art. 44). Built: a "Do you have their permission?" step before "Them" photos (screen 26). Place and card photos stay one tap.
- **Digital-card QR codes are usually just a link.** Built: the link is saved and "Photograph the card" fills the details (screen 25).
- **Arabic and Thai.** Names and notes will mix scripts and right-to-left text; check every name-bearing component with Arabic and Thai names.
- **Offline is normal at events.** Design the "3 notes waiting to send" badge and the retry state.
- **iPhone install coach.** Tie "Add to Home Screen" to what it unlocks (reminders, offline notes), since iOS has no install prompt.
- **Likely next features** (recommended, not yet approved): "Save to phone contacts" with a "met at … on …" note; birthday and follow-up reminders with an in-app fallback; a trip mode showing who you know in the city you're heading to. Leave room for them.
- **Avoid:** face recognition or grouping, contact enrichment, "overdue" scores or pipeline language, and bulk messaging.

### 7.7 Installable app and offline (built for real)

The install prompt, the iPhone instruction screen, "waiting to send" and the offline page are built for real, not mocked (screens 33 to 36). The app also has a Home Screen icon (`public/icons/`, from `scripts/build-icons.mts`) and long-press shortcuts: Record a note, Scan a card, Ask.

Please design: the app icon (ours is a placeholder pin on green), the install prompt and steps (an illustration of Safari's Share button would help most people), the waiting-to-send strip and its sending state, and the offline page. Keep the record button in view on a 659 px tall iPhone screen with Safari's toolbars: today the Capture heading tightens on short screens to make room.

## 8. Content and voice

Plain, brief, warm without being cute. Second person ("Who did you just meet?"). No exclamation marks, emoji or CRM jargon (lead, contact record, pipeline, opportunity). Dates as "4 Oct 2026"; birthdays as "14 November" or "2 July 1979". Names from many languages and scripts must render well (e.g. Thai, Arabic, accented Latin).

## 9. Current design tokens (for reference)

Defined in `app/globals.css`; brand values in `lib/config.ts`.

| Role | Light | Dark |
|---|---|---|
| Background | `#fafaf9` | `#0c0c0b` |
| Foreground | `oklch(0.145 0.004 170)` | `oklch(0.985 0.004 170)` |
| Primary (accent) | `#1f6f5c` | `#5fbfa4` |
| Muted surface | `oklch(0.97 0.004 170)` | `oklch(0.269 0.004 170)` |
| Muted text | `oklch(0.49 0.006 170)` | `oklch(0.708 0.004 170)` |
| Border | `oklch(0.922 0.004 170)` | `oklch(1 0 0 / 10%)` |
| Destructive | `oklch(0.577 0.245 27.3)` | `oklch(0.704 0.191 22.2)` |
| Warning (low-confidence name) | Tailwind amber-500/700 | amber-400/300 |
| Map water | primary 7% mixed into muted | same |

- Neutrals are tinted very slightly toward the accent hue (170).
- Radius base 0.625 rem; inputs and buttons 12 px (`rounded-xl`); panels and cards 16–24 px.
- Type: system UI font. Names 26–40 px semibold, tight tracking. Body 15–17 px. Labels 14 px muted. No fixed scale yet; please propose one (ratio ~1.125–1.2).
- Touch sizes: buttons 44 px (`touch`) and 48 px (`touch-lg`), icon buttons 44 px.
- Motion: 150–250 ms for state changes, map flights 700 ms ease-out-quart; reduced motion turns animations off.

Please return token changes as a table like the one above (OKLCH preferred) so they map onto the same role names.

## 10. Out of scope (don't design)

Push notifications (the in-app Coming up list stands in for now), WhatsApp or Telegram voice-note intake, native App Store / Play Store apps, sharing contacts between users, team features, billing. Keep layouts flexible enough that a reminders badge and a WhatsApp source label could be added later.

## 11. Where things live in code (for our implementation)

| Area | Files |
|---|---|
| Tokens, theme | `app/globals.css`, `lib/config.ts` |
| App shell, tab bar, headers | `app/(app)/layout.tsx`, `components/tab-bar.tsx`, `components/screen-header.tsx` |
| Capture | `components/capture/capture-screen.tsx`, `components/capture/record-button.tsx` |
| Review, add, edit form | `components/person-form.tsx`, `app/(app)/capture/review/page.tsx` |
| People list and search | `components/people-list.tsx` |
| Profile | `app/(app)/people/[id]/page.tsx`, `components/original-note.tsx` |
| Map | `components/map/map-screen.tsx`, `components/map/mini-map.tsx` |
| Settings | `components/settings-screen.tsx` |
| Photos | `components/photos/*` (strip, viewer, picker, avatar) |
| Card scanner | `components/capture/card-scanner.tsx`, `lib/cards/*` |
| Ask AI | `components/ask/*`, `app/(app)/ask/page.tsx` |
| Tags | `components/tags/tag-editor.tsx`, `lib/tags.ts` |
| Meetings, Coming up, trip | `components/meeting-timeline.tsx`, `components/coming-up.tsx`, `components/map/map-screen.tsx`, `lib/upcoming.ts` |
| Contacts (save, import, my card) | `components/save-contact-button.tsx`, `components/settings/*`, `lib/contacts/*` |
| Claude / ChatGPT connector | `app/api/mcp/route.ts`, `lib/mcp/people-tools.ts` |
| Base components | `components/ui/*` (shadcn base-nova) |
| Product context | `PRODUCT.md` |

Screenshots are regenerated with `npm run screenshots` while the dev server runs.
