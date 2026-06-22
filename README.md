# PocketVerse Direct ROM Build

Versão corrigida para abrir o jogo diretamente por URL, sem upload local.

## Estrutura obrigatória

Coloque a ROM em:

```txt
roms/game.gb
```

A estrutura final deve ficar assim:

```txt
pocketverse/
├── index.html
├── style.css
├── app.js
└── roms/
    └── game.gb
```

## Importante

- Use arquivo `.gb`.
- Não use `.gba`.
- Renomeie o arquivo para `game.gb`.
- Não use espaço, acento, parênteses ou colchetes no nome.
- Este pacote não inclui ROM.

## Como testar

Abra no navegador:

```txt
https://SEU-USUARIO.github.io/pocketverse/roms/game.gb
```

Se o arquivo baixar, o caminho está correto.
Se aparecer 404, o arquivo está no lugar errado.

## Controles

```txt
Setas = direcional
Z = B
X = A
V = Select
Enter = Start
```
