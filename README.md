# Gofa Bahamas — Website

Marketing website for Gofa Bahamas (private charters, swim with pigs, snorkel with
turtles, ATV adventures, deep sea fishing). The booking and contact forms send
submissions to your email using **Web3Forms** — no server required.

## Contents

| File | Purpose |
|------|---------|
| `index.html` | The website (all styles/scripts inline, single page). |
| `404.html` | Custom "page not found" page. |
| `favicon.svg` | Site icon. |
| `site.webmanifest` | Install / PWA metadata. |
| `robots.txt`, `sitemap.xml` | SEO / search-engine files. |
| `charter image.jpg`, `PIGS.jpg`, `TURTLES SNORKLING.jpg` | Photos used on the site. |
| `server.js`, `package.json`, `.env.example` | Optional Node backend (only if you'd rather self-host the email handling instead of Web3Forms). |

## Set up the forms (Web3Forms — recommended, no server)

1. Go to **https://web3forms.com**, enter `gofabahamas@gmail.com`, and click to get an Access Key.
2. Check that inbox and copy the Access Key they email you.
3. Open `index.html`, find this line near the bottom (in the `<script>`):

   ```js
   var ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';
   ```

   Replace `YOUR_WEB3FORMS_ACCESS_KEY` with your key, keeping the quotes. Save.

That's it. Every booking/contact submission is now emailed to `gofabahamas@gmail.com`.
Web3Forms is free and includes basic spam filtering (a hidden honeypot field is already
built into both forms).

> Before you paste a key, the forms still "work" — clicking submit opens the visitor's
> email app pre-filled to gofabahamas@gmail.com. Once the key is in, submissions send
> silently in the background with a thank-you message.

## Publish the site (free static hosting)

Because there's no server to run, you can host the whole folder anywhere:

- **Netlify** — drag the folder onto https://app.netlify.com/drop. Done in seconds.
- **GitHub Pages** — push the files to a repo and enable Pages.
- **Cloudflare Pages / Vercel** — connect the repo or upload the folder.

Upload everything **except** `server.js`, `package.json`, `.env`, and `node_modules`
(those are only for the optional backend below).

## Optional: self-hosted Node backend instead of Web3Forms

If you'd rather run your own email handler, `server.js` provides `/api/booking` and
`/api/contact` endpoints using Gmail SMTP. See `.env.example` for the settings and run
`npm install` then `npm start`. If you go this route, change the two `fetch(ENDPOINT ...)`
targets in `index.html` back to `/api/booking` and `/api/contact`.
