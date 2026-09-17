# A2 Dron Test

Webová/mobilní aplikace (PWA) pro procvičování testových otázek k dálkově řízeným letadlům (dronům) kategorie A2. Postavena čistě na HTML/JS a Tailwind CSS, bez nutnosti buildu.

## Spuštění

Aplikace je statická, stačí ji servírovat přes libovolný HTTP server (kvůli `fetch('questions.json')` nelze spouštět přímo z `file://`):

```bash
cd drone-a2-test
python3 -m http.server 8080
```

Poté otevřete `http://localhost:8080` v prohlížeči. Na mobilu lze aplikaci přidat na plochu ("Přidat na plochu" / "Install app") a funguje i offline díky service workeru.

## Struktura

- `index.html` – kostra stránky, HTML `<template>` bloky pro jednotlivé obrazovky.
- `css/input.css`, `css/tailwind.css` – zdrojový a zbuildovaný (minifikovaný) Tailwind CSS. Aplikace používá **předgenerovaný CSS soubor**, ne CDN skript, aby fungovala i offline (PWA) a bez závislosti na externí síti.
- `js/quiz-engine.js` – čistá logika testu (výběr otázek, míchání, skórování) bez závislosti na DOM.
- `js/app.js` – vykreslování UI a propojení s `quiz-engine.js`.
- `questions.json` – databáze otázek (viz struktura níže). Snadno nahraditelné/rozšiřitelné vlastní sadou.
- `manifest.webmanifest`, `service-worker.js`, `icons/` – podpora PWA (instalace na plochu, offline chod).

### Přebuildování CSS po úpravě UI

Pokud upravíte třídy v `index.html`/`js/app.js` nebo styly v `css/input.css`, je potřeba znovu vygenerovat `css/tailwind.css`:

```bash
npm install      # jednorázově, nainstaluje Tailwind CLI jako dev dependency
npm run build:css
```

## Formát `questions.json`

```json
{
  "id": 1,
  "question": "Text otázky",
  "options": ["Možnost A", "Možnost B", "Možnost C", "Možnost D"],
  "correctAnswerIndex": 1,
  "explanation": "Vysvětlení, proč je odpověď správná."
}
```

Aplikace při spuštění testu náhodně vybere až 40 otázek (pokud je jich v souboru méně, použije všechny) a zamíchá i pořadí odpovědí u každé otázky. Hranice úspěšnosti je nastavena na 75 % (lze změnit v `js/quiz-engine.js`, konstanta `PASS_THRESHOLD`).
