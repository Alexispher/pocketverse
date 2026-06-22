# Retro Pocket GB para GitHub Pages

Este projeto transforma o visual do seu Game Boy em uma página jogável usando EmulatorJS.

## O que esta base já faz

- Mantém um console visual estilo Game Boy.
- Coloca o emulador dentro da tela.
- Permite escolher uma ROM `.gb`, `.gbc` ou `.zip` pelo navegador.
- Salva a ROM localmente no IndexedDB do dispositivo do usuário.
- Usa Service Worker para abrir offline depois do primeiro carregamento.
- Mantém botões físicos clicáveis/tocáveis: D-pad, A, B, Select e Start.
- Ativa save interno e save states pelo menu do EmulatorJS.

## O que você ainda precisa colocar

Você precisa copiar a pasta `data/` do EmulatorJS para este projeto.

A estrutura final deve ficar assim:

```txt
/index.html
/style.css
/app.js
/sw.js
/manifest.webmanifest
/data/loader.js
/data/emulator.min.js
/data/emulator.min.css
/data/cores/...
/data/...
```

Sem a pasta `data`, a página abre, mas o emulador não inicia.

## Importante sobre ROMs

Não hospede ROMs comerciais no GitHub. A página foi preparada para que cada usuário carregue o próprio arquivo localmente.

## Como testar no computador

Não abra pelo `file://`. Rode um servidor local:

```bash
python -m http.server 8000
```

Depois acesse:

```txt
http://localhost:8000
```

## Como publicar no GitHub Pages

1. Crie um repositório.
2. Envie todos os arquivos deste projeto.
3. Confirme que a pasta `data/` do EmulatorJS também está no repositório.
4. Vá em Settings → Pages.
5. Em “Build and deployment”, selecione `Deploy from a branch`.
6. Escolha a branch `main` e a pasta `/root`.
7. Abra o link do GitHub Pages.
8. No primeiro uso, carregue a ROM e inicie o jogo com internet para o navegador cachear os arquivos.
9. Depois disso, o site tende a abrir offline no mesmo dispositivo.

## Observações técnicas

O áudio do navegador só é liberado depois de clique/toque do usuário. Por isso o botão “Iniciar jogo” é necessário.

O save é local. Ele não sincroniza entre celulares/computadores diferentes.
