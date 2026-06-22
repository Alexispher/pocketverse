const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const dom = {
  power: $("#powerButton"),
  led: $("#batteryLed"),
  gameScreen: $("#gameScreen"),
  emptyScreen: $("#emptyScreen"),
  game: $("#game"),
  bootBtn: $("#bootBtn"),
  lastRomBtn: $("#lastRomBtn"),
  romInput: $("#romInput"),
  status: $("#statusText"),
};

const DB_NAME = "pocketverse-db";
const STORE_NAME = "rom-store";
const LAST_ROM_KEY = "last-rom";

let selectedRom = null;
let isOn = false;
let emulatorStarted = false;
let bootTimer = null;

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
  }, 1500);
}

function powerOff() {
  isOn = false;

  dom.power?.classList.remove("on");
  dom.led?.classList.remove("on");
  dom.gameScreen?.classList.remove("startup");

  setStatus("Console desligado.");
}

function togglePower() {
  if (isOn) {
    powerOff();
    return;
  }

  powerOn();

  if (selectedRom) {
    window.setTimeout(() => {
      startGame(selectedRom);
    }, 900);
  } else {
    setStatus("Console ligado. Escolha uma ROM para iniciar o jogo.");
  }
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
    // Alguns navegadores bloqueiam áudio até haver interação do usuário.
  }
}

function getRomCore(fileName) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".gbc")) {
    return "gbc";
  }

  if (lower.endsWith(".gb")) {
    return "gb";
  }

  if (lower.endsWith(".zip")) {
    return "gb";
  }

  return "gb";
}

function resetGameContainer() {
  if (!dom.game) return;

  dom.game.innerHTML = "";
  dom.game.removeAttribute("style");
}

function startGame(file) {
  if (!file) {
    setStatus("Escolha uma ROM primeiro.");
    return;
  }

  if (emulatorStarted) {
    setStatus("O emulador já foi iniciado. Para trocar de ROM, recarregue a página.");
    return;
  }

  powerOn();

  if (dom.emptyScreen) {
    dom.emptyScreen.style.display = "none";
  }

  dom.gameScreen?.classList.add("running");
  resetGameContainer();

  const gameUrl = URL.createObjectURL(file);
  const core = getRomCore(file.name);
  const cleanGameName = file.name.replace(/\.(gb|gbc|zip)$/i, "");

  window.EJS_player = "#game";
  window.EJS_gameUrl = gameUrl;
  window.EJS_core = core;
  window.EJS_gameName = cleanGameName;

  // Como você já colocou a pasta data no projeto, deixe local:
  window.EJS_pathtodata = "./data/";

  window.EJS_startOnLoaded = true;
  window.EJS_volume = 0.85;
  window.EJS_language = "pt-BR";

  // Qualidade visual mais limpa dentro da tela pequena.
  window.EJS_color = "#0f380f";
  window.EJS_backgroundColor = "#9ca04c";

  // Evita que o EmulatorJS tente abrir em fullscreen automaticamente.
  window.EJS_fullscreenOnLoaded = false;

  // Mantém o foco no player.
  window.EJS_disableDatabases = false;

  const script = document.createElement("script");
  script.src = "./data/loader.js";
  script.async = true;

  script.onload = () => {
    emulatorStarted = true;
    setStatus(`Rodando: ${file.name}`);
  };

  script.onerror = () => {
    dom.gameScreen?.classList.remove("running");

    if (dom.emptyScreen) {
      dom.emptyScreen.style.display = "flex";
    }

    setStatus("Erro: não encontrei ./data/loader.js. Confira se a pasta data está na raiz do projeto.");
  };

  document.body.appendChild(script);

  setStatus(`Carregando ${file.name}...`);
}

function createKeyboardEvent(type, key) {
  const event = new KeyboardEvent(type, {
    key,
    code: getCodeFromKey(key),
    bubbles: true,
    cancelable: true,
  });

  try {
    Object.defineProperty(event, "keyCode", {
      get: () => getKeyCodeFromKey(key),
    });

    Object.defineProperty(event, "which", {
      get: () => getKeyCodeFromKey(key),
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
  const event = createKeyboardEvent(type, key);

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

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveLastRom(file) {
  try {
    const db = await openDb();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(file, LAST_ROM_KEY);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    setStatus("ROM selecionada, mas o navegador não permitiu salvar a última ROM.");
  }
}

async function loadLastRom() {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(LAST_ROM_KEY);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

function setupEvents() {
  dom.power?.addEventListener("click", togglePower);

  dom.bootBtn?.addEventListener("click", () => {
    if (!selectedRom) {
      powerOn();
      setStatus("Escolha uma ROM para iniciar o jogo.");
      return;
    }

    startGame(selectedRom);
  });

  dom.romInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validExtensions = [".gb", ".gbc", ".zip"];
    const lowerName = file.name.toLowerCase();

    const isValid = validExtensions.some((extension) => {
      return lowerName.endsWith(extension);
    });

    if (!isValid) {
      setStatus("Arquivo inválido. Use .gb, .gbc ou .zip.");
      return;
    }

    selectedRom = file;
    await saveLastRom(file);

    setStatus(`ROM selecionada: ${file.name}. Agora clique em Ligar console.`);
  });

  dom.lastRomBtn?.addEventListener("click", async () => {
    try {
      const file = await loadLastRom();

      if (!file) {
        setStatus("Nenhuma ROM anterior foi encontrada neste navegador.");
        return;
      }

      selectedRom = file;
      setStatus(`Última ROM carregada: ${file.name}.`);
      startGame(file);
    } catch {
      setStatus("Não foi possível recuperar a última ROM.");
    }
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // O site continua funcionando mesmo sem Service Worker.
    });
  });
}

setupEvents();
bindVirtualButtons();
registerServiceWorker();

setStatus("Pronto. Escolha uma ROM local para iniciar.");
