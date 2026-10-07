# OS Built-ins and Niche "Where-I-Met / Contact-Map / Name-Memory" Apps (state as of 7 Oct 2026)

Method note: research ran 7 Oct 2026. The session's web-search budget ran out partway through, so a few items rest on search snippets or secondary sources. Each one is flagged. App Store pages show the month and day without a year for updates from the current year, so dates such as "Jul 29" are inferred to mean 2026. They are marked "(yr inferred)". Ratings are US App Store counts unless stated otherwise.

---

## Q1. What do the built-in Apple / Google / Samsung / Microsoft features offer in the iOS 26–27 / Android 16 era for "remember who I met, where and when"?

### Takeaway
None of the platforms has a "where/when we met" field, a map of contacts by meeting place, or a city filter over contacts. Apple's new AI layers (Siri AI with personal context in iOS 27, and Visual Intelligence turning business cards and flyers into contacts and events) and Google's Gemini Contacts connector make capture and lookup faster. They do not record meeting context. Both are also limited to English or a few languages, launched as betas or behind waitlists, and support neither Arabic nor Thai. Samsung dropped native card scanning from Contacts. Microsoft Lens, along with its business-card mode, was retired in 2025.

### Cited Findings

**Apple: Apple Intelligence availability and languages**
- Apple's support page (last updated 14 Sep 2026) lists the Apple Intelligence languages: English, Danish, Dutch, French, German, Italian, Norwegian, Portuguese, Spanish, Swedish, Turkish, Vietnamese, Chinese (simplified and traditional), Japanese and Korean. **Arabic and Thai are not on the list.** — [Apple Support 121115](https://support.apple.com/en-us/121115)
- Apple Intelligence "will not currently work" on supported devices bought in mainland China when the Apple Account region is also mainland China. Devices: iPhone 15 Pro, iPhone 16 or later, and M1+ iPad/Mac. Storage needed is up to 14 GB on newer flagships and up to 8 GB on other devices. — [Apple Support 121115](https://support.apple.com/en-us/121115)
- On the UAE: "Arabic is still absent." Users who run the iPhone in Arabic lose Apple Intelligence and Siri AI. Running the device in English is the workaround, and Apple has given no timeline for Arabic. — [tbreak (UAE)](https://tbreak.com/apple-intelligence-arabic-uae-watch-hypertension/) and [tbreak WWDC26](https://tbreak.com/wwdc26-apple-siri-ai-apple-intelligence/)
- Apple's iOS 27 feature-availability page lists the languages for Visual Intelligence ("Events from Flyer", "Identify Places", "Plants and Animals"), Siri AI, Notes audio transcription, Phone call transcription and Journaling Suggestions. **None of them includes Arabic or Thai.** Dictation does include "Arabic (Saudi Arabia, United Arab Emirates)" and "Thai (Thailand)". Notes audio transcription covers Chinese (Traditional), English, French, German, Japanese, Korean, Portuguese (Brazil) and Spanish. Phone call transcription covers Chinese (Traditional); English (AU, CA, IN, NZ, SG, UK, US); Japanese; Korean; and Spanish (MX, US). — [Apple iOS Feature Availability](https://www.apple.com/ios/feature-availability/). Caveat: the page is long, and a second fetch could not reproduce the exact list of English regional variants, so it is unverified whether an "English (UAE)" variant appears.
- In Sept 2025 (iOS 26), Apple Intelligence covered English, French, German, Italian, Portuguese (Brazil), Spanish, Chinese (simplified), Japanese and Korean. Danish, Dutch, Norwegian, Portuguese (Portugal), Swedish, Turkish, Chinese (traditional) and Vietnamese were announced as coming. — [Apple Newsroom, Sep 2025](https://www.apple.com/newsroom/2025/09/new-apple-intelligence-features-are-available-today/)

**Apple: Siri personal context / Siri AI**
- The personal-context Siri was delayed several times: first from iOS 18, then past its iOS 26.4 target to iOS 26.5 or iOS 27, after testing showed accuracy and latency problems. — [ChannelNews](https://www.channelnews.com.au/apples-ai-powered-siri-upgrade-hits-new-delays-ahead-of-ios-26-4/); [Macworld](https://www.macworld.com/article/2813651/sorry-siri-fans-dont-expect-those-delayed-apple-intelligence-features-until-2026.html)
- **iOS 27 shipped on 14 Sep 2026** with "Siri AI", which can "use personal context to find information across your messages, emails, photos, and other content". It also adds a dedicated Siri app with conversation history. Compatible iPhones are the 15 Pro/Pro Max, the iPhone 16 family, iPhone Air and "iPhone Duo". — [9to5Mac](https://9to5mac.com/2026/09/14/ios-27-now-available-features-compatible-iphones/)
- Siri AI is a **waitlisted English beta** in 8 regions: US, UK, Canada, Australia, Ireland, India, New Zealand and South Africa. It is not available in China and is "not initially available on iPhone and iPad in the European Union". The iOS 27.2 beta adds French, Japanese, Korean, Portuguese and Spanish. Semantic search spans Mail, Messages, Photos, Notes, Reminders, Calendar and Files. — [iGeeksBlog](https://www.igeeksblog.com/siri-ai-ios-27-features/). Secondary source. It conflicts with the broader language list on Apple's feature-availability page, so treat the 8-region list as the launch state.

**Apple: Visual Intelligence and Live Text (camera or screenshot to contact or event)**
- iOS 26 brought Visual Intelligence to screenshots. Users can "add an event from a flyer on their iPhone screen to their calendar, with a single tap". That calendar feature was **English only** at launch. — [Apple Newsroom, Sep 2025](https://www.apple.com/newsroom/2025/09/new-apple-intelligence-features-are-available-today/); [Macworld](https://www.macworld.com/article/2879052/how-to-use-visual-intelligence-to-analyze-any-screenshot-in-ios-26.html)
- In iOS 26, Visual Intelligence "can add addresses to your contacts". — [Macworld](https://www.macworld.com/article/2879052/how-to-use-visual-intelligence-to-analyze-any-screenshot-in-ios-26.html)
- WWDC26 (OS 27): Visual Intelligence gains "adding to contacts, saving multiple calendar events". Contacts it adds, for example from a business card, are written to CNContactStore. — [Apple Developer WWDC26 session 297](https://developer.apple.com/videos/play/wwdc2026/297/) (from the search snippet; the page was not fetched in full). In iOS 27, Visual Intelligence can "Import contacts" by photographing business cards. — [iGeeksBlog](https://www.igeeksblog.com/siri-ai-ios-27-features/)
- Third-party app "Visual IQ" plugs into iOS 26 Visual Intelligence and imports several people from business cards or posters into Contacts. — [Visual IQ press](https://www.cromulentlabs.com/visualiq/press/)

**Apple: Contacts app fields, privacy and developer constraints**
- The Notes field is a free-text catch-all that can be typed or dictated. There is no structured "met at" field. — [Dummies](https://www.dummies.com/article/technology/electronics/cell-phones/iphones/iphone-contact-fields-related-name-social-profiles-notes-and-custom-fields-157077/) (older, undated reference)
- iOS 26 lets users add people to Contacts straight from a message thread and adds an "Add Contact" button in group chats. — [Nerds Chalk](https://nerdschalk.com/36-new-features-in-ios-26-that-you-might-have-missed-but-apple-made-sure-you-knew/)
- iOS 16 added contact Lists, duplicate merging and list export, along with field filtering when sharing a contact. — [Gadget Hacks](https://ios.gadgethacks.com/how-to/your-iphones-contacts-app-just-got-its-biggest-update-ever-0385142/)
- **iOS 18 added "Limited Access" to contacts.** With it, third-party apps see only the contacts the user chooses, through the ContactAccessButton or the contactAccessPicker. — [Apple WWDC24 "Meet the Contact Access Button"](https://developer.apple.com/videos/play/wwdc2024/10121/)
- **Reading or writing the Contacts Notes field from a third-party app needs the `com.apple.developer.contacts.notes` entitlement, and Apple must approve it** (request URL: developer.apple.com/contact/request/contact-note-field). Without it, fetching notes fails with `CNError.unauthorizedKeys`. The rule applies from iOS 13. — [Apple Developer docs (JSON)](https://developer.apple.com/tutorials/data/documentation/bundleresources/entitlements/com.apple.developer.contacts.notes.json)
- A user review of a contacts app captures the gap: people met at events end up "lost in the mix of 100s or 1000s of contacts… without any context". — [App Store "Contacts" app reviews](https://apps.apple.com/us/app/contacts/id1069512615?see-all=reviews)
- Apple Maps can show the people in Contacts on a map, based on their saved **addresses** (Maps → bookmarks → Contacts). — [Dummies](https://www.dummies.com/article/technology/electronics/tablets-e-readers/how-to-use-maps-contacts-on-your-iphone-196869/) (old; not verified on iOS 26/27)

**Apple: Journal / Journaling Suggestions**
- Journaling Suggestions draws on workouts, media, "whom you communicated with via texts, calls, and FaceTime", "photos and videos from your library, names of people and pets", and "places you've recently been, including information about events". Bluetooth detects "the number of your mutual contacts who are nearby", but "Contacts' names and locations are not shared with you." The data is end-to-end encrypted in iCloud. — [Apple Privacy: Journaling Suggestions](https://www.apple.com/legal/privacy/data/en/journaling-suggestions/)
- Significant Locations feed the suggestions, and nearby contacts raise the priority of "moments you've shared". — [Apple AU privacy page](https://apple.com/au/legal/privacy/data/en/journaling-suggestions) (from the search snippet)

**Apple: Notes audio transcription**
- Notes on iOS 18 can record audio and transcribe it, on iPhone 12 or later. The iOS 18 languages were English (US, UK, AU, CA, IN, IE, NZ, SG), Spanish, French, German, Japanese, Mandarin, Cantonese and Portuguese (BR). — [AppleInsider](https://appleinsider.com/inside/ios-18/tips/how-to-record-audio-and-create-transcripts-in-notes-in-ios-18); [RouteNote](https://routenote.com/blog/?p=102689) (secondary). The iOS 27 list is in the feature-availability entry above.

**Google**
- **Gemini plus Google Contacts (2026).** 9to5Google spotted the connector on 5 Jun 2026, first on AI Ultra accounts with Gemini Spark. It can find, add, edit and delete contacts, search by name, number or email, and "Remind you about important dates… like birthdays". — [9to5Google](https://9to5google.com/2026/06/05/gemini-google-contacts/)
- The Gemini Help page gives the example prompts "Check my contacts for Akira's birthday" and "Add Luka C to my contacts with the phone number…". Requirements: 18+, eligible for Personal Intelligence, a personal Google Account and Keep Activity switched on. It runs only in the Gemini mobile app and gemini.google.com. The search snippet adds that it is **US only, Gemini Spark only and English only**. The help page says nothing about notes or how and where people met. — [Gemini Apps Help 17100956](https://support.google.com/gemini/answer/17100956)
- Google Contacts lets users add a photo, street address and notes on Android, under "Add fields". — [Google Contacts Help](https://support.google.com/contacts/answer/1069522?hl=en&co=GENIE.Platform%3DAndroid)
- Google Contacts has had **Reminders** on significant dates (Birthday, Anniversary or Custom) since Nov 2023, with alerts on the day, 2 days, 7 days or 2 weeks before. It also has a "Highlights" tab with a "For you" birthday feed. — [9to5Google 2023](https://9to5google.com/2023/11/22/google-contacts-reminder-notifications/); [Android Central](https://androidcentral.com/apps-software/google-contacts-gains-reminders-plus-notifications-feature); [Android Police](https://www.androidpolice.com/google-contacts-new-birthday-alerts-section-highlights-tab/). This **contradicts** YourPond's claim that Google Contacts has "No reminders" — [YourPond blog, Jul 2026](https://www.yourpond.io/blog/best-contact-tracker-apps-2026), which is a biased source.
- Google Lens recognises a business card and offers to add it to Contacts through OCR. The feature was Pixel-only at first and later reached Android generally. — [PopSci](https://www.popsci.com/story/diy/use-google-lens-smartphone-camera/); [Technipages](https://www.technipages.com/what-is-google-lens-and-how-to-use-it) (secondary and undated; not verified against Google Help in 2026)

**Samsung**
- Samsung Contacts used to scan and save business cards but **removed the feature**. Users report it gone since around the Galaxy S10+ update. — [Samsung Community thread](https://r2.community.samsung.com/t5/Galaxy-S/BUSINESS-CARD-READER/td-p/3352584) (user forum; the page returned 403 on fetch, so this rests on the search snippet)
- The replacement is One UI 5's "Extract text": long-press any input field, or use the keyboard toolbar, to OCR phone numbers or emails into a field. It is context-aware but works one field at a time. — [Samsung Community](https://r2.community.samsung.com/t5/Tech-Talk/Extract-Text-Feature-Keyboard-One-UI-5/m-p/13704524)

**Microsoft**
- **Microsoft Lens has been retired.** Retirement began 15 Sep 2025. The app left the App Store and Google Play by 15 Nov 2025 and stopped scanning after 15 Dec 2025. Users are pointed to Microsoft 365 Copilot. Lens's business-card mode used to save contacts to iOS Contacts, OneNote or Outlook. — [WebNots](https://www.webnots.com/microsoft-to-discontinue-lens-app-shifts-focus-to-ai-powered-copilot/); [GetCoAI](https://case-studies.getcoai.com/news/dim-future-microsoft-lens-app-shutting-down-beginning-in-fall-as-users-directed-to-copilot)

**What the OS cannot do (cited)**
- Publisher comparison tables mark Apple and Google Contacts with "No" for map view, city filter and connection tracking. — [YourPond, Mar 2026](https://www.yourpond.io/blog/best-apps-tracking-where-friends-live) (vendor-biased, but consistent with every other finding)
- Google Contacts lists no where-or-when-met field among its documented fields. — [Google Contacts Help](https://support.google.com/contacts/answer/1069522?hl=en&co=GENIE.Platform%3DAndroid)

### Inferences
- **Capture speed.** iOS (Visual Intelligence or NameDrop) and Android (Lens) can turn a card or phone tap into a contact in seconds. Adding the meeting context is still a manual typed note in a free-text field. No platform stamps a contact with GPS or a date by default.
- **Location and date of meeting.** No built-in records them. The Journal app logs place and nearby-contact counts but never ties them to a named contact. Photos' People and Places can act as an indirect "where did I see X" if the user took a photo, but this is the user's own workaround, not a designed feature (People/Places specifics were not verified this session).
- **Searchable notes and AI search.** Siri AI (iOS 27) and Gemini (Contacts connector) can now answer some natural-language questions about contacts. Both are English or US only, in beta or behind a waitlist, and neither indexes "where we met" because the data does not exist. "Who do I know in Bangkok?" only works if the user typed a Bangkok address or note.
- **Regional implications.** UAE users with Arabic devices, and Thai users with Thai devices, get none of the Apple Intelligence or Siri AI capture help. A PWA with its own LLM extraction, supporting Arabic and Thai, would face no OS-native competition in those languages, though English-language UAE and Thai users do get the Apple features.
- **Sync constraints for planned native apps.** On iOS, writing "met at…" into the Contacts Notes field needs an entitlement that Apple approves case by case, and iOS 18's Limited Access means users may share only some contacts. Phone-book sync should rely on custom fields the app owns, or treat notes write-back as optional.

### Gaps
- NameDrop: I could not retrieve Apple's NameDrop article (the guide page did not render). It is unverified whether NameDrop records the date or location of an exchange. My belief that it does not is unconfirmed.
- Live Text business-card flow: no official Apple page was retrieved, and the search budget ran out before I could get one.
- Apple Photos "People & Places" and the current Apple Maps contacts layer on iOS 26/27 were not verified.
- Samsung One UI 8 / Galaxy AI people features (Now Brief, Transcript Assist, Bixby Vision card OCR) were not researched because the search budget ran out. Samsung's current card-to-contact flow is unverified.
- A claim that iOS 27 Siri "can add information about people to Contacts, like birthdays or additional phone numbers" appeared in a search summary, but I could not tie it to a specific fetched source, so it is excluded.
- It is unverified whether the Apple Contacts app search covers the Notes field.
- No official Google Help page for Lens card-to-contact in 2026 was retrieved.
- Gemini Contacts' US, Spark and English restrictions come from the search snippet. The fetched page did not show them, and Gemini's plan names and prices were not checked.

---

## Q2. Niche apps: what they do, platforms, last update, ratings, pricing, standout features, complaints

### Takeaway
There are many small indie apps, and several do exactly "log where and when I met someone and show it on a map": Quis, MetMe, Remember Names (Chestwick), GEOnameWizard, Remet, Known Names and People (Hidden Spectrum). Every one is small. The most-rated has 110 US ratings (Revere) and most have between 1 and 24. Most are iOS-only and local-only. Address-mapping apps (Sidewalk, Contacts Map) map where contacts live, not where you met them. Event apps (Swapcard, Brella, Grip) capture leads inside the event and are paid for by organizers or exhibitors.

### Cited Findings

**A. "Where/when I met" + map apps (most relevant)**
- **Quis: Your Contacts on a Map** (Quis Technologies, LLC). iOS and Android. **Free**, no in-app purchases listed. Rated 4.6★ from 10 ratings. Version 5.0.4 on "Jul 29" (yr inferred 2026); 5.0.0 was a "complete rebuild featuring map view, card scanner, and contact context". — [App Store](https://apps.apple.com/us/app/quis-your-contacts-on-a-map/id1558252000)
  - Records "the place and the moment you met" automatically. The map shows people by meeting location, home address, or the city and country inferred from their phone number. AI card scanning takes about 1.5 s. The list sorts by when you met. Search is typo-tolerant across name, company, place, notes and number. It can filter by missing photo or birthday, and has an on-device insights dashboard. Two-way sync with native contacts and vCard import/export. Data stays in a local database, with "no copy on our servers", no account and no ads. Planned: catch-up reminders, voice search and social-profile auto-fill. — [quis.co](https://quis.co/); [Google Play listing](https://play.google.com/store/apps/details?id=co.quis.quis&hl=en_AU&gl=US)
  - Complaint: the app shows "bright white in dark mode", which made one reviewer wonder if it is outdated. — [App Store](https://apps.apple.com/us/app/quis-your-contacts-on-a-map/id1558252000)
- **MetMe** (developer Mattan Ingram). iOS only. Users type or speak something like "Met Sarah at the coffee shop, she's a designer at Figma" and **on-device Apple Intelligence** pulls out the fields. Views: timeline, calendar of the days people were added, and a **map of where people were met**. Works offline with no account and writes into iOS Contacts. Processing takes under 5 s per contact. Requires iOS 26+ and an iPhone 15 Pro or newer. **Free, in TestFlight beta, with the App Store release "coming soon".** — [metme.app](https://metme.app/); [FeedBagel/Product Hunt summary, about 7 months before Oct 2026](https://feedbagel.com/post/metme-ios-app-ai-powered-contact-management-with-contextual-memory)
- **People** (Hidden Spectrum). iOS. Saves where you met someone. A GPS "current event" feature lets you jot down several names at once, and a lock-screen control gives quick capture. Also: emoji tags, social links, mutual connections between app users, and archiving. Data stays on the device and in private iCloud. Beta closed 28 Jan 2025, with launch expected Feb 2025. — [designboom, Jan 2025](https://www.designboom.com/technology/people-app-helps-users-remember-when-where-how-they-met-everyone-contacts-iphone-01-24-2025/). Current 2026 status and pricing are unverified.
- **Remember Names: Name Reminder** (Chestwick Investments Inc). iOS plus Apple Watch. Rated 4.3★ from 24 ratings. **Last version 5.14.1 on 17 Aug 2025**, about 14 months before this research. Free, with in-app purchases at $1.99, $4.99 and $29.99, or $79.99 lifetime. Features: **location-based reminders when you return to where you met someone**, a **map with clustering**, up to 10 photos per person, **recorded voice pronunciation of names**, Name Recall and Photo Match quizzes, groups and notes, AI auto-fill, and widgets. Reviews call it "very fairly priced" and better organised than the stock Contacts app. — [App Store](https://apps.apple.com/us/app/remember-names-name-reminder/id6504533632)
- **GEOnameWizard / NameWizard** (YOURFULLSTACK, LLC). iOS. **$7.99 paid up front.** Rated 4.8★ from 4 ratings. Version 2.0.9 on "Sep 16" (yr inferred 2026). Stores name, photo, notes, company, title, tags and "the location where you met". A "Nearby" view and a map of everyone saved. Push reminders to meet people. Local storage with **JSON export and import**. Sign in with Apple. One reviewer: walk into a Starbucks you go to often and "it shows the people you added that you met there". — [App Store](https://apps.apple.com/us/app/id6450182834)
- **Remet – Remember People** (Feng Chi Hsu). iOS, iPad, Mac and Vision. Rated 5.0★ from 1 rating. Version 1.2.2 on "Mar 10" (yr inferred 2026). Free, with Premium at $2.99 or $19.99. Photo-first: it reads **GPS coordinates from imported photos**, offers "Open in Maps", detects faces, sets face crops as the contact photo, runs quizzes, and tags by context (Work, Gym, Book Club). Everything stays on the device. — [App Store](https://apps.apple.com/us/app/id6757997989)
- **Known Names: Remember Everyone** (Jubulah Labs). iOS. Free. Rated 5.0★ from 1 rating. Version 1.1.1 on "Apr 10" (yr inferred 2026). Search by location ("conferences or coffee shops"), workplace or name. Timeline of recent meetings. Available in 24 languages. — [App Store](https://apps.apple.com/us/app/id6751477026)
- **YourPond** (vendor that also publishes comparison blogs). iOS and web; Android was only "implied" on the site and is unverified. **Free up to 25 contacts. Pro is $10/month or $100/year.** Capture by plain-language typing, or by voice on iOS, with extraction of names, locations, jobs and "how you met". Map with full location history and a **city filter** ("see who's nearby before traveling"). "Ripples" relationship graph and family trees. "Moments" record who attended. Birthday, anniversary and custom reminders. AI search, export, contacts sync and account deletion. "Never used to train AI." — [yourpond.io](https://www.yourpond.io/); [AlternativeTo](https://alternativeto.net/software/yourpond/about); [YourPond blog, Jul 2026](https://www.yourpond.io/blog/best-contact-tracker-apps-2026)
- **Connecti5** (vendor blog dated 7 Apr 2026). iOS, Android and web. Card scan in about 5 s. **Private contact map** with nearby filters at 1, 5 and 10 km. Filters by industry, profession, location, group and label. Groups by city or event. "Ask My Network" natural-language AI search, including **Hinglish**. Route planning. Import from phone, Google or Excel. Free to start with no card needed; prices are not published. — [connecti5.com](https://connecti5.com/); [Connecti5 blog](https://connecti5.com/blog/app-to-track-people-you-meet)

**B. Personal-CRM-style apps with a "how/where met" field**
- **Revere – Remember People** (Revere Inc). iOS. Rated **4.7★ from 110 ratings, the most of any app in this set**. Version 4.14.1, released about 4 days before research (early Oct 2026). Free, with **Premium at $4.99/month or $49.99/year**. Notes on how you met, location, photos, voice dictation, reminders with snooze, birthdays, AI search, groups, Siri and export. Complaints: "the app will not load without internet access", the subscription feels expensive, and users want connection mapping. The developer says offline mode and more AI are in development. — [App Store](https://apps.apple.com/us/app/revere-remember-people/id1260429188)
- **Rememorate** (Rememorate, LLC, USA). iOS and Android. Plans: **Icebreaker** free for up to 50 contacts; **Socialite** $9.99/year for 150; **Networker** $3.99/month or $29.99/year for unlimited; **Enterprise** $9.99 per user per month with LDAP/G-Suite login and CRM/HRMS integrations. Every tier is "Fully featured". — [rememorate.com/pricing](https://rememorate.com/pricing); [rememorate.com](https://rememorate.com/). Ratings, last update and feature detail are unverified.
- **PeopleNote** (Kai Chen). iOS, iPad and Mac. **$9.99 paid up front.** No ratings yet. Calendar-linked alerts before a meeting that show a "cheat sheet". Logs interactions with location, topic and notes. Local encrypted database with no cloud. — [App Store](https://apps.apple.com/us/app/id6756147404)
- **Covve Scan** (business cards and badges). iOS, Android and web portal. OCR across "60+ languages, online or offline". Records where and when contacts were met. **Voice capture** of leads and notes, AI enrichment, and CRM sync and export. Individual plan **$12/user/month** or $84–120/user/year. Team plans: Starter $12/month or $119/year; Team $20/month or $199/year, with a $6 or $60 CRM add-on; Business $31/month or $299/year. 14-day trial. — [covve.com](https://www.covve.com/)
- From YourPond's comparison (biased source): **Dex** costs $12/month billed annually and is centred on LinkedIn and Gmail. **Clay** is free (limited) or $10/month with auto-enrichment. **Monica** is free self-hosted or $9/month cloud, web only. None of the three has a map. — [YourPond blog, Jul 2026](https://www.yourpond.io/blog/best-contact-tracker-apps-2026); [YourPond blog, Mar 2026](https://www.yourpond.io/blog/best-apps-tracking-where-friends-live)

**C. Name/face memory apps (memorisation focus, little or no location)**
- **Name Reminder: Remember Names** (Digital Palette LLC). iOS. Rated 4.6★ from 8 ratings. **Last version 2.4 on 3 Sep 2024, so stale.** Pro is $5.99/month or $34.99/year; "Friend Keeper Pro" is $89.99. Photos, groups, birthday reminders, spaced repetition, a face grid and iCloud sync on Pro. One review asked for a flash-card quiz. — [App Store](https://apps.apple.com/us/app/name-reminder-remember-names/id6450018987)
- **NameMemory** (Tomohisa Kasami). iOS. Rated 5.0★ from 1 rating. Version 1.0.10 on "Aug 27" (yr inferred 2026). Free up to 20 people; Pro is a $9.99 one-time purchase. Faces are built as **avatars rather than photos**, for places where photography is not allowed. Location and organisation tags, SM-2 spaced repetition, offline, and no data collection. — [App Store](https://apps.apple.com/us/app/namememory/id6756201292)
- Other name apps found but not inspected: NameMe – Remember Names, Who's Who (indie project) and BeName. — [App Store NameMe](https://apps.apple.com/us/app/nameme-remember-names/id6761031851); [Who's Who](https://shiresmith.github.io/projects/whos-who/)

**D. Address-based contact-map apps (map where contacts live, not where met)**
- **Sidewalk – Contact Mapping** (shrtlist.com). iOS. Rated 4.6★ from 12 ratings. Version 3.9.8 on "Sep 1" (yr inferred 2026). Free, with All Access at $9.99/month or $49.99/year. Pins contacts by address. Search by name, organisation, street, **city** or ZIP, and filter by address label. Groups several contacts at one location. Syncs iCloud, Google and Exchange automatically. On-device. — [App Store](https://apps.apple.com/us/app/sidewalk-contact-mapping/id1005409136)
- **Contacts Map: territory manage** (Youngwan Choi). iOS and Mac. **$4.99.** Rated 4.4★ from 5 ratings. Version 2.4 on "Jul 28" (yr inferred 2026). Filters by group, address type and distance. Aimed at sales routing. One user mapped "4000+ worldwide contacts". — [App Store](https://apps.apple.com/us/app/contacts-map-territory-manage/id468424673)
- Also found: Contacts on Map (id6748297474), "see who's nearby, plan smarter routes", and Contact Map – Address Mapping. — [App Store](https://apps.apple.com/us/app/contacts-on-map/id6748297474); [App Store](https://apps.apple.com/us/app/contact-map-address-mapping/id6529532171) (not inspected)

**E. Event-networking apps (lead capture inside an event)**
- **Swapcard**: "Quick Scan" mode that scans and confirms without forms. Offline badge **and business-card** scanning, notes, AI lead scoring, real-time CRM sync and 100+ integrations. Organizers can sell lead capture as a revenue line. — [Swapcard release notes](https://release.swapcard.com/quick-scan-mode-capture-every-lead-even-in-the-chaos-4qprlC); [Swapcard vs Brella](https://www.swapcard.com/compare/swapcard-vs-brella) (vendor page)
- **Brella**: active (© 2026). Intent-based AI matchmaking, built-in lead scanning and meeting ratings. Per Swapcard's comparison, it scans QR badges with limited offline support and few native integrations. — [brella.io](https://www.brella.io/); [Swapcard vs Brella](https://www.swapcard.com/compare/swapcard-vs-brella)
- **Grip**: run by Intros.at Ltd in London, active (© 2026). AI matchmaking, exhibitor lead retrieval by badge scan, a new AI Assistant. Claims "5,000+ events, 15 million+ participants, 2 million+ booked meetings". — [grip.events](https://www.grip.events/)

### Inferences
- Activity: Revere, Quis, Sidewalk, GEOnameWizard, Contacts Map, NameMemory and the event platforms all show 2025–2026 updates or 2026 copyrights. Name Reminder (Digital Palette, last updated 2024) and Remember Names (Chestwick, last updated Aug 2025) are slowing. MetMe has not left beta.
- Traction is uniformly tiny on the US App Store, at 1 to 110 ratings. That points to fragmented demand with no category leader, or to weak discovery.
- The common complaints (online-only, price, dark mode, missing quiz or connection mapping) are about polish. None of them disputes the concept.
- Event apps keep data inside each event and the organizer's or exhibitor's CRM. They are not a lifelong personal people memory, so they compete only at the moment of capture (badge or card scan).

### Gaps
- Google Play ratings and installs for Quis, Rememorate and Connecti5 could not be read; the Play pages did not render.
- Ratings and last-update dates were not obtained for Rememorate, People (Hidden Spectrum; App Store ID not found), MetMe (not yet on the App Store), YourPond's App Store listing or Connecti5's store listings.
- The "Remember App" with "Nearby Places", seen in a search snippet from AppAdvice, could not be fetched (DNS failure). Its developer and status are unknown.
- Onetta: Who Was There (App Store, IL) returned a 404 and may have been removed.
- No Reddit "app to remember where I met someone" threads were retrieved; searches returned listicles and vendor blogs. User-voice evidence here is thin.
- "Travel-centric people apps" were not specifically surfaced beyond YourPond's city filter ("before traveling"). Search budget ran out.
- Clay/Mesh, Dex and Monica details come only from YourPond's biased comparison.

---

## Q3. Feature matrix: the 5 most relevant niche apps (yes / partial / no / ? = not stated)

### Takeaway
No single app covers voice capture, AI extraction, GPS-stamped meeting place, a map with clusters, a city filter, reminders and cross-platform reach together. Quis comes closest on map, where-met, card scan and sync, but has no voice or reminders. MetMe comes closest on voice, AI and map, but is an iOS-only beta. YourPond comes closest on voice, AI, city filter and reminders, but maps where people live rather than where you met. Remember Names has a clustered map plus location-triggered recall but no AI or voice capture.

### Cited Findings

| Capability | Quis | MetMe (beta) | YourPond | Remember Names (Chestwick) | Revere |
|---|---|---|---|---|---|
| Voice capture | No; voice search only "upcoming" | **Yes** (speak naturally) | **Yes** (iOS) | Partial: records name pronunciation only | Partial: voice dictation |
| Auto-transcription / AI extraction | Partial: AI parsing of business cards only | **Yes**, on-device Apple Intelligence | **Yes**, natural-language parsing | Partial: "AI auto-fill" | ? |
| Photo of person | Partial: photo field; can filter by missing photo | ? | Yes, profile photos | **Yes**, up to 10 | Yes |
| Business card scan + OCR | **Yes**, about 1.5 s | ? | ? | ? | ? |
| Geotag / map of where met | **Yes**: place and moment captured automatically; map by meeting location | **Yes**: map of where met | Partial: map of where contacts live plus location history; "how you met" is text | **Yes**: map with clustering, plus location-based reminders | Partial: location field, no map stated |
| City filter | Partial: map by city and country (inferred from phone number); no explicit picker confirmed | ? | **Yes**: city filter | ? | ? |
| Birthdays | Partial: filter by missing birthday | ? | **Yes** | ? | **Yes** |
| Follow-up reminders | No; catch-up reminders "upcoming" | ? | **Yes** | Partial: location-triggered | **Yes**, with snooze |
| Enrichment | No; social auto-fill "upcoming" | No | No (its own table says so) | No | ? |
| AI natural-language search | No (typo-tolerant keyword search) | ? | **Yes** | ? | **Yes** |
| WhatsApp intake | No evidence | No evidence | No evidence | No evidence | No evidence |
| vCard export / contacts sync | **Yes**: two-way native sync plus vCard | Yes: writes to iOS Contacts | Yes: "contacts sync" | ? | ? |
| Offline capture | Yes (local database, no account) | **Yes** (fully offline) | ? | ? | **No** ("will not load without internet") |
| Multi-user / private accounts | No accounts (single device) | No accounts | Yes (account on iOS and web) | ? | Implied cloud account |
| Data export | Yes (vCard) | Via iOS Contacts | **Yes** | ? | **Yes** |
| Account deletion | Not applicable (no account) | Not applicable | **Yes** | ? | ? |
| Platforms | iOS + Android | iOS 26+, iPhone 15 Pro+ only | iOS + web (Android unverified) | iOS + Watch | iOS |
| Price | Free | Free (beta) | Free up to 25 contacts; $10/mo or $100/yr | Free + IAP up to $79.99 lifetime | Free; $4.99/mo or $49.99/yr |

Sources by column: Quis — [quis.co](https://quis.co/), [App Store](https://apps.apple.com/us/app/quis-your-contacts-on-a-map/id1558252000). MetMe — [metme.app](https://metme.app/), [FeedBagel](https://feedbagel.com/post/metme-ios-app-ai-powered-contact-management-with-contextual-memory). YourPond — [yourpond.io](https://www.yourpond.io/), [YourPond blog](https://www.yourpond.io/blog/best-contact-tracker-apps-2026), [AlternativeTo](https://alternativeto.net/software/yourpond/about). Remember Names — [App Store](https://apps.apple.com/us/app/remember-names-name-reminder/id6504533632). Revere — [App Store](https://apps.apple.com/us/app/revere-remember-people/id1260429188).

Honourable mentions for specific cells:
- **Covve Scan**: card OCR in 60+ languages offline, plus voice capture, where/when met, enrichment and CRM export. It is a paid B2B lead tool at $12/user/month. — [covve.com](https://www.covve.com/)
- **GEOnameWizard**: where-met location, Nearby view, map, photos, reminders and JSON export, for $7.99. — [App Store](https://apps.apple.com/us/app/id6450182834)
- **Connecti5**: contact map with 1/5/10 km radius, city and event grouping, AI search including Hinglish, on iOS, Android and web. — [connecti5.com](https://connecti5.com/)

### Inferences
- **WhatsApp intake was not found in any app**, and no app combines voice, LLM extraction, GPS stamp, clustered map and city picker on Android or the web. The only voice + AI + where-met-map app found (MetMe) is limited to the newest iPhones because it depends on Apple Intelligence. That leaves out Android, older iPhones, and Arabic- or Thai-language users.
- Privacy positioning is table stakes in this category. Quis, MetMe, NameMemory, Remet and PeopleNote all advertise "on-device / no account / no servers". A cloud PWA that runs LLM extraction will need a clear privacy story to compete.

### Gaps
- "?" cells were not stated on the pages fetched. They may exist and should be confirmed by hands-on testing.
- I could not verify whether Quis's map offers an explicit city picker or only zoom-based browsing.

---

## Q4. Is "map-first recall of people by where you met them" genuinely unserved?

### Takeaway
It is not literally unserved. Several live apps (Quis, MetMe, Remember Names, GEOnameWizard, Known Names, Remet, People) stamp where someone was met and show it on a map or search by location. But it is unserved at scale and in quality. Each of these apps has between 1 and 24 US ratings, most are iOS-only, and none combines one-tap voice, AI extraction, clustered map, city picker and reminders across platforms. The OS vendors still offer no meeting-place field and no map of contacts by meeting place.

### Cited Findings
- **Evidence that products do it:**
  - Quis: "remember where and when you met every contact" and "see your whole network on a map", free on iOS and Android, rebuilt in v5.0 around the map. — [quis.co](https://quis.co/); [App Store](https://apps.apple.com/us/app/quis-your-contacts-on-a-map/id1558252000)
  - MetMe: "Map display pinpointing where people were met", with voice and AI capture. — [metme.app](https://metme.app/)
  - Remember Names: "Map integration – View contacts by location with intelligent clustering" plus location-based reminders. — [App Store](https://apps.apple.com/us/app/remember-names-name-reminder/id6504533632)
  - GEOnameWizard: "the location where you met", "Nearby" and a map view. — [App Store](https://apps.apple.com/us/app/id6450182834)
  - People (Hidden Spectrum): saves the location where you met and detects the current event by GPS. — [designboom](https://www.designboom.com/technology/people-app-helps-users-remember-when-where-how-they-met-everyone-contacts-iphone-01-24-2025/)
  - Known Names: "search by location" for conferences and coffee shops. — [App Store](https://apps.apple.com/us/app/id6751477026)
  - Remet: GPS from photos and "Open in Maps". — [App Store](https://apps.apple.com/us/app/id6757997989)
- **Evidence of weak traction or incompleteness:**
  - Ratings: Quis 10, Remember Names 24, GEOnameWizard 4, Known Names 1, Remet 1. Revere has 110 but no map. — App Store pages as cited above.
  - Quis has no voice capture or reminders yet ("upcoming"). — [quis.co](https://quis.co/)
  - MetMe is TestFlight-only and needs iOS 26+ on an iPhone 15 Pro or newer. — [metme.app](https://metme.app/)
  - Remember Names was last updated in Aug 2025. — [App Store](https://apps.apple.com/us/app/remember-names-name-reminder/id6504533632)
  - Address mappers (Sidewalk, Contacts Map) map **addresses**, not meetings. — [Sidewalk](https://apps.apple.com/us/app/sidewalk-contact-mapping/id1005409136); [Contacts Map](https://apps.apple.com/us/app/contacts-map-territory-manage/id468424673)
  - YourPond's map and city filter cover where contacts **live**, with location history. — [YourPond blog, Mar 2026](https://www.yourpond.io/blog/best-apps-tracking-where-friends-live)
  - Connecti5's map supports nearby radius and city grouping, and is pitched at professionals in India (Hinglish search). — [connecti5.com](https://connecti5.com/)
- **OS gap:** Apple and Google Contacts have no map view or city filter (vendor comparison) — [YourPond](https://www.yourpond.io/blog/best-apps-tracking-where-friends-live). No documented where-met field exists in Google Contacts — [Google Help](https://support.google.com/contacts/answer/1069522?hl=en&co=GENIE.Platform%3DAndroid). Gemini's Contacts connector covers name, phone, email, birthday and address but not meeting context — [Gemini Help](https://support.google.com/gemini/answer/17100956).

### Inferences
- The "map of where I met people" idea has been tried at least seven times by indie developers since about 2023, and none has broken out. Possible explanations: capture friction (typing at the moment of meeting), iOS-only reach, no habit loop (reminders), or weak discovery. A product whose differentiator is one-tap voice capture with automatic GPS and date and LLM structuring removes the main friction these apps leave. The map and city picker on their own are not novel.
- The best whitespace evidence points to a cross-platform product (PWA plus Android) with multilingual extraction, including Arabic and Thai where Apple Intelligence is absent, and messaging intake such as WhatsApp, which no competitor showed.
- Risk: platform encroachment. Apple Visual Intelligence (iOS 27) now creates contacts from cards, and Siri AI and Gemini answer natural-language questions about contacts. If Apple or Google add an automatic "met at / met on" stamp (Journal already captures place and nearby-contact signals), the core idea could be absorbed. Nothing announced as of Oct 2026 suggests this.

### Gaps
- No usage, download or revenue data exists for any niche app beyond App Store rating counts. Market size cannot be inferred.
- No independent reviews or Reddit user threads comparing these apps were retrieved, because the search budget ran out.
- Android-native where-met apps were barely covered. Only Quis, Rememorate and Connecti5 were confirmed on Android.
