# Live site audit: valenciasmileexpert.com (Oct 23, 2026)

Source: every URL in the WordPress sitemaps (26 pages, 30 posts, 1 author page), the pages they link to
(`/category/blogs/` with pages 2 and 3, `/author/nedamoezzi/page/2/` and `/3/`, `/author/fahad/`,
`/author/ttrdigital/`), the WordPress REST API and the page source. Numbers in brackets are the decision
numbers in the chat message.

## 1. Text copied from elsewhere, or left over from drafting

| # | Page | Problem |
|---|---|---|
| 1 | `/services/restorative-dentistry/dental-bridges/` | A whole **Invisalign** section sits on the bridges page: "3D Digital Imaging … iTero scanner", "Custom Clear Aligners … BPA-free plastic aligners", "Daily Wear & Routine Care … 20–22 hours a day", check-ins, "6 to 18 months". Copied word for word from `/services/cosmetic-dentistry/invisalign/`. |
| 2 | `/dental-implants-valencia-cost-guide/` | The writer's note was published: "Suggested images for the post — To improve engagement and conversions, add these images (we can generate them after you approve publishing): Featured image: … (1200×628). Diagnostic image … Before/after gallery … Infographic …" |
| 3 | `/why-choose-valencia-smile-what-to-expect-on-your-first-visit/` | Heading "FAQ — quick answers (voice‑search & snippet optimized)" (SEO instruction left in the heading). The "Helpful internal links" list is fine (real links). |
| 4 | `/dental-bridge-cost-guide/` | Opens with "The keyword you probably searched for — dental bridge cost santa clarita — is the single practical question…" |
| 5 | `/crown-vs-filling-dental-crown-guide/` | Reddit posts (the page links them) are presented as the practice's own patients: "Real patients in our clinic raises three recurring concerns…", "one patient in our clinic shared quotes…". The other posts say "Reddit" / "community forums" openly. |
| – | 20+ posts | Price ranges and forum anecdotes ("$2,800 in Mexico", "New York City", "Los Angeles" threads). This is the client's own published text, so it is copied as is; listed only so you know it is there. |
| – | `/about/` | "At Valencia Smile **Experts**" (plural) once. The contact form's consent line says "VALENCIA'S SMILE EXPERT LLC"; the terms say "Valencia Smile Expert LLC". |

No text from another practice or another city was found (searched every page for other practice names,
doctors, cities and states). The only other business is in image addresses (section 4).

## 2. Duplicate and empty pages

- No two pages share a title or description, and no page is an exact copy of another.
- Overlapping posts (same topic, different text; kept, listed for your info): `/dental-implants-cost/` and
  `/dental-implants-valencia-cost-guide/`; `/dental-implant-timeline/` and `/how-long-do-dental-implants-take/`;
  `/bone-grafting-for-dental-implants-guide/` and `/bone-grafting-healing-timeline/`.
- [9] `/testimonials/` is **empty** (title and heading only, no reviews) but is in the sitemap.
- `/appointment/` has no text besides "Book Your Appointment" and the GoHighLevel calendar.
- [10] `/thank-you/` is indexable and listed in the sitemap.
- Author archives: `/author/nedamoezzi/` (in the sitemap, 3 pages), `/author/fahad/` and `/author/ttrdigital/`
  (empty). Per your brief: 301 to `/about/` (Dr. Moezzi) and to the blog (the other two).

## 3. Titles, descriptions, headings

- [15] **32 of 57 pages have no meta description**: Contact, Appointment, Privacy Policy, Terms, Testimonials,
  Thank You, Sitemap, TMJ, Dental Crowns, Dental Bridges, Holistic Dentistry and 21 of the 30 posts.
- 14 service pages share one template description ("Explore Valencia Smile Expert's top-rated *X* in Santa
  Clarita—modern care, advanced technology, and 1-on-1 personalized treatment. Book today."), unique only by
  the service name. 5 descriptions are over 160 characters.
- 24 titles are over 60 characters (mostly posts: title + " - Valencia Smile Expert").
- [13] Lower-case titles: "tmj treatments - Valencia Smile Expert" (also "tmj treatments" in the menu) and
  "terms and services - Valencia Smile Expert".
- [17] **No H1** on About, Appointment, Sitemap, Terms and Thank You; **two H1s** on Services (desktop and phone
  copies of the same heading).
- [18] The menu's "Blogs" page (`/category/blogs/`) is **noindex** and has no description.
- The HTML sitemap page (`/sitemap/`) lists pages only, no posts; the footer links to `/sitemap` (no slash),
  which costs a redirect.

## 4. Links to staging hosts and broken links

- [23] Google logo and rating-star images load from **`staging7.tiamspa.com`** (another business's staging site)
  on Home, Contact and the 5 Oral Surgery pages, and from **`valencia.ttrdigitalmarketing.com`** (old staging
  site) on 9 service pages. Both still answer today; if either is shut down, those images break.
- [24] Broken links: `/scaling-vs-root-planing-understanding-the-differences-in-dental-care/` (404, in
  `/dental-implants-vs-dentures/`), `aaid.com/about/what-are-dental-implants.html` (404),
  `nhs.uk/conditions/dental-crown/` (404), and two incomplete citation links
  `ncbi.nlm.nih.gov/pmc/articles/` and `…/pmc/articles/PMC/`.
- [25] Two outbound links carry `?utm_source=chatgpt.com` (Cleveland Clinic, WebMD).
- Could not be checked from here (the sites block automated requests): mayoclinic.org (6 links), cdc.gov
  (`/oralhealth/index.html`, 6 links).
- [7] Social icons on every page: Facebook, X and LinkedIn go to **`iHeartDDS1`** accounts (LinkedIn as a
  personal profile, `/in/iHeartDDS1`); Instagram goes to `Valenciasmileexpert`.
- [8] Footer menu items "Patient Resources", "New Patient Offer", "Emergency Dental" and "New Patient Spanish"
  are plain text, not links (no such pages exist).

## 5. Images

- [26] 587 image tags, 103 different images; **471 tags (83 images) have no alt text**, including the logo,
  doctor and team photos, every blog banner and all review avatars.
- Before/after photos (6 pairs + 1 implant pair) are real patient photos with alt text.

## 6. Reviews and stats

- [5] Home, Contact and 14 service pages show "Google Rating 4.9 ★ 180 reviews" and the same 5 Google
  reviews, typed into the page (not a live widget). They are the client's published text; whether 4.9 / 180 is
  still current can't be checked from here.
- Practice claims on the site (copied as is): "serving the community of Santa Clarita since 2007",
  "$59 Exam & X-Rays" new-patient special, "same-day availability", "flexible financing", "sedation options".
- [11] Hours: "Monday – Friday: 8am – 5pm, Saturday & Sunday Closed" everywhere; the Terms page says text-message
  support is "Monday through Friday, 9:00 AM to 5:00 PM PST".

## 7. Forms, booking, chat and tracking

| What | Where | Details |
|---|---|---|
| Weave "Book Now" link | header, footer and most buttons, every page | `book2.getweave.com/657e8080-…/request-appointment?source=WEBSITE` (external page, works) |
| GoHighLevel calendar | `/appointment/` | booking widget `j4H5rCKjnGNn7M2ylkvT` (iframe + `form_embed.js`) |
| GoHighLevel form "Request Appointment" | pop-up (Elementor popup 566), opened by "Book Now" buttons on 19 pages | form `btm4moNMa4QyioPeiU4r`: Full Name, Phone Number\*, Email Address\*, Comment; Cloudflare Turnstile; button "Request Appointment" |
| GoHighLevel form "valencia contact" | `/contact/` | form `plxF1RZLck60J8TsFE2p`: First Name, Last Name, Phone, Email, Message, SMS marketing consent checkbox; button "Submit" |
| Elementor Pro form | pop-up (Elementor popup 835), opened by "Request Your Appointment" buttons on 6 pages (4 cosmetic service pages, Restorative, Dental Bridges) | Full Name\*, Phone\*, Your Email\*, Comment; posts to WordPress, which emails it. **Stops working when WordPress is gone.** |
| WordPress comment form | all 30 posts | 0 comments ever published |
| Chat widget | none | no GoHighLevel or other chat script on any page |
| Google Tag Manager | every page | `GTM-PPV3TDK8` |
| Google Analytics 4 | every page | `G-XBJPWQ7365` (gtag, separate from GTM) |
| Ahrefs Web Analytics | every page | `analytics.ahrefs.com/analytics.js`, data-key `zOiJ7NVjmgliAokzTHBDAw` |
| Google Maps embeds | Home, About, Contact, service pages | three slightly different map iframes |

## 8. Hosting

- `https://www.valenciasmileexpert.com` is the canonical host today; the bare domain redirects to it, URLs
  without a slash get a 301 to the slash version, unknown URLs return a real 404. SiteGround (Site Tools,
  SG Optimizer, SG Security) on WordPress 6 + Astra + Elementor Pro.
- `/feed/` and `/category/blogs/feed/` answer 200 today (410 after the switch, per your brief).
- `/dental-implants/` already 301s to `/services/dental-implants/` (WordPress old-slug redirect): kept.
