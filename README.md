# Poenimekiri

Grocery list PWA: Svelte 5 + Vite, Firestore with live updates and offline persistence.

## Setup

1. Create a Firebase project with a Firestore database and a Web app.
2. Copy `.env.example` to `.env.production` (production project) and `.env.development` (a separate dev project), and fill in each Web app config. Vite refuses to run in any non-production mode against the production project.
3. Deploy `firestore.rules` to both projects (`--project dev` for the dev one).
4. `npm install && npm run dev`

`npm run build` outputs a static site to `dist/` using the production config; `npm run preview` builds and serves it with the dev config. Serve it over HTTPS so it can be installed as a PWA.

`npm run deploy` builds and deploys to Cloudflare Workers static assets (`wrangler.jsonc`). Firebase config is baked in at build time, so with Cloudflare's Git-connected builds set the `VITE_FIREBASE_*` variables as build variables.

## Notes

- Data: `items`, `history` (per-product usage for suggestions and department), `settings/departmentOrder`.
- Grouping and the expanded "Ostetud" section are per-device (localStorage).
- Offline: Firestore's IndexedDB cache serves the list and queues writes; the service worker precaches the app.
- Updates: the service worker checks hourly and when the app regains focus; a new version activates and reloads the page.
- PWA icons are generated from `public/icon.svg` at build time.
