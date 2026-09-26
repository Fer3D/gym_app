![FitTrack ES banner](https://capsule-render.vercel.app/api?type=waving&color=0:0f0f1a,100:4f46e5&height=220&section=header&text=FitTrack%20ES&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Nutrici%C3%B3n%20%C2%B7%20Entrenamientos%20%C2%B7%20Espa%C3%B1a&descAlignY=58&descAlign=50)

## App de nutrición y entrenamientos

Seguimiento de macros, rutinas, calendario y perfil en una sola app.  
Frontend React + backend Express + LibSQL (SQLite local / Turso en demo).

[![Live demo](https://img.shields.io/badge/Live%20demo-Vercel-black?style=for-the-badge&logo=vercel)](https://gym-app-opal-eight.vercel.app)

> **Demo pública:** sin auth. Todos comparten el mismo usuario (`userId` 1). Ideal para probar; no metas datos personales.
>
> API: [https://gym-app-otiw.onrender.com/api/health](https://gym-app-otiw.onrender.com/api/health)

---

## Capturas

![Nutrición FitTrack ES](https://github.com/user-attachments/assets/08e98a3f-44d3-4a74-b0ec-40bc63b93104)

![Nutrición FitTrack ES](https://github.com/user-attachments/assets/bc94e815-b05c-41ac-969f-a12c4e511832)

![Nutrición FitTrack ES](https://github.com/user-attachments/assets/f1d68a01-73d1-4bfd-a1e2-571f0134bb6d)

---

## Qué hace


| Módulo         | Descripción                                                   |
| -------------- | ------------------------------------------------------------- |
| **Dashboard**  | Resumen del día: calorías, macros, entrenos y gráfica semanal |
| **Nutrición**  | Comidas, búsqueda de alimentos y objetivos de macros          |
| **Entreno**    | Rutinas, ejercicios y logs de series                          |
| **Calendario** | Vista diaria/mensual de nutrición y workouts                  |
| **Perfil**     | Datos del usuario, TDEE y metas                               |


---

## Stack del proyecto

### Lenguajes


|                                                                                                                 |                                                                                                                 |                                                                                           |                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ![TypeScript](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg) TypeScript | ![JavaScript](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg) JavaScript | ![HTML](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg) HTML | ![CSS](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg) CSS |


### Frontend


|                                                                                             |                                                                                             |                                                                                                                   |                                                                                                                       |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ![React](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg) React | ![Vite](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg) Vite | ![Tailwind CSS](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg) Tailwind | ![React Router](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/reactrouter/reactrouter-original.svg) React Router |



| Librería           | Uso                     |
| ------------------ | ----------------------- |
| **TanStack Query** | Cache y fetching de API |
| **Axios**          | Cliente HTTP            |
| **Framer Motion**  | Animaciones UI          |
| **Recharts**       | Gráficas de nutrición   |
| **Lucide React**   | Iconos                  |
| **date-fns**       | Fechas / locale ES      |
| **react-calendar** | Calendario              |


### Backend


|                                                                                                   |                                                                                                     |                                                                                                 |                                                                                                 |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ![Node.js](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg) Node.js | ![Express](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg) Express | ![Prisma](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg) Prisma | ![SQLite](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg) SQLite |



| Pieza               | Detalle                                                              |
| ------------------- | -------------------------------------------------------------------- |
| **Express 5**       | API REST (`/api/...`)                                                |
| **Prisma + LibSQL** | ORM: SQLite local (`file:./dev.db`) o Turso (`libsql://...`) en demo |
| **CORS / dotenv**   | Origen frontend + variables de entorno                               |


### Deploy (demo)


| Pieza    | Host                                                  |
| -------- | ----------------------------------------------------- |
| Frontend | Vercel (`frontend/`, env `VITE_API_URL`)              |
| API      | Render Web Service (`backend/`, `npm run start:prod`) |
| DB       | Turso LibSQL (`DATABASE_URL` + `TURSO_AUTH_TOKEN`)    |


Variables clave (ver `.env.example`):

```bash
# backend
DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
CORS_ORIGIN=https://gym-app-opal-eight.vercel.app
PORT=3001

# frontend (Vercel)
# VITE_API_URL=https://gym-app-otiw.onrender.com/api
```

Render: root `backend`, build `npm install && npm run build`, start `npm run start:prod`.  
Live UI: [https://gym-app-opal-eight.vercel.app](https://gym-app-opal-eight.vercel.app) — API: [https://gym-app-otiw.onrender.com](https://gym-app-otiw.onrender.com)  
Vercel: root `frontend`.

### Herramientas


|                                                                                              |                                                                                     |                                                                                                 |                                                                                                   |                                                                                                 |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ![npm](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg) npm | ![Git](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg) Git | ![GitHub](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg) GitHub | ![VS Code](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg) VS Code | ![ESLint](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg) ESLint |


---

## Estructura

```
gym_app/
├── frontend/     # React + Vite + Tailwind (Vercel)
├── backend/      # Express + Prisma + LibSQL (Render)
├── package.json  # concurrently (dev frontend + backend)
└── README.md
```

---

## Cómo arrancar

Copia `.env.example` a `backend/.env` (local: `DATABASE_URL=file:./dev.db`).

```bash
# Dependencias
npm run install:all

# Migraciones (primera vez / tras clonar)
cd backend && npx prisma migrate deploy && cd ..

# Dev (API + UI)
npm run dev
```


| Servicio | URL típica              |
| -------- | ----------------------- |
| Frontend | `http://localhost:5173` |
| Backend  | `http://localhost:3001` |


Scripts útiles backend:

```bash
cd backend
npm run db:migrate
npm run db:studio
```

---

## Tests

Frontend usa **Vitest**. Suite actual: **18 tests** de lógica (sin browser ni API real).


| Archivo                          | Qué cubre                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/lib/utils.test.ts` | Macros (`calcMacrosFromPer100g`), progreso (`pct`, `remaining`), labels de comida, fechas ES (`dateToString`, `getWeekStart`, `formatDate`), saludos (`greetingForHour`) |
| `frontend/src/lib/mock.test.ts`  | Fixtures de nutrición, workouts y calendario                                                                                                                             |


### Cómo ejecutarlos

Desde la raíz del repo:

```bash
npm test
```

Desde `frontend/`:

```bash
cd frontend
npm test                 # una pasada
npm run test:watch       # modo watch
npx vitest run --reporter=verbose   # lista cada test
npm run test:coverage    # cobertura
```

---

## Accesibilidad y SEO

No pretendí optimizar para Google a lo bestia: es una SPA de portfolio. Sí me importó que se pueda usar con teclado, que un lector de pantalla entienda formularios y botones, y que al compartir el enlace no salga una tarjeta vacía.

En accesibilidad hay skip link al contenido, modales que se cierran con Escape y mantienen el foco dentro, labels reales en el perfil, y `aria-label` donde el botón es solo un icono. También `:focus-visible` y respeto a `prefers-reduced-motion`.

En SEO dejé title por página, description, Open Graph / Twitter, favicon y un `robots.txt` + `sitemap.xml` de verdad en `public/` (antes Vercel devolvía el HTML de la app y engañaba).

---

[![Follow Me](https://img.shields.io/github/followers/Fer3D?label=Follow%20Me&style=social)](https://github.com/Fer3D)
