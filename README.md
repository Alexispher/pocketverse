# PocketVerse Retro Engine

**PocketVerse Retro Engine** is a lightweight, browser-based retro handheld experience designed for static hosting environments such as GitHub Pages. It combines a custom-built responsive console interface with a client-side emulation layer, local file loading, browser storage, audio support, and offline-first behavior.

The project is built to run entirely in the browser. No backend server, database, user account, or cloud processing is required.

---

## Overview

PocketVerse provides a polished retro-console interface where users can load compatible game files from their own device and play directly in the browser. The application is designed as a static web project, making it easy to deploy, maintain, and share.

The interface includes a custom handheld shell, a display area, virtual controls, a power switch, a battery indicator, startup feedback, and support for browser-based play sessions.

---

## Key Features

* **Static Web App**
  Runs on GitHub Pages or any static hosting service.

* **Custom Retro Handheld UI**
  Built with semantic HTML, modern CSS, and responsive layout techniques.

* **Client-Side Emulation Support**
  Designed to work with EmulatorJS through a local `data/` runtime folder.

* **Local File Loading**
  Users select compatible files directly from their own device.

* **No Server Uploads**
  Files remain in the user’s browser session and are not sent to any backend service.

* **Audio Support**
  Includes browser-compatible audio behavior after user interaction.

* **Offline-First Shell**
  Uses a Service Worker to cache the application shell for offline access after the first successful load.

* **Local Persistence**
  Uses IndexedDB to store the last selected file locally in the browser.

* **Virtual Controls**
  On-screen buttons simulate keyboard input for touch and desktop use.

* **Responsive Design**
  Optimized for desktop and mobile screens.

---

## Technology Stack

PocketVerse is built with:

* **HTML5** for semantic structure.
* **CSS3** for the console layout, visual styling, animations, and responsive behavior.
* **Vanilla JavaScript** for application logic, file handling, UI state, local storage, and control mapping.
* **IndexedDB** for local browser persistence.
* **Service Worker API** for offline caching.
* **Web Audio API** for startup feedback and audio compatibility.
* **EmulatorJS** as the browser-based emulation runtime.

---

## Project Structure

```txt
pocketverse-retro-engine/
├── index.html
├── style.css
├── app.js
├── sw.js
├── manifest.webmanifest
├── README.md
└── data/
    ├── loader.js
    ├── emulator.js
    ├── cores/
    └── additional EmulatorJS runtime files
```

---

## Required Runtime Files

This repository does not include the EmulatorJS runtime by default.

To enable emulation, add the complete EmulatorJS `data/` folder to the project root. The application expects the following path:

```txt
./data/loader.js
```

The final structure should include:

```txt
/data/loader.js
/data/emulator.js
/data/cores/
```

Without these files, the visual interface will load, but the emulation screen will not start.
::: 
