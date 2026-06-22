const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const dom = {
  screenFrame: $("#screenFrame"),
  emptyScreen: $("#emptyScreen"),
  game: $("#game"),
  bootBtn: $("#bootBtn"),
  resetBtn: $("#resetBtn"),
  status: $("#statusText"),
};

const ROM_URL = "./roms/game.gb";
const ROM_NAME = "Game";

const DATA_PATH = "https://cdn.emulatorjs.org/stable/data/";
const LOADER_PATH = "https://cdn.emulatorjs.org/stable/data/loader.js";

let emulatorStarted = false;
let cleanupTimer = null;

const keyToButtonSelector = {
  ArrowUp: '[data-key="ArrowUp"]',
  ArrowDown: '[data-key="ArrowDown"]',
  ArrowLeft: '[data-key="ArrowLeft"]',
  ArrowRight: '[data-key="ArrowRight"]',
  z: '[data-key="z"]',
  x: '[data-key="x"]',
  v: '[data-key="v"]',
  Enter: '[data-key="Enter"]',
};

function setStatus(message) {
  dom.status.textContent = message;
}

async function checkRomExists() {
  const url = new URL(ROM_URL, window.location.href).href;

  const response = await fetch(`${url}?check=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ROM não encontrada em ${ROM_URL}.`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    throw new Error(`A URL ${ROM_URL} retornou HTML. Provavelmente é 404.`);
  }

  return url;
}

function resetGameContainer() {
  dom.game.innerHTML = "";
  dom.game.removeAttribute("style");
}

function removePreviousLoader() {
  $$('script[data-pocketverse-loader="true"]').forEach((script) => {
    script.remove();
  });
}

function clearEmulatorGlobals() {
  [
    "EJS_player",
    "EJS_gameUrl",
    "EJS_core",
    "EJS_gameName",
    "EJS_pathtodata",
    "EJS_startOnLoaded",
    "EJS_fullscreenOnLoaded",
    "EJS_volume",
    "EJS_Buttons",
    "EJS_disableDatabases",
    "EJS_threads",
    "EJS_language",
    "EJS_color",
    "EJS_backgroundColor",
  ].forEach((key) => {
    try {
      delete window[key];
    } catch {
      window[key] = undefined;
    }
  });
}

async function startGame() {
  if (emulatorStarted) {
    focusGame();
    setStatus("Jogo já iniciado.");
    return;
  }

  setStatus("Verificando ROM...");

  let romUrl;

  try {
    romUrl = await checkRomExists();
  } catch (error) {
    setStatus(error.message);
    return;
  }

  resetGameContainer();
  removePreviousLoader();
  clearEmulatorGlobals();

  dom.screenFrame.classList.add("running");

  window.EJS_player = "#game";
  window.EJS_gameUrl = romUrl;
  window.EJS_core = "gb";
  window.EJS_gameName = ROM_NAME;
  window.EJS_pathtodata = DATA_PATH;
  window.EJS_startOnLoaded = true;
  window.EJS_fullscreenOnLoaded = false;
  window.EJS_volume = 0.85;
  window.EJS_disableDatabases = false;
  window.EJS_threads = false;

  window.EJS_Buttons = {
    playPause: false,
    restart: false,
    mute: false,
    settings: false,
    fullscreen: false,
    saveState: false,
    loadState: false,
    screenRecord: false,
    gamepad: false,
    cheat: false,
    volume: false,
    saveSavFiles: false,
    loadSavFiles: false,
    quickSave: false,
    quickLoad: false,
    screenshot: false,
    cacheManager: false,
    exitEmulation: false,
  };

  const script = document.createElement("script");
  script.src = LOADER_PATH;
  script.async = true;
  script.dataset.pocketverseLoader = "true";

  script.onload = () => {
    emulatorStarted = true;
    setStatus("Jogo carregado. Clique na tela e use o teclado.");
    startInterfaceCleanup();
    window.setTimeout(focusGame, 1000);
  };

  script.onerror = () => {
    dom.screenFrame.classList.remove("running");
    setStatus("Erro ao carregar o EmulatorJS.");
  };

  document.body.appendChild(script);
  setStatus("Carregando jogo...");
}

function startInterfaceCleanup() {
  stopInterfaceCleanup();

  cleanupTimer = window.setInterval(() => {
    cleanEmulatorOverlay();
    closeRetroArchMenu();
  }, 700);

  window.setTimeout(() => {
    stopInterfaceCleanup();
    cleanEmulatorOverlay();
    focusGame();
  }, 8000);
}

function stopInterfaceCleanup() {
  if (cleanupTimer) {
    window.clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

function cleanEmulatorOverlay() {
  const root = dom.game;

  const selectors = [
    '[class*="ejs_menu"]',
    '[class*="ejs_context"]',
    '[class*="ejs_button"]',
    '[class*="ejs_start"]',
    '[class*="ejs_loading"]',
    '[class*="ejs_volume"]',
    '[class*="ejs_control"]',
    '[class*="ejs_settings"]',
    '[class*="ejs_virtual"]',
    '[id*="menu"]',
    '[id*="context"]',
    '[id*="volume"]',
    '[id*="settings"]',
    '[id*="controls"]'
  ];

  selectors.forEach((selector) => {
    root.querySelectorAll(selector).forEach((element) => {
      if (element.tagName.toLowerCase() !== "canvas") {
        element.style.display = "none";
        element.style.opacity = "0";
        element.style.pointerEvents = "none";
      }
    });
  });

  root.querySelectorAll("*").forEach((element) => {
    const text = (element.textContent || "").trim();

    const shouldHide =
      text.includes("EmulatorJS") ||
      text.includes("Context Menu") ||
      text.includes("Início") ||
      text.includes("Fechar") ||
      text.includes("volume") ||
      text.includes("Settings") ||
      text.includes("Main Menu");

    if (shouldHide && element.tagName.toLowerCase() !== "canvas") {
      element.style.display = "none";
      element.style.opacity = "0";
      element.style.pointerEvents = "none";
    }
  });
}

function closeRetroArchMenu() {
  sendKey("Escape", "Escape", 27);
}

function sendKey(key, code, keyCode) {
  const down = new KeyboardEvent("keydown", {
    key,
    code,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });

  const up = new KeyboardEvent("keyup", {
    key,
    code,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });

  [down, up].forEach((event) => {
    document.dispatchEvent(event);
    window.dispatchEvent(event);
    dom.game.dispatchEvent(event);
  });
}

function focusGame() {
  dom.game.setAttribute("tabindex", "0");
  dom.game.focus({ preventScroll: true });
}

function resetPage() {
  window.location.reload();
}

function normalizeKey(eventOrKey) {
  const key = typeof eventOrKey === "string" ? eventOrKey : eventOrKey.key;

  if (key === "ArrowUp") return "ArrowUp";
  if (key === "ArrowDown") return "ArrowDown";
  if (key === "ArrowLeft") return "ArrowLeft";
  if (key === "ArrowRight") return "ArrowRight";
  if (key === "Enter") return "Enter";

  const lower = String(key).toLowerCase();

  if (lower === "z") return "z";
  if (lower === "x") return "x";
  if (lower === "v") return "v";

  return null;
}

function setVisualButtonPressed(key, pressed) {
  const normalizedKey = normalizeKey(key);
  const selector = keyToButtonSelector[normalizedKey];

  if (!selector) return;

  const button = document.querySelector(selector);

  if (!button) return;

  button.classList.toggle("pressed", pressed);
}

function createKeyboardEvent(type, key) {
  const normalizedKey = normalizeKey(key) || key;

  const event = new KeyboardEvent(type, {
    key: normalizedKey,
    code: getCodeFromKey(normalizedKey),
    bubbles: true,
    cancelable: true,
  });

  try {
    Object.defineProperty(event, "keyCode", {
      get: () => getKeyCodeFromKey(normalizedKey),
    });

    Object.defineProperty(event, "which", {
      get: () => getKeyCodeFromKey(normalizedKey),
    });
  } catch {
    // Alguns navegadores não permitem sobrescrever keyCode/which.
  }

  return event;
}

function getCodeFromKey(key) {
  const map = {
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    Enter: "Enter",
    z: "KeyZ",
    x: "KeyX",
    v: "KeyV",
  };

  return map[key] || key;
}

function getKeyCodeFromKey(key) {
  const map = {
    ArrowUp: 38,
    ArrowDown: 40,
    ArrowLeft: 37,
    ArrowRight: 39,
    Enter: 13,
    z: 90,
    x: 88,
    v: 86,
  };

  return map[key] || 0;
}

function simulateKey(key, type) {
  const normalizedKey = normalizeKey(key) || key;
  const event = createKeyboardEvent(type, normalizedKey);

  setVisualButtonPressed(normalizedKey, type === "keydown");

  document.dispatchEvent(event);
  window.dispatchEvent(event);
  dom.game.dispatchEvent(event);
}

function bindPhysicalKeyboardToVisualButtons() {
  document.addEventListener(
    "keydown",
    (event) => {
      const key = normalizeKey(event);

      if (!key) return;

      event.preventDefault();
      setVisualButtonPressed(key, true);
    },
    true
  );

  document.addEventListener(
    "keyup",
    (event) => {
      const key = normalizeKey(event);

      if (!key) return;

      event.preventDefault();
      setVisualButtonPressed(key, false);
    },
    true
  );

  window.addEventListener("blur", () => {
    Object.keys(keyToButtonSelector).forEach((key) => {
      setVisualButtonPressed(key, false);
    });
  });
}

function bindVirtualButtons() {
  $$("[data-key]").forEach((button) => {
    const key = button.dataset.key;

    const press = (event) => {
      event.preventDefault();
      button.classList.add("pressed");
      simulateKey(key, "keydown");
      focusGame();
    };

    const release = (event) => {
      event.preventDefault();
      button.classList.remove("pressed");
      simulateKey(key, "keyup");
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("pointercancel", release);
  });
}

async function clearOldCache() {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      registrations.forEach((registration) => registration.unregister());
    } catch {
      // Ignora.
    }
  }

  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      keys.forEach((key) => caches.delete(key));
    } catch {
      // Ignora.
    }
  }
}

dom.bootBtn.addEventListener("click", startGame);
dom.resetBtn.addEventListener("click", resetPage);
dom.screenFrame.addEventListener("click", focusGame);

bindVirtualButtons();
bindPhysicalKeyboardToVisualButtons();
clearOldCache();
