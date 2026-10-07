# Own the where-and-when of meeting people

**PeopleMap market research and product review, October 2026.** This report draws on research notes compiled on 7 October 2026. Prices, product status and app-store figures are as checked on that date unless stated. Numbers in square brackets are citations to the source list in section 11. The legal sections are practical research, not legal advice.

## 1. Executive summary

- **The market's middle is empty.** Funded personal CRMs (Mesh, Dex, folk) build networks from inboxes and calendars or serve sales teams, and are only now adding mobile capture. Card apps (Blinq, CamCard, Popl) are drifting toward event lead capture for sales teams. Voice tools and wearables (Plaud, Granola, Bee, Omi) remember meetings, not people. No product in the notes combines one-tap voice capture, an automatic GPS and date stamp, LLM-extracted fields, a clustered map with a city picker, photos of the person, card and place, and WhatsApp intake [1][2][3][4][5].
- **The closest rivals are small or adjacent.** Dex already turns WhatsApp and SMS messages, including voice notes, into contacts, and scans cards offline. But its map shows contacts' addresses rather than where you met them, and only on web and desktop [2][6][7]. YourPond has voice capture and a city-clustered map, but of where people *live*, and its free tier stops at 25 contacts [8][9]. Quis, MetMe and Remember Names do map where you met, but have 1 to 24 US App Store ratings each, are mostly iOS-only, or are still in beta [10][11][12]. A where-met map is not a moat by itself. The moat is capture speed plus multilingual extraction (Arabic and Thai, which Apple Intelligence does not support), cross-platform reach and messaging intake [13].
- **Trust is the price of entry.** In this category, apps die and data disappears. UpHabit closed in April 2026; Clay was acquired and renamed Mesh; Limitless gave EU and UK users two weeks to export before deletion; Humane deleted all customer data [14][15][16][17]. Export (vCard and CSV), account deletion, and a "no training, no enrichment, no face recognition" pledge are now baseline expectations, not extras.
- **The three prototypes need sharper positioning.** Card scanning is a commodity (Dex, folk, Mesh, Covve, CamCard and Contacts+ all have it), and most digital-card QR codes carry only a profile URL [6][18][19][20]. "Ask AI" over your own contacts is table stakes (Mesh Nexus, Dex, folk, Nametrace, Revere). But nobody documents answering "who did I meet in Bangkok?" from a where-met geotag [21][22]. Photos of the person set PeopleMap apart from the funded CRMs. In the UAE, though, photographing or keeping images of someone without consent is a crime under Cybercrime Law Article 44 [23].
- **The PWA can ship most of Phase 2 now.** Reminders work with a Home Screen install on iOS (Declarative Web Push from iOS 18.4) and need an email or in-app fallback. Other items are ready today:
  - vCard export, with a hint for iOS's confusing save sheet;
  - an offline capture queue;
  - an Apple Shortcut for quick launch;
  - location stamped with the browser's Geolocation API, because EXIF GPS is stripped from photos uploaded on both iOS and Android.

  WhatsApp intake costs nothing in Meta fees for inbound messages and in-window replies, and is allowed if the bot stays structured. OpenAI's `gpt-transcribe` costs $0.0045 a minute, so AI costs about $1 to $3 per 1,000 notes [24][25][26][27][28][29].
- **The legal risk sits in photos, location and offshore AI, not in contact notes.** The UAE PDPL is in force but has no Executive Regulations and little enforcement. Its personal-use exclusion is narrow and its biometric definition names "facial images" [30][31][32]. Thailand allows legitimate interests but requires notice when data comes from other sources, and has been fining companies since 2024 [33][34]. In Australia, a small operator is probably exempt from the Australian Privacy Principles, but the statutory privacy tort (from June 2025) applies to everyone [35][36]. OpenAI processing happens offshore in every case.
- **Pricing has a clear band.** Solo plans cluster at $8 to $12 a month, or $50 to $120 a year. Users complain about being pushed into team tiers, about paywalls on core features, and about $12 a month being "too expensive" [37][38][39][40][41].

## 2. Competitor profiles

### 2a. Personal CRMs and relationship managers: three funded leaders, a fragile long tail

**Mesh (formerly Clay): alive, acquired, rebranded.**
- **Status:** Automattic bought Clay in June 2025 [42][43]. It was renamed Mesh (me.sh) on 20 March 2026 [15]. A third-party claim of a 2024 rename conflicts with the official post [44]. Android launched on 12 August 2026 [1].
- **What it does:** builds an "AI-friendly" network automatically from email, calendar, address book, LinkedIn, X and iMessage. Runs on macOS, Windows, web, iOS and Android [45][46].
- **Capture:** card scanning (scans can be saved to the Photo Library) and "photo-based contact creation" [46][19]. A hands-free voice mode is experimental, and an improved scanner is in development [1].
- **Location:** city, state and country fields only; no map was verified [47].
- **Reminders and enrichment:** reconnect reminders, birthdays and "life updates" (job and location changes, news mentions) on all plans [37].
- **AI search:** Nexus, an opt-in OpenAI-powered assistant. It can answer who "has been to a specific place". Mesh's own docs warn it can hallucinate [21].
- **Messaging:** imports WhatsApp contacts and drafts messages through Beeper; there is no capture bot [1].
- **Export and deletion:** an emailed CSV, with licensed fields left out. Accounts can be deleted, but backups are kept for 90 days [47][48].
- **Privacy:** SOC 2 Type II, AI features opt-in, no training on user data. Hosting region is not stated [48].
- **Complaints:** missing notes, broken Nexus, failed iMessage imports, duplicates, and regret over a $120 plan. One reviewer asked for city labels and travel notifications on the map [49]. iOS rating 4.4 from 764 ratings [45].

**Dex: alive, and the closest to PeopleMap's core loop.**
- **What it does:** a keep-in-touch personal CRM on web, iOS, Android, macOS and Windows, plus a Chrome extension, an MCP server and a REST API [50].
- **Capture:** users text Dex on WhatsApp or SMS (plain text, voice notes or photos), and it creates or updates the contact and parses reminders. It sends a morning digest, plus an end-of-day recap that asks about new connections [2].
  - Speech goes to Deepgram and text generation to OpenAI [51].
  - The card scanner pre-fills an editable form, saves the card image, scans cards one after another, and works offline [6].
- **Location:** a map of contacts' stated addresses (filled from LinkedIn), on web and desktop only, plus text and distance filters. Dex does not stamp the meeting place [7].
- **Reminders and enrichment:** keep-in-touch cadences and birthdays. Enrichment comes from LinkedIn sync, EnrichLayer and Bright Data [51].
- **AI search:** questions by text or WhatsApp ("who did I meet at the … event"). MCP access is on the Professional plan [2][52].
- **Sync and export:** two-way contact sync. Export is CSV only; no vCard export was found [38].
- **Privacy:** US Google Cloud and Firebase hosting, AES-256 encryption, "never sell". AI vendors are OpenAI, Groq, Deepgram and OpenRouter [51].
- **Complaints:** lag and sync failures, a LinkedIn sync its own FAQ calls fragile, a "non-functional map view" (Nov 2024), no VoiceOver support, and a price called too high at $12 a month [53][54][40]. iOS rating 4.4 from 260 ratings [55].

**folk: alive; a team CRM that went mobile in mid-2026.**
- **Status and platforms:** a CRM for small teams, priced per member. "Contacts by folk" for iOS and Android launched on 16 July 2026 [18][56].
- **Capture:** an AI card scanner (31 July) and talk-to-text notes (25 August). No location, map or offline features are mentioned [18][56].
- **Reminders:** a Follow-up assistant and Tasks [18].
- **Enrichment:** credits (500 a month on Standard) and phone-number enrichment (1 October) [57][18].
- **AI search:** "ask folk a question", plus MCP [56].
- **WhatsApp:** syncs chats, but there is no capture bot [57].
- **Privacy:** built in France, data hosted in Europe (hosting migration dated 24 September 2026) [58][18].
- **Complaints:** G2 rating 4.5 from 343 reviews. The long-running complaint was "no mobile app", fixed in July 2026; email sync problems also come up [59].

**Covve personal CRM: alive, but no longer the company's focus.**
- **Status:** the homepage now leads with card scanning and team lead capture, and "personal CRM" appears only in the footer [60]. The iOS app is still listed, but the date of its latest version is unconfirmed [61].
- **What it does:** a mobile-only contact book with fast card OCR, follow-up reminders, career news from 150+ sources, an "AI assistant via email" and offline access [61]. Voice capture exists only in the team product, Covve Scan [60].
- **Privacy:** optional end-to-end encryption with a 9-word key; lose the key and the data is unrecoverable [62].
- **Complaints:** duplicates when syncing between iPhone and iPad, field-mapping errors and price [63].

**Monica: alive, open source, mid-rebuild.**
- **Status:** the stable release is v4.1.2 (May 2024). A ground-up "Monica v3" is promised before the end of 2026 [64][65].
- **What it does:** web-only, with no voice capture, card scanning or AI. It handles birthday reminders, photo uploads and vCard/CardDAV [64].
- **Privacy:** "no model trained on your contacts" and no enrichment. But the hosted database is not encrypted at rest beyond passwords [66][67].
- **Complaints:** users praise its ethos and criticise stagnation and clunkiness [68].

**YourPond: alive; the closest consumer analogue.**
- **Status:** an iOS app by a solo developer, launched 1 May 2025; v2.3 shipped in early October 2026. Rated 5.0 from 29 ratings [69].
- **Capture:** the "Describe Your People" voice feature (iOS) or typed text, from which it extracts names, locations, jobs and relationships [8].
- **Map:** a global map of where contacts *live*, clustered by city, for checking "who's there" before a trip. It also has photos, birthdays and QR exchange [8].
- **Gaps:** no card OCR and no WhatsApp. It deliberately has no email or LinkedIn sync [9].
- **Privacy:** no selling, no ads, no AI training [69].

**BlaBlaNote: alive (Spain); the closest business-side analogue.**
- **Capture:** voice notes on iOS, Android, a browser extension and a desktop recorder. Pro adds WhatsApp and phone-call notes, plus Telegram forwarding [70][71].
- **AI:** transcription in 12 languages, summaries, tasks, contact detection (Pro), Event Mode, a QR card, and MCP access to your network from Claude or ChatGPT [70][71].
- **Gaps:** no map, geotag or card scanning was found.
- **Privacy:** hosted on AWS; the AI provider "deletes your data after processing" and does not train on it [70].

**Nametrace: alive (Switzerland); the closest on "place and date met".**
- **Capture:** text or voice notes; "capture place, date, topics and agreements"; a card scanner [72][73].
- **Other features:** natural-language questions about your network, "Smart Care" reminders, enrichment through web-research credits, vCard export and one-click account deletion. Runs on web, iOS, Android and Mac, in English and German [72][73][74].
- **Privacy:** hosted in Switzerland (AWS Zurich); the App Store privacy label lists precise location and audio. No map is documented, and it is unverified whether "place" comes from GPS [74].

**Smaller living players.**
- **Dextr:** local-first iPhone, iPad and Mac app with "where and when you met" fields. Card scanning costs $14.99 a year [75].
- **Contacts+:** a sync and enrichment utility. Its AI card scanner shows the result for confirmation before saving, and it accepts card photos from ChatGPT, Claude or Grok via MCP [76][19].
- **Cloze:** now an "AI-powered real estate platform", though the individual Pro plan remains [77][78].
- **Revere:** iOS app rated 4.7 from 110 US ratings. It records how you met, location, photos, voice dictation and reminders, and has "Ask Revere" AI. Users complain it "will not load without internet access" [79][22].
- **Notion templates:** about 250 personal-CRM templates on Notion's marketplace, mostly free. They fail at mobile capture and reminders [80][81].

| Product | Status in Oct 2026 | Note |
|---|---|---|
| UpHabit | **Shut down** 9 Apr 2026 | The apps still run but are unmaintained; users were told to export. The date comes from competitors [14][82] |
| Garden | **Abandoned** | Last update June 2020 [83] |
| Mogul | **Stale** | Last update January 2024 [84] |
| Fabriq | **Likely defunct** | Domain does not resolve; unconfirmed [85] |
| Nat | **Low visible activity** | Footer still says © 2022 [86] |
| Moments | **Pivoted** to a general AI assistant (Apr 2026) | Per a competitor [82] |
| FollowUp / Nouri | **Pivoted** | Email reminders only / event ticketing [85] |
| Kin, Bond, Hippo | **Unknown** | No 2026 source found |

### 2b. Business card and digital card apps: scanning is a commodity, and value is moving to sales lead capture

| Product | Status and focus | Capture: OCR, languages, voice, location | Follow-up, enrichment, AI, messaging, sync | Privacy | Notable complaints |
|---|---|---|---|---|---|
| **CamCard** (INTSIG) | Alive; rebranded around an "AI Business Assistant"; iOS rating 4.7 from ~90K ratings [87] | Claims "99.99%" accuracy; lists **Arabic and Thai**; voice-to-text with AI summaries; location collected per privacy label, but no map [87] | VCF/Excel export, Google and Outlook sync; Business edition has notes and CRM sync; shares cards *out* via WhatsApp only [88][89] | ISO 27001/27701; privacy label shows usage data used for tracking [89][87] | OCR getting worse (misread names), pop-ups, AI slowing edits, paywalled sync [90][91] |
| **Blinq** (Victoria, Australia) | Alive; 4.9 from 132K ratings; claims 4M+ users [92][93] | Paper-card scanner (Premium+); **AI Notetaker** records or takes voice memos after a meeting in 99+ languages, works offline, links notes to the contact [3][94] | Follow-ups, enrichment, 20+ CRMs, CSV; MCP search over notes [39][3] | Audio "never used for AI model training"; SOC 2 Type II; audio purged within 30 days of deletion [3][95] | Solo users pushed to Business tier for Zapier; sync and crash issues [92] |
| **HiHello** | Alive | Bulk "stack" scanning; AI plus **human** transcription [96][97] | Enrichment add-on; Google and Outlook sync [98] | Human workforce reads cards [96] | Few found |
| **Popl** | Alive; now an "AI-powered GTM platform" for events [99] | Badge scanner; voice recording of meetings; event maps for navigation | Apollo/RocketReach enrichment; AI follow-up emails [99] | SOC 2 Type 2 | NFC failures, hidden costs [100] |
| **Covve Scan** | Alive; team lead capture | Claims 96% accuracy; 60+ languages including **Thai, but not Arabic**; offline; voice capture [101][102] | Exports to phone contacts and Excel; CRM add-ons [103] | ISO 27001, GDPR [60] | Fields land in the wrong place; can't scan several cards at once [63][104] |
| **Wave Connect** | Alive; site and docs in Arabic [105] | AI scanner; offline mode on Enterprise [106] | Reminders, automated follow-ups, enrichment credits [107] | SOC 2 Type II | — |
| **ScanBizCards** | Alive, independent (US) | OCR plus paid human transcription; 19 languages [108] | Address-book sync, CSV | Humans read cards | — |
| **Linq** | Company pivoted to an iMessage API ($20M Series A, Feb 2026); card app still sold [109] | — | — | — | — |
| **ABBYY BCR** | **End of life** on Android (Sept 2023); iOS sync terminated [110] | — | — | — | — |
| **Tapt, Haystack** (AU), **V1CE** (UK), **Mobilo** | Alive; NFC and QR cards with scanners [111][112][113][114] | Card, QR and badge scanning | Enrichment and CRM sync | — | — |
| **Eight / Sansan** (Japan) | Alive | 99.9% accuracy via AI plus human operators [115] | Job-change alerts [116] | Thousands of human operators | — |
| **CardDrop** | Alive; aimed at real-estate agents | Text a card photo to a number [117] | Natural-language search, reminders, Google Contacts, vCard | Deletes card images after 90 days | — |
| **NeverDrop, AI CardVault, Leadnics** | New AI capture apps | Card OCR plus voice notes [118][119] | CRM sync, AI follow-ups | — | — |
| **UAE NFC resellers** (e.g., Jaab NFC, Emeron) | Local resellers | English/Arabic RTL profiles; no scanning leader [120][121] | — | — | Low-quality sources |

Across the 17 card apps reviewed, none showed WhatsApp intake (CamCard only shares cards *out* via WhatsApp), a map of where you met, a city filter, birthday fields, or a photo of the person rather than the card [89][3][101].

### 2c. Voice capture, wearables, OS built-ins and niche "where we met" apps

**Voice-first AI capture tools. They structure meetings, not people.**

| Product | What it does | People-memory relevance | Privacy | Complaints |
|---|---|---|---|---|
| **Voicenotes** | Transcription and AI recall on phone, watch and desktop [122] | No contact fields; WhatsApp listed as a Pro integration (direction unverified); MCP | "Never used to train AI"; SOC 2 | — |
| **Plaud** (app + NotePin S) | Press-and-hold recorder; 112 languages [4] | Summaries and speaker labels; no contacts; "Ask Plaud" | Location collected per privacy label | "Not worth nearly $400"; AI features weaker than ChatGPT [123] |
| **Granola** | Meeting notes; Apple Watch app (July 2026) captures in-person meetings without taking out the phone [124] | Chat with notes; no people records | Deletes audio; SOC 2 [125] | — |
| **Otter, Notion AI Meeting Notes, Mem 2.0** | Meeting transcription and AI chat [126][127][128] | Notion requires consent from all participants [127] | — | — |
| **AudioPen, Cleft, Letterly** | Fast dictation with on-device or offline options [129][130][131] | Action button, widgets, CarPlay (Cleft) | AudioPen deletes audio within 48 h | — |
| **Keep AI, LynkIt, NexaLink, NetNote** (indie voice-to-contact) | Voice notes become structured contacts | Keep AI: names, dates, follow-ups, birthdays, card scan, all on device. **LynkIt: geotag plus interactive map**, vCard. NetNote keeps the recording [132][133][134][135] | Mostly on-device | Negligible traction (a handful of ratings); LynkIt last updated March 2025 |

**AI wearables are consolidating into Big Tech and attracting backlash.**
- **Bee:** Amazon bought it (July 2025). It is US-only at $49.99. A press-and-hold button makes a voice note, and the audio is discarded after transcription, so you can't play it back to check [136][137][138].
- **Limitless:** Meta bought it, and pendant sales stopped on 5 December 2025. The service ended in the EU, the UK and five other markets, with two weeks to export [16][139].
- **Humane:** dead (February 2025), with all data deleted [17].
- **Still selling:** Omi ($129, always-on) [140], Pebble Index 01 (a hold-to-talk ring, $75 to $99, on-device) [141] and Sandbar Stream (push-to-talk ring) [142].
- **Meta glasses:** they draw backlash over the I-XRAY face-doxxing demo, a "Name Tag" face-recognition plan with a leaked memo about launch timing, and bans in New York and England & Wales courts. Friend's subway ads were defaced with "surveillance" graffiti [143][144][145][146].
- **The lesson:** intentional, after-the-meeting narration is the socially acceptable pattern.

**OS built-ins capture faster, but still record no meeting context.**
- **Apple, iOS 27 (shipped 14 September 2026):**
  - "Siri AI" with personal context is a waitlisted English beta in eight regions, and the UAE is not one of them [147][148].
  - Visual Intelligence can turn photographed business cards into contacts [149][148].
  - Apple Intelligence does not support Arabic or Thai, so UAE users running their iPhone in Arabic lose it [13][150].
  - The Journal app logs places and nearby contacts but never ties them to a named person [151].
  - Third-party apps need an Apple-approved entitlement to read or write the Contacts Notes field [152].
- **Google:**
  - A Gemini connector for Contacts can find, add and edit contacts and remind about birthdays. It is reported as US-only, English-only and limited to Gemini Spark [153][154].
  - Google Contacts has had birthday reminders since 2023 [155].
- **Samsung** dropped business-card scanning from its Contacts app [156]. **Microsoft Lens** was retired in 2025 [157].
- **What no platform has:** a "where or when we met" field, or a map of contacts by meeting place [158][154].

**Niche where-met, map and name-memory apps. The concept has been tried many times; none has broken out.**

| App | Platforms, price, traction | Where-met / map | Other | Gaps |
|---|---|---|---|---|
| **Quis** | iOS + Android; free; 4.6 from 10 ratings [10] | Auto-records "the place and the moment you met"; map by meeting place, home address or phone-number country | AI card scan in about 1.5 s; two-way contact sync; vCard; local-only, no account [5] | No voice capture or reminders yet ("upcoming"); explicit city picker unverified |
| **MetMe** | iOS 26+, iPhone 15 Pro+; free TestFlight beta [11] | Map of where people were met | Speak or type; on-device Apple Intelligence extraction in under 5 s; writes to iOS Contacts | Not on the App Store; no Android; no Arabic or Thai |
| **Remember Names** | iOS + Watch; free + in-app purchases ($79.99 lifetime); 4.3 from 24 ratings; last update Aug 2025 [12] | Map with clustering; **reminders when you return to where you met** | Up to 10 photos; recorded name pronunciation; quizzes | No voice notes or AI extraction |
| **GEOnameWizard** | iOS; $7.99; 4 ratings [159] | Where met, "Nearby" view, map | Photos, reminders, JSON export | Tiny |
| **Remet, Known Names, People (Hidden Spectrum)** | iOS; 1 rating each, or unverified [160][161][162] | GPS read from photos; search by location; GPS "current event" | On-device | Tiny or status unknown |
| **Connecti5** | iOS, Android, web; prices in INR [163] | Private map with 1/5/10 km radius filters | "Ask My Network" AI search (including Hinglish) [164] | Aimed at India; zero Capterra reviews |
| **Rememorate** | iOS + Android; free (50 contacts) to $29.99/yr [165] | Search by map location and the date and time met | Photo-first | Status unverified |
| **Face Sherlock AI** | iOS (July 2026) [166] | — | **On-device face matching** against a private face library | A legal red flag (see section 8) |
| **Sidewalk, Contacts Map** | iOS [167][168] | Map where contacts **live**, not where you met | — | — |

## 3. How the three new prototypes compare

### 3.1 Geotagged photos of the person, card and place

**Who already does it, and how well.**
- **Funded CRMs:** none documents a "take a photo of the person" step. Mesh avatars come from connected sources [46]. Dex accepts photos by WhatsApp but has no confirmed person-photo field [2]. Monica allows uploads [64], and YourPond has profile photos [8].
- **Small name-memory apps:** here the "photo plus place plus time" pattern does exist.
  - Remember Names: up to 10 photos, a clustered map and location-triggered recall [12].
  - Remet: reads GPS from imported photos and crops faces [160].
  - Rememorate: photo-first, searchable by map location and date met [165].
  - None has more than a few dozen ratings.
- **Card images:** Dex keeps the card picture on the contact [6]. Mesh can save scans to the Photo Library [19]. CardDrop deletes card images after 90 days [117].
- **Place photos:** no competitor ties a photo of the *place* to the meeting.
- **Face matching:** Face Sherlock AI shows "search by face" is already being shipped in a personal-CRM wrapper [166].

**What PeopleMap should do differently.**
- **Make place and card photos the default, and the face photo a deliberate, consented extra.**
  - The place photo is a unique memory cue and low legal risk. The card photo is the lowest-risk data in the app [169][33].
  - A face photo taken without consent is exactly the conduct UAE Cybercrime Law Article 44 describes [23].
  - Add an "I have this person's permission" checkbox, off by default for UAE users.
- **Stamp location from the capture event, not from EXIF.** iOS strips GPS from photos uploaded through a file input (camera captures always), and Android hides photo location from web pages [26][170].
  - Read the location with `navigator.geolocation` when the user taps record, and attach that fix to every photo taken in the same session.
  - For photos picked later from the library, offer a manual pin.
- **Never send person photos to OpenAI.** There is no product need. OpenAI's usage policy bars building "facial recognition databases without data subject consent", and its vision models are trained to refuse "who is this" requests [171][172].
- **Never add face recognition, face search or auto-grouping by face** (section 8).
- **Embed the photo in the vCard export** (the `PHOTO` field), so it survives if the user leaves [25].

### 3.2 Card scanning: live QR decoding plus LLM card reading

**Who already does it, and how well.**
- **Card scanning is everywhere:**
  - Dex: an editable pre-filled form, saved card image, works offline [6].
  - folk: an AI scanner since July 2026 [18].
  - Mesh: "improved reliability" [45].
  - Covve Scan: claims 96%, 60+ languages, Thai but not Arabic [101][102].
  - CamCard: claims "99.99%" and lists Arabic and Thai, but users report misread names [87][90].
  - Quis: scans in about 1.5 s [5].
- **Accuracy benchmarks are human-backed:** HiHello, ScanBizCards and Sansan use human transcribers [96][108][115].
- **The best-practice flow:** Contacts+ moved to AI extraction with a confirm-before-save screen [19].
- **OS competition:** iOS 27 Visual Intelligence now creates contacts from cards for free [148].
- **Complaints are mostly about field mapping and non-Latin names,** not raw OCR [63][91].

**The QR reality: most codes are links, not contact cards.**
- By default, Blinq, Popl, HiHello, Linq, Wave, V1CE, Tapt, Mobilo and Haystack all put a **profile URL** in their QR codes [173][20][174].
- An embedded vCard appears only in an "offline" mode:
  - Blinq switches automatically when the phone is offline [175].
  - HiHello and Tapt have a manual toggle [176].
  - On V1CE, offline QR is a paid legacy feature [174].
- LINE codes are `line.me/R/ti/p/…` or `line.me/ti/p/…` URLs with no name or phone [177]. WhatsApp click-to-chat links are `wa.me/<number>` [178].
- A vCard/MECARD-only decoder will therefore mostly come back with just a link.

**What PeopleMap should do differently.**
- **Recognise the hosts and parse what they carry.**
  - Store known digital-card domains and LinkedIn as a "card link" or social field.
  - Turn `wa.me/<digits>` into a phone number.
  - Store `line.me` links as a LINE field. This matters for Thailand, though LINE's usage share was not researched.
  - Then prompt: "snap the paper card or screenshot their profile" so the LLM reader can fill the fields.
- **Don't fetch the vendor's hosted `.vcf` silently.** Endpoints are undocumented and may count as a profile view in the sharer's analytics (unverified), so make this a deliberate decision.
- **Keep the card image** next to the extracted fields, as Dex does, and **always show a confirm-before-save review** [6][19].
- **Crop to the card** before sending, and send the image inline to OpenAI with `store: false` (details in section 8).
- **Build an Arabic, Thai and bilingual-card test set before claiming accuracy.** OpenAI's own vision guide warns that performance "degrades with non-Latin alphabets, small text, and rotated content" [179].
- **Support back-to-back scanning at events,** which Covve users ask for [104].
- **Merge card and voice:** the card gives the exact spelling, and the voice note gives the context.

### 3.3 "Ask AI" natural-language search

**Who already does it, and how well.**
- **Built-in chat:**
  - Mesh Nexus: OpenAI-powered, warns of hallucination [21]; a competitor calls it "inconsistent", and App Store reviewers say it is broken [180][49].
  - Dex: questions by text or WhatsApp [2].
  - folk: "ask folk" [56].
  - Nametrace: natural-language questions [72].
  - Revere: "Ask Revere", a Premium feature at €4.99 a month [22].
  - Connecti5: natural-language search plus distance search [163].
  - Also YourPond, CardDrop and LynkIt (local semantic search) [181][117][133].
- **Export over MCP to the user's own ChatGPT or Claude:** Dex Professional, folk, BlaBlaNote Pro, Contacts+ and Blinq [52][71][19][3].
- **OS assistants:** Siri AI and Gemini Contacts are English-only betas with restricted regions [148][154].
- **The gap:** location queries are documented only from profile fields (Mesh "has been to a place") or distance from a contact's address (Dex, Connecti5). **No one documents answering "who did I meet in [city]" from a where-met geotag** [21][7][163].

**What PeopleMap should do differently.**
- **Run structured filters in the database first** (city, date range, radius from the GPS stamp, event), and use the LLM only to parse the question and summarise the matches. This makes "who did I meet in Bangkok last year who does logistics?" exact, not hallucinated.
- **Cite the source contacts in every answer, and say "no match" plainly.** That is the clearest lesson from the Nexus complaints [21][180].
- **Add travel framing:** "I'm in Sydney next week — who do I know there?" matches a reviewer's request for city labels and travel notifications on Mesh's map [49].
- **Search inside voice-note transcripts,** which enrichment-led rivals do not hold.
- **Send OpenAI only the minimum records needed,** stateless, behind an explicit consent screen (Apple 5.1.2(i)) [182].
- **Keep the conversational assistant in the PWA, not in WhatsApp.** Meta bans "AI Providers" whose AI is the primary functionality [28].
- **Treat MCP export as optional and later.** It pushes cost and privacy onto the user's own assistant.

## 4. Feature matrix

Legend: **Yes**, **Partial**, **No**, **Unverified** (not confirmed either way). PeopleMap is marked **Now** (in the MVP), **Proto** (recently prototyped) or **P2/P3/P4** (planned phase).

| Feature | PeopleMap | Dex | Mesh | folk | Covve (personal / Scan) | YourPond | BlaBlaNote | Nametrace | Blinq | Quis | Remember Names |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Voice capture | Yes, Now: one big button | Yes: voice msgs, dictation | Partial: experimental | Yes: talk-to-text (Aug 2026) | Partial: Scan only | Yes: "Describe" (iOS) | Yes: core | Yes: text or voice | Yes: AI Notetaker | No: voice search planned | Partial: name pronunciation |
| Auto-transcription / extraction | Yes, Now: OpenAI + LLM fields | Yes: Deepgram + LLM | Unverified | Partial: speech-to-text only | Partial: Scan voice-to-lead | Yes: NL extraction | Yes: contact detection (Pro) | Partial: structures notes | Partial: transcript, summary | Partial: cards only | Partial: "AI auto-fill" |
| Photo of person | Proto: person/card/place | Partial: via chat, no field | Partial: synced avatars | Unverified | Unverified | Yes: profile photos | Unverified | Unverified | Unverified | Partial: photo field | Yes: up to 10 |
| Business card scan + OCR | Proto: QR + LLM vision | Yes: offline, image kept | Yes | Yes: AI (Jul 2026) | Yes: fast OCR; 60+ langs | No | No: own QR card only | Yes | Yes: Premium+ | Yes: ~1.5 s | Unverified |
| Geotag / map of where met | Yes, Now: GPS + clustered map | Partial: address map, desktop | No: fields only | No | No | Partial: where people live | Unverified | Partial: place + date, no map | Partial: location collected, no map | Yes: auto place + map | Yes: clustered map |
| City filter | Yes, Now: city picker | Yes: location + distance | Partial: Nexus place queries | Unverified | Unverified | Yes: city clusters (residence) | Unverified | Unverified | Unverified | Partial: map by city | Unverified |
| Birthdays | Partial: field Now; reminders P2 | Yes: digest | Yes | Unverified | Unverified | Yes | Partial: "important dates" | Unverified | Unverified | Partial: missing-birthday filter | Unverified |
| Follow-up reminders | Partial: field Now; push P2 | Yes: cadences, by text | Yes | Yes: assistant, Tasks | Yes | Partial: custom reminders | Yes: Pro cadence | Yes: Smart Care | Partial: follow-ups | No: planned | Partial: location-triggered |
| Enrichment | No (by design) | Yes: LinkedIn, data vendors | Yes | Yes: credits | Yes: career news | No | Partial: LinkedIn extension | Yes: research credits | Yes | No | No |
| AI natural-language search | Proto: Ask AI; P3 assistant | Yes: chat + MCP | Yes: Nexus | Partial: "ask folk", MCP | Partial: email assistant | Yes (vendor claim) | Yes: via MCP (Pro) | Yes | Partial: note search, MCP | No: keyword only | Unverified |
| WhatsApp intake | P3 (planned) | Yes: text/voice/photo | No: Beeper drafts only | Partial: chat sync | No | No | Yes: Pro (+Telegram) | Unverified | Unverified | No | Unverified |
| vCard export / contacts sync | P2 vCard; P4 sync | Partial: 2-way sync, CSV only | Partial: CSV | Partial: phone sync | Partial: device sync, Scan export | Partial: claimed | Unverified | Yes: vCard + sync | Partial: sync, CSV | Yes: 2-way + vCard | Unverified |
| Offline capture | Not in brief (recommended) | Partial: card scan | Unverified | Unverified | Yes | Unverified | Unverified | Unverified | Yes: records offline | Yes: local DB | Unverified |
| Multi-user / private accounts | Yes, Now: invite codes, private | Yes: plus Team | Yes: Team ≤4 | Yes: team-first | Partial: single user / seats | Yes: private | Yes: private + Custom | Yes: team features | Yes | No: no account | Unverified |
| Data export | Partial: vCard P2; full export not in brief | Yes: CSV | Yes: CSV (some fields excluded) | Partial: claimed | Partial: Scan to Excel | Yes | Unverified | Yes: vCard | Yes: CSV | Yes: vCard | Unverified |
| Account deletion | Not in brief (required for P4 stores) | Yes | Yes: backups 90 days | Partial: claimed | Unverified | Partial: vendor claim | Unverified | Yes: one click | Yes | N/A: no account | Unverified |

Sources by column:
- PeopleMap: the product brief.
- Dex [2][6][7][38][51]
- Mesh [1][37][47][21][48]
- folk [18][57][56][58]
- Covve [61][60][103]
- YourPond [8][9][181]
- BlaBlaNote [70][71]
- Nametrace [72][73][74]
- Blinq [3][39][95][92]
- Quis [5][10]
- Remember Names [12]

## 5. Pricing snapshot

All prices are in USD unless the currency column says otherwise. The "Checked" date is when the notes recorded the price; ⚠ marks figures that are unverified or conflicting.

| Product | Plans and prices | Currency | Billing | Free tier | Checked | Flags |
|---|---|---|---|---|---|---|
| Mesh [37][45] | Pro $10/mo; Team $40/seat/mo (≤4 seats); Enterprise custom. iOS in-app: $19.99/mo or $119.99/yr | USD | Pro shown with "50% discount" (implies annual) | Yes, 1,000 contacts | 2026-10-07 | ⚠ "$20 monthly" is third-party; free plan page says "credit card required" (ambiguous) |
| Dex [38][55] | Premium $12 / $16 / $20 per month; Professional $20 / $27 / $34 per month; Team $40/user/mo. iOS: Premium $19.99/mo or $143.99/yr | USD | Annual / quarterly / monthly | No (7-day trial, card required) | 2026-10-07 | ⚠ A third-party gist claims a free plan |
| folk [57] | Standard $24 ($30); Premium $48 ($60); Enterprise from $80 ($100), per member | USD (EUR also listed) | Annual (monthly price in brackets) | No (2-week trial) | 2026-10-07 | Team pricing |
| Covve personal CRM [61][183] | PRO $12.99/mo or $119.99/yr (iOS in-app); legacy $4.99/mo, $49.99 and $79.99/yr | USD | Monthly / annual | ⚠ 20 contacts (third-party only) | 2026-10-07 | ⚠ |
| Covve Scan [103] | Essential $12/seat/mo or $119/yr; Pro $20 or $199; Enterprise custom | USD | Monthly / annual | No (14-day trial) | 2026-10-07 | ⚠ Homepage shows different plan labels |
| Monica [184] | Hosted $9/mo or $90/yr; self-host free | USD | Monthly / annual | 30-day trial; free if self-hosted | 2026-10-07 | — |
| YourPond [8][69] | Pro $10/mo or $100/yr (iOS in-app $9.99 / $99.99) | USD | Monthly / annual | 25 contacts | 2026-10-07 | — |
| BlaBlaNote [71] | Pro €9/mo billed annually (€108/yr) or €12 monthly; Custom quote | EUR | Annual / monthly | Yes: 90 min recording, unlimited contacts | 2026-10-07 | — |
| Nametrace [73][74] | Web: Starter 3, Pro 10, Business 20 CHF/mo. iOS: Pro $12.99/mo or $129.99/yr; AI credit packs $14.99 to $299.99 | CHF / USD | Monthly / annual | 500 contacts | 2026-10-07 | ⚠ Per-plan feature split unreliable |
| Dextr [75][185] | Pro $14.99/yr | USD | Annual | Yes (unlimited contacts) | 2026-10-07 | ⚠ Its own blog lists $1.99/mo and $59 lifetime |
| Contacts+ [76] | Premium $9.99/mo or $119.88/yr; Teams $12.99/user/mo | USD | Monthly / annual | 1,000 contacts | 2026-10-07 | — |
| Cloze [78] | Pro $17 ($19.99); Business $21 to $42 per user ($24.99 to $49.99) | USD | Annual (monthly in brackets) | No (14-day trial) | 2026-10-07 | — |
| Revere [79][22] | Premium $4.99/mo or $49.99/yr (€4.99 / €49.99 in France) | USD / EUR | Monthly / annual | Yes | 2026-10-07 | — |
| Remember Names [12] | In-app $1.99, $4.99, $29.99; $79.99 lifetime | USD | One-off | Yes | 2026-10-07 | — |
| Quis [10] | Free, no in-app purchases | — | — | Yes | 2026-10-07 | — |
| Keep AI [132] | $7.99/mo or $49.99/yr | USD | Monthly / annual | — | 2026-10-07 | — |
| Blinq [39][92] | Premium $9.99/mo or $7.33/mo billed yearly; Business $6.99 ($4.99 yearly)/user. iOS: Premium $87.99/yr; Pro $22.49/mo or $199/yr | USD | Monthly / annual / weekly in-app | 2 cards, unlimited contacts | 2026-10-07 | ⚠ Pro is in-app only |
| CamCard [87][186] | iOS in-app $4.49, $8.49; $49.99/yr | USD | Annual | ⚠ ~100 scans (third-party) | 2026-10-07 | ⚠ "$9.99/mo" comes from a search summary; Business plans unpublished |
| HiHello [98] | Professional $6/mo annual ($72/yr); Business $5/user/mo; iOS $9/mo or $84/yr | USD | Annual / monthly | 4 cards, 5 scans/mo | 2026-10-07 | — |
| Popl [187] | Pro $7.99/mo or $76.80/yr; Pro+ $14.99/mo or $143.88/yr; Teams by quote | USD | Monthly / annual | Yes | 2026-09-27 (third-party) | ⚠ Not on the official site |
| Wave Connect [106] | Pro $7/mo; Teams $5/user/mo (3-seat minimum) | USD | Monthly (annual discount) | Yes | 2026-10-07 | — |
| CardDrop [117] | Pro $19.99/mo | USD | Monthly | 10 scans/mo | 2026-10-05 (Capterra) | — |
| Tapt [111] | Startup A$99/yr; Small Business A$199/yr (platform fee) | AUD | Annual | 1 to 4 users (card cost extra) | 2026-10-07 | — |
| Voicenotes [122] | Pro $9/user/mo; Enterprise $24 | USD | Monthly | 100 min/week | 2026-10-07 | — |
| Plaud [4] | Pro $17.99/mo or $8.33/mo annual; Unlimited $29.99 or $19.99; NotePin S hardware $179 | USD | Monthly / annual | 300 min/mo | 2026-10-07 | ⚠ Hardware price from reviews |
| Bee [138][188] | $49.99 hardware (US only, sold out) | USD | One-off | ⚠ Subscription reportedly made free | 2026-10-07 | ⚠ |
| Omi [140] | Pendant $129 (normally $179) | USD | One-off | Free plan | 2026-10-07 | — |

No product publishes prices in AED or THB, and regional App Store prices were not collected.

**What this means:** a solo plan at about $8 to $10 a month, or $50 to $100 a year, sits in the middle of the market. A free tier capped at 25 contacts (YourPond) does not suit someone who meets hundreds of people a year.

## 6. What users love and hate

**Users love tools that fill themselves in.**
- Even a competitor admits that Mesh's enrichment fills about 80% of what you would otherwise type [180].
- Covve reviewers praise scanning 200+ cards with "no corrections" [63].
- Dex reviewers like automatic message tracking and "satisfying" reminders [53].
- On HN in September 2026, users said it is "way easier" to tell an AI about a friend than to fill in forms. That supports voice capture, provided extraction can be checked [68].

**Users value seeing when and where they met someone.**
- A G2 reviewer values seeing "the exact day they connected" [41].
- A Blinq Trustpilot reviewer (Sept 2026) praises notes on "where meetings occurred" [189].
- Product Hunt reviewers singled out Dex's world map [190].
- A Mesh reviewer asks for city labels and travel notifications on the map [49].
- People already hand-stamp "date, meeting type, text and location" into the Apple Contacts notes field [191].

**Privacy and local control are valued for their own sake.**
- The 2025-2026 Show HN posts lean local-first (offline PWAs, no signup) [192][193].
- Users demand "offline-first, encryption, backups that stay compatible" [194].
- Users praise Monica's non-extractive ethos [68].

**The biggest dislike is upkeep.**
- One original poster said manual tracking "did not work"; they want something "automated enough to actually call people once in a while" [195].
- Consolidating thousands of contacts before starting puts people off [196].
- Dex at $12 a month is called too expensive, with tedious onboarding [40].

**Sync and import bugs drive cancellations.**
- Dex: failed LinkedIn sync and a broken map [53][54].
- Mesh: failed iMessage imports, duplicates from country-code formats, and 20-hour syncs [49][197].

**People dislike the CRM feel.**
- Monica users call tagging clunky, and one went back to iPhone Contacts because it covers "95%" of their needs [68].
- A vendor guide calls the cause "pipeline grammar": friends as rows with overdue flags [198].

**Paywalls and team-tier pressure annoy users.**
- CamCard moved sync behind a paywall (per a competitor) [91].
- Blinq solo users need the Business tier for Zapier [92].
- Blinq's per-card pricing comes with usage credits on top [41].

**Card scans get fields wrong, and non-Latin names worst of all.**
- CamCard misreads clearly printed names [90].
- Covve puts business names and job titles in the wrong fields [63].
- Turkish and Greek characters fail (per a competitor) [91].

**Shutdowns and data loss create lock-in fear.**
- UpHabit "wasn't a commercial success" [82].
- Covve users report losing 30+ cards in a failed backup [63].

**AI that doesn't work, or gets in the way, is punished.**
- Mesh's Nexus is reported broken [49].
- CamCard's AI features slow down editing [90].

**Too many reminders feel like a threat.**
- Daily nudges across 20 to 100+ relationships feel like "a threat" [196].
- Reconnect suggestions are irrelevant [197].

**Wearable users want proof and dislike surveillance.**
- Bee cannot play audio back for checking [137].
- Limitless mislabels speakers [199].
- Friend's ads were defaced [146].

**Caveat:** Reddit could not be accessed. Hacker News skews technical and toward self-hosting, so these themes may overweight local-first preferences compared with mainstream business owners.

## 7. Gaps and opportunities

**White space PeopleMap can own:**

1. **Where and when you met, as the main index, on every platform.**
   - No funded CRM or OS stamps the meeting place. Apple and Google Contacts have no where-met field and no map by meeting place [154][158].
   - The indie apps that do it have 1 to 24 ratings, are iOS-only or in beta, and lack voice capture or reminders [5][11][12].
   - At least seven indie attempts have not broken out. The hard parts are capture friction, habit and distribution, not the idea.
2. **Multilingual capture for the Gulf and Southeast Asia.**
   - Apple Intelligence (including Visual Intelligence and Siri AI) supports neither Arabic nor Thai [13][200].
   - MetMe depends on Apple Intelligence on an iPhone 15 Pro or newer [11].
   - Among major scanners, only CamCard confirms Arabic and Thai OCR, and Covve does not list Arabic [87][102].
   - `gpt-transcribe` supports multiple language hints and code-switching [201]. Its quality on Gulf Arabic, Thai, or Arabic and Thai names inside English speech is untested.
3. **Messaging intake as a personal memory channel.**
   - Only Dex and BlaBlaNote take WhatsApp intake, and no card app does [2][71][89].
   - Inbound WhatsApp messages and replies inside the 24-hour window are free [27].
   - LINE matters in Thailand, but its usage share was not researched.
4. **A privacy promise rivals can't make.**
   - Dex, Mesh, folk and Nametrace all enrich contacts with third-party data [51][37][57][73].
   - "We don't enrich, scrape, train on your data, or run face recognition" sets PeopleMap apart. It also matches Apple 5.1.1(viii), which bars compiling personal information not obtained directly from the user [182].
5. **"You narrate; we never record them."**
   - Ambient recorders have died, sold to Big Tech, or drawn public hostility [16][17][146].
   - Dictating after the meeting is socially acceptable and raises no surveillance-device issue [202].
6. **Data that outlives the app.** vCard and CSV export, coexisting with the phone book, and a published "if we shut down" policy answer real lock-in fear [82][16].
7. **One capture event that bundles voice, card, place photo and GPS.** No notable product offers this as a single flow.

**Threats:**
- **Apple and Google.**
  - iOS 27 Visual Intelligence turns photographed cards into contacts [148].
  - Siri AI and Gemini answer questions about contacts [147][154].
  - Journal already logs places and nearby contacts [151].
  - Google Contacts reminds about birthdays [155].
  - If either adds an automatic "met at" stamp, PeopleMap's core could be absorbed. Nothing announced as of October 2026 suggests this, and their language limits leave Arabic and Thai users uncovered for now.
- **Dex** already has WhatsApp voice-to-contact intake and offline card scanning. Adding a GPS stamp would be a small step [2][6].
- **Indie map apps** could add voice capture:
  - Quis is free, with two-way sync and a card scanner, and lists voice search as upcoming [5].
  - MetMe already combines voice, AI and a map on new iPhones [11].
  - YourPond could re-point its city map at meeting places [8].
- **Blinq,** the Australian incumbent, has 99+ languages, offline notes and MCP [3].
- **Mesh** is building hands-free voice and a better scanner [1].
- **Category economics.** UpHabit closed for lack of revenue [82]. Voice-CRM launches on Show HN in 2025-2026 drew zero to few comments [203][204], so the concept alone does not sell.

## 8. Privacy and legal notes by region

*Practical research, not legal advice. Get advice in each jurisdiction before launch and before any monetisation.*

### 8.1 United Arab Emirates

**Federal PDPL (Federal Decree-Law No. 45 of 2021)**
- **Status:** in force, but the Executive Regulations had still not been issued as of a portal check on 23 September 2026. Chambers 2026 agrees [31][30]. Some compliance blogs claim "Cabinet Resolution No. 33 of 2024" and a 1 January 2027 deadline; neither is traced to a primary source [205].
- **Enforcement:** the UAE Data Office "has yet to become fully operational", enforcement is limited, and the decision setting penalties has not been issued [30][206].
- **Personal-use exclusion:** it covers only "a data subject who processes his/her data for personal purposes". That is much narrower than the GDPR household exemption, so a business owner storing other people's details is probably in scope [32].
- **Reach:** the PDPL also reaches operators outside the UAE that process the data of people in the UAE [206].
- **Lawful bases:** consent comes first, and there is no legitimate-interests basis [32].
- **Biometric data:** counted as sensitive. The definition requires processing "using a specific technique" but gives "facial images" as an example [206][32].
- **Transfers abroad:** depend on adequacy decisions (none published) or the Article 23 exceptions [206].

**Cybercrime Law (Federal Decree-Law No. 34 of 2021), Article 44**
- Using IT means to invade privacy without consent is punishable by at least six months' imprisonment and/or a fine of AED 150,000 to 500,000. The listed acts include "taking photographs of others in any public or private place … or retaining electronic images", and tracking or disclosing location [23].
- The Abu Dhabi Judicial Department publicly restated these penalties in December 2023 [207].
- There is an intent element, but it is uncertain and depends on the facts [23].

**Free zones**
- **DIFC:** the Data Protection Law was amended by Law No. 1 of 2025 (effective 15 July 2025). The amendment widened its reach, added a private right to sue (Article 64A) and raised some fines to USD 50,000 [208].
- **ADGM:** controllers must register [209].
- In both free zones, biometric data is a special category that needs explicit consent [30].
- These regimes apply only if the operator, or a user's firm, is established or operating there.

**In practice**
- The business card is the strongest case for implied consent.
- Take face photos only with clear consent.
- Keep GPS private to the user.
- Expect the Cybercrime Law, not the PDPL, to be the near-term legal exposure.

### 8.2 Australia

**Who is regulated**
- **Small business exemption:** the Australian Privacy Principles (APPs) bind organisations with turnover above AUD 3m. Smaller ones are exempt unless an exception applies, for example health service providers, or businesses that **trade in personal information**, meaning they "provide a benefit, service or advantage to collect personal information" without consent [35].
  - An app built on users' notes about non-consenting third parties could arguably trigger that exception. The point is untested, and the risk rises sharply with any enrichment, people search or selling of data.
  - Get advice before monetising, and consider complying with the APPs voluntarily.
- **Personal use (s 16):** the APPs do not apply to individuals acting "only" for personal, family or household affairs. Business networking is outside that, and mixed use probably is too [210].

**Statutory tort (in force since 10 June 2025)**
- It applies to individuals and businesses of any size, with no household or small-business exemption [36].
- It requires intentional or reckless invasion, a reasonable expectation of privacy, seriousness, and a public-interest balance [211].
- Damages for non-economic loss are capped at the greater of $478,550 and the defamation cap [211].
- Privately stored networking notes are very unlikely to qualify. Covert or intimate photos, health or sexual details, and GPS pins that reveal someone's home or routine raise the risk.

**Reform status**
- **Tranche 1 (POLA Act 2024):** created a doxxing offence (up to 7 years) [212]. Transparency rules for automated decision-making start on 10 December 2026 [213].
- **Tranche 2 exposure draft (2026):** the *Privacy Amendment (Personal Data Protection) Bill 2026*. Consultation closed on 18 September 2026; release dates conflict (31 August per the Attorney-General's Department, 13 September per one law firm) [214][215]. The draft would add:
  - a "fair and reasonable" test;
  - "precise geolocation tracking data" (within 500 m, tracked over time) as sensitive information;
  - biometric templates as sensitive information;
  - 72-hour breach notification;
  - a controller/processor split.
  - It **keeps** the small business exemption [216][215][217].

**Facial recognition (OAIC)**
- A face photo becomes sensitive information only when it is "to be used for the purpose of automated biometric verification or biometric identification", or turned into a template [169].
- **Bunnings:** in February 2026 the Administrative Review Tribunal held that faces processed for milliseconds were still "collected". It overturned the APP 3 finding on a safety exception but upheld the transparency breaches [218]. The OAIC called the case "a useful case study, rather than a green light" [219].
- **July 2026 guidance:** sets a "high bar" and a "precautionary approach"; 45% of Australians see facial recognition as a major privacy risk [220].
- **Kmart** (unlawful facial recognition, September 2025; under review) and **Clearview** (2021) complete the picture [221][222].

**Other rules**
- **Overseas disclosure (APP 8):** covered entities must take reasonable steps to make sure overseas recipients comply, and stay accountable for their breaches (s 16C) [223].
- **Recording laws:** dictating your own memo is fine. Recording a *conversation* needs all-party consent in NSW, WA, SA, Tasmania and the ACT, and sources conflict on Victoria [202][224].
- **Spam Act:** applies to any commercial messages sent to saved contacts [225].

### 8.3 Thailand

**Scope**
- **Household exemption (s 4(1)):** covers collection "for personal benefit or household activity of such Person only", so business networking falls outside it [33].
- **Reach (s 5):** reaches foreign operators that offer services to people in Thailand [33].

**Lawful basis and notice**
- **Legitimate interests (s 24(5)) is available,** which makes Thailand friendlier than the UAE [33].
- **Section 25:** data collected "from other sources" needs notice within 30 days, or at the first communication if the data is used to contact the person. In practice, a user following up should say who they are and how they got the details [33].

**Sensitive and biometric data**
- Sensitive data (s 26), including biometric data, needs explicit consent.
- Biometric data is defined by technology ("such as the facial recognition data"), so **a plain photo is not biometric until it is processed for recognition** [33].

**Transfers abroad**
- There is no whitelist. Standard contractual clauses (ASEAN Model Contractual Clauses or EU SCCs) and BCRs are accepted (rules in force 24 March 2024) [33][226].

**Operator duties**
- Breach notice "where feasible, within 72 hours" (s 37) [33].
- A Thai representative is needed for a foreign controller unless it processes no sensitive data and not "a large amount" (s 37(5) and s 38) [33].
- A DPO is needed at 100,000+ data subjects, or where sensitive processing is a core activity [227].

**Enforcement is real**
- The first fine came in 2024 (THB 7m). In August 2025 the PDPC announced eight fines. Nagashima totals them at about THB 14.5m, with THB 21.5m as the cumulative figure; other firms call the August round alone THB 21.5m, so the totals conflict [34][228].
- The fines targeted security failures, breach notification, missing DPOs and missing processor agreements; one processor was fined THB 3m [34].
- In November 2025 the PDPC ordered Worldcoin to stop iris scanning and delete biometric data for about 1.2 million people [229].
- An April 2025 emergency decree added criminal offences for misusing personal data [229].
- A PDPC consultation on new guidelines ran in March 2026 [229].

### 8.4 Two features that need special care

**(i) Sending card images and people data to an LLM provider (OpenAI)**
- **Training and retention:**
  - API data is not used for training by default, and abuse-monitoring logs are kept for up to 30 days [230].
  - Zero Data Retention (ZDR) and Modified Abuse Monitoring need OpenAI's approval. The transcription, Responses and Chat Completions endpoints are ZDR-eligible [230].
  - **The Responses API stores application state for 30 days by default unless `store` is false** [230].
  - **`/v1/files`, vector stores, assistants and conversations are not ZDR-eligible** and keep data until deleted [230].
  - Images flagged by the CSAM classifier are kept for manual review even under ZDR [230].
- **What to do:** send card images inline (base64) to `/v1/responses` or `/v1/chat/completions` with `store: false`. Crop to the card, strip EXIF, never use Files, and keep the system of record in your own database.
- **Data residency:**
  - Storage residency now includes the UAE and Australia [230].
  - In-region *processing* is listed for the US, Europe and the UAE (limited GPT-5.x snapshots). Australia is storage-only, and Thailand is not a region [230].
  - The UAE in-region processing list does not appear to include the transcription models (from a summary of the region table) [230].
  - One research note says only the US and Europe offer in-region processing. Check the live table.
  - Residency needs sales approval and abuse-monitoring controls, and adds 10% to the price of models released on or after 5 March 2026 [230][29].
  - In practice, UAE, Australian and Thai voice notes will be **processed offshore**.
- **Consent and disclosure:**
  - **Apple 5.1.2(i):** apps "must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so" [182]. The PWA isn't bound by this, but the Phase 4 native apps will be, so build the consent screen now.
  - **Transfer rules:** UAE Articles 22 and 23 [206], Thai ss 28 and 29 with standard clauses [226], and Australian APP 8 with s 16C for covered entities [223].
  - **OAIC:** AI inputs and outputs about people are personal information, and inferring data counts as "collection" [231].
  - **Privacy policy:** disclose "OpenAI (US), up to 30 days abuse monitoring", sign the DPA, and apply for ZDR when volume justifies it.
  - WhatsApp's terms bar using platform data to train AI models, except to fine-tune a model for your exclusive use [28].

**(ii) Storing face photos**
- **UAE:** "facial images" are the PDPL's own example of biometric data, and Cybercrime Law Article 44 criminalises taking or keeping photos of people without consent [206][23]. This is the highest-risk jurisdiction for the feature.
- **Australia and Thailand:** a plain stored photo is personal information, but not biometric or sensitive data, *until* it is used for automated identification or turned into a template [169][33].
  - Adding face matching would need consent from every person pictured, which is impossible for third parties.
  - In Australia this follows the Clearview pattern [222].
  - In Thailand it would bring explicit-consent duties, likely a DPO, and loss of the s 38 carve-out [33].
  - Bunnings shows that even millisecond processing counts as collection [218].
- **Never add face recognition, face search or face clustering.** Apple 5.1.2(vi) also bars mining facial-mapping data [182].
- **Do not send person photos to OpenAI.** OpenAI prohibits building facial-recognition databases without consent [171].
- **Storage:** keep face photos encrypted, behind short-lived signed URLs. Make them optional, gate them behind a consent checkbox, and make them easy to delete.

## 9. Prioritised recommendations

Phases: **Quick win** (current MVP), **Pull forward** (from a later phase), **Later**, **Avoid**. Effort is S, M or L.

| # | Recommendation | Why / evidence | Effort | Phase |
|---|---|---|---|---|
| 1 | Stamp location with `navigator.geolocation` when the user taps record. Store lat/lng, accuracy and a timestamp. Attach that fix to photos from the same capture; offer a manual pin for library photos | iOS strips GPS on file-input uploads; Android web uploads arrive without location [26][170] | S | Quick win |
| 2 | Store one coarse location per meeting at the user's initiative. No background tracking or per-contact location history | Tranche 2 makes precise location tracked over time sensitive information; UAE Art. 44 covers tracking and disclosing location [215][23] | S | Quick win |
| 3 | Review screen: put the playable original clip next to the extracted fields, with one-tap fixes for names and numbers | Bee's lack of playback and Limitless's mislabelled speakers are trust-killers; NetNote keeps the recording [137][199][135] | S | Quick win |
| 4 | Send the user's existing names, places and companies to `gpt-transcribe` as keyword and language hints, then reconcile spelling against existing contacts | `gpt-transcribe` (28 Jul 2026, $0.0045/min) supports keyword hints, multiple language hints and code-switching; legacy models accept prompts [201][29][232] | S | Quick win |
| 5 | Offline capture queue: save the audio and metadata (with a local UUID) to IndexedDB or OPFS; call `persist()`; retry uploads when the app opens, comes online or becomes visible; show a "3 notes waiting" badge | iOS has no Background Sync (through 27.2); quota is about 60% of disk; event users complain about connectivity [233][234][41] | M | Quick win |
| 6 | Make recording robust: use `audio/mp4` on iOS and WebM/Opus on Chrome, never `audio/ogg`; call `getUserMedia` on the tap; hold a Screen Wake Lock | Ogg recording fails on Safari 18.4; Wake Lock works in iOS 18.4 Home Screen apps; mic permission can re-prompt [235][236][237] | S | Quick win |
| 7 | QR parser: recognise digital-card hosts and LinkedIn; turn `wa.me` into a phone number and `line.me` into a LINE field; then prompt for a photo of the card or profile | Digital-card QR codes are profile URLs by default; vCard only in offline modes [173][20][174][177][178] | S | Quick win |
| 8 | Keep the card image; crop before sending; send inline to `/v1/responses` with `store: false`; never use `/v1/files` | Dex keeps card images; Responses retains state for 30 days by default; Files is not ZDR-eligible [6][230] | S | Quick win |
| 9 | Build an Arabic, Thai and bilingual card test set, and add back-to-back scanning, before claiming accuracy | OpenAI vision degrades on non-Latin text; only CamCard confirms Arabic; Covve users want multi-card scanning [179][87][104] | M | Quick win |
| 10 | Ask AI: structured database filters (city, date, radius, event) plus LLM parsing; cite the source contacts; answer "no match" plainly | Nexus hallucination warning and complaints; no rival answers where-met queries [21][180] | M | Quick win |
| 11 | Face photos optional, behind an "I have permission" checkbox, off by default in the UAE; place and card photos as the default; discourage bystanders in shots | UAE Art. 44; tort risk from covert photos [23][207][36] | S | Quick win |
| 12 | Two-layer privacy notice, plus a public "if you've been saved in this app" page. Name OpenAI (US), the 30-day logs and the hosting region. Show an explicit consent screen before first AI use | Apple 5.1.2(i); Thai s 23/25 notice; OAIC AI guidance [182][33][231] | S | Quick win |
| 13 | In-app account deletion (also on the web) plus full export (CSV, vCard, media). Publish an "if we shut down" policy | Apple 5.1.1(v); Google requires web deletion; UpHabit, Limitless and Humane shutdowns [182][238][82][16][17] | M | Quick win |
| 14 | Host Supabase in Singapore (ap-southeast-1) and pin Vercel functions to sin1 | Neither has a Middle East region; Vercel defaults to iad1 (Washington) [239][240] | S | Quick win |
| 15 | iOS install coach (Share > Add to Home Screen), tied to "turn on reminders" and "keep notes offline" | No install prompt on iOS; iOS 26 opens Home Screen sites as web apps; push needs install [241][242][243] | S | Quick win |
| 16 | Quick launch: Android manifest shortcut to `/capture?autostart=1`; for iOS, a shareable Apple Shortcut ("Open URL") for the Action button, Back Tap or a Lock Screen control | iOS doesn't support manifest shortcuts; Shortcuts can run from the Action button or Back Tap; whether it opens the installed app or Safari is **untested** [244][245][246] | S | Quick win |
| 17 | Strict per-user data silos tested with row-level security; no cross-user people table or de-duplication; in-app warning against recording health, religion, politics, sexuality or criminal details | Apple 5.1.2(iv); Thai s 26; UAE sensitive data [182][33][206] | S | Quick win |
| 18 | Measure seconds from tap to saved, and the iOS Home Screen install rate | No vendor publishes time-to-capture; install rate gates iOS push [243] | S | Quick win |
| 19 | vCard "save to contacts" now: serve `text/vcard` with a NOTE ("met at … on …") and PHOTO; on iOS, show "scroll down, tap Create New Contact"; test `navigator.share` with a .vcf | iOS's save sheet discards on "Done"; Dex and Mesh export CSV only [25][38][47] | S | Pull forward |
| 20 | "Import from my contacts" on Android via the Contact Picker; hide it on iOS | Supported on Chrome for Android only; disabled by default on iOS [247] | S | Pull forward |
| 21 | Birthday and follow-up reminders via Declarative Web Push; re-subscribe on every open; email or in-app "due today" fallback; few, opt-in, context-based reminders rather than cadences | iOS 16.4+ needs install; Declarative Push on 18.4+; subscriptions silently go invalid; reminder overload [243][24][248][249][196] | M | Pull forward |
| 22 | Trip mode: the user picks an upcoming city and gets a "who you know there" digest (manual, since the PWA has no background location) | Mesh reviewer asks for travel notifications; Remember Names does location-triggered recall natively [49][12] | M | Pull forward |
| 23 | Telegram intake pilot (Phase 1.5) | Bot API 10.3; 20 MB downloads; OGG/Opus; no AI-chatbot ban; reach likely lower than WhatsApp [250] | S | Pull forward |
| 24 | WhatsApp voice-note intake pilot with structured replies ("Saved: … Reply 1 to edit"). Download media within 5 minutes and convert OGG/Opus before transcription | Inbound and in-window replies free since 1 Jul 2025; media URLs expire after 5 min; OGG is not among OpenAI's accepted formats; AED billing from Apr 2026 [27][251][232] | M | Pull forward |
| 25 | Price a personal plan at about $8 to $10 a month or $50 to $100 a year; a free tier sized for hundreds of contacts; no team-tier gating of core features | Market band; complaints about Dex's price and Blinq's tier pressure [37][38][8][40][92] | S | Later |
| 26 | Native apps: an App Intent on the Action button or Lock Screen that starts recording; on-device SpeechAnalyzer for English; per-contact writes to Contacts (no bulk upload) | A PWA can't record from the Lock Screen; SpeechAnalyzer has no Arabic or Thai at launch; iOS 18 allows limited contacts access; Notes field needs an entitlement [252][253][152][182] | L | Later |
| 27 | Apply for OpenAI ZDR or Modified Abuse Monitoring and assess residency once volume justifies it | Approval through sales; UAE processing excludes transcription models; 10% uplift [230][29] | S | Later |
| 28 | Legal review before monetising: the Australian trading exception, the Thai representative requirement, and watching for the UAE Executive Regulations | [35][33][31] | S | Later |
| 29 | **No** face recognition, face search or auto-grouping by face | OAIC decisions; Thai explicit consent; OpenAI policy; Meta "Name Tag" backlash [220][222][33][171][144] | — | Avoid |
| 30 | **No** enrichment or scraping (LinkedIn, web, data brokers) | Apple 5.1.1(viii); Australian trading exception risk; enrichment is thin for people who keep a low profile [182][35][180] | — | Avoid |
| 31 | **No** ambient or conversation recording of the other person | All-party consent in NSW, WA, SA, Tas, ACT; wearable backlash; Limitless "Consent Mode" never shipped [202][146][199] | — | Avoid |
| 32 | **No** open-ended AI assistant inside WhatsApp | Meta bans AI Providers whose AI is the "primary" functionality (since 15 Jan 2026) [28][254] | — | Avoid |
| 33 | **No** bulk messaging, "select all", or automated promotional birthday messages to contacts | Spam Act; Apple 5.1.2(v) [225][182] | — | Avoid |
| 34 | **No** bulk phone-book upload to the server; no "overdue" scores or pipeline language | Apple 5.1.2(iv); the "pipeline ick" [182][198] | — | Avoid |
| 35 | **Don't** rely on push as the only reminder channel, or on EXIF for location | Push subscriptions go invalid; EXIF is stripped [248][26] | — | Avoid |

**AI cost:** a 30-second note costs about $0.00225 to transcribe with `gpt-transcribe`, and extraction with gpt-5-mini adds about $0.00085. That is roughly $1 to $3 of AI per 1,000 notes [29]. AssemblyAI ($0.15 an hour) and Deepgram Nova-3 ($0.0043 a minute) are credible fallbacks [255][256].

## 10. What could not be verified

- **Reddit:** inaccessible to the research, so mainstream user sentiment is under-represented. Hacker News skews technical.
- **Capture speed and traction:** no vendor publishes time-to-capture. There is no download, revenue or retention data for any niche app beyond rating counts.
- **Competitor features still unknown:**
  - whether Mesh or folk keep card images;
  - whether Blinq or Covve voice notes become structured fields;
  - whether Nametrace's "place" comes from GPS;
  - whether Quis has an explicit city picker;
  - YourPond's Android app, account deletion and contacts sync (sources conflict).
- **App status:** MetMe's App Store release; the 2026 status of People (Hidden Spectrum), Rememorate, Kin, Bond, Hippo and Fabriq.
- **Pricing:**
  - Popl individual prices (third-party only);
  - CamCard prices (search summary);
  - Covve plan labels (conflicting);
  - Mesh and Dex free-tier wording;
  - Nametrace's tier split;
  - Dextr's plans (its pricing page and blog conflict);
  - prices in AED, AUD and THB.
- **AI quality:** `gpt-transcribe` and OpenAI vision on Arabic, Thai and accented English names have no benchmark. Nor is it confirmed that current GPT-5.x vision models still refuse identity requests; the latest evidence is the 2023 GPT-4V system card.
- **OpenAI terms:** the DPA (page returned 403) and the exact usage-policy wording (403). The region table rows conflict between notes on whether the UAE offers in-region processing.
- **iOS and PWA behaviour:**
  - whether an Apple Shortcut "Open URL" opens the installed web app or Safari;
  - whether iOS 26 or 27 fixed Web Push subscriptions going invalid;
  - whether Safari and the installed app share storage;
  - the iOS 26/27 vCard save flow and `navigator.share` with a .vcf;
  - background recording in an iOS PWA (assumed impossible);
  - microphone and location permission persistence.
- **QR formats:** the fields in Blinq's offline QR; the payload of WhatsApp's personal QR; LINE's personal QR format (low-authority source); how often people share in offline mode.
- **Messaging:**
  - WhatsApp, Telegram and LINE usage share in the UAE, Australia and Thailand;
  - WhatsApp per-country template rates;
  - Meta's list of "certain countries" allowing AI providers;
  - the EU outcome after May 2026.
- **UAE law:**
  - the Executive Regulations status (sources conflict);
  - the official PDPL text (403);
  - Penal Code privacy articles;
  - the DIFC and ADGM texts;
  - any regulator view on whether photos are biometric data.
- **Thailand law:**
  - only the Thai text is binding;
  - the PDPC's reported position on casual photography;
  - the text of Computer Crime Act s 16;
  - any fines after 2025;
  - the status of the PDPA amendment;
  - a claimed July 2026 notification on access rights;
  - the fine totals (THB 14.5m vs 21.5m).
- **Australia law:**
  - how the trading exception applies to apps like this;
  - the s 16 wording (search extract only);
  - the claimed AML/CTF expansion from 1 July 2026;
  - POLA penalty amounts;
  - the status of the Children's Online Privacy Code;
  - Victoria's surveillance-device rule;
  - the tranche 2 release date (31 August or 13 September).
- **Wearables:** whether Bee records continuously by default or only on a button press; whether Bee is now free; whether Meta has shipped face recognition (contested).
- **OS features:** whether NameDrop records the date or place of an exchange; the Apple Maps contacts layer on iOS 26/27; Samsung One UI 8 card-to-contact; the exact English regional variants on Apple's feature-availability page.

## 11. Sources

1. TechCrunch (12 Aug 2026): Mesh comes to Android. https://techcrunch.com/2026/08/12/mesh-automattics-crm-for-everyone-comes-to-android
2. Dex docs: Messaging Dex. https://getdex.com/docs/ai/messaging-dex
3. Blinq: AI Notetaker. https://blinq.me/solutions/ai-notetaker
4. Plaud AI plan pricing. https://www.plaud.ai/pages/plaud-ai-plan-pricing
5. Quis homepage. https://quis.co/
6. Dex docs: Card scanner. https://getdex.com/docs/workflows/card-scanner
7. Dex docs: Organize your contacts (map and location filters). https://getdex.com/docs/workflows/organize-your-contacts
8. YourPond homepage. https://www.yourpond.io/
9. YourPond blog: Best personal CRM apps 2026 (vendor). https://www.yourpond.io/blog/best-personal-crm-apps-2026
10. App Store: Quis: Your Contacts on a Map. https://apps.apple.com/us/app/quis-your-contacts-on-a-map/id1558252000
11. MetMe homepage. https://metme.app/
12. App Store: Remember Names: Name Reminder. https://apps.apple.com/us/app/remember-names-name-reminder/id6504533632
13. Apple Support 121115: Apple Intelligence languages and availability. https://support.apple.com/en-us/121115
14. Contacts+: UpHabit alternative (competitor; UpHabit shutdown). https://www.contactsplus.com/uphabit-alternative/
15. Mesh Library (20 Mar 2026): Introducing Mesh. https://library.me.sh/2026/03/20/mesh/
16. Limitless homepage (acquired by Meta). https://www.limitless.ai/
17. Engadget: Humane AI Pins stop working. https://engadget.com/ai/all-of-humanes-ai-pins-will-stop-working-in-10-days-225643798.html
18. folk changelog. https://www.folk.app/changelog
19. Contacts+ business card scanner. https://contactsplus.com/business-card-scanner/
20. Wave Connect blog: Offline QR codes guide. https://wavecnct.com/blogs/offline-qr-codes-guide
21. Mesh KB: Nexus. https://library.me.sh/knowledge-base/nexus/
22. App Store (FR): Revere - Remember People. https://apps.apple.com/fr/app/revere-remember-people/id1260429188
23. BSA Law: Photography and privacy under Federal Decree-Law No. 34 of 2021. https://bsalaw.com/insight/legal-risks-of-photography-and-technology-use-navigating-privacy-laws-under-federal-decree-law-no-34-of-2021/
24. WebKit: Meet Declarative Web Push. https://webkit.org/blog/16535/meet-declarative-web-push/
25. HiHello blog: Dear Apple, let's improve contact saving (iOS vCard sheet). https://hihello.com/blog/dear-apple-lets-improve-contact-saving
26. WebKit Bugzilla 257534: GPS EXIF stripped on upload. https://bugs.webkit.org/show_bug.cgi?id=257534
27. Meta: WhatsApp Business Platform pricing. https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
28. Meta Terms for WhatsApp Business Platform (AI Providers, s 4.7). https://www.facebook.com/legal/Meta-Terms-for-WhatsApp-Business-Platform
29. OpenAI API pricing. https://developers.openai.com/api/docs/pricing
30. Chambers Global Practice Guides 2026: UAE data protection trends. https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/uae/trends-and-developments
31. ITSecNow: UAE PDPL Executive Regulations 2026 explained. https://itsecnow.com/regulators/pdpl-executive-regulations-2026
32. SMEX: UAE data protection law between exceptions and exemptions. https://smex.org/uaes-data-protection-law-between-exceptions-and-exemptions/
33. Thailand PDPA B.E. 2562, unofficial English translation. https://pdpa.msu.ac.th/wp-content/uploads/2022/05/EN-PDPA-2019.pdf
34. Nagashima Ohno & Tsunematsu (22 Aug 2025): Thailand PDPC fines. https://www.nagashima.com/en/publications/publication20250822-1/
35. OAIC: Small business. https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business
36. OAIC: Statutory tort for serious invasions of privacy. https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/statutory-tort-for-serious-invasions-of-privacy
37. Mesh pricing. https://me.sh/pricing
38. Dex pricing. https://getdex.com/pricing
39. Blinq pricing. https://blinq.me/pricing
40. Hacker News comment (Aug 2026): Dex too expensive. https://news.ycombinator.com/item?id=49179453
41. B2Brain: Blinq reviews compared (third-party). https://www.b2brain.com/blogs/blinq-reviews
42. Crunchbase News: Automattic acquires relationship management startup Clay. https://news.crunchbase.com/ma/automattic-acquires-relationship-management-startup-clay/
43. TechCrunch (12 Jun 2025): Automattic acquires relationship manager Clay. https://techcrunch.com/2025/06/12/automattic-acquires-relationship-manager-clay-to-add-an-identity-layer-to-online-tools/
44. use-apify: Clay personal CRM review 2026 (third-party; conflicting rename date). https://use-apify.com/blog/clay-personal-crm-review-2026
45. App Store: Mesh: Contacts + CRM. https://apps.apple.com/us/app/mesh-contacts-crm/id1463073824
46. Mesh homepage. https://me.sh/
47. Mesh KB: Export to CSV. https://library.me.sh/knowledge-base/export-to-csv/
48. Mesh KB: Security and privacy. https://library.me.sh/knowledge-base/security-and-privacy/
49. App Store: Mesh user reviews. https://apps.apple.com/us/app/mesh-contacts-crm/id1463073824?see-all=reviews&platform=ipad
50. Dex homepage. https://getdex.com/
51. Dex privacy policy (updated 23 Sep 2026). https://getdex.com/privacy
52. Dex: AI agents / MCP. https://getdex.com/ai-agents.md
53. App Store: Dex user reviews. https://apps.apple.com/us/app/dex-rolodex-and-personal-crm/id1472132715?see-all=reviews&platform=ipad
54. Dex docs: LinkedIn sync FAQ. https://getdex.com/docs/faq/linkedin
55. App Store: Dex. https://apps.apple.com/app/id1472132715
56. folk mobile app page. https://www.folk.app/mobile
57. folk pricing. https://www.folk.app/pricing
58. folk: GDPR-compliant CRM hosted in Europe. https://www.folk.app/articles/gdpr-compliant-crm-hosted-in-europe
59. G2: folk reviews. https://www.g2.com/products/folk-folk/reviews
60. Covve homepage. https://covve.com/
61. App Store: Covve - Personal CRM. https://apps.apple.com/us/app/-/id958935377
62. Covve Help: End-to-end encryption. https://help.covve.com/help/introducing-end-to-end-encryption-kb
63. App Store: Covve Business Card Scanner user reviews. https://apps.apple.com/us/app/covve-business-card-scanner/id1459654107?see-all=reviews&platform=iphone
64. GitHub: monicahq/monica. https://github.com/monicahq/monica
65. Monica blog: We are rebuilding Monica. https://www.monicahq.com/en/blog/we-are-rebuilding-monica/
66. Monica v3. https://www.monicahq.com/en/v3/
67. Monica privacy. https://www.monicahq.com/en/privacy
68. Hacker News: 'We are rebuilding Monica' thread (Sep 2026). https://news.ycombinator.com/item?id=49509655
69. App Store: YourPond. https://apps.apple.com/us/app/id6761669539
70. BlaBlaNote homepage. https://blablanote.com/
71. BlaBlaNote pricing. https://blablanote.com/pricing
72. Nametrace homepage. https://nametrace.app/en
73. Nametrace pricing. https://nametrace.app/en/pricing
74. App Store: Nametrace. https://apps.apple.com/us/app/nametrace/id6758048527
75. Dextr pricing. https://dextr.app/pricing/
76. Contacts+ pricing. https://www.contactsplus.com/pricing/
77. Cloze homepage (ai.cloze.com). https://ai.cloze.com/
78. Cloze pricing. https://www.cloze.com/app/pricing
79. App Store (US): Revere - Remember People. https://apps.apple.com/us/app/revere-remember-people/id1260429188
80. Notion templates: Personal CRM. https://www.notion.com/templates/category/personal-crm
81. 2sync: Best Notion CRM templates. https://2sync.com/blog/best-notion-crm-templates
82. Kinu: Personal CRM apps that shut down (competitor-authored). https://kinu.care/blog/personal-crm-apps-shut-down
83. App Store: Garden: Stay in Touch. https://apps.apple.com/us/app/id1230466454
84. App Store: Mogul - Thoughtful Networking. https://apps.apple.com/us/app/id1367307210
85. Dex blog: Personal CRM list (competitor-authored). https://getdex.com/blog/personal-crm-list/
86. nat.app. https://nat.app/
87. App Store: CamCard. https://apps.apple.com/us/app/-/id349447615
88. CamCard pricing. https://www.camcard.com/pricing
89. CamCard homepage. https://www.camcard.com/
90. App Store: CamCard user reviews. https://apps.apple.com/us/app/camcard-ai-business-assistant/id349447615?see-all=reviews
91. Mobilo: Honest CamCard reviews (competitor-authored). https://www.mobilocard.com/post/camcard-reviews
92. App Store: Blinq. https://apps.apple.com/us/app/blinq-digital-business-card/id1324102258
93. Australian Government AI Directory: Blinq Technologies. https://aidirectory.industry.gov.au/organisation/blinq-technologies
94. Blinq support: AI Notetaker basics. https://support.blinq.me/en/articles/71264-ai-notetaker-the-basics
95. Blinq support: How long Blinq keeps your Notetaker audio. https://support.blinq.me/en/articles/84195-how-long-blinq-keeps-your-notetaker-audio
96. HiHello blog: CardMunch 2.0. https://www.hihello.com/blog/hihello-cardmunch
97. HiHello: Business card scanner. https://www.hihello.com/features/business-card-scanner
98. HiHello pricing. https://www.hihello.com/pricing
99. Popl homepage. https://popl.co/
100. Trustpilot UK: Popl reviews. https://uk.trustpilot.com/review/popl.co?page=9
101. Covve: Business card scanner. https://covve.com/business-card-scanner
102. Capterra UAE: Covve Scan (languages). https://www.capterra.ae/software/1011109/covve-scan
103. Covve pricing. https://covve.com/pricing
104. Software Advice AU: Covve Scan reviews. https://www.softwareadvice.com.au/software/357774/covve-scan
105. Wave Connect docs (Arabic): Scanner. https://wavecnct.com/docs/ar/contacts/scanner.md
106. Wave Connect pricing. https://wavecnct.com/pages/pricing
107. Wave Connect homepage. https://wavecnct.com/
108. ScanBizCards homepage. https://www.scanbizcards.com/
109. Bham Now (3 Feb 2026): Linq raises $20M. https://bhamnow.com/2026/02/03/birmingham-startup-raises-20m-in-funding-for-ai-powered-messaging/
110. ABBYY: Mobile apps EOL announcement. https://support.abbyy.com/hc/en-us/articles/19657953214867-Mobile-Apps-EOL-Announcement
111. Tapt pricing. https://tapt.io/pages/pricing
112. Haystack pricing. https://www.thehaystackapp.com/pricing
113. V1CE pricing. https://v1ce.co/pages/pricing
114. Mobilo pricing. https://www.mobilocard.com/pricing
115. Sansan IR: Business information. https://ir.corp-sansan.com/en/ir/management/businessinformation_3.html
116. Eight (8card.net). https://8card.net/
117. Capterra: CardDrop. https://www.capterra.com/p/10047916/carddrop/
118. App Store: AI CardVault. https://apps.apple.com/us/app/ai-cardvault/id6740126760
119. App Store: Leadnics. https://apps.apple.com/us/app/-/id6739613530
120. App Store: Jaab NFC. https://apps.apple.com/lu/app/jaab-nfc/id6740198703
121. Emeron (UAE NFC card reseller; low-quality source). https://emeron.io/?p=989645
122. Voicenotes pricing. https://voicenotes.com/pricing
123. App Store: Plaud AI Notetaker. https://apps.apple.com/us/app/plaud-ai-notetaker/id6450364080
124. TechCrunch (28 Jul 2026): Granola launches an Apple Watch app. https://techcrunch.com/2026/07/28/granola-launches-an-apple-watch-app/
125. Granola pricing. https://www.granola.ai/pricing
126. Otter pricing. https://otter.ai/pricing
127. Notion Help: AI Meeting Notes. https://www.notion.com/help/ai-meeting-notes
128. Mem pricing. https://get.mem.ai/pricing
129. AudioPen. https://audiopen.ai/
130. Cleft. https://www.cleftnotes.com/
131. Letterly. https://letterly.app/
132. App Store: Keep AI - Personal CRM. https://apps.apple.com/app/id6751458016
133. App Store: LynkIt - Networking Assistant. https://apps.apple.com/app/id6756911857
134. App Store: NexaLink. https://apps.apple.com/app/id6480664534
135. NetNote. https://www.netnoteapp.com/
136. TechCrunch (12 Jan 2026): Why Amazon bought Bee. https://techcrunch.com/2026/01/12/why-amazon-bought-bee-an-ai-wearable/
137. TechCrunch (12 Jan 2026): Hands-on with Bee. https://techcrunch.com/2026/01/12/hands-on-with-bee-amazons-latest-ai-wearable/
138. Bee homepage. https://www.bee.computer/
139. TechCrunch (5 Dec 2025): Meta acquires Limitless. https://techcrunch.com/2025/12/05/meta-acquires-ai-device-startup-limitless
140. Omi homepage. https://www.omi.me/
141. Pebble Index 01. https://repebble.com/index
142. Sandbar Stream. https://www.sandbar.com/
143. PC Gamer: I-XRAY smart-glasses doxxing demo. https://pcgamer.com/hardware/insta-dox-meta-smart-glasses
144. TechCrunch (13 Feb 2026): Meta plans facial recognition on smart glasses. https://techcrunch.com/2026/02/13/meta-plans-to-add-facial-recognition-to-its-smart-glasses-report-claims/
145. Wikipedia: Ray-Ban Meta. https://en.wikipedia.org/wiki/Ray-Ban_Meta
146. TechCrunch (27 Sep 2025): Friend's subway ads. https://techcrunch.com/2025/09/27/ai-startup-friend-spent-more-than-1m-on-all-those-subway-ads
147. 9to5Mac (14 Sep 2026): iOS 27 now available. https://9to5mac.com/2026/09/14/ios-27-now-available-features-compatible-iphones/
148. iGeeksBlog: Siri AI in iOS 27 (secondary). https://www.igeeksblog.com/siri-ai-ios-27-features/
149. Apple Developer WWDC26 session 297 (Visual Intelligence). https://developer.apple.com/videos/play/wwdc2026/297/
150. tbreak: Apple Intelligence and Arabic in the UAE. https://tbreak.com/apple-intelligence-arabic-uae-watch-hypertension/
151. Apple Privacy: Journaling Suggestions. https://www.apple.com/legal/privacy/data/en/journaling-suggestions/
152. Apple Developer: com.apple.developer.contacts.notes entitlement. https://developer.apple.com/tutorials/data/documentation/bundleresources/entitlements/com.apple.developer.contacts.notes.json
153. 9to5Google (5 Jun 2026): Gemini and Google Contacts. https://9to5google.com/2026/06/05/gemini-google-contacts/
154. Gemini Apps Help: Google Contacts connector. https://support.google.com/gemini/answer/17100956
155. 9to5Google (Nov 2023): Google Contacts reminders. https://9to5google.com/2023/11/22/google-contacts-reminder-notifications/
156. Samsung Community: Business card reader removed (user forum). https://r2.community.samsung.com/t5/Galaxy-S/BUSINESS-CARD-READER/td-p/3352584
157. WebNots: Microsoft Lens discontinued. https://www.webnots.com/microsoft-to-discontinue-lens-app-shifts-focus-to-ai-powered-copilot/
158. YourPond blog: Best apps for tracking where friends live (vendor). https://www.yourpond.io/blog/best-apps-tracking-where-friends-live
159. App Store: GEOnameWizard. https://apps.apple.com/us/app/id6450182834
160. App Store: Remet - Remember People. https://apps.apple.com/us/app/id6757997989
161. App Store: Known Names. https://apps.apple.com/us/app/id6751477026
162. designboom (Jan 2025): People app (Hidden Spectrum). https://www.designboom.com/technology/people-app-helps-users-remember-when-where-how-they-met-everyone-contacts-iphone-01-24-2025/
163. Capterra: Connecti5. https://www.capterra.com/p/10041360/Connecti5/
164. Connecti5 homepage. https://connecti5.com/
165. Rememorate pricing. https://rememorate.com/pricing
166. mwm.ai listing: Face Sherlock AI (aggregator). https://mwm.ai/apps/face-sherlock-ai/6789845307
167. App Store: Sidewalk - Contact Mapping. https://apps.apple.com/us/app/sidewalk-contact-mapping/id1005409136
168. App Store: Contacts Map. https://apps.apple.com/us/app/contacts-map-territory-manage/id468424673
169. OAIC APP Guidelines, Chapter B: Key concepts. https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-b-key-concepts
170. Android Developers: Access media files from shared storage. https://developer.android.com/training/data-storage/shared/media
171. OpenAI Usage Policies (wording from search summary; page returned 403). https://openai.com/policies/usage-policies/
172. OpenAI: GPT-4V System Card (2023). https://cdn.openai.com/papers/GPTV_System_Card.pdf
173. Popl support: How others save your information. https://support.popl.co/en/articles/8728463-how-others-save-your-information
174. V1CE support: Offline QR code. https://support.v1ce.co/features/does-v1ce-support-an-offline-qr-code
175. Blinq support: Using Blinq offline. https://support.blinq.me/en/articles/84144-using-blinq-offline
176. HiHello support: Share your card offline. https://support.hihello.com/hc/en-us/articles/30322306120603-How-to-Share-Your-HiHello-Card-Offline
177. LINE Developers: Using LINE URL scheme. https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme
178. WhatsApp FAQ: How to use click to chat. https://faq.whatsapp.com/5913398998672934
179. OpenAI: Images and vision guide. https://developers.openai.com/api/docs/guides/images-vision
180. Dex blog: Mesh review (competitor-authored). https://getdex.com/blog/mesh-review/
181. YourPond blog: Best contact tracker apps 2026 (vendor). https://www.yourpond.io/blog/best-contact-tracker-apps-2026
182. Apple App Review Guidelines. https://developer.apple.com/app-store/review/guidelines/
183. Dex blog: Covve review (competitor-authored). https://getdex.com/blog/covve-review/
184. Monica pricing. https://www.monicahq.com/en/pricing
185. Dextr blog: Best personal CRM apps in 2026 (vendor; conflicting pricing). https://dextr.app/articles/best-personal-crm-apps-in-2026/
186. Spreadly blog: Top 7 business card scanner apps 2026 (third-party). https://spreadly.app/en/blog/top-7-best-business-card-scanner-apps-2026
187. FrontDeskReview: Popl pricing (third-party). https://frontdeskreview.com/software/digital-business-card/popl/
188. BigGuyOnStuff: AI wearables 2026 review (third-party). https://bigguyonstuff.com/ai-wearables-2026-honest-review/
189. Trustpilot: Blinq. https://www.trustpilot.com/review/blinq.me
190. Product Hunt: Dex reviews. https://www.producthunt.com/products/dex/reviews
191. Show HN (Aug 2026): A personal CRM inside Apple's Contacts app. https://news.ycombinator.com/item?id=49142119
192. Show HN (Nov 2025): Radius.today local-first PWA. https://news.ycombinator.com/item?id=46042182
193. Show HN (Feb 2026): NameMemory. https://news.ycombinator.com/item?id=46842622
194. Hacker News comment (Sep 2026): offline-first, encrypted. https://news.ycombinator.com/item?id=49534893
195. Ask HN (Sep 2024): Personal CRM. https://news.ycombinator.com/item?id=41518100
196. Show HN (Sep 2023): A 'CRM' for personal relationships. https://news.ycombinator.com/item?id=37625283
197. Product Hunt: Mesh (Clay) reviews. https://www.producthunt.com/products/clay/reviews
198. asambl: Personal CRM without the ick (vendor). https://asambl.app/guides/personal-crm/
199. Fast.io: Limitless AI review 2026 (third-party). https://fast.io/resources/limitless-ai-review-2026/
200. Apple: iOS feature availability. https://www.apple.com/ios/feature-availability/
201. OpenAI model page: gpt-transcribe. https://developers.openai.com/api/docs/models/gpt-transcribe
202. Hamilton Locke: Recording private conversations in Australia. https://hamiltonlocke.com.au/recording-private-conversations-the-law-in-australia/
203. Show HN (Nov 2025): Echo, personal CRM with voice mode. https://news.ycombinator.com/item?id=45827926
204. HN Algolia: 'personal crm' stories 2023-2026. https://hn.algolia.com/api/v1/search?query=personal%20crm&tags=story&numericFilters=created_at_i%3E1672531200&hitsPerPage=50
205. BinaryMinds (5 Sep 2026): UAE PDPL compliance checklist 2027 (unverified claims). https://binaryminds.ae/blog/uae-pdpl-compliance-checklist-2027
206. DLA Piper: Data Protection Laws of the World, UAE. https://www.dlapiperdataprotection.com/countries/uae-general/law.html
207. Lexis Middle East (Dec 2023): Abu Dhabi penalties for privacy violations. https://www.lexis.ae/2023/12/21/auh-penalties-for-privacy-violations-clarified/
208. Baker McKenzie: DIFC updates data protection law. https://connectontech.bakermckenzie.com/dubai-international-financial-centre-updates-data-protection-law/
209. ADGM Office of Data Protection. https://www.adgm.com/operating-in-adgm/office-of-data-protection
210. Privacy Act 1988 s 16 (AustLII). https://20.austlii.edu.au/au/legis/cth/consol_act/pa1988108/s16.html
211. Norton Rose Fulbright: Australia's new statutory privacy tort. https://www.nortonrosefulbright.com/en/knowledge/publications/87ee5e95/privacy-gets-teeth-australias-new-statutory-tort-and-how-it-might-look-in-practice
212. MinterEllison: Privacy and Other Legislation Amendment Act 2024 now in effect. https://www.minterellison.com/articles/privacy-and-other-legislation-amendment-act-2024-now-in-effect
213. Corrs: Australia's ongoing privacy reforms. https://corrs.com.au/insights/australias-ongoing-privacy-reforms-bolstering-australias-privacy-regulatory-framework
214. Attorney-General's Department: Privacy reform consultation (2026 exposure draft). https://consultations.ag.gov.au/rights-and-protections/privacy-reform/
215. Colin Biggers & Paisley: Exposure draft of the Privacy Amendment Bill. https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment
216. Aitken Legal (2 Sep 2026): Privacy Act reforms tranche 2. https://www.aitken.com.au/news/privacy-act-reforms-tranche2
217. Ashurst: Australia's 2026 privacy reforms, a first look. https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/
218. Clayton Utz (Feb 2026): Bunnings wins appeal on facial recognition. https://www.claytonutz.com/insights/2026/february/bunnings-wins-appeal-on-facial-recognition-technology-key-takeaways-for-businesses-and-privacy-law
219. OAIC statement on the ART Bunnings decision. https://www.oaic.gov.au/news/media-centre/privacy-commissioner-statement-on-administrative-review-tribunals-bunnings-decision
220. OAIC (29 Jul 2026): Updated guidance on facial recognition. https://www.oaic.gov.au/news/media-centre/privacy-commissioner-publishes-updated-guidance-on-facial-recognition-in-retail-spaces
221. OAIC: Kmart's use of facial recognition unlawful. https://www.oaic.gov.au/news/media-centre/18-kmarts-use-of-facial-recognition-to-tackle-refund-fraud-unlawful,-privacy-commissioner-finds
222. OAIC: Clearview AI breached Australians' privacy. https://www.oaic.gov.au/news/media-centre/clearview-ai-breached-australians-privacy
223. OAIC APP Guidelines, Chapter 8: Cross-border disclosure. https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information
224. ALRC Report 123: Participant monitoring. https://www.alrc.gov.au/publication/serious-invasions-of-privacy-in-the-digital-era-alrc-report-123/14-surveillance-devices/participant-monitoring/
225. Corrs: ACMA Spam Act enforcement. https://www.corrs.com.au/insights/acma-spam-act-enforcement-and-the-implications-for-business
226. Tilleke & Gibbins: Thailand cross-border transfer regulations. https://www.tilleke.com/insights/thailands-regulations-for-cross-border-personal-data-transfer-come-into-force/
227. Tilleke & Gibbins: Thailand DPO notification. https://www.tilleke.com/insights/thailand-releases-notification-on-data-protection-officer-appointment/16/
228. Gala Law: Thailand PDPC multi-million-baht fines (conflicting total). https://blog.galalaw.com/post/102lvee/thailands-pdpc-signals-tougher-enforcement-with-multi-million-baht-fines
229. Chambers Global Practice Guides 2026: Thailand data protection trends. https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/thailand/trends-and-developments
230. OpenAI: Your data (retention, ZDR, residency). https://developers.openai.com/api/docs/guides/your-data
231. OAIC: Guidance on privacy and commercially available AI products. https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products
232. OpenAI: Speech-to-text guide. https://developers.openai.com/api/docs/guides/speech-to-text
233. caniuse: Background Sync. https://caniuse.com/background-sync
234. WebKit: Updates to Storage Policy. https://webkit.org/blog/14403/updates-to-storage-policy/
235. frequal.com: OggOpus still not working in Safari 18.4. https://frequal.com/java/OggOpusStillNotWorkingInSafari18_4.html
236. WebKit: Features in Safari 18.4. https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
237. WebKit Bugzilla 215884: getUserMedia permission prompts in standalone. https://bugs.webkit.org/show_bug.cgi?id=215884
238. Google Play: User Data policy. https://support.google.com/googleplay/android-developer/answer/10144311
239. Supabase: Available regions. https://supabase.com/docs/guides/platform/regions
240. Vercel: Global network and regions. https://vercel.com/docs/regions
241. firt.dev: iOS PWA compatibility notes. https://firt.dev/notes/pwa-ios/
242. WebKit: News from WWDC25 (Safari 26; Home Screen web apps). https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/
243. WebKit: Web Push for Web Apps on iOS and iPadOS. https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
244. web.dev: Learn PWA, Enhancements (shortcuts). https://web.dev/learn/pwa/enhancements
245. Apple Shortcuts User Guide: run with Action button or Back Tap. https://support.apple.com/guide/shortcuts/apd897693606/ios
246. MacRumors: iOS 18 Control Center and Lock Screen controls. https://macrumors.com/guide/ios-18-control-center
247. caniuse: ContactsManager (Contact Picker). https://caniuse.com/mdn-api_contactsmanager
248. WebKit Bugzilla 273063: Web Push subscription becomes invalid. https://bugs.webkit.org/show_bug.cgi?id=273063
249. Apple Developer Forums 786360: iOS PWA push reliability. https://developer.apple.com/forums/thread/786360
250. Telegram Bot API. https://core.telegram.org/bots/api
251. Meta: WhatsApp Cloud API media. https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media
252. addpipe: Apple SpeechAnalyzer API. https://blog.addpipe.com/apple-speechanalyzer-api/
253. Apple Developer: Accessing the contact store (limited access). https://developer.apple.com/documentation/contacts/accessing-the-contact-store
254. respond.io: WhatsApp general-purpose chatbots ban. https://respond.io/blog/whatsapp-general-purpose-chatbots-ban
255. AssemblyAI pricing. https://www.assemblyai.com/pricing
256. Deepgram pricing. https://deepgram.com/pricing
