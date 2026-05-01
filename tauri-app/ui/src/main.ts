import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";
import { initPreferences } from "./lib/theme";
import { initRouting }     from "./lib/store.svelte";
import { registerStandardCommands } from "./lib/register-commands";

// Apply persisted theme/density before the first paint so users don't see a flash.
initPreferences();
// Sync URL → view state and listen for back/forward.
initRouting();
// Build the command-palette catalog.
registerStandardCommands();

const app = mount(App, { target: document.getElementById("app")! });

export default app;
