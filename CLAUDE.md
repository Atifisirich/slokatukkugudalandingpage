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
(currently `?v=31`) so returning visitors don't get a cached copy.

## Page order

1. **Header**: logo, section links (Campus, Facilities, Grades & Fees, Transport, FAQ), phone, Enquire button.
   Transparent over the hero photo, solid once scrolled. Mobile has a fixed Call / WhatsApp bar.
2. **Hero**: full-width campus building photo, headline left, CRM enquiry form right.
   On desktop the photo stays pinned and zooms toward the entrance while the copy scrolls away (`.hero--zoom`),
   then "Sloka International School, Tukkuguda" arrives. On phones it is a poster: clear photo with the headline
   and a Book button, then the form, then the two shortcuts.
3. **Trust strip**: CBSE Affiliated, NEP 2020 Aligned and three smaller facts.
4. **"Step inside" + campus story** (`#campus-story`): an arch doorway opens on the entrance, then each scroll
   brings in the next campus photo (6 slides, arched rising edge, captions, progress dots).
   `--n` on the section must equal the number of slides.
5. **Facilities** (`#facilities`): photo mosaic of 13 spaces (Aero Bay, Science Labs, ICT, Library, Smart Classrooms,
   Play Land and Activity Hall, football and cricket, basketball, skating, pickleball, taekwondo, athletics, CCTV)
   with a sideways-scrolling picker (All or one space). Real school photos, except Aero Bay (AI image supplied by the
   school) and the CCTV walkway. A missing photo shows a maroon tile with its file name.
6. **Grades** (`#pathway`): grade chips (Nursery to Grade 10) + date-of-birth check, then ONE grade sheet: grade
   header band, stage details (Early Years, Primary, Middle School, Secondary), spaces, the grade's own fee range
   and its own parent testimonial.
7. **Transport** (`#visit`): one card with the Google Map, area buttons grouped by distance, directions,
   WhatsApp about the bus, and the campus address strip.
8. **Admission in four steps** (doors that open as the section scrolls into view), **FAQ** ("Ask Sloka" chat
   with search and WhatsApp fallback), **footer**. There is no closing call-to-action, approach or parents section.

A flower loading screen (from the logo) shows once per session, never with reduced motion.

## Where to change things (top of js/main.js)

- `ENQUIRY_CONFIG`: CRM. Currently `mode: 'widget'` with the ExtraaEdge widget (form-9, container `ee-form-9`)
  supplied by the CRM team. It loads after first paint or on first interaction (about 300 KB of jQuery, select2 etc.).
  `enquiry_submitted` is pushed to `dataLayer` once, only when the widget's API reply is
  `{ result: "Success", message: "1" }` (see `widget.isSuccess`). Do not change this without testing.
  `endpoint` mode (built-in form) is kept as a fallback option.
- `AGE_RULES`: minimum age per grade on 1 June 2027 for the date-of-birth check.
- `FEES`: approximate annual fee per grade as `[min, max]` in rupees; `null` shows the placeholder.
- `PARENT_VOICES`: one testimonial per grade (topic, quote, parent, area, optional photo, `draft` flag); `null` shows
  the placeholder. Keys must match the grade chip values exactly, e.g. "Grade 2".
- `trackInteractions`: extra dataLayer events (grade picked, area checked, FAQ opened/searched, call/WhatsApp taps).
- GTM container ID is `GTM-XXXXXXX` in two places in `index.html` (head and noscript).

## Information from the school (website details form, 2 Nov 2026)

Already on the page: admissions phones (+91 85200 71222, +91 85200 87222), transport desk +91 80196 46415, office
timings, same-day call-back, age counted on 31 March 2027 (Nursery 3, LKG 4, UKG 5, Grade 1 6 years), documents list,
approximate yearly tuition by stage (`FEES`), what is charged separately, three parent testimonials
(`PARENT_VOICES`, consent given, full names shown), CBSE affiliation no. 3630582, Mandatory Disclosure link.
Not shown on purpose: the counsellor's name and the website managers' contacts.

## Still waiting on the school (placeholders are visible on the page as yellow chips)

- Minimum ages for Grades 2 to 10 (the form only gave Nursery to Grade 1; the rest are one year apart).
- Testimonials for Grades 9 and 10 (other grades show testimonials from their own stage); one about safety and transport.
- What Grades 9–10 offer (the Secondary card is a draft and is flagged on the page), and add both grades to the
  CRM widget's grade list; which grades use the ICT lab and smart classrooms.
- Privacy policy URL; landing page URL (canonical, OG, schema).
- Real GTM ID; OG image (`images/og-image.jpg`, 1200x630).
- Exact map pin (coordinates are derived from the plus code).
- Which of the two enquiry e-mail addresses to show, if any (they are for receiving enquiries in the CRM).

## Rules the client and brief set

- Brand colours exactly: yellow #F9C212, orange #E87724, maroon #971B1E, ink #1A1110, paper #FBF5E9.
  Never body text in yellow on light backgrounds. Fonts: Young Serif (headings), Mukta (body).
- One H1. No emojis. No purple/blue gradients, glassmorphism, neon or blobs.
- No unverifiable claims ("best school", "#1", etc.); keep wording factual for Google Ads and ASCI.
- Real Sloka photos only. The facilities photos are now real (from the school's `infra` folder); the Aero Bay photo, the
  campus story slides, the grade-sheet stage photos and `athletics.webp` still look AI-generated and should be replaced
  with real photos before ads go live (same file names in `images/` work as drop-in replacements).
- Must stay fast on budget Android phones on 4G (Lighthouse 90+ target), keyboard accessible, respect reduced motion.
- The client rejected: the earlier "school notebook" theme and an aerial-film hero intro. Don't bring them back.

## Deploy

Upload `index.html`, `css/`, `js/` and `images/` to the cPanel subdomain (HTTPS on). `.claude/` is local only.
