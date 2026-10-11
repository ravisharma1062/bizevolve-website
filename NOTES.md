# BizEvolve website: notes and handover

Plain static site. No build step. Open `index.html` through any web server and it works.

## 1. Key decisions and why

- **Plain HTML, CSS and JavaScript (ES2017).** Easy to edit, free to host, and old phones can run it.
- **Everything is local.** GSAP, ScrollTrigger and Lenis are in `vendor/`. Fonts (Sora and Inter) are in `assets/fonts/`. Nothing loads from a CDN at runtime.
- **All business details live in `js/config.js`.** Phone, WhatsApp number, email, prices, sample links, reviews.
- **The page works first as plain HTML.** Effects are added on top by JavaScript. With JavaScript off, everything is visible. FAQ uses `<details>`. WhatsApp, call and email are normal links.
- **Three animation tiers, chosen at start-up** (`data-tier` on `<html>`):
  - `full`: everything (aurora canvas, smooth scroll, custom cursor, tilt, pinned sample showcase).
  - `lite`: weak phone, data saver, slow network or low frame rate. Simple fades, marquee, counters, timeline. No canvas, smooth scroll, cursor or tilt.
  - `minimal`: reduced motion, JavaScript off, very old browser, or the visitor pressed "Reduce motion" in the footer. No animation at all.
  - To test a tier, add `?tier=full`, `?tier=lite` or `?tier=minimal` to the address.
- **Safety rules.** Content is only hidden by JavaScript after GSAP has loaded. If anything fails, `Biz.anim.fail()` shows everything. The preloader is removed after 2.2 seconds at most.
- **Contact form has no backend.** It opens WhatsApp with the details filled in, using a real link click (not `window.open`), so it also works inside WhatsApp and Instagram browsers. A "Tap here" fallback link also appears.
- **Pinned sideways sample showcase** only runs on wide screens with a mouse. Phones and tablets get a swipe carousel.
- **WhatsApp button green** is `#067A57` (a little darker than the brand WhatsApp green) so white text passes the AA contrast rule.
- **Sample concepts** are built with HTML and CSS only (no photos). They are fictional and labelled "Sample concept".
- **Email.** `sakshirsharma@gmail.com` is published as the plan says. Set `email: ""` in `js/config.js` and every email button, link and text disappears. The email in the JSON-LD block in `index.html` must be removed by hand in that case.

## 2. How to edit text and prices

- **Phone, WhatsApp number, email, city, prices, first WhatsApp message:** `js/config.js`. Save and refresh.
- **Page text** (headlines, services, FAQ, how it works, about): `index.html`. Search for the words you want to change.
- **Prices:** change `price` in `js/config.js` (the cards update by themselves). The bullet lists under each plan are in `index.html`, inside `<article class="plan">`.
- **Colours:** top of `css/base.css` (`:root { --violet ... }`).
- If you change the phone number, also change it in `index.html` in the JSON-LD block near the top and in `assets/og-image` (source: `tools/og.html`).

## 3. How to add real reviews and demo links

- **Reviews:** in `js/config.js`, fill `reviews`:
  ```js
  reviews: [
    { name: "Customer name", business: "Business name", text: "What they said." }
  ]
  ```
  The "Be our first success story" card is replaced by a review slider. Only add real reviews, with the customer's permission.
- **Demo links:** in `js/config.js`, put the address in `samples[].liveUrl`, for example `liveUrl: "https://demo.example.com"`. An "Open live site" button then appears in that sample's popup.
- **Optional form service:** paste a Web3Forms or Formspree address in `FORM_ENDPOINT`. The form then also sends there.

## 4. Run the site on your computer

You need Node.js (any recent version).

```
node tools/serve.js 8080
```

Then open http://localhost:8080 in your browser. (Any static server works, for example `npx serve`.)

To run the tests (needs `cd tools && npm install` once, and then `npx playwright install` once):

```
node tools/test.js        # functional checks (about 80)
node tools/matrix.js      # device screenshots and overflow checks
```

Screenshots are saved in `tools/shots/`.

## 5. Publish and update (free)

**Cloudflare Pages (recommended)**
1. Put this folder in a GitHub repository (or choose "Upload assets" in Cloudflare Pages).
2. Create a Pages project. Build command: none. Output directory: `/` (the project root).
3. After the domain **bizevolve.in** is bought in the business owner's name, add it under "Custom domains" and follow the DNS steps. HTTPS is automatic.

**Netlify:** drag and drop the folder onto the Netlify dashboard. No build command. Publish directory is the root.

**To update later:** edit the files, then push to GitHub (or upload the folder again). The site updates in about a minute.

**After the first publish**
- If the live address is not `https://bizevolve.in`, update `siteUrl` in `js/config.js` and the `canonical`, `og:url`, `og:image`, `twitter:image` tags, and the `url` in the JSON-LD block of `index.html`. Also update `robots.txt` and `sitemap.xml`.
- Test every button on a real phone, and open the link from inside WhatsApp once.

You can delete the `tools/` folder before publishing if you want. The site does not use it. (`tools/node_modules` and `tools/shots` are not needed on the server.)

## 6. Not finished or needs the owner

- **Deploy was not done.** It needs the owner's Cloudflare or Netlify account, and the domain. Steps are above.
- **Real reviews** and **live demo links** (Section 3).
- **Tested by emulation only.** No real iPhone, Android phone or in-app browser was available. Please open the live link on real phones and from inside WhatsApp and Instagram once.
- **Orbiting chips in the hero** use an animated CSS property (`@property`). Browsers without it (older Safari and Firefox) show floating chips instead. This is intended.
- The email in the JSON-LD block is written by hand (see Section 1).
