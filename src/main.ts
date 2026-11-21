import { mount } from 'svelte';
import './fonts.css';
import './app.css';
import App from './ui/App.svelte';
import { connectList } from './state/connection';
import { blockCommitWhile, commitCheckedItems } from './state/checking';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { wasUpdatedSinceLastRun } from './pwa/updateCheck';
import { showToast } from './ui/toast/toastState.svelte';
import { isDragging } from './ui/list/longPressDrag';

connectList();
blockCommitWhile(isDragging);
// Ticked items would be lost if the app is closed or reloads within the undo window.
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && commitCheckedItems());
mount(App, { target: document.getElementById('app')! });
registerServiceWorker();
if (wasUpdatedSinceLastRun()) showToast('Rakendus on uuendatud');
