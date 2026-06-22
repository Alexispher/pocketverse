const DB_NAME = 'retro-pocket-gb-db';
const DB_VERSION = 1;
const ROM_STORE = 'roms';
const ROM_KEY = 'main-rom';

const romInput = document.querySelector('#romInput');
const startButton = document.querySelector('#startButton');
const clearButton = document.querySelector('#clearButton');
const statusEl = document.querySelector('#status');
const emptyScreen = document.querySelector('#emptyScreen');
const gameEl = document.querySelector('#game');

let cachedRom = null;
let emulatorBooted = false;
let currentRomUrl = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ROM_STORE)) {
        db.createObjectStore(ROM_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveRomFile(file) {
  const db = await openDatabase();
  const buffer = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ROM_STORE, 'readwrite');
    tx.objectStore(ROM_STORE).put({
      id: ROM_KEY,
      name: file.name,
      type: file.type || 'application/octet-stream',
      buffer,
      updatedAt: new Date().toISOString()
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function readSavedRom() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ROM_STORE, 'readonly');
    const request = tx.objectStore(ROM_STORE).get(ROM_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function clearSavedRom() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ROM_STORE, 'readwrite');
    tx.objectStore(ROM_STORE).delete(ROM_KEY);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function romNameWithoutExtension(name) {
  return name.replace(/\.(gb|gbc|zip)$/i, '').slice(0, 80) || 'Game Boy';
}

function showEmulatorScreen() {
  emptyScreen.classList.add('is-hidden');
}

function bootEmulator(rom) {
  if (emulatorBooted) {
    setStatus('O emulador já está carregado. Recarregue a página para trocar de jogo.');
    return;
  }

  if (!rom || !rom.buffer) {
    setStatus('Escolha uma ROM antes de iniciar.');
    return;
  }

  const blob = new Blob([rom.buffer], { type: rom.type || 'application/octet-stream' });
  currentRomUrl = URL.createObjectURL(blob);

  window.EJS_player = '#game';
  window.EJS_core = 'gb';
  window.EJS_controlScheme = 'gb';
  window.EJS_gameUrl = currentRomUrl;
  window.EJS_gameName = romNameWithoutExtension(rom.name);
  window.EJS_pathtodata = 'data/';
  window.EJS_biosUrl = '';
  window.EJS_volume = 0.8;
  window.EJS_startOnLoaded = true;
  window.EJS_startButtonName = 'Jogar';
  window.EJS_color = '#a3ff12';
  window.EJS_backgroundColor = '#111827';
  window.EJS_alignStartButton = 'center';

  // Cache interno do EmulatorJS para ROM/core. Mantém o projeto leve e ajuda no uso offline após o primeiro carregamento.
  window.EJS_cacheConfig = {
    enabled: true,
    cacheMaxSizeMB: 768,
    cacheMaxAgeMins: 60 * 24 * 30
  };

  // Força gravações periódicas do arquivo .sav quando o core detectar mudança.
  window.EJS_fixedSaveInterval = 10000;

  // Mapeamento documentado do EmulatorJS: setas, z, x, v e Enter.
  window.EJS_defaultControls = {
    0: {
      0: { value: 'x', value2: 'BUTTON_2' },
      1: { value: 's', value2: 'BUTTON_4' },
      2: { value: 'v', value2: 'SELECT' },
      3: { value: 'enter', value2: 'START' },
      4: { value: 'up arrow', value2: 'DPAD_UP' },
      5: { value: 'down arrow', value2: 'DPAD_DOWN' },
      6: { value: 'left arrow', value2: 'DPAD_LEFT' },
      7: { value: 'right arrow', value2: 'DPAD_RIGHT' },
      8: { value: 'z', value2: 'BUTTON_1' },
      9: { value: 'a', value2: 'BUTTON_3' }
    }
  };

  window.EJS_Buttons = {
    saveState: { visible: true, displayName: 'Salvar estado' },
    loadState: { visible: true, displayName: 'Carregar estado' },
    quickSave: { visible: true, displayName: 'Save rápido' },
    quickLoad: { visible: true, displayName: 'Load rápido' },
    saveSavFiles: { visible: true, displayName: 'Salvar .sav' },
    loadSavFiles: { visible: true, displayName: 'Carregar .sav' },
    cacheManager: { visible: true, displayName: 'Cache' },
    fullscreen: { visible: true, displayName: 'Tela cheia' }
  };

  window.EJS_ready = () => {
    showEmulatorScreen();
    setStatus(`Emulador pronto: ${rom.name}. Use o menu do emulador para save state, load state e tela cheia.`);
  };

  window.EJS_onGameStart = () => {
    setStatus(`Jogo iniciado: ${rom.name}. O save interno e os save states ficam neste navegador.`);
  };

  window.EJS_onSaveUpdate = () => {
    setStatus('Progresso detectado e salvo no armazenamento local do navegador.');
  };

  window.EJS_onSaveState = () => {
    setStatus('Save state criado. Você pode carregá-lo pelo menu do emulador.');
  };

  window.EJS_onLoadState = () => {
    setStatus('Save state carregado.');
  };

  const loader = document.createElement('script');
  loader.src = 'data/loader.js';
  loader.async = true;
  loader.onerror = () => {
    setStatus('Não encontrei data/loader.js. Copie a pasta data do EmulatorJS para este projeto e publique novamente.');
    gameEl.innerHTML = '';
    emptyScreen.classList.remove('is-hidden');
  };

  emulatorBooted = true;
  setStatus('Carregando emulador. No primeiro uso, toque/click em Jogar para liberar o áudio.');
  document.body.appendChild(loader);
}

async function hydrateSavedRom() {
  try {
    cachedRom = await readSavedRom();
    if (cachedRom) {
      setStatus(`ROM salva encontrada: ${cachedRom.name}. Clique em iniciar jogo.`);
      startButton.textContent = 'Continuar jogo';
    }
  } catch (error) {
    console.error(error);
    setStatus('Não consegui ler o armazenamento local deste navegador.');
  }
}

romInput.addEventListener('change', async (event) => {
  const [file] = event.target.files || [];
  if (!file) return;

  const allowed = /\.(gb|gbc|zip)$/i.test(file.name);
  if (!allowed) {
    setStatus('Arquivo inválido. Use .gb, .gbc ou .zip.');
    return;
  }

  try {
    setStatus('Salvando ROM localmente neste navegador...');
    await saveRomFile(file);
    cachedRom = await readSavedRom();
    setStatus(`ROM carregada: ${file.name}. Clique em iniciar jogo.`);
    startButton.textContent = 'Iniciar jogo';
  } catch (error) {
    console.error(error);
    setStatus('Falha ao salvar a ROM. Verifique o espaço disponível do navegador.');
  }
});

startButton.addEventListener('click', async () => {
  if (!cachedRom) {
    cachedRom = await readSavedRom();
  }
  bootEmulator(cachedRom);
});

clearButton.addEventListener('click', async () => {
  try {
    await clearSavedRom();
    cachedRom = null;
    if (currentRomUrl) URL.revokeObjectURL(currentRomUrl);
    setStatus('ROM local apagada. Recarregue a página se o emulador já estiver aberto.');
    startButton.textContent = 'Iniciar jogo';
  } catch (error) {
    console.error(error);
    setStatus('Não consegui apagar a ROM local.');
  }
});

function keyboardPayload(key) {
  const lower = key.toLowerCase();
  const map = {
    arrowup: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
    arrowdown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
    arrowleft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
    arrowright: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    z: { key: 'z', code: 'KeyZ', keyCode: 90 },
    x: { key: 'x', code: 'KeyX', keyCode: 88 },
    v: { key: 'v', code: 'KeyV', keyCode: 86 },
    enter: { key: 'Enter', code: 'Enter', keyCode: 13 }
  };
  return map[lower] || { key, code: key, keyCode: 0 };
}

function dispatchKey(type, key) {
  const payload = keyboardPayload(key);
  const event = new KeyboardEvent(type, {
    key: payload.key,
    code: payload.code,
    keyCode: payload.keyCode,
    which: payload.keyCode,
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);
  window.dispatchEvent(event);
}

function wireTouchControls() {
  const buttons = document.querySelectorAll('.control-button[data-key]');

  buttons.forEach((button) => {
    const key = button.dataset.key;

    const press = (event) => {
      event.preventDefault();
      button.classList.add('is-pressed');
      dispatchKey('keydown', key);
    };

    const release = (event) => {
      event.preventDefault();
      button.classList.remove('is-pressed');
      dispatchKey('keyup', key);
    };

    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    await navigator.serviceWorker.register('sw.js');
  } catch (error) {
    console.warn('Service Worker não registrado:', error);
  }
}

wireTouchControls();
registerServiceWorker();
hydrateSavedRom();
