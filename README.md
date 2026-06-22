# PocketVerse Retro Engine

Projeto estático para GitHub Pages com visual de console portátil retrô.

## O que já vem pronto

- Layout bonito em HTML/CSS puro.
- Botão de energia.
- LED de BATTERY ligando junto com o console.
- Upload local de ROM.
- Suporte para EmulatorJS.
- Botões virtuais simulando teclado.
- Service Worker para cache offline do site.
- IndexedDB para recuperar a última ROM usada no mesmo navegador.

## O que você precisa adicionar

Este pacote não inclui ROMs nem arquivos do EmulatorJS.

Baixe o EmulatorJS separadamente e copie a pasta `data/` completa para a raiz do projeto, mantendo este caminho:

```txt
/data/loader.js
/data/emulator.js
/data/cores/
```

## Como publicar no GitHub Pages

1. Suba todos os arquivos para o repositório.
2. Vá em `Settings > Pages`.
3. Em `Build and deployment`, selecione a branch `main`.
4. Publique pela pasta raiz.
5. Abra o link do GitHub Pages.

## Aviso

Use apenas ROMs que você possua legalmente. O projeto não distribui jogos.
