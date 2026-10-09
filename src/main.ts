import { mount } from 'svelte';
import '@fontsource/arvo/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './design/global.css';
import { applyTheme } from './design/tokens';
import App from './App.svelte';

applyTheme('day');
mount(App, { target: document.getElementById('app')! });
