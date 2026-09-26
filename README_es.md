<p align="right">
  <a href="./README.md"><img src="https://flagcdn.com/h20/gb.png" height="20" alt="English"></a>
  &nbsp;
  <a href="./README_es.md"><img src="https://flagcdn.com/h20/es.png" height="20" alt="Español"></a>
</p>

![FitTrack banner](https://capsule-render.vercel.app/api?type=waving&color=0:0f0f1a,100:4f46e5&height=220&section=header&text=FitTrack&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Nutrici%C3%B3n%20%C2%B7%20Entrenamientos&descAlignY=58&descAlign=50)

## FitTrack

Demo de portfolio que monté para llevar las comidas y entrenos en un mismo sitio: macros, rutinas, calendario y perfil.  
Frontend en React, API en Express, datos en LibSQL (SQLite en local, Turso en la demo online). La interfaz sigue el idioma del navegador (ES o EN), o lo puedes modificar en el Perfil.

[![Live demo](https://img.shields.io/badge/Live%20demo-Vercel-black?style=for-the-badge&logo=vercel)](https://gym-app-opal-eight.vercel.app)

> **Ojo:** la demo pública no tiene login. Todo el mundo usa el mismo usuario compartido (`userId` 1), así que no metas ninguna información personal.  
> Ping de la API: [gym-app-otiw.onrender.com/api/health](https://gym-app-otiw.onrender.com/api/health)

> **Sobre el nombre:** «FitTrack» es solo un placeholder de esta pieza de portfolio. No es un producto que venda ni una marca mía. Si coincide con otra marca, es casualidad — sin afiliación.

---

## Capturas

Unas pantallas de la app en uso:

![Dashboard](https://github.com/user-attachments/assets/08e98a3f-44d3-4a74-b0ec-40bc63b93104)

![Nutrición](https://github.com/user-attachments/assets/bc94e815-b05c-41ac-969f-a12c4e511832)

![Entreno](https://github.com/user-attachments/assets/f1d68a01-73d1-4bfd-a1e2-571f0134bb6d)

---

## Con qué está hecha

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

También TanStack Query, i18next, Axios, Framer Motion, Recharts, date-fns y LibSQL/Turso cuando está online.

El despliegue es sencillo: UI en Vercel, API en Render, DB en Turso. Copia [`.env.example`](./.env.example) si quieres levantarla en local.

---

## Cómo arrancarla

```bash
cp .env.example backend/.env   # local: DATABASE_URL=file:./dev.db
npm run install:all
cd backend && npx prisma migrate deploy && cd ..
npm run dev
```

Luego abre `http://localhost:5173` — la API escucha en `http://localhost:3001`.

---

## Tests

Hay una suite pequeña de Vitest para la lógica pura (sin browser ni API real). Desde la raíz del repo:

```bash
npm test
```

---

## Accesibilidad y SEO

No pretendí rankear en Google: es una SPA de portfolio. Sí que me importó que se pueda usar con teclado, que un lector de pantalla entienda formularios y botones con icono, y que al compartir el enlace salga una tarjeta.

Por eso hay skip link, modales que cierran con Escape y mantienen el foco dentro, labels reales en el perfil, `aria-label` donde el control es solo icono, `:focus-visible` y respeto a `prefers-reduced-motion`. Para la tarjeta de compartir: title por página, description, Open Graph / Twitter, favicon, y un `robots.txt` + `sitemap.xml` reales en `public/`.

---

[![Follow Me](https://img.shields.io/github/followers/Fer3D?label=Follow%20Me&style=social)](https://github.com/Fer3D)
