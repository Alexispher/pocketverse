const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const dom = {
  power: $("#powerButton"),
  led: $("#batteryLed"),
  gameScreen: $("#gameScreen"),
  emptyScreen: $("#emptyScreen"),
  game: $("#game"),
  bootBtn: $("#bootBtn"),
  resetBtn: $("#resetBtn"),
  status: $("#statusText"),
};

/*
  IMPORTANTE

  Para o jogo abrir direto, a ROM precisa estar em uma URL real do site.

  Caminho esperado:
  ./roms/game.gb

  No GitHub:
  pocketverse/
  ├── index.html
  ├── style.css
  ├── app.js
  └── roms/
      └── game.gb

  Não use espaço, acento, parênteses ou colchetes no nome do arquivo.
*/

const ROM_URL = "./roms/game.gb";
const ROM_NAME = "Game";

const DATA_PATH = "https://cdn.emulatorjs.org/stable/data/";
const LOADER_PATH = "https://cdn.emulatorjs.org/stable/data/loader.js";

// Para testar com a pasta local data/ no futuro:
// const DATA_PATH = "./data/";
// const LOADER_PATH = "./data/loader.js";

let isOn = false;
let emulatorStarted = false;
let bootTimer = null;

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
  if (dom.status) {
    dom.status.textContent = message;
  }
}

function powerOn() {
  isOn = true;

  dom.power?.classList.add("on");
  dom.led?.classList.add("on");
  dom.gameScreen?.classList.add("startup");

  playBootTone();

  window.clearTimeout(bootTimer);
  bootTimer = window.setTimeout(() => {
    dom.gameScreen?.classList.remove("startup");
  }, 1000);
}

function playBootTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Áudio pode ser bloqueado até uma interação do usuário.
  }
}

async function checkRomExists() {
  const url = new URL(ROM_URL, window.location.href).href;

  try {
    const response = await fetch(`${url}?check=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      throw new Error("A URL da ROM retornou HTML. Provavelmente é uma página 404.");
    }

    return url;
  } catch (error) {
    throw new Error(
      `Não encontrei a ROM em ${ROM_URL}. Crie a pasta roms e coloque o arquivo como game.gb. Detalhe: ${error.message}`
    );
  }
}

function resetGameContainer() {
  if (!dom.game) return;

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
  ].forEach((key) => {
    try {
      delete window[key];
    } catch {
      window[key] = undefined;
    }
  });
}

async function startGameDirect() {
  if (emulatorStarted) {
    setStatus("O jogo já está rodando.");
    focusGameScreen();
    return;
  }

  powerOn();
  setStatus("Verificando ROM em roms/game.gb...");

  let romUrl;

  try {
    romUrl = await checkRomExists();
  } catch (error) {
    setStatus(error.message);
    return;
  }

  if (dom.emptyScreen) {
    dom.emptyScreen.style.display = "none";
  }

  dom.gameScreen?.classList.add("running");

  resetGameContainer();
  removePreviousLoader();
  clearEmulatorGlobals();

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
    setStatus(`Rodando: ${ROM_NAME}`);

    window.setTimeout(() => {
      focusGameScreen();
      closeRetroArchMenu();
    }, 1800);
  };

  script.onerror = () => {
    dom.gameScreen?.classList.remove("running");

    if (dom.emptyScreen) {
      dom.emptyScreen.style.display = "flex";
    }

    setStatus("Erro ao carregar o EmulatorJS.");
  };

  document.body.appendChild(script);

  setStatus("Carregando jogo...");
}

function hardResetPage() {
  window.location.reload();
}

function focusGameScreen() {
  if (!dom.game) return;

  dom.game.setAttribute("tabindex", "0");
  dom.game.focus({ preventScroll: true });
}

function closeRetroArchMenu() {
  const sendEscape = () => {
    const events = [
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      }),
      new KeyboardEvent("keyup", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      }),
    ];

    events.forEach((event) => {
      document.dispatchEvent(event);
      window.dispatchEvent(event);
      dom.game?.dispatchEvent(event);
    });
  };

  sendEscape();
  window.setTimeout(sendEscape, 500);
  window.setTimeout(sendEscape, 1000);
  window.setTimeout(focusGameScreen, 1200);
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

  if (dom.game) {
    dom.game.dispatchEvent(event);
  }
}

function bindVirtualButtons() {
  const controls = $$("[data-key]");

  controls.forEach((button) => {
    const key = button.dataset.key;

    const press = (event) => {
      event.preventDefault();
      button.classList.add("pressed");
      simulateKey(key, "keydown");
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

function setupEvents() {
  dom.power?.addEventListener("click", startGameDirect);
  dom.bootBtn?.addEventListener("click", startGameDirect);
  dom.resetBtn?.addEventListener("click", hardResetPage);

  dom.game?.addEventListener("click", () => {
    focusGameScreen();
  });
}

setupEvents();
bindVirtualButtons();
bindPhysicalKeyboardToVisualButtons();
clearOldCache();

setStatus("Pronto. Clique em Ligar console para iniciar.");
