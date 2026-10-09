import { mount } from 'svelte';
import '@fontsource/rokkitt/600.css';
import '@fontsource/rokkitt/800.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './design/global.css';
import { applyTheme } from './design/tokens';
import App from './App.svelte';

applyTheme('day');
mount(App, { target: document.getElementById('app')! });
