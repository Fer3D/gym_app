<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0f1a,100:4f46e5&height=220&section=header&text=FitTrack%20ES&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Nutrici%C3%B3n%20%C2%B7%20Entrenamientos%20%C2%B7%20Espa%C3%B1a&descAlignY=58&descAlign=50" alt="FitTrack ES banner">
</p>

<h2 align="center">App de nutrición y entrenamientos</h2>

<p align="center">
  Seguimiento de macros, rutinas, calendario y perfil en una sola app.<br>
  Frontend React + backend Express + SQLite.
</p>

---

## Capturas
<p align="center">
  <img width="100%" alt="Nutrición FitTrack ES" src="https://github.com/user-attachments/assets/08e98a3f-44d3-4a74-b0ec-40bc63b93104" />
</p>

<p align="center">
  <img width="100%" alt="Nutrición FitTrack ES" src="https://github.com/user-attachments/assets/bc94e815-b05c-41ac-969f-a12c4e511832" />
</p>

<p align="center">
  <img width="100%" alt="Nutrición FitTrack ES" src="https://github.com/user-attachments/assets/f1d68a01-73d1-4bfd-a1e2-571f0134bb6d" />
</p>

---

## Qué hace

| Módulo | Descripción |
| --- | --- |
| **Dashboard** | Resumen del día: calorías, macros, entrenos y gráfica semanal |
| **Nutrición** | Comidas, búsqueda de alimentos y objetivos de macros |
| **Entreno** | Rutinas, ejercicios y logs de series |
| **Calendario** | Vista diaria/mensual de nutrición y workouts |
| **Perfil** | Datos del usuario, TDEE y metas |

---

## Stack del proyecto

### Lenguajes

<table>
  <tr>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="40" height="40" alt="TypeScript"><br>TypeScript</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="40" height="40" alt="JavaScript"><br>JavaScript</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="40" height="40" alt="HTML"><br>HTML</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" width="40" height="40" alt="CSS"><br>CSS</td>
  </tr>
</table>

### Frontend

<table>
  <tr>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="40" height="40" alt="React"><br>React</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="40" height="40" alt="Vite"><br>Vite</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="40" height="40" alt="Tailwind CSS"><br>Tailwind</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/reactrouter/reactrouter-original.svg" width="40" height="40" alt="React Router"><br>React Router</td>
  </tr>
</table>

| Librería | Uso |
| --- | --- |
| **TanStack Query** | Cache y fetching de API |
| **Axios** | Cliente HTTP |
| **Framer Motion** | Animaciones UI |
| **Recharts** | Gráficas de nutrición |
| **Lucide React** | Iconos |
| **date-fns** | Fechas / locale ES |
| **react-calendar** | Calendario |

### Backend

<table>
  <tr>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="40" height="40" alt="Node.js"><br>Node.js</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="40" height="40" alt="Express"><br>Express</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="40" height="40" alt="Prisma"><br>Prisma</td>
    <td align="center" width="110"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg" width="40" height="40" alt="SQLite"><br>SQLite</td>
  </tr>
</table>

| Pieza | Detalle |
| --- | --- |
| **Express 5** | API REST (`/api/...`) |
| **Prisma + LibSQL** | ORM sobre SQLite local (`backend/dev.db`) |
| **CORS / dotenv** | Origen frontend + variables de entorno |

### Herramientas

<table>
  <tr>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg" width="40" height="40" alt="npm"><br>npm</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="40" height="40" alt="Git"><br>Git</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="40" height="40" alt="GitHub"><br>GitHub</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" width="40" height="40" alt="VS Code"><br>VS Code</td>
    <td align="center" width="100"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg" width="40" height="40" alt="ESLint"><br>ESLint</td>
  </tr>
</table>

---

## Estructura

```
gym_app/
├── frontend/     # React + Vite + Tailwind
├── backend/      # Express + Prisma + SQLite
├── package.json  # concurrently (dev frontend + backend)
└── README.md
```

---

## Cómo arrancar

```bash
# Dependencias
npm run install:all

# Dev (API + UI)
npm run dev
```

| Servicio | URL típica |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:3000` (o puerto de `backend/.env`) |

Scripts útiles backend:

```bash
cd backend
npm run db:migrate
npm run db:studio
```

---

## Tests

Frontend usa **Vitest**. Suite actual: **20 tests** de lógica (sin browser ni API real).

| Archivo | Qué cubre |
| --- | --- |
| `frontend/src/lib/utils.test.ts` | Macros (`calcMacrosFromPer100g`), progreso (`pct`, `remaining`), labels de comida, fechas ES (`dateToString`, `getWeekStart`, `formatDate`), saludos (`greetingForHour`) |
| `frontend/src/lib/mock.test.ts` | Datos mock (nutrición, workouts, calendario) y `withFallback` (API OK vs error) |

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

<p align="center">
  <a href="https://github.com/Fer3D"><img src="https://img.shields.io/github/followers/Fer3D?label=Follow%20Me&style=social" alt="Follow Me"></a>
</p>
