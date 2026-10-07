# Australian privacy and legal considerations, plus biometric/face-photo and business-card OCR questions, for a people-memory app (as of October 2026)

Scope note: These are practical research notes, not legal advice. The app lets a user record details about third parties who have not consented: name, phone, birthday, where and when they met (with GPS), free-text notes, a face photo, a business-card photo (OCR'd) and a photo of the place. A third-party AI provider (OpenAI) does the transcription and extraction, and the data sits in a cloud database. Users join by invite code and each user's data is private. The operator is small (likely under AUD 3m turnover) and may commercialise later. Users are business owners who use it partly for networking and partly for personal purposes. Research date: 7 October 2026. The web-search budget for this session ran out partway through. Items that could not be confirmed against a primary source are flagged in each Gaps section.

---

## 1. Who is regulated: APP entities, the small business exemption (and its exceptions) and the s 16 personal/household exemption, applied to (a) the end user and (b) the app operator

### Takeaway
A small operator under AUD 3m turnover is probably outside the Australian Privacy Principles (APPs) today, unless an exception applies. The exception that matters most is "trading in personal information", which a data-about-other-people business model could arguably trigger. Losing the exemption on that ground would be costly. End users are outside the APPs when they use the app for personal affairs (s 16). When they use it for business they count as "organisations", but most will be exempt small businesses. Users who are health service providers, or whose businesses turn over more than AUD 3m, are fully covered.

### Cited Findings
- Businesses with annual turnover above AUD 3m must comply with the APPs. "Annual turnover" includes "all income from all sources" and excludes assets held, capital gains and proceeds of capital sales. Businesses at or under AUD 3m generally fall outside the Act unless an exception applies. — [OAIC: Small business](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business)
- These are covered regardless of turnover: health service providers, credit reporting bodies, residential tenancy database operators, Commonwealth contracted service providers, employee associations, protected action ballot agents, telecommunications data retention providers, and Consumer Data Right accredited entities. Also covered: related bodies corporate of a covered entity, AML/CTF Act reporting entities, and businesses that opt in voluntarily. — [OAIC: Small business](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business)
- **Trading in personal information exception.** A small business must comply if it trades in personal information without consent. The OAIC describes this as businesses that "provide a benefit, service or advantage to collect personal information, or disclose personal information for a benefit, service or advantage". Consent can be "express or implied". — [OAIC: Small business](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business)
- "Organisation" includes "an individual (including a sole trader), a body corporate, a partnership" and other unincorporated entities. It excludes small business operators: generally an individual, body corporate, partnership and so on with annual turnover of AUD 3,000,000 or less (s 6D), subject to the exceptions. — [OAIC APP Guidelines, Chapter B: Key concepts](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-b-key-concepts)
- **s 16 (personal, family or household affairs).** Nothing in the APPs applies to collecting, holding, using or disclosing personal information by an individual "only for the purposes of, or in connection with, their personal, family or household affairs". — [Privacy Act 1988 s 16 (AustLII)](https://20.austlii.edu.au/au/legis/cth/consol_act/pa1988108/s16.html) (text taken from a search-result extract; direct fetch was blocked)
- Its predecessor, s 16E, applied where information was dealt with "solely" in personal, family or household affairs. The Revised Explanatory Memorandum (2000) indicates the phrase has the same meaning as "other than in the course of business". — [ALRC (search-result extract)](https://www.alrc.gov.au/?p=7999)
- "Personal information" is "information or an opinion about an identified individual, or an individual who is reasonably identifiable", "whether the information or opinion is true or not". — [OAIC APP Guidelines, Chapter B](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-b-key-concepts)
- Health information (information about the health or disability of an individual) is sensitive information. — [OAIC APP Guidelines, Chapter B](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-b-key-concepts)
- From 1 July 2026, AML/CTF reforms reportedly bring more than 100,000 small businesses under the Privacy Act regardless of the general exemption, via the AML/CTF reporting-entity exception. — reported in search results for [SmartCompany](https://www.smartcompany.com.au/business-advice/privacy-act-small-business-exemption-government-report/) and related articles (I could not tell which article the claim came from; treat as unverified)

### Inferences
- **(b) Operator, today.** If turnover is AUD 3m or less, there is no related covered entity, the operator is not a health service provider, and it does not trade in personal information, then it is probably not an APP entity. That means APP 1–13, the Notifiable Data Breaches scheme and OAIC complaint jurisdiction would not apply.
- **The "trading" risk (untested interpretation).** The business model is collecting personal information about non-consenting third parties from users while providing users a service. A literal reading of "provide a benefit, service or advantage to collect personal information ... about another individual from anyone else" could arguably catch this. The third parties have not consented, so the consent carve-out would not help. The provision was aimed at list-buying and data brokers, so this reading is uncertain. Two things would sharply raise the risk: monetisation that discloses or sells data (for example enrichment, people-search, lead lists or ad targeting), and any cross-user pooling. Get specific legal advice before commercialising. Opting in voluntarily, or simply following the APPs anyway, removes the doubt.
- **(a) End user, personal use.** Recording a friend's birthday or a personal acquaintance falls squarely within s 16, so the APPs do not apply to the user.
- **(a) End user, business use.** A business owner logging networking contacts acts "in the course of business", so s 16 likely does not apply. Whether the APPs apply then depends on the user's own business: exempt if a small business operator, covered if turnover exceeds AUD 3m or an exception applies. Health service providers (physios, psychologists, personal trainers who record health information, naturopaths and so on) are covered whatever their size. If they record client health details in free-text notes, the APPs, including the sensitive-information consent rules, would apply to that use.
- **Mixed use.** s 16 needs the information to be held "only" for personal, family or household affairs, so mixed personal and business records may fall outside it.
- **Notes create sensitive information.** Free text can capture health, sexuality, religion, politics or criminal-record details. For any covered user, or the operator if it ever becomes covered, that is sensitive information with stricter consent rules.

### Gaps
- I found no OAIC guidance or case law on whether a SaaS or app provider that receives third-party information from users "provides a benefit, service or advantage to collect personal information". This needs legal advice.
- I could not fetch the s 16 text directly from legislation.gov.au or AustLII. The wording above comes from a search extract.
- I could not verify the 1 July 2026 AML/CTF-driven expansion claim against a primary source.

---

## 2. Status of privacy reform as of October 2026: POLA Act 2024 (what commenced and when) and "tranche 2"

### Takeaway
Tranche 1 (Privacy and Other Legislation Amendment Act 2024) is largely in force. Doxxing offences, new OAIC powers and infringement or compliance notices started in December 2024. The statutory tort started on 10 June 2025. Automated decision-making (ADM) transparency starts on 10 December 2026, and the Children's Online Privacy Code must be registered by the same date. Tranche 2 exists only as an exposure draft, the *Privacy Amendment (Personal Data Protection) Bill 2026*, released on 31 August 2026 with consultation closing on 18 September 2026. Its key features are a "fair and reasonable" test, a broader definition of personal information, precise geolocation as sensitive information, 72-hour breach notification and a controller/processor split. It does **not** remove the small business exemption.

### Cited Findings
**Tranche 1 (POLA Act 2024)**
- POLA received Royal Assent on 10 December 2024, and many amendments took effect immediately. — [search extract citing MinterEllison and others](https://www.minterellison.com/articles/privacy-and-other-legislation-amendment-act-2024-now-in-effect)
- Commenced 11 December 2024: a new doxxing offence, described as "making it illegal to share someone's personal information with the intent to harm ... punishable by up to 7 years' imprisonment". Also commenced: ministerial power to "whitelist" countries with substantially similar protections for overseas transfers, new OAIC infringement-notice and compliance-notice powers, and clarification that APP 11 security includes "technical and organisational measures". — [MinterEllison](https://www.minterellison.com/articles/privacy-and-other-legislation-amendment-act-2024-now-in-effect)
- The statutory tort commenced on 10 June 2025 (Schedule 2 of the Privacy Act). — [OAIC: Statutory tort](https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/statutory-tort-for-serious-invasions-of-privacy)
- ADM transparency commences 10 December 2026. Entities using a "computer program" for decisions that could "reasonably be expected to significantly affect the rights or interests of an individual" must disclose in their privacy policy the kinds of personal information used and whether decisions are fully automated or substantially assisted. — [Corrs (17 June 2025)](https://corrs.com.au/insights/australias-ongoing-privacy-reforms-bolstering-australias-privacy-regulatory-framework); [Legal500 / Coleman Greig (8 Sept 2026)](https://www.legal500.com/intelligence/australia/privacy/privacy-reform-in-australia-what-businesses-need-to-know-in-2026-2027)
- Children's Online Privacy Code: the OAIC must register it by 10 December 2026. It covers under-18s and is expected to apply to social media services, designated internet services and potentially edtech, wearables and smart toys. An Issues Paper came out in June 2025 and a 60-day public consultation was planned for 2026. — [Corrs (17 June 2025)](https://corrs.com.au/insights/australias-ongoing-privacy-reforms-bolstering-australias-privacy-regulatory-framework)

**Tranche 2 (exposure draft)**
- The AG's Department consultation on the exposure draft *Privacy Amendment (Personal Data Protection) Bill 2026* and a Consultation Paper opened on 31 August 2026 and closed on 18 September 2026. "The Bill remains subject to further consideration by government." — [AGD consultation hub](https://consultations.ag.gov.au/rights-and-protections/privacy-reform/); [Exposure draft PDF](https://consultations.ag.gov.au/rights-and-protections/privacy-reform/user_uploads/exposure-draft-bill-2026.pdf) (the PDF itself was not reviewed)
- The government expects to introduce the legislation "before the end of the year". — [Ashurst](https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/); [Aitken Legal (2 Sept 2026)](https://www.aitken.com.au/news/privacy-act-reforms-tranche2)
- **Small business exemption is retained.** "The small business exemption stays. Businesses under the $3 million turnover threshold are not brought into the Act by this Bill". The employee records exemption also stays. — [Aitken Legal (2 Sept 2026)](https://www.aitken.com.au/news/privacy-act-reforms-tranche2); consistent with [Colin Biggers & Paisley](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment) and [Ashurst](https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/). Ashurst notes the exemption was "not addressed in exposure draft or consultation paper despite government's prior agreement in-principle to a removal".
- In its response to the Privacy Act Review, the government agreed in principle to remove the small business exemption, but only after an impact analysis, consultation and support measures, possibly including a code. — [National Law Review (search extract)](https://www.natlawreview.com/article/breaking-down-privacy-act-review-report-3-removal-small-business-exemption)
- In February 2026 the Attorney-General confirmed the government was "progressing" tranche 2 without giving a timeline. — [SmartCompany (search extract)](https://www.smartcompany.com.au/business-advice/privacy-act-small-business-exemption-government-report/)
- **"Fair and reasonable" test.** A single requirement that collection, use and disclosure be "lawful and fair and reasonable in the circumstances" would replace APPs 3, 4 and 6. Factors include reasonable expectations, the relationship to functions, transparency, data minimisation, genuine choice, privacy impact or harm, proportionality, and for children "the best interests of the child". — [Ashurst](https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/); [Aitken](https://www.aitken.com.au/news/privacy-act-reforms-tranche2)
- **Broader personal information.** The definition would expand to include "pseudonyms, identifiers, location data, behavioural patterns" and information allowing a person to be "recognised or singled out". — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment)
- **New sensitive information categories.** These include genomic information, biometric templates and "precise geolocation tracking data", described as within 500 metres and tracked over time. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment); "Precise geolocation tracking data would become sensitive information, so consent would be needed to collect it" — [Aitken](https://www.aitken.com.au/news/privacy-act-reforms-tranche2)
- **Consent.** There would be a statutory definition: "voluntary, informed, current, specific and unambiguous". Consent would be required for data trading, direct marketing and sensitive information. — [Ashurst](https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/); [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment)
- **Controller/processor.** A processor acting on "documented written instructions" would be bound only by the transparency (APP 1) and security (APP 11) obligations. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment); [Ashurst](https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/)
- **Breaches.** A 72-hour notification deadline would replace the current 30-day assessment window. There would also be duties to prevent or reduce harm from all breaches and to assess security regularly. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment); [Ashurst](https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/)
- **Erasure right.** It would be limited to "large digital platforms" with group revenue of at least $500m or 2.5 million average Australian end users. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment)
- **Retention.** Retention becomes "an audited obligation rather than a policy aspiration", and entities must consider destroying information they no longer need. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment)
- **Complaints.** Organisations would need an accessible complaints mechanism, a 60-day response time and written decisions. — [Ashurst](https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/)
- **Left out of the draft:** a direct right of action, mandatory privacy impact assessments, the objection right and the de-indexing right. — [Ashurst](https://www.ashurstperkinscoie.com/en/insights/australias-2026-privacy-reforms-a-first-look-at-pivotal-new-changes/)
- **Date conflict.** CBP's article as extracted gives the release date as 13 September 2026. The AGD hub and Aitken say 31 August 2026, which is preferred here. — [AGD](https://consultations.ag.gov.au/rights-and-protections/privacy-reform/) vs [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment)

### Inferences
- **Small operator, near term.** The tranche 2 obligations will not bite unless the operator crosses AUD 3m, falls into an exception or opts in. They are still the best available guide to where the law and community expectations are heading, and would shape any business-user customer's procurement questions.
- **GPS "where met" pins.** A single pin per meeting probably is not "precise geolocation tracking data ... tracked over time". Repeated pins for the same contact over time, or continuous background location logging, would sit closer to the new sensitive category. Collect a single coarse location at the user's initiative, never background tracking.
- **Fair and reasonable test.** Storing face photos and GPS of non-consenting people would be judged on reasonable expectations, minimisation and proportionality. Data that serves a clear memory-aid purpose, such as business-card details or notes about a conversation, is easier to defend than face photos plus precise location.
- **ADM obligation (10 Dec 2026).** This applies only to APP entities making decisions that significantly affect individuals. OCR and transcription are unlikely to qualify. Any scoring, ranking or "who to follow up" feature affecting the third parties is unlikely to "significantly affect rights or interests", but should be monitored.

### Gaps
- I could not verify the exact POLA penalty amounts (serious-interference, mid-tier and infringement-notice tiers) from a primary source in this session. Verify them on legislation.gov.au (Privacy Act ss 13G–13K) before quoting figures.
- I could not confirm whether the Children's Online Privacy Code was released in draft or registered as of October 2026.
- Proposed commencement and transition periods for the 2026 exposure draft were not found in any source reviewed.
- The doxxing offence's Criminal Code section numbers and the split between the individual and group-targeting tiers were not verified. MinterEllison gives "up to 7 years".
- I did not review the Dentons briefing ([link](https://www.dentons.com/en/insights/articles/2026/september/3/privacy-reform-take-two-a-substantial-rewrite-of-australias-privacy-act)) or the exposure draft PDF; both returned errors or were not fetched.

---

## 3. The statutory tort for serious invasions of privacy: elements, exemptions and practical risk for storing notes and photos

### Takeaway
The tort has been in force since 10 June 2025. It applies to individuals and to businesses of any size, and there is **no** personal/household or small-business exemption. "Misuse of information" includes *collecting* information. The bar is high: intentional or reckless conduct, a reasonable expectation of privacy, seriousness, and a public interest balance. Privately storing ordinary networking details is very unlikely to qualify. The risk rises with covert or intimate photos, health or sexual details in notes, stalking-like compilation (face plus GPS plus routine), and any leak or disclosure.

### Cited Findings
- Commenced 10 June 2025 (Privacy Act Schedule 2). A plaintiff may sue where the defendant invaded privacy by "intruding upon the individual's seclusion" or "misusing information that relates to the plaintiff". The plaintiff must have had "a reasonable expectation of privacy in all the circumstances", and the public interest in privacy must outweigh any countervailing public interest. — [OAIC: Statutory tort](https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/statutory-tort-for-serious-invasions-of-privacy)
- It applies "to individuals and other entities that may not necessarily be an Australian Privacy Principle entity", regardless of business size. — [OAIC: Statutory tort](https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/statutory-tort-for-serious-invasions-of-privacy)
- Five elements: invasion (intrusion or misuse); reasonable expectation of privacy; intentional or reckless conduct (not negligence); seriousness; and a public interest balance. Misuse covers "collecting, using, or disclosing information about the individual". — [Norton Rose Fulbright](https://www.nortonrosefulbright.com/en/knowledge/publications/87ee5e95/privacy-gets-teeth-australias-new-statutory-tort-and-how-it-might-look-in-practice)
- Seriousness factors include "the degree of any offence, distress or harm to dignity that the invasion of privacy was likely to cause", whether the defendant knew or ought to have known of the likely impact, and malice. — [Norton Rose Fulbright](https://www.nortonrosefulbright.com/en/knowledge/publications/87ee5e95/privacy-gets-teeth-australias-new-statutory-tort-and-how-it-might-look-in-practice)
- Defences include consent, lawful authority, a reasonable belief that the conduct was necessary to protect life, health or safety, proportionate defence of persons or property, and defamation-style privileges. — [Norton Rose Fulbright](https://www.nortonrosefulbright.com/en/knowledge/publications/87ee5e95/privacy-gets-teeth-australias-new-statutory-tort-and-how-it-might-look-in-practice)
- Exemptions: journalists (collection, preparation or publication of journalistic material), under-18s, government agencies acting in good faith, law enforcement and intelligence agencies. Norton Rose's summary identified no personal/household exemption. — [Norton Rose Fulbright](https://www.nortonrosefulbright.com/en/knowledge/publications/87ee5e95/privacy-gets-teeth-australias-new-statutory-tort-and-how-it-might-look-in-practice); [OAIC](https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/statutory-tort-for-serious-invasions-of-privacy)
- Damages for non-economic loss are capped at the greater of $478,550 and the defamation non-economic cap. Exemplary damages, injunctions, account of profits, apologies and orders to destroy material are also available. It is actionable without proof of damage. — [Norton Rose Fulbright](https://www.nortonrosefulbright.com/en/knowledge/publications/87ee5e95/privacy-gets-teeth-australias-new-statutory-tort-and-how-it-might-look-in-practice); [search extract (Lander & Rogers and others)](https://landers.com.au/legal-insights-news/australia-introduces-landmark-privacy-tort-what-does-it-mean-for-you)
- Limitation: the earlier of 1 year after the plaintiff became aware or 3 years after the invasion. For plaintiffs who were under 18, before their 21st birthday. — [OAIC](https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/statutory-tort-for-serious-invasions-of-privacy)
- Norton Rose describes the intent requirement as "a high, but necessary, bar". — [Norton Rose Fulbright](https://www.nortonrosefulbright.com/en/knowledge/publications/87ee5e95/privacy-gets-teeth-australias-new-statutory-tort-and-how-it-might-look-in-practice)

### Inferences
- **End user.** A private note such as "met at X conference, works in fintech, birthday 3 May" plus their business card: there is little reasonable expectation of privacy in information a person handed over, and seriousness is unlikely to be met. Higher-risk patterns are:
  - covert face photos taken in private settings;
  - notes recording health, sexuality, family conflict or financial distress;
  - GPS pins that reveal someone's home or routine;
  - sharing or exporting these records;
  - using them to harass, which overlaps with the doxxing offence.
- **Operator.** The operator is less likely to be the "intentional or reckless" actor for user-entered content. Recklessness could be argued if the operator built features that obviously facilitate covert profiling, such as face search, location history per person or shareable dossiers, while ignoring known misuse, or kept weak security after notice. A breach that exposes intimate notes is the most realistic route to operator exposure.
- Being exempt from the APPs as a small business gives **no** shield against the tort.

### Gaps
- I found no reported judgments under the new tort (to October 2026) involving personal CRM, contact-notes or similar apps. Practical risk is extrapolated from the elements.

---

## 4. Biometric information and face photos under Australian law; OAIC facial recognition determinations (Bunnings, Kmart, Clearview) and what they imply

### Takeaway
Under current Australian law a stored face photo is personal information but not, by itself, "sensitive information". It becomes sensitive biometric information when it is "to be used for the purpose of automated biometric verification or biometric identification", or turned into a biometric template. Adding face matching, auto-tagging or "who is this" search would require consent from the people depicted. Regulators and the Tribunal treat even millisecond-long processing as collection, and the OAIC describes a "high bar" and a "precautionary approach". The safest course is no face recognition, ever.

### Cited Findings
- Section 6 defines sensitive information to include "biometric information that is to be used for the purpose of automated biometric verification or biometric identification; or biometric templates". — [OAIC facial recognition factsheet (search extract)](https://www.oaic.gov.au/__data/assets/pdf_file/0021/266322/Factsheet-Facial-recognition-technology-and-privacy.pdf); [OAIC APP Guidelines, Chapter B](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-b-key-concepts)
- Ordinary photographs are not automatically sensitive information; only biometric information used for automated identification or verification, or templates, qualifies. — [OAIC APP Guidelines, Chapter B (as summarised)](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-b-key-concepts)
- Facial recognition for identification "involves collecting a digital image of an individual's face and extracting their distinct features into a biometric template". "Biometric templates and photos of individuals used for the purpose of automated identification are sensitive information." — [OAIC factsheet / Norton Rose on updated OAIC guidance (search extract)](https://www.nortonrosefulbright.com/en/knowledge/publications/388f7fed/facial-recognition-and-privacy-updated-oaic-guidance)
- **Bunnings, Administrative Review Tribunal (4 February 2026).**
  - Facial images captured by CCTV were "collected" biometric, sensitive information even though deleted within milliseconds; "the threshold for 'collection' under the Privacy Act is a low one".
  - The ART accepted Bunnings' reliance on a "permitted general situation" (s 16A; APP 3.4): consent was impracticable and the system was reasonably believed necessary to lessen or prevent a serious threat to life, health or safety.
  - Breaches of APP 1.2 (governance and documented risk assessment) and APP 1.3/5.1 (transparency) were upheld.
  - [Clayton Utz](https://www.claytonutz.com/insights/2026/february/bunnings-wins-appeal-on-facial-recognition-technology-key-takeaways-for-businesses-and-privacy-law)
- OAIC statement (5 March 2026): "safeguards apply in the context of biometric technologies, even those that only collect and keep personal data for mere milliseconds". The Commissioner did not appeal and warned that Bunnings is "a useful case study, rather than a green light". — [OAIC statement](https://www.oaic.gov.au/news/media-centre/privacy-commissioner-statement-on-administrative-review-tribunals-bunnings-decision)
- Updated OAIC FRT guidance (29 July 2026): "there is a high bar for using facial recognition technology in Australia", and "a precautionary approach to the deployment of FRT is required under Australian law". It extends beyond retail to "high volume and publicly accessible physical spaces". It reports that 45% of Australians (up from 27% in 2023) see facial recognition as a major privacy risk. — [OAIC media release](https://www.oaic.gov.au/news/media-centre/privacy-commissioner-publishes-updated-guidance-on-facial-recognition-in-retail-spaces). **Conflict:** the extracted text described the ART decision as "affirming" the Commissioner's findings. Clayton Utz and the OAIC's own March statement show the APP 3 finding was overturned and only the APP 1 and APP 5 findings upheld.
- **Kmart determination (published 18 September 2025).** Kmart used FRT in 28 stores (June 2020 – July 2022) to detect refund fraud and collected biometric information without notice or consent. The Commissioner rejected the permitted general situation: collection was "indiscriminate", less intrusive alternatives existed, utility was "limited" and the collection was disproportionate. — [OAIC media release](https://www.oaic.gov.au/news/media-centre/18-kmarts-use-of-facial-recognition-to-tackle-refund-fraud-unlawful,-privacy-commissioner-finds)
- As of July 2026 the Kmart determination is under ART review, with hearings scheduled for early 2027. — [OAIC media release (29 July 2026)](https://www.oaic.gov.au/news/media-centre/privacy-commissioner-publishes-updated-guidance-on-facial-recognition-in-retail-spaces)
- **Clearview AI.** In November 2021 the Commissioner found Clearview breached the Privacy Act by scraping Australians' facial images and biometrics without consent, collecting by unfair means, and failing to notify individuals or ensure accuracy. Clearview was ordered to stop collecting and to delete the images. In 2024 the OAIC decided not to pursue further action, but the determination stands. — [OAIC (search extract)](https://www.oaic.gov.au/news/media-centre/clearview-ai-breached-australians-privacy); [ACS Information Age (2024)](https://ia.acs.org.au/article/2024/govt-drops-further-action-against-clearview-ai.html)
- The tranche 2 exposure draft lists "biometric templates" among sensitive categories. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment)

### Inferences
- **Today (face photo only, no matching).** A face photo attached to a contact is personal information. For an APP-covered operator or user it is not sensitive information, provided it is never used for automated identification or verification and no template is created. The operator's main obligations, if covered, would be APP 1/5 transparency, APP 11 security and the APP 8 vendor rules.
- **Sending face photos to OpenAI.** Asking a vision model to *describe* or *identify* a person drifts toward biometric identification. Following Bunnings, even transient processing can be a "collection". Do not send face photos to the AI provider at all. If an image must go to a model, for example a combined card-and-face shot, crop or blur faces on-device first and instruct the model not to identify people.
- **Future face matching.** Features such as "find everyone I've met who looks like this", auto-grouping photos by person, or matching a new photo against saved contacts would create biometric information and templates about non-consenting third parties. Consent from those people is impracticable, and none of the permitted general situations, which centre on serious threats or unlawful activity, plausibly fits a networking or memory app. This is the Clearview pattern: collecting third parties' faces without consent and making them searchable. If the operator were an APP entity, this would very likely breach APP 3.3. It would also raise tort risk, and App Store risk under Apple 5.1.2(vi) and 5.1.1(viii).
- On-device-only face matching that never leaves the phone is still processing by the app. It may reduce, but probably does not remove, the legal characterisation. That is untested.

### Gaps
- There is no OAIC guidance specific to consumer or personal apps storing face photos of third parties (all FRT guidance is retail or public-space).
- I did not obtain the full OAIC factsheet text directly; I relied on search extracts.
- OpenAI usage policies on facial recognition and biometric identification were not reviewed in this session.

---

## 5. Notifiable Data Breaches, overseas disclosure (APP 8) with US AI and cloud vendors, OpenAI data controls, and the Spam Act / Do Not Call

### Takeaway
The NDB scheme and APP 8 bind only APP entities, so they do not currently bind an exempt small operator. They do bind covered business users, and they will matter the moment the operator is covered. OpenAI's API does not train on data by default and keeps abuse-monitoring logs for up to 30 days. "Australia" data residency is **storage-only**: processing stays in the US, and it requires approval for abuse-monitoring controls. Any future messaging to saved contacts triggers the Spam Act if the content is commercial.

### Cited Findings
- **NDB.** "Any organisation or agency the Privacy Act 1988 covers" must notify affected individuals and the OAIC of eligible data breaches "likely to result in serious harm". — [OAIC NDB scheme](https://www.oaic.gov.au/privacy/notifiable-data-breaches/about-the-notifiable-data-breaches-scheme)
- Tranche 2 would introduce a 72-hour notification deadline. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment)
- **APP 8.** Before disclosing personal information overseas, an entity must "take such steps as are reasonable in the circumstances to ensure that the recipient does not breach the APPs", typically through enforceable contracts. Under s 16C the disclosing entity is accountable for the overseas recipient's breaches. — [OAIC APP Guidelines, Chapter 8](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information)
- Giving data to an overseas cloud provider may be a "use" rather than a "disclosure", so APP 8 does not apply, when three conditions hold:
  - a binding contract limits the provider to handling it for limited purposes;
  - subcontractors are bound the same way;
  - the entity keeps "the right or power to access, change or retrieve the personal information".
  - Exceptions to APP 8 include a substantially similar overseas law, and express informed consent after the individual is told the entity will not be accountable.
  - [OAIC APP Guidelines, Chapter 8](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information)
- POLA added a ministerial power to "whitelist" countries with substantially similar protections. — [MinterEllison](https://www.minterellison.com/articles/privacy-and-other-legislation-amendment-act-2024-now-in-effect)
- **OAIC AI guidance (21 October 2024, updated 17 January 2025).**
  - "Privacy obligations will apply to any personal information input into an AI system, as well as the output data generated by AI".
  - "If AI systems are used to generate or infer personal information ... this is a collection of personal information and must comply with APP 3".
  - "As a matter of best practice, the OAIC recommends that organisations do not enter personal information, and particularly sensitive information, into publicly available generative AI tools".
  - Organisations should update privacy policies about AI use and do due diligence on "who will have access to personal information input or generated" and whether service terms give the developer access to data.
  - [OAIC: Guidance on privacy and commercially available AI products](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products)
- **OpenAI API data controls.**
  - "As of March 1, 2023, data sent to the OpenAI API is not used to train or improve OpenAI models (unless you explicitly opt in)". Abuse-monitoring logs are kept "up to 30 days, unless longer retention is required by law".
  - Chat Completions/Responses keep no application state by default (apart from some exceptions). Files and vector stores are kept "until deleted".
  - Zero Data Retention and Modified Abuse Monitoring require OpenAI approval. Even with ZDR, images may be "retained for manual review" if CSAM classifiers trigger.
  - Data residency: regional *processing* is available for the US, Europe and the UAE. Australia (with Canada, Japan, India, Singapore, South Korea and the UK) is "storage only". "To use data residency with any region other than the United States, you must be approved for abuse monitoring controls."
  - [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- **Spam Act.** It covers commercial electronic messages (email, SMS, MMS, IM) that offer or promote goods or services. Three rules apply: consent, identification and unsubscribe. Consent can be express or inferred. Inferred consent can come from an existing business relationship or "conspicuous publication" of an address, but only for messages relevant to the recipient's business role. — [search extract, sources include Corrs on ACMA enforcement](https://www.corrs.com.au/insights/acma-spam-act-enforcement-and-the-implications-for-business) and [ADMA Spam Act overview](https://www.adma.com.au/sites/default/files/Comply%20QA%203%20Spam%20Act%20Overview.pdf) (the ACMA page itself timed out: [ACMA](https://www.acma.gov.au/avoid-sending-spam))

### Inferences
- **Operator (exempt).** There is no legal duty to notify breaches. Notifying anyway is still sensible practice for trust, and covered business users may contractually require it.
- **Operator (if covered).** Under OpenAI's API terms the data is not used for training and is deleted after 30 days. Whether that is a "use" (no APP 8) or a "disclosure" (APP 8 plus s 16C accountability) depends on contract terms and control. OpenAI's abuse monitoring arguably is not purely on the operator's behalf, which leans toward "disclosure". Treat it as an overseas disclosure and document reasonable steps: the DPA, ZDR or MAM if approved, no-training, and a retention setting.
- The OAIC's "publicly available generative AI tools" warning is aimed at consumer chat tools. An API under business terms with no training is a different risk profile, but OAIC still expects due diligence and transparency.
- **Data residency.** Choosing OpenAI's Australian residency would keep stored data in Australia, but inference still runs in the US. The cloud database itself can be hosted in an Australian region, which is a separate decision for the database vendor.
- **Do not use OpenAI Files or vector stores** to hold contact data, because they are kept until deleted. Use stateless calls with `store=false` or equivalent, and keep the system of record in the operator's own database.
- **Messaging contacts.** Messages the app sends to saved contacts, such as follow-up nudges, birthday wishes with promotional content, or invites, will often be "commercial" when sent by business users. They would need consent (inferred consent from an exchanged business card is arguable only for relevant business messages), sender identification and an unsubscribe facility. Keep messaging user-initiated, individual and sent from the user's own account or number, and never bulk or "select all". That also matches Apple 5.1.2(v).
- Do Not Call Register: relevant only if the app places or automates telemarketing calls. The app as described does not.

### Gaps
- OpenAI's Data Processing Addendum could not be fetched (HTTP 403). Its terms (processor role, sub-processors, breach notification timing, transfer mechanisms) were not verified.
- The ACMA primary guidance page timed out. Spam Act details come from secondary sources.
- The Do Not Call Register Act was not researched in this session.

---

## 6. State and territory surveillance devices laws (only relevant if the app records conversations rather than the user's own dictation)

### Takeaway
Recording the user's *own dictation* raises no surveillance-device issue. Recording a *conversation* with the person met is lawful for a participant in some jurisdictions (Qld and NT, and per the ALRC also Vic). It is generally prohibited without all parties' consent in NSW, WA, SA, Tas and ACT, subject to narrow exceptions. Sources conflict on Victoria.

### Cited Findings
- Queensland (Invasion of Privacy Act 1971) and NT (Surveillance Devices Act 2007): lawful for a participant to record without the other party's consent. NSW (Surveillance Devices Act 2007), WA (1998), SA (2016), Tas (Listening Devices Act 1991) and ACT (Listening Devices Act 1992): illegal without all-party consent, with "lawful interest" exceptions. — [Hamilton Locke (8 Aug 2025)](https://hamiltonlocke.com.au/recording-private-conversations-the-law-in-australia/)
- **Conflict on Victoria.** Hamilton Locke's summary lists Victoria (Surveillance Devices Act 1999) as all-party consent. The ALRC says "the surveillance device laws of Queensland, Victoria and the Northern Territory contain participant monitoring exceptions". Another search extract also lists Victoria as one-party. — [Hamilton Locke](https://hamiltonlocke.com.au/recording-private-conversations-the-law-in-australia/) vs [ALRC Report 123, Participant monitoring (2014)](https://www.alrc.gov.au/publication/serious-invasions-of-privacy-in-the-digital-era-alrc-report-123/14-surveillance-devices/participant-monitoring/); [Sprintlaw (search extract)](https://www.sprintlaw.com.au/articles/is-it-legal-to-record-a-phone-call-in-australia)
- The ALRC recommended removing participant-monitoring exceptions. That is a 2014 report and pre-dates SA's 2016 Act. — [ALRC](https://www.alrc.gov.au/publication/serious-invasions-of-privacy-in-the-digital-era-alrc-report-123/14-surveillance-devices/participant-monitoring/)
- Phone calls: the Telecommunications (Interception and Access) Act 1979 (Cth) prohibits interception, "primarily concerned with third parties seeking to intercept communications". — [Hamilton Locke](https://hamiltonlocke.com.au/recording-private-conversations-the-law-in-australia/)

### Inferences
- Keep the voice feature as "dictate a memo after the meeting". Do not offer ambient or meeting recording. If conversation recording is ever added, gate it behind an explicit all-party-consent prompt, because the user base will span all-party jurisdictions such as NSW.
- Even where recording is lawful, the states restrict publishing or communicating recordings. Uploading recordings to an AI vendor and storing them in the cloud should be assessed separately.

### Gaps
- The Victorian position should be checked against the current Surveillance Devices Act 1999 (Vic) text, which was not reviewed.
- State rules on communicating or publishing lawfully made recordings were not covered by the sources reviewed.

---

## 7. Cross-cutting: is a plain face photo "biometric data" (GDPR Recital 51), and how do Apple and Google app store rules treat face data, contacts and third-party data?

### Takeaway
Under GDPR (and similarly under Australian law), a photo becomes biometric or special-category data only when processed through specific technical means for unique identification or authentication. For this app the app stores are the more immediate constraint. Apple now requires explicit permission before sharing personal data with "third-party AI". It bans building contact databases from Contacts or Photos, using facial-mapping or photo data for data mining, and apps that "compile personal information" not obtained directly from the user. Both stores require in-app account deletion; Google also requires deletion on the web. Google requires a prominent disclosure and an accurate Data safety form.

### Cited Findings
- GDPR Recital 51: "The processing of photographs should not systematically be considered to be processing of special categories of personal data as they are covered by the definition of biometric data only when processed through a specific technical means allowing the unique identification or authentication of a natural person." — [GDPR Recital 51](https://gdpr-info.eu/recitals/no-51/)
- EDPB Guidelines 3/2019 on video devices (v2.0, adopted 29 January 2020) address when video images become biometric data. I could not retrieve the text. — [EDPB Guidelines 3/2019](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_201903_video_devices_en.pdf)
- **Apple 5.1.1(i).** The privacy policy must identify the data collected and all uses, confirm that third parties provide equal protection, and explain retention and deletion and how to revoke consent or request deletion. — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Apple 5.1.1(v).** "If your app supports account creation, you must also offer account deletion within the app." — [Apple](https://developer.apple.com/app-store/review/guidelines/)
- **Apple 5.1.1(viii).** "Apps that compile personal information from any source that is not directly from the user or without the user's explicit consent, even public databases, are not permitted on the App Store or alternative distribution." — [Apple](https://developer.apple.com/app-store/review/guidelines/)
- **Apple 5.1.2(i).**
  - "Unless otherwise permitted by law, you may not use, transmit, or share someone's personal data without first obtaining their permission."
  - "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so."
  - [Apple](https://developer.apple.com/app-store/review/guidelines/)
- **Apple 5.1.2(ii)–(iii).** No repurposing without further consent. No surreptitiously building user profiles. — [Apple](https://developer.apple.com/app-store/review/guidelines/)
- **Apple 5.1.2(iv).** "Do not use information from Contacts, Photos, or other APIs that access user data to build a contact database for your own use or for sale/distribution to third parties". — [Apple](https://developer.apple.com/app-store/review/guidelines/)
- **Apple 5.1.2(v).** Do not contact people using Contacts or Photos information "except at the explicit initiative of that user on an individualized basis". No "Select All". — [Apple](https://developer.apple.com/app-store/review/guidelines/)
- **Apple 5.1.2(vi).** Data "from depth and/or facial mapping tools (e.g. ARKit, Camera APIs, or Photo APIs) may not be used for marketing, advertising or use-based data mining, including by third parties". — [Apple](https://developer.apple.com/app-store/review/guidelines/)
- **Apple 2.5.13.** Apps using facial recognition for authentication must use LocalAuthentication where possible. — [Apple](https://developer.apple.com/app-store/review/guidelines/)
- **Unverified claim.** A search-engine summary said 5.1.2 "prohibits apps from collecting information about the user's friends, contacts, or other third-party persons without the knowledge or consent of those parties". That wording does **not** appear in the current guidelines text I retrieved; treat it as unverified. — [Apple Developer Forums thread (search result)](https://developer.apple.com/forums/thread/741012) vs [Apple guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Google Play User Data policy.**
  - "Personal and sensitive user data" includes "personally identifiable information ... phonebook, contacts, device location ... camera".
  - It requires an in-app prominent disclosure, displayed in normal use and describing the data and its use or sharing, plus consent by "affirmative user action".
  - The privacy policy must be on an "active, publicly accessible and non-geofenced URL (no PDFs)".
  - Account deletion must be offered "both from within your app and outside of your app (for example, by visiting your website)" and must delete "all the user data associated with that app account".
  - The Data safety section must be accurate.
  - It prohibits "unauthorized publishing or disclosure of people's non-public contacts".
  - Third-party code and SDKs must comply, and SDK providers must not sell personal and sensitive data.
  - [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)

### Inferences
- **Apple 5.1.1(viii).** This is the clause most likely to be cited against a "notes about people" app. The best argument for compliance: all information comes "directly from the user", who consents. The app does no scraping, enrichment, people-search or public-database lookups. Do not add features that pull data about contacts from LinkedIn, the web or data brokers.
- **Apple 5.1.2(i), "someone's personal data".** This could be read to cover third parties, but it is qualified by "unless otherwise permitted by law". Personal CRMs and contact-note apps exist on the App Store, which suggests Apple accepts user-entered contact notes. That is an observation, not verified in this session. Position the app as a user's private notebook, not a database about people.
- **Apple 5.1.2(i), third-party AI.** The app must show a clear, explicit consent screen before any data, including third-party data, goes to OpenAI, and the privacy policy must name the provider category.
- **Apple 5.1.2(iv).** Never aggregate data across users, for example a global "people" table de-duplicated across accounts, or "3 other users also know this person". Per-user data silos are both a privacy and an App Store requirement.
- **Apple 5.1.2(vi).** Face photos taken with the camera or picked from Photos must not be mined for analytics or marketing, or used to train models.
- **Google.** The Data safety form should declare contacts and personal info, photos, approximate or precise location, and sharing with service providers (OpenAI, cloud). Deletion must be reachable from the web.

### Gaps
- I could not retrieve the EDPB 3/2019 biometric paragraphs (paras ~74–80) verbatim.
- I did not verify the Apple "account deletion" help page or the Google Data safety help page separately.
- Whether Apple App Review has rejected specific personal-CRM or people-notes apps under 5.1.1(viii) was not researched.

---

## 8. Business cards and OCR: how business-card information is treated, and whether OCR or upload to an AI vendor changes the analysis

### Takeaway
Information on a business card is personal information or personal data: name, work phone and email identify an individual. Handing over a card creates a strong expectation that the recipient will keep and use it for business contact. That supports legitimate-interest (EU) or reasonable-expectation (Australia) arguments for storing it, and arguably inferred Spam Act consent for *relevant* business messages. OCR does not change the character of the data. Sending the image to a third-party AI vendor adds a disclosure or overseas-transfer layer that a card-holder would not expect, so it needs transparency and vendor controls.

### Cited Findings
- Personal information is information "about an identified individual, or an individual who is reasonably identifiable". Work contact details can be personal information when they identify an individual. — [OAIC APP Guidelines, Chapter B](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-b-key-concepts)
- Under GDPR, "contact information of natural persons providing services in legal entities and details of individual entrepreneurs" (name, position, address, email, professional phone) is personal data. Spain's then-draft LOPDGDD Article 19 proposed treating such processing as based on "the legitimate interest of the data controller". The article argues that full Art 13 notice on every card exchange would be impractical. — [Garrigues (23 February 2018)](https://www.garrigues.com/en_GB/garrigues-digital/will-general-data-protection-regulation-make-business-cards-thing-past)
- Spam Act: consent may be inferred from an existing business relationship or "reasonable expectation" by the recipient. The "conspicuous publication" rule allows only messages relevant to the recipient's business role. — [search extract incl. Corrs on ACMA enforcement](https://www.corrs.com.au/insights/acma-spam-act-enforcement-and-the-implications-for-business)
- OAIC AI guidance: personal information input into AI, and personal information the AI generates or infers, is subject to the APPs. Generating or inferring personal information is a "collection". AI-generated inaccurate information about an identifiable person is personal information subject to APP 10 accuracy. — [OAIC AI products guidance](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products)
- APP 6 limits secondary use. If uncertain whether AI processing is within reasonable expectations, the OAIC suggests seeking consent or offering an opt-out. — [OAIC AI products guidance](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products)

### Inferences
- **The business card is the lowest-risk data type in the app.** It was voluntarily given for the purpose of business contact, so a reasonable person would expect the recipient to store it, increasingly via a phone scanner. This matters for the tranche 2 "fair and reasonable" factors (reasonable expectations) and for the tort (little reasonable expectation of privacy).
- **OCR by on-device text recognition** (for example the iOS Vision or Android ML Kit OCR frameworks) keeps processing on the phone, the easiest story to tell.
- **OCR by OpenAI** sends the card image to a US processor. The card-holder would not specifically expect this, but it is functionally like any cloud scanner. Mitigations: no training, short retention or ZDR, crop to the card (removing any faces), and disclose it in the privacy policy and Apple's third-party AI consent.
- AI-extracted fields can be wrong, for example a misread phone number or an inferred job title. Show extracted data to the user for confirmation before saving, which supports the APP 10 accuracy expectation if the operator is ever covered.
- **Place photos** usually contain no personal information unless people or number plates are visible. Consider on-device blurring or a reminder not to photograph bystanders.

### Gaps
- I found no Australian regulator (OAIC or ACMA) guidance specifically on business cards, card-scanning apps or OCR.
- The final Spanish LOPDGDD Art 19 text (as enacted in 2018) was not verified. The Garrigues piece discusses the draft.
- I found no regulator view on whether sending card images to a generative-AI OCR vendor differs materially from a traditional OCR vendor.

---

## 9. The "household exemption" across regimes, and where a multi-user commercial app operator sits

### Takeaway
Australia (s 16), the EU (GDPR Art 2(2)(c) with Recital 18) and others exempt purely personal or household processing *by individuals*. That exemption does not extend to whoever provides the means of processing. Business or professional use takes the end user outside it. The operator of a multi-user commercial app is never itself "household": it is a controller (or, for business users, arguably a processor), and is regulated wherever its size and activities bring it in scope.

### Cited Findings
- GDPR Art 2(2)(c): the Regulation does not apply to processing "by a natural person in the course of a purely personal or household activity". Recital 18 limits this to processing "unrelated to his or her professional or economic activities" (it mentions social networking as possible personal activity). It adds that the Regulation "applies to controllers or processors which provide the means for processing personal data for such personal or household activities". — [Presencis: Recital 18](https://presencis.com/regulations/gdpr/recital-18/); [Mondaq: "One-man controller"](https://www.mondaq.com/data-protection/1773198/one-man-controller-the-responsibility-of-individuals-under-the-gdpr)
- In *Lindqvist* (CJEU, 2003), publishing personal data on a website accessible to an indefinite number of people was not covered by the household exemption. — [search extract (Mondaq / AAU thesis)](https://www.mondaq.com/data-protection/1773198/one-man-controller-the-responsibility-of-individuals-under-the-gdpr)
- In *Ryneš* (C‑212/13, 11 December 2014), home CCTV covering public space was not a "purely personal or household activity". — [Thomas Helbing summary of Ryneš](https://www.thomashelbing.com/en/wissen/llms.mdx/dsgvo-hub/rechtsprechung/1.4.20-eugh-rynes)
- Australia s 16 exempts individuals acting "only" for personal, family or household affairs. Historically this was equated with "other than in the course of business". — [AustLII s 16](https://20.austlii.edu.au/au/legis/cth/consol_act/pa1988108/s16.html); [ALRC](https://www.alrc.gov.au/?p=7999)
- The tranche 2 exposure draft would add a controller/processor split. Processors acting on documented instructions would be bound only by APP 1 and APP 11. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment)

### Inferences
- **End users.** Personal use is likely exempt (s 16 or Art 2(2)(c)). Business-networking use is not exempt under either regime, and the result then depends on the user's own status (in Australia, the small business exemption).
- **Operator.** Under GDPR, if EU users are ever onboarded, the operator is a controller for account data and its own purposes (analytics, security, product improvement). For the contact records it is at least a processor, and arguably a controller if it decides the purposes or means, such as AI extraction and retention. Recital 18 means users' household status does not help the operator. In Australia the operator's status depends only on its own coverage (small business exemption and its exceptions), not on how users use the app.
- **Mixed use.** The app cannot reliably know whether a given record is personal or business. Design the product as if the stricter (business) analysis applies to everything.
- **Sharing.** Features that publish or share contact records (such as shareable profiles or team spaces) move users out of the household exemption, following the logic of *Lindqvist*.

### Gaps
- The full CJEU judgments and EDPB statements on the household exemption were not retrieved directly. I relied on summaries.
- No research was done on GDPR Art 14 (notice to data subjects for indirectly collected data) or its "disproportionate effort" exception for business users of such apps. That matters only if the EU market is targeted.

---

## 10. Practical recommendations for the operator (derived from the findings above; not legal advice)

### Takeaway
Build to APP-level standards voluntarily, even if the small business exemption currently applies. Avoid biometrics entirely. Minimise what goes to OpenAI. Keep each user's data siloed. Make transparency, deletion and export first-class features, and add in-app guidance that nudges users away from tort-risky notes.

### Cited Findings (anchors for the recommendations)
- Apple requires a privacy policy covering data, uses, third parties, retention and deletion; in-app account deletion; and explicit permission before sharing with third-party AI. — [Apple 5.1.1, 5.1.2](https://developer.apple.com/app-store/review/guidelines/)
- Google requires a prominent disclosure, a public non-PDF privacy policy URL, deletion both in-app and on the web, and an accurate Data safety section. — [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)
- The OAIC expects privacy policies to explain AI use, due diligence on vendors' data access and retention, and treats AI-generated output about people as personal information. — [OAIC AI guidance](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products)
- OpenAI API: no training by default; 30-day abuse logs; ZDR or MAM by approval; Australian residency is storage-only and requires approval for abuse-monitoring controls; Files and vector stores are kept until deleted. — [OpenAI: Your data](https://developers.openai.com/api/docs/guides/your-data)
- APP 8 / s 16C: contractual reasonable steps and accountability for overseas recipients; the "use not disclosure" route for tightly controlled cloud arrangements. — [OAIC Chapter 8](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information)
- APP 11 includes "technical and organisational measures" (POLA, in force December 2024). — [MinterEllison](https://www.minterellison.com/articles/privacy-and-other-legislation-amendment-act-2024-now-in-effect)
- Tranche 2 direction: fair and reasonable test, minimisation, retention as an audited obligation, precise geolocation as sensitive, 72-hour breach notification. — [CBP](https://www.cbp.com.au/insights/publications/round-2%21-the-australian-government-has-released-the-exposure-draft-of-the-privacy-amendment); [Aitken](https://www.aitken.com.au/news/privacy-act-reforms-tranche2)
- FRT: a "high bar" and "precautionary approach". Even millisecond processing is collection. Documented risk assessments are expected. — [OAIC July 2026](https://www.oaic.gov.au/news/media-centre/privacy-commissioner-publishes-updated-guidance-on-facial-recognition-in-retail-spaces); [Clayton Utz](https://www.claytonutz.com/insights/2026/february/bunnings-wins-appeal-on-facial-recognition-technology-key-takeaways-for-businesses-and-privacy-law)
- The Coleman Greig briefing advises: "Businesses currently relying upon the exemption should consider preparing for future compliance obligations rather than waiting for legislation to be finalised." — [Legal500 / Coleman Greig (8 Sept 2026)](https://www.legal500.com/intelligence/australia/privacy/privacy-reform-in-australia-what-businesses-need-to-know-in-2026-2027)

### Inferences (the recommendations)
1. **Coverage decision.** Document why the operator is a small business operator: turnover, no related bodies, not a health service provider. Get advice on the "trading in personal information" ambiguity before any monetisation that involves disclosing data. Consider voluntary APP compliance and, at commercialisation, opting in under s 6EA, because business customers with turnover above AUD 3m will ask.
2. **Privacy policy content.** Cover:
   - what is collected about users and about the people they save;
   - purposes, limited to the user's own memory aid and networking;
   - AI processing by OpenAI (US), named as a provider category or by name, plus the cloud host and region;
   - overseas locations;
   - retention periods;
   - deletion and export;
   - security;
   - a complaints contact;
   - a statement that the operator does not sell, share or enrich contact data and does not use face recognition;
   - a note that a person who has been saved can contact the operator. Decide in advance how such requests are handled: the operator cannot see siloed data, so it should explain the user-controlled model.
   - When ADM rules start (10 Dec 2026), confirm no in-scope automated decisions, or disclose them if they exist.
3. **Purpose limitation.** Use contact data only to provide the service to that user. Do not use it for analytics, model training, marketing or cross-user features. Any future "network" or enrichment feature needs a fresh legal review (APP 6, Apple 5.1.2(ii)/(iv), Google policy).
4. **No biometrics.** Do not build face matching, face search, clustering or templates. Do not send face photos to the AI provider. Store face photos as plain images with encryption. Consider making the face photo optional and off by default, with in-app copy discouraging covert photos.
5. **Minimise what reaches OpenAI.**
   - Send only what extraction needs: card images cropped to the card, and dictation audio or text.
   - Strip EXIF and GPS before upload.
   - Use stateless endpoints with storage off, never Files or vector stores, for contact data.
   - Apply for ZDR or Modified Abuse Monitoring once eligible.
   - Sign or accept OpenAI's DPA.
   - Record these steps as the APP 8 "reasonable steps" file.
6. **Data residency.** Host the primary database and object storage in an Australian cloud region. If approved, use OpenAI's Australia storage residency, but disclose that processing occurs in the US.
7. **Location.** Capture one coarse location per meeting at the user's initiative. Do not collect background location or build location histories per contact. This anticipates "precise geolocation tracking" becoming sensitive.
8. **Retention.** Set default retention or review prompts (for example, "you haven't looked at this contact in 2 years — keep or delete?"). Purge AI intermediate artefacts and logs quickly. Hard-delete within a defined window after account deletion, and say so.
9. **Deletion and export.** Offer per-contact delete, delete-all and account deletion both in-app and on the web, as Apple and Google require. Offer a full export (CSV or vCard plus media) so users can leave.
10. **Security.** Use TLS, encryption at rest, per-user row-level access control, encrypted media buckets with short-lived signed URLs, MFA for admin access, and least-privilege staff access. Consider "no staff access to user content" as a policy. Keep a breach response plan with voluntary notification, in anticipation of the 72-hour rule.
11. **In-app guidance about the people you save.** Show a short notice at onboarding and at first face photo:
    - only save what the person would reasonably expect you to remember;
    - avoid health, sexuality, religion, politics or financial-hardship details;
    - do not photograph people covertly or in private settings;
    - do not record conversations (dictate your own memo instead);
    - delete on request;
    - never share records to embarrass or harass, noting the doxxing offences and the statutory tort.
12. **App store compliance.** Add an explicit consent screen before first AI use (Apple 5.1.2(i)). Use the out-of-process photo picker rather than full Photos access (Apple 5.1.1(iii)). Do not import or upload the device address book in bulk. Messaging contacts must be user-initiated, individual, with a preview (Apple 5.1.2(v)). Complete the Data safety section accurately (Google).
13. **Invite-code multi-user model.** Keep accounts strictly siloed. If team or shared workspaces are added later, re-assess: the household exemption would be lost, the operator becomes a processor for business customers, and DPAs and role-based access would be needed.

### Gaps
- No Australian-specific template or regulator guidance exists for "personal CRM" apps. The recommendations are synthesised from general APP guidance, FRT decisions, app store rules and vendor documentation.
- Australian Consumer Law exposure for inaccurate privacy representations (for example "we never share your data") was not researched, but is generally relevant to any privacy policy claims.
- GDPR/UK, US state biometric laws (such as Illinois BIPA) and other foreign regimes were outside this note's research scope beyond Recital 51 and the household exemption. If users outside Australia are onboarded, those regimes need separate review.
