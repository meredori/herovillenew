import './app.css'
import App from './App.svelte'

// Create the app using the Svelte 4 approach (with 'new')
const app = new App({
  target: document.getElementById('app'),
});

export default app
