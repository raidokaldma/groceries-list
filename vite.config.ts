import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { minimal2023Preset } from '@vite-pwa/assets-generator/config';

/** Stops the dev server, and non-production builds, from ever using the production Firebase project. */
function assertNotProductionDatabase(mode: string): void {
  if (mode === 'production') return;
  const projectId = loadEnv(mode, process.cwd(), 'VITE_').VITE_FIREBASE_PROJECT_ID;
  const productionProjectId = loadEnv('production', process.cwd(), 'VITE_').VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error(`No Firebase config for mode "${mode}": create .env.${mode} from .env.example.`);
  if (projectId === productionProjectId)
    throw new Error(`Mode "${mode}" points at the production Firebase project "${projectId}". Use a separate project in .env.${mode}.`);
}

export default defineConfig(({ mode }) => {
  assertNotProductionDatabase(mode);
  return {
    server: { host: true },
    // Lets the app notice, after reloading, that it now runs a new version.
    define: { __BUILD_ID__: JSON.stringify(new Date().toISOString()) },
    plugins: [
      svelte(),
      VitePWA({
        registerType: 'autoUpdate',
        pwaAssets: {
          // index.html has its own theme-color tag that follows the app's theme.
          injectThemeColor: false,
          image: 'public/icon.svg',
          // The source icon has rounded corners for browser tabs. Android and iOS round icons themselves,
          // so their versions fill the corners with the icon's green; the cart sits inside the maskable safe zone.
          preset: {
            ...minimal2023Preset,
            maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#1d4d33' } },
            apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#1d4d33' } },
          },
        },
        manifest: {
          name: 'Poenimekiri',
          short_name: 'Poenimekiri',
          lang: 'et',
          display: 'standalone',
          start_url: '/',
          // No theme_color: Android colours the installed app's navigation bar from it, and a manifest holds only one colour,
          // so the bar stayed light in dark mode. Without it the bar follows the phone's theme.
          // Set to undefined, not left out, to override the plugin's default colour.
          theme_color: undefined,
          // The window behind the page: shown on the launch screen and briefly where the keyboard opens.
          // Dark in both themes, since a flash of dark is less jarring than a flash of white.
          background_color: '#0f1210',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
      }),
    ],
  };
});
