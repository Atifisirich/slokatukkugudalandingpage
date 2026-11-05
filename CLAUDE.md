# Sloka International School, Tukkuguda: Admissions 2027–28 landing page

Single-page admissions landing page for Google and Meta ads. Goal: turn ad visitors into enquiries.
Plain HTML, CSS and vanilla JS, no build step, hosted on the school's cPanel subdomain.

```
index.html       all markup, image list in the top comment, School + FAQPage schema in <head>
css/styles.css   all styles, numbered sections (see the contents list at the top)
js/main.js       config objects at the top, then all behaviour
images/          WebP photos, logo, flower, favicons
```

## Run it locally

Any static server works, for example from the project folder:

```bash
npx serve .
```

After changing `css/styles.css` or `js/main.js`, bump the `?v=` number on both links in `index.html`
(currently `?v=52`) so returning visitors don't get a cached copy.

## Page order

1. **Header**: logo, section links (Campus, Facilities, Grades & Fees, Transport, FAQ), phone, Enquire button.
   Transparent over the hero photo, solid once scrolled. Mobile has a fixed Call / WhatsApp bar.
2. **Hero**: full-width campus building photo, headline left, CRM enquiry form right.
   On desktop the photo stays pinned and zooms toward the entrance while the copy scrolls away (`.hero--zoom`),
   then "Sloka International School, Tukkuguda" arrives. On phones it is a poster: clear photo with the headline
   and a Book button, then the form. The place name "Tukkuguda" is half yellow (top) and half white (bottom); "Admissions Open 2027–28" is a yellow label under the headline; the
   service-area sentence and the two shortcut buttons were removed on client feedback. The form must fit one
   desktop screen (compact widget styles at the end of `css/styles.css`).
3. **Trust strip**: CBSE Affiliated, NEP 2020 Aligned and three smaller facts.
4. **"Step inside" + campus story** (`#campus-story`): an arch doorway opens on the entrance, then one slide, the
   school building ("Our campus"). The client asked for only the building photo (science lab, football, cricket and
   early-years slides were removed). `--n` on the section must equal the number of slides.
5. **Facilities** (`#facilities`): grid of 17 photo cards, one per space (Aero Bay, Physics, Chemistry and Biology labs, ICT, Library, Classrooms,
   Activity Hall, Play Land, football, cricket, basketball, skating, pickleball, taekwondo, athletics, CCTV)
   with a sideways-scrolling picker (All or one space). Real school photos, except Aero Bay (AI image supplied by the
   school) and the CCTV walkway. A missing photo shows a maroon tile with its file name.
6. **Grades** (`#pathway`): grade chips (Nursery to Grade 10) + date-of-birth check, then ONE grade sheet: grade
   header band, stage details (Foundational Nursery to Grade 2, Preparatory Grades 3 to 5, Middle 6 to 8, Secondary
   9 and 10; wording is the client's `content.docx`), the grade's own yearly tuition fee and its parent testimonial.
7. **Transport** (`#visit`): one card with the Google Map, area buttons grouped by distance, a pick-up point search
   (`[data-stopfinder]`: type a stop, see its km and a Google Maps directions link; list in `PICKUP_POINTS`), directions, WhatsApp about the bus, and the campus address strip.
8. **Admission in five steps** (heading + Book button on the left, a numbered rail of five rows on the right that fills as the section scrolls into view; step 1 offers Online, Phone, Email, WhatsApp), **FAQ** ("Ask Sloka" chat
   with search and WhatsApp fallback), **footer** (Address and Admissions only; the Links column, including Mandatory Disclosure, was removed on client request). There is no closing call-to-action, approach or parents section.

A flower loading screen (from the logo) shows once per session, never with reduced motion.

## Where to change things (top of js/main.js)

- `ENQUIRY_CONFIG`: CRM. Currently `mode: 'widget'` with the ExtraaEdge widget (form-9, container `ee-form-9`)
  supplied by the CRM team. It loads after first paint or on first interaction (about 300 KB of jQuery, select2 etc.).
  `enquiry_submitted` is pushed to `dataLayer` once, only when the widget's API reply is
  `{ result: "Success", message: "1" }` (see `widget.isSuccess`). Do not change this without testing.
  `endpoint` mode (built-in form) is kept as a fallback option.
- `AGE_RULES`: minimum age per grade on 1 June 2027 for the date-of-birth check.
- `FEES`: yearly tuition per grade as `[amount]` (or `[min, max]`) in rupees, from the client's grade-wise table.
- `PICKUP_POINTS`: bus pick-up points `{ name, km, pin }` from the school's `BUS STOPS NAMES.xlsx` (89 stops after merging duplicates; teachers' route 28 left out; route numbers and student counts kept off the page). Empty = search box hidden.
- `PARENT_VOICES`: one testimonial per grade (topic, quote, parent, area, optional photo, `draft` flag); `null` shows
  the placeholder. Keys must match the grade chip values exactly, e.g. "Grade 2".
- `trackInteractions`: extra dataLayer events (grade picked, area checked, FAQ opened/searched, call/WhatsApp taps).
- GTM container ID is `GTM-XXXXXXX` in two places in `index.html` (head and noscript).

## Information from the school (website details form, 2 Nov 2026)

Already on the page: admissions phones (+91 85200 71222, +91 85200 87222), transport desk +91 80196 46415, office
timings, same-day call-back, age counted on 31 March 2027 (Nursery 3, LKG 4, UKG 5, Grade 1 6 years), documents list,
grade-wise yearly tuition (`FEES`), what is charged separately, three parent testimonials
(`PARENT_VOICES`, consent given, full names shown), CBSE affiliation no. 3630582, Mandatory Disclosure link.
Not shown on purpose: the counsellor's name and the website managers' contacts.

## Still waiting on the school (placeholders are visible on the page as yellow chips)

- Per-grade parent testimonials and the client's own FAQ set
  (client feedback, Nov 2026: "later"). The FAQ answers on the page are ours until then.

- Minimum ages for Grades 2 to 10 (the form only gave Nursery to Grade 1; the rest are one year apart).
- Testimonials for each grade. Until they arrive a grade shows the three we have: its own, else its stage's, else all of
  them (each named with the parent's real grade). Also one about safety and transport.
- What Grades 9–10 offer (the Secondary card is a draft and is flagged on the page), and add both grades to the
  CRM widget's grade list; which grades use the ICT lab.
- Privacy policy: not on the site for now (taken down until the school supplies its details). The draft is in git
  history: `git checkout 75cf51b -- privacy-policy.html`, then re-add the footer link and the link in the enquiry note;
  its page styles are still in `css/styles.css` (section 21). Yellow chips to confirm: legal name, retention period,
  grievance officer, which Tag Manager tools run; a legal adviser should read it before ads go live.
- Landing page URL (canonical, OG, schema).
- Real GTM ID; OG image (`images/og-image.jpg`, 1200x630).
- Exact map pin (coordinates are derived from the plus code).
- Which of the two enquiry e-mail addresses to show, if any (they are for receiving enquiries in the CRM).

## Rules the client and brief set

- Brand colours exactly: yellow #F9C212, orange #E87724, maroon #971B1E, ink #1A1110, paper #FBF5E9.
  Never body text in yellow on light backgrounds. Fonts: Young Serif (headings), Mukta (body).
- One H1. No emojis. No purple/blue gradients, glassmorphism, neon or blobs.
- No unverifiable claims ("best school", "#1", etc.); keep wording factual for Google Ads and ASCI.
- Real Sloka photos only. The facilities photos are now real (from the school's `infra` folder); the Aero Bay photo, the
  campus story's walkway slide, the "Step inside" entrance photo, the grade-sheet stage photos and `athletics.webp` still look AI-generated and should be replaced
  with real photos before ads go live (same file names in `images/` work as drop-in replacements).
- Must stay fast on budget Android phones on 4G (Lighthouse 90+ target), keyboard accessible, respect reduced motion.
- The client rejected: the earlier "school notebook" theme and an aerial-film hero intro. Don't bring them back.

## Where the code lives

One `git push origin main` from the working folder pushes to two GitHub repositories: `Atifisirich/slokatukkugudalandingpage`
(the original) and `hbi83701-tech/slokatukkugudalandingpage` (the second account's copy), so both stay identical. This is set up in
the local clone's remote settings (two push URLs on `origin`), not in the repository. Commit and push only from this folder, or
the two copies can diverge and the push to the one that is behind is rejected.

## Deploy

Upload `index.html`, `css/`, `js/` and `images/` to the cPanel subdomain (HTTPS on). `.claude/` is local only.
