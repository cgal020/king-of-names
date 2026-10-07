# Gap-fill: QR contact exchange, card scanning, photo of the person, AI search over own contacts, and OpenAI image handling (as of 7 October 2026)

Scope note: this file only fills gaps left by `personal_crm_core.md`, `personal_crm_other.md`, `business_card_apps.md`, `platform_feasibility.md` and `legal_australia_biometrics.md`. Facts already recorded there are referenced, not repeated. About 40 searches and fetches were made. "(search summary)" means the claim comes from a search-engine summary of the linked page, not from a full fetch of that page. Treat those claims as less certain.

## 1. What do popular digital business card QR codes encode, and how often will a vCard/MECARD-only decoder get structured data?

### Takeaway
By default, every digital card checked (Blinq, Popl, HiHello, Linq, Wave, V1CE, Tapt, Mobilo, Haystack) puts a **profile URL** in its QR code. The phone opens a hosted web page with a "Save contact" button, which on Android downloads a `.vcf`. An embedded vCard QR only appears when the sharer switches to an **"offline" mode**:
- Blinq switches automatically when the phone loses its connection.
- HiHello and Tapt have a manual toggle.
- Wave has an offline QR.
- V1CE's offline QR is a paid legacy feature.

LINE QR codes and WhatsApp contact links also carry URLs, not contact fields. A decoder that only understands vCard/MECARD will mostly come back with just a link.

### Cited Findings
- **Blinq**: when Blinq "detects that your connection has dropped, it automatically switches your card's QR code to an offline version that scans without internet". There is a manual toggle, and it works in the mobile app only. The article does not say which fields the offline QR holds. — [Blinq support: Using Blinq offline](https://support.blinq.me/en/articles/84144-using-blinq-offline)
- **Blinq save path**: recipients need no Blinq account to view the card and save the contact. On Android, tapping "Save Contact" then "Download" saves a `.vcf` file. — [Blinq support: Saving a Blinq card to your mobile contacts](https://support.blinq.me/en/articles/68044-saving-a-blinq-card-to-your-mobile-contacts) (search summary)
- **HiHello offline QR**: in the app, Share, then tap the QR code to "switch to offline sharing mode". The offline code lets others save "name, company, title, phone, and a HiHello card link". Email is not in that list, and you must be logged in before going offline. — [HiHello support: How to Share Your HiHello Card Offline](https://support.hihello.com/hc/en-us/articles/30322306120603-How-to-Share-Your-HiHello-Card-Offline) (search summary)
- **Wave Connect**: offline QR codes store vCard data "directly in the code pattern" ("the code can directly display your name, phone number, email, and other details"). Normal digital cards "usually rely on a link". Article dated 31 Aug 2025. — [Wave blog: Offline QR codes guide](https://wavecnct.com/blogs/offline-qr-codes-guide)
- **V1CE**: the standard QR "points at your V1CE page… their phone needs an internet connection to open the page". The offline QR "embeds your contact details inside the QR itself". "Offline QR is a legacy feature on V1CE Plus at £119.99 / year. It is not available in ClientCapture OS or Free Forever." — [V1CE support: Does V1CE support an offline QR code?](https://support.v1ce.co/features/does-v1ce-support-an-offline-qr-code)
- **Tapt**: with "Share Offline" enabled, scanning the QR "immediately open[s] a 'Save New Contact' form" on the recipient's phone. Offline mode is one-way: you can share your details but cannot receive theirs. — [Tapt help: Using your Tapt card offline](https://help.tapt.io/en/articles/8695549-using-your-tapt-card-offline) (search summary; the page returned 404 when fetched)
- **Popl**: the card opens in the recipient's phone browser and needs no app. To save, they tap "Save Contact" or "Connect with me", then "Save to Contacts". — [Popl support: How others save your information](https://support.popl.co/en/articles/8728463-how-others-save-your-information) (search summary)
  - Popl's QR codes are "linked to your digital business card or lead capture form". Its scanner reads "LinkedIn QR and most third-party QR formats". I found no Popl offline vCard QR for sharing. — [Popl llms: offline lead capture](https://popl.co/llms/offline-lead-capture-app) (search summary)
- **Linq**: the email-signature QR plus a "Save My Contact" link send people to the Linq page. Sharing by text sends "a link to your Linq page and a vcf contact card". — [Linq blog: 7 ways to share](https://buy.linqapp.com/blogs/news/7-ways-to-share-your-digital-business-card-beyond-using-a-nfc-product) (search summary). I found no Linq offline QR.
- **Mobilo**: the profile "opens in the phone's browser and lets them save contact details instantly". — [Mobilo: Share contact card on iPhone](https://www.mobilocard.com/share-contact-card-iphone) (search summary). Mobilo advertises "No-internet QR sharing", as already noted in `business_card_apps.md`. — [Mobilo pricing](https://www.mobilocard.com/pricing)
- **Haystack**: cards "have a QR code and unique URL". New recipients "first see a mobile web version… which they can save directly to their device". — [Haystack FAQ](https://thehaystackapp.com/faq) (search summary)
- **LINE (Thailand)**:
  - A personal friend-invite URL looks like `line.me/ti/p/` plus a random string — [blueeyes.tw guide](https://robot.blueeyes.tw/LINE_autoS_addfriends-en.php) (third-party, low authority)
  - Official accounts use `https://line.me/R/ti/p/{percent-encoded LINE ID}`, which opens the profile or the existing chat — [LINE Developers: sharing your bot / URL scheme](https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme)
  - Neither form contains a name or phone number.
- **WhatsApp**:
  - Click-to-chat links take the form `https://wa.me/<number>`, with the full international number and no zeros, brackets or dashes. An optional `?text=` can be added. — search summary of WhatsApp click-to-chat guidance; the official FAQ [faq.whatsapp.com/5913398998672934](https://faq.whatsapp.com/5913398998672934) ("How to use click to chat") was truncated when fetched.
  - The in-app personal QR code adds you as a contact when scanned in WhatsApp, and can be reset as often as you like, which invalidates old codes. — [Guiding Tech](https://www.guidingtech.com/how-to-use-whatsapp-qr-codes-to-add-contacts/); [Technipages](https://www.technipages.com/add-new-whatsapp-contact-using-custom-qr-code/) (third-party)

### Inferences
- In real networking, most scans of digital cards will give the decoder a **URL** (blinq.me, popl.co, hihello, linqapp, wavecnct, v1ce, tapt, mobilo, haystack, linkedin.com/in, line.me/ti/p, wa.me). A vCard QR will appear mainly when the sharer is offline, or has chosen offline mode in HiHello, Tapt, Wave or V1CE Plus.
- The decoder should therefore:
  - recognise these hosts and store the URL as a "card link" or social field;
  - parse `wa.me/<digits>` into a phone number, since it carries the number directly;
  - record `line.me` URLs as a LINE handle or link, with no name or phone to extract.
- Fetching the vendor's hosted `.vcf` server-side could give structured fields, but each vendor's endpoint is different and undocumented. It may also count as a "profile view" in the sharer's analytics. This is unverified, so it should be a deliberate product decision.
- Pairing a QR link with a photo of the paper card, or a screenshot of the opened profile page sent through the existing LLM extraction, is the practical way to get structured fields from URL-only QRs.

### Gaps
- I did not verify the exact fields in Blinq's offline QR, or whether Popl, Linq or Haystack offer any offline or embedded-vCard QR.
- The exact payload of the WhatsApp personal QR (believed to be a `wa.me/qr/<token>` short link that hides the number) was not confirmed from a primary source.
- The format of a LINE personal QR comes only from a low-authority third-party source.
- No usage statistics show how often people share via offline mode versus links.

---

## 2. Card scanning quality in personal CRMs: OCR vs LLM, image saved, languages, verification (gap-fill only)

### Takeaway
Personal CRMs now call their scanners "AI" but publish almost nothing about languages, accuracy or whether the card image is kept. Dex is still the only one documented to **save the card image** to the contact (already in `personal_crm_core.md`). Mesh can save the scan to the Photo Library.

Contacts+ has moved from its historical human transcription to AI extraction with a confirm-before-save screen. It also accepts card photos through ChatGPT, Claude or Grok via MCP. A **human-verification step before saving** (an editable pre-filled form) is now the norm: Dex, Contacts+.

### Cited Findings
- **Contacts+**:
  - "uses AI to turn any business card, badge, screenshot or photo into a structured, saved contact in seconds". "AI maps each detail to the right field… and shows you the result before you save, so you can confirm or tweak anything in a tap."
  - Limits: Free "a few scans", Premium "100 cards per month", Teams "100 cards per user per month".
  - "Already working in ChatGPT, Claude or Grok? Connect it to ContactsPlus, hand it a photo of the card there, and it sends the details over for you to approve."
  - Languages and image retention are not stated.
  - [Contacts+ business card scanner](https://contactsplus.com/business-card-scanner/)
- **Contacts+ conflict**: an older Contacts+ blog post (undated in the summary) says it "uses Human Transcription". This conflicts with the current AI page. Treat human transcription as historical. — [Contacts+ blog: iPhone business card readers](https://www.contactsplus.com/blog/iphone-business-card-readers/) (search summary)
- **folk**: the scanner launched on 31 Jul 2026. The only quality claim is "AI captures the details faster and more accurately than any existing scanners". The changelog does not cover OCR vs LLM, image retention, languages or a review step. — [folk changelog: Scan business cards](https://www.folk.app/changelog/scan-business-cards)
- **Mesh**: the App Store notes cite "improved business card scanning reliability and scan identity handling" and the option to "save scanned business cards to your Photo Library". — [App Store: Mesh](https://apps.apple.com/us/app/mesh-contacts-crm/id1463073824) (search summary). The Mesh help article "Adding a contact" (updated 18 Jun 2026) does not document scanning at all. — [Mesh KB: Adding a contact](https://library.me.sh/knowledge-base/adding-a-contact/)
- **Connecti5**: lists "scan business cards" as an import route, without saying how the scanning works. — [Capterra: Connecti5](https://www.capterra.com/p/10041360/Connecti5/) (search summary)
- **OpenAI vision limitations relevant to an LLM card reader**: "Performance degrades with non-Latin alphabets, small text, and rotated content" (paraphrased by the fetch tool from the Limitations list). — [OpenAI: Images and vision guide](https://developers.openai.com/api/docs/guides/images-vision)

### Inferences
- An LLM card reader plus a confirm-before-save form matches current best practice (Dex, Contacts+). Keeping the card image, as Dex does, is a small differentiator, and it is useful when extraction is wrong.
- OpenAI's own warning about non-Latin text means Arabic and Thai cards need hands-on testing before any accuracy claim. CamCard is the only incumbent with confirmed Arabic and Thai support (see `business_card_apps.md`).

### Gaps
- I found nothing published on the scanning engine, languages or image retention for Nametrace, folk, Mesh or Connecti5. YourPond has no scanner (see `personal_crm_other.md`).
- I found no independent accuracy tests for personal-CRM scanners.

---

## 3. Photo of the person: who lets users attach their own photo, and who ties it to place and time met?

### Takeaway
The major personal CRMs (Mesh, Dex, folk, Covve, Nametrace, Revere) do **not** document a "take a photo of the person" capture step. Their avatars come from enrichment or address books. Monica and YourPond allow contact photos. The "photo plus place plus time" pattern exists in **small name-memory apps**: Remember Names, Rememorate and NameKeeper.

A new entrant, **Face Sherlock AI** (July 2026), goes further. It offers on-device face matching against a private face library, which is facial recognition in a personal CRM.

### Cited Findings
- **Remember Names: Name Reminder** (iOS):
  - "Add multiple photos to contacts (up to 10 images per name)"
  - "Remember exactly where you met someone", "See your contacts on a map", and "Get reminded of names when you return to meeting spots"
  - AI "Smart Auto-Fill"
  - Privacy label: "The developer does not collect any data". Free with in-app purchases up to a $79.99 lifetime option. Version 5.14.1 (17 Aug 2025). Too few ratings to show a score.
  - [App Store: Remember Names](https://apps.apple.com/hn/app/remember-names-name-reminder/id6504533632?l=en-GB)
- **Rememorate**: "The first step… is to take a photo". You can search contacts "by photo, location on the map, the date/time you met, keywords". — [BlueStacks listing: Rememorate](https://www.bluestacks.com/campaign/co.rememorate.rememorate/en) (search summary; current status not verified)
- **NameKeeper**: the "current address [is] automatically suggested if you allow GPS access", and you can add an optional description and/or photo. — [App Store: NameKeeper](https://apps.apple.com/us/app/-/id1148776555) (search summary)
- **IJustWish**: "captures faces, voices, and details of everyone you meet". Groups have a photo, description and date. — search summary of App Store listings for name-memory apps (no stable URL captured; unverified)
- **Face Sherlock AI**:
  - A "digital 'personal CRM' for faces". Users "search for individuals by uploading a photo", and the app matches against stored profiles.
  - "all user data, including face photos and profiles, stays exclusively on your device"
  - First released 14 Jul 2026
  - [mwm.ai listing: Face Sherlock AI](https://mwm.ai/apps/face-sherlock-ai/6789845307) (aggregator of App Store data)
- **Revere – Remember People**: has "dedicated spaces for family, how you met, their work". The listing does not document photos of people. — [App Store FR: Revere](https://apps.apple.com/fr/app/revere-remember-people/id1260429188)
- **Mesh**: auto-updated contact cards include "profile photos" pulled from connected sources (App Store, search summary). The KB article on adding a contact does not document uploading a photo. — [App Store: Mesh](https://apps.apple.com/us/app/mesh-contacts-crm/id1463073824); [Mesh KB](https://library.me.sh/knowledge-base/adding-a-contact/)
- Already covered elsewhere:
  - Monica supports photo uploads; Dex accepts photos by WhatsApp/SMS but has no confirmed person-photo field; Contacts+ enrichment adds public photos — `personal_crm_core.md`, `personal_crm_other.md`
  - YourPond has contact photos — `personal_crm_other.md`

### Inferences
- "Photo of the person plus geotag plus map" is proven demand in a niche: Remember Names even re-surfaces names when you return to a place. But it is absent from the funded personal CRMs. The prototype's combination of person, card and place photos, auto-geotagged and shown on a map, is a differentiator against Mesh, Dex and folk. It is not unique against small name-memory apps.
- Face Sherlock AI shows that face-matching "search by photo" is being shipped. Doing this in the prototype would turn plain photos into biometric processing (see GDPR Recital 51 and the OAIC determinations in `legal_australia_biometrics.md`). It also conflicts with OpenAI policy if done through OpenAI (section 5). A clear "we never run face recognition" stance is a cleaner position.

### Gaps
- I did not verify whether YourPond, Nametrace, Covve or folk allow a user-taken photo of the person, as opposed to an imported avatar.
- I did not verify Rememorate's or IJustWish's 2026 status, pricing, or primary listing text.
- I found no download or review volume for any name-memory app, so demand size is unknown.

---

## 4. AI natural-language search over one's own contacts: who, what queries, how, price, complaints

### Takeaway
There are two patterns:
- **Built-in LLM chat**: Mesh Nexus (OpenAI), Revere "Ask Revere", Connecti5, Dex's text and WhatsApp bot, folk's "ask folk", Nametrace.
- **MCP export to the user's own ChatGPT or Claude**: Dex (Professional plan), folk, BlaBlaNote (Pro), Contacts+, Blinq.

Location-style queries are documented by Mesh ("who has been to X") and Connecti5 (distance and location). Event-style queries are documented by Dex ("who did I meet at the Google event…"). No one documents "who did I meet in [city]" based on a **where-met geotag**.

The only accuracy evidence is Mesh's own hallucination warning, plus a competitor (Dex) review describing Nexus as inconsistent.

### Cited Findings
- **Mesh Nexus**:
  - "an AI navigator for your network, powered by OpenAI, and is an optional add-on feature of Mesh". It uses "the information you've provided to Mesh, such as notes and sources".
  - "nothing runs unless you actively use Nexus"
  - The docs warn of "AI hallucination" (it may mention people or facts you don't know) and advise checking names against the cited sources.
  - Use cases: reasons to reconnect, outreach and intro emails, gift ideas.
  - Updated 22 Jun 2026.
  - [Mesh KB: Nexus](https://library.me.sh/knowledge-base/nexus/)
- **Mesh Nexus query types**: who in your network "has been to a specific place, works at a particular company, or is knowledgeable about a certain topic". — [Mesh KB: Nexus](https://library.me.sh/knowledge-base/nexus/) (search summary)
- **Mesh pricing**: the pricing page names Nexus but gives no per-plan AI limits. Plans are Personal (free, 1,000 contacts), Pro ($10/mo), Team ($40/seat/mo) and Enterprise. — [Mesh pricing](https://me.sh/pricing)
- **Mesh complaints**: a Dex blog post says Nexus is "inconsistent—some queries return exactly what you want, while others miss obvious results", and that App Store reviewers flagged Nexus not loading on contact pages. — [Dex blog: Mesh review (6 Apr 2026)](https://getdex.com/blog/mesh-review/) (search summary; competitor source, so biased)
- **Dex MCP**:
  - "MCP access requires a Dex Professional subscription". Endpoint `https://mcp.getdex.com/mcp`, with OAuth 2.0 or a bearer API key.
  - Clients include Claude (directory connector), ChatGPT (app), Cursor, VS Code, Gemini CLI and Zed.
  - Tools let you "Search, create, update, and merge contacts. Manage tags, groups, notes, reminders, and custom fields."
  - [Dex: AI agents](https://getdex.com/ai-agents.md)
  - A third-party listing says contact search works by name, email or company. — [mcp.so: Dex MCP Server](https://mcp.so/servers/dex-mcp-server?tab=tools) (search summary)
  - The built-in Dex text and WhatsApp query example is already in `personal_crm_core.md`.
- **Revere – Remember People** (iOS):
  - "Ask open-ended questions about people and Revere will answer based on your notes about them"
  - AI search, voice dictation and note cleanup are Premium: €4.99/month or €49.99/year.
  - Rated 3.0 from 5 reviews (FR store). Updated about 3 Oct 2026 (v4.14.1).
  - [App Store FR: Revere](https://apps.apple.com/fr/app/revere-remember-people/id1260429188)
- **Connecti5** (iOS, Android, web):
  - "AI-powered natural language search to find contacts based on profession, location, company, or context", plus a "private map" with "distance-based searches to find nearby connections". — [Capterra: Connecti5](https://www.capterra.com/p/10041360/Connecti5/) (fetched); search summary of [hunted.space](https://hunted.space/product/connecti5)
  - Pricing in INR: Proximity ₹199/mo (500 contacts, 10 km radius) or ₹1,999/yr; Elite ₹499/mo (5,000 contacts, 20 km) or ₹4,999/yr; a free plan exists.
  - Zero Capterra reviews.
  - [Capterra: Connecti5](https://www.capterra.com/p/10041360/Connecti5/)
- **Contacts+**: "AI Assistants (MCP)" integration, including card capture from ChatGPT, Claude or Grok. — [Contacts+ scanner page](https://contactsplus.com/business-card-scanner/)
- Already covered elsewhere:
  - folk "ask folk a question" plus folk MCP; BlaBlaNote MCP (Pro, €9/mo annual); Nametrace "Ask your network natural questions"; Blinq MCP over notes; CardDrop natural-language search — `personal_crm_core.md`, `personal_crm_other.md`, `business_card_apps.md`

### Inferences
- AI search over your own contacts is now table stakes. Differentiation will come from **what data the query can use**: where and when you met (GPS and date), photos, and voice-note content. Most rivals rely on enrichment and email data instead.
- MCP-only approaches push cost and privacy onto the user's own assistant, which then also sees the data. A built-in "Ask AI" that sends only the user's own records, with the result linked back to source records, follows Mesh's "cite sources" mitigation for hallucinations.
- Showing source contacts for every answer and saying "no match" plainly is the clearest lesson from the Nexus complaints.

### Gaps
- I did not verify Nametrace's, folk's or Revere's AI providers, query limits or accuracy.
- I found no independent accuracy evaluation of any contact-search AI, and no Reddit sentiment (blocked in earlier sessions).
- I found no primary App Store review text about Nexus failures; that claim comes from a competitor's blog.

---

## 5. OpenAI handling of image inputs, policy on identifying people, and Apple 5.1.2(i)

### Takeaway
OpenAI does not publish a separate retention rule for images. They fall under the general API rules: no training by default and up to 30 days of abuse-monitoring logs (see `platform_feasibility.md`). There are three image-specific points:
- **Images flagged by the CSAM classifier are kept for manual review even under ZDR.**
- `/v1/responses` and `/v1/chat/completions` are ZDR-eligible, but **Responses stores application state for 30 days by default** unless `store` is false.
- **`/v1/files` is not ZDR-eligible**, and files are kept until deleted.

OpenAI's usage policy bars building "facial recognition databases without data subject consent". Its vision models are trained to refuse "who is this person" requests.

### Cited Findings
- **CSAM scanning**: "Image and file inputs are scanned for CSAM content upon submission. If the classifier detects potential CSAM content, the image will be retained for manual review, even if Zero Data Retention, Modified Abuse Monitoring, or Private Retention with PSP is enabled." — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- **Abuse monitoring**: "By default, abuse monitoring logs are generated for all API feature usage and retained for up to 30 days, unless longer retention is required by law." — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- **ZDR-eligible endpoints**: `/v1/chat/completions`, `/v1/responses`, `/v1/images/generations`, `/v1/images/edits`, `/v1/embeddings`, `/v1/audio/transcriptions`, `/v1/realtime`, `/v1/moderations` and others.
- **Not ZDR-eligible**: `/v1/files`, `/v1/conversations`, `/v1/vector_stores`, `/v1/assistants`, `/v1/threads`, `/v1/batches`, `/v1/fine_tuning/jobs`, `/v1/evals` and others.
- **Responses state**: "the Responses API has a 30 day Application State retention period by default, or when the `store` parameter is set to `true`". Under ZDR, `store` "will always be treated as `false`".
- **Retained objects**: "Objects that are not deleted via the API or dashboard are retained indefinitely". Deleted Assistants-related objects are removed 30 days after deletion.
- All four bullets above: [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- **Training**: API data is not used for training unless the customer opts in. — already cited in `platform_feasibility.md` (same page)
- **The vision guide is silent on retention**: it documents formats (PNG, JPEG, WEBP, non-animated GIF) and limits, and that the system "blocks the submission of CAPTCHAs". It does not say how image inputs are retained. — [OpenAI: Images and vision](https://developers.openai.com/api/docs/guides/images-vision)
- **Usage policy**: OpenAI services may not be used for "facial recognition databases without data subject consent" or "real-time remote biometric identification in public spaces". Under "Respect privacy" it bars attempts to "aggregate, monitor, profile, or distribute individuals' private or sensitive information without their authorization". — [OpenAI Usage Policies](https://openai.com/policies/usage-policies/) (search summary; the page returned 403 on fetch, so the wording is not verified verbatim and the effective date is unconfirmed)
- **Model Spec (18 Dec 2025 version)**: "The assistant must not respond to requests for private or sensitive information about people, even if the information is available somewhere online." No face-specific clause was found in that version. — [OpenAI Model Spec 2025-12-18](https://model-spec.openai.com/2025-12-18.html)
- **GPT-4V System Card (25 Sep 2023)**: the model "refuses requests for… Identity (e.g. a user uploads an image of a person and asks who they are, or a pair of images and asks if they're the same person)", "Sensitive traits (e.g. age, race)" and "Ungrounded inferences". OpenAI could "steer the model to refuse this class of requests more than 98% of the time, and steer its accuracy rate to 0%". — [GPT-4V System Card (PDF)](https://cdn.openai.com/papers/GPTV_System_Card.pdf), pp. 4 and 13
- **Apple 5.1.2(i), exact wording**: "Unless otherwise permitted by law, you may not use, transmit, or share someone's personal data without first obtaining their permission… You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (verified in `legal_australia_biometrics.md` the same day; not re-fetched here)

### Inferences
- **Card photos**:
  - Send them inline (base64) to `/v1/responses` or `/v1/chat/completions` with `store: false` set explicitly, because the Responses default keeps 30 days of state.
  - Never upload through `/v1/files`, which is not ZDR-eligible and keeps files until deleted.
  - Crop to the card before sending, to remove incidental faces.
  - Disclose "OpenAI, US, up to 30 days abuse monitoring" in the privacy policy and in the Apple 5.1.2(i) consent screen.
- **Person photos**: do not send them to OpenAI at all. There is no product need. Identity requests are refused by design and are against policy when used to build face databases. Sending them would make OpenAI a recipient of potentially biometric-adjacent third-party images. Keep person photos only in the app's own storage.
- **Place photos**: low risk, but the same transport rules apply if they are ever sent for captioning.
- **Ask AI**: sending the user's own text records to OpenAI is a "third-party AI" share under Apple 5.1.2(i), so it needs the same explicit-permission screen as card OCR. A PWA is not bound by the App Store, but the native phase will be.

### Gaps
- The OpenAI Usage Policies page could not be fetched (403), so the facial-recognition wording and effective date come from a search summary.
- I found no OpenAI system card for current GPT-5.x vision models confirming that the person-identification refusal still applies. The 2023 GPT-4V card is the latest primary evidence found.
- I did not confirm whether image inputs held in Responses application state (`store: true`) are kept as images or only as references.
- OpenAI's DPA remains unfetched (403 in earlier sessions).
