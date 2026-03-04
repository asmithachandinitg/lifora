# lifora

Personal life management app built with Angular. One place to track everything — health, habits, finances, journaling, travel, and more.

Backend: [github.com/asmithachandinitg/lifora-backend](https://github.com/asmithachandinitg/lifora-backend)

---

## What's inside

### Productivity
- Dashboard
- Tasks
- Habits
- Goals

### Health
- Fitness Tracker
- Food Tracker
- Sleep Tracker
- Mood Tracker
- Period Tracker
- Pregnancy Tracker
- Medicine Tracker

### Finance
- Expenses Tracker

### Personal
- Diary / Journal (rich text with Quill)
- Reading Tracker
- Profile
- Settings

### Lifestyle
- Travel

More modules will be added over time.

---

## Tech

- **Angular** (standalone components)
- **TypeScript**
- **Angular Forms**
- **ngx-quill** — rich text editor for the journal
- **CSS** — custom styles per component, no UI library

Communicates with the backend via Angular's HttpClient.

---

## Running locally

You'll need Node.js and the Angular CLI installed.

```bash
git clone https://github.com/asmithachandinitg/lifora.git
cd lifora
npm install
ng serve
```

Open `http://localhost:4200` in your browser.

Make sure the backend is running on `http://localhost:5000` for API calls to work.

---

## Project structure

```
lifora/
├── src/
│   ├── app/                   # root app component
│   ├── core/                  # core services, guards, interceptors
│   ├── layout/                # shared layout (navbar, sidebar, etc.)
│   ├── modules/               # feature modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── diary/
│   │   ├── expenses/
│   │   ├── fitness/
│   │   │   ├── fitness.component.ts
│   │   │   ├── fitness.component.html
│   │   │   ├── fitness.component.css
│   │   │   ├── fitness.model.ts
│   │   │   └── fitness.service.ts
│   │   ├── food/
│   │   ├── goals/
│   │   ├── habits/
│   │   ├── medicine/
│   │   ├── mood/
│   │   ├── period/
│   │   ├── pregnancy/
│   │   ├── profile/
│   │   ├── reading/
│   │   ├── settings/
│   │   ├── sleep/
│   │   ├── tasks/
│   │   └── travel/
│   ├── shared/                # shared components and utilities
│   ├── types/                 # TypeScript type definitions
│   │   └── country-telephone-data.d.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── tsconfig.json
└── package.json
```

Each module follows the same pattern — a component (`.ts`, `.html`, `.css`), a model (`.model.ts`), and a service (`.service.ts`) that handles the API calls.

---

## Build

```bash
ng build
```

Output goes to `dist/`.

---

## Notes

- This is actively being developed — some modules may be more complete than others
- Auth module exists in the frontend but full login/register flow may still be in progress
- This is a portfolio project

---

## Author

Asmitha Chandini T G
