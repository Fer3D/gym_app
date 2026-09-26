<p align="right">
  <a href="./README.md"><img src="https://flagcdn.com/h20/gb.png" height="20" alt="English"></a>
  &nbsp;
  <a href="./README_es.md"><img src="https://flagcdn.com/h20/es.png" height="20" alt="Español"></a>
</p>

![FitTrack banner](https://capsule-render.vercel.app/api?type=waving&color=0:0f0f1a,100:4f46e5&height=220&section=header&text=FitTrack&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Nutrition%20%C2%B7%20Workouts&descAlignY=58&descAlign=50)

## FitTrack

Portfolio demo I built to track meals and workouts in the same place: macros, routines, calendar, and profile.
Frontend in React, API in Express, data in LibSQL (SQLite locally, Turso for the live demo). The UI follows the browser language (Spanish or English), or you can change it in Profile.

[![Live demo](https://img.shields.io/badge/Live%20demo-Vercel-black?style=for-the-badge&logo=vercel)](https://gym-app-opal-eight.vercel.app)

> **Heads up:** the public demo has no login. Everyone uses the same shared user (`userId` 1), so please don’t put any personal information in there.
> API ping: [gym-app-otiw.onrender.com/api/health](https://gym-app-otiw.onrender.com/api/health)

> **About the name:** “FitTrack” is just a placeholder for this portfolio piece. It’s not a product I’m selling, and I’m not claiming the trademark. If it overlaps with another brand, that’s coincidence — not affiliation.

---

## Screenshots

A few shots of the app in use:

![Dashboard](https://github.com/user-attachments/assets/08e98a3f-44d3-4a74-b0ec-40bc63b93104)

![Nutrition](https://github.com/user-attachments/assets/bc94e815-b05c-41ac-969f-a12c4e511832)

![Workout](https://github.com/user-attachments/assets/f1d68a01-73d1-4bfd-a1e2-571f0134bb6d)

---

## What I used

<table>
  <tr>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="40" height="40" alt="React"><br>React</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="40" height="40" alt="TypeScript"><br>TypeScript</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="40" height="40" alt="Vite"><br>Vite</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="40" height="40" alt="Tailwind"><br>Tailwind</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="40" height="40" alt="Node.js"><br>Node</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="40" height="40" alt="Express"><br>Express</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="40" height="40" alt="Prisma"><br>Prisma</td>
  </tr>
</table>

Plus TanStack Query, i18next, Axios, Framer Motion, Recharts, date-fns, and LibSQL/Turso when it’s online.

The live split is simple: UI on Vercel, API on Render, DB on Turso. Copy [`.env.example`](./.env.example) if you want to run it yourself.

---

## Run it locally

```bash
cp .env.example backend/.env   # local: DATABASE_URL=file:./dev.db
npm run install:all
cd backend && npx prisma migrate deploy && cd ..
npm run dev
```

Then open `http://localhost:5173` — the API listens on `http://localhost:3001`.

---

## Tests

I keep a small Vitest suite for the pure logic (no browser, no real API). From the repo root:

```bash
npm test
```

---

## Accessibility and SEO

I didn’t try to rank on Google: it’s a portfolio SPA. I did care that you can use it with a keyboard, that a screen reader understands forms and icon buttons, and that sharing the link shows a preview card.

That’s why there’s a skip link, modals that close with Escape and keep focus inside, real labels on the profile form, `aria-label` where a control is icon-only, `:focus-visible`, and respect for `prefers-reduced-motion`. For the share card: per-page titles, description, Open Graph / Twitter, favicon, and a real `robots.txt` + `sitemap.xml` in `public/`.

---

[![Follow Me](https://img.shields.io/github/followers/Fer3D?label=Follow%20Me&style=social)](https://github.com/Fer3D)