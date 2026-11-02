# Sito matrimonio — sito statico autonomo

Sito statico (Home + Lista nozze) con solo frontend: nessun database, nessuna API, nessuna pagina RSVP.

È **completamente autonomo**: non carica nulla da Squarespace, Typekit o altre CDN. HTML, CSS, JS, font, immagini e favicon sono tutti serviti da questo progetto.

## Requisiti

- Node.js 18 o superiore

## Avvio

```bash
npm start
```

Poi apri:

- Home: http://localhost:3000
- Lista nozze: http://localhost:3000/regalo

Per cambiare porta:

```bash
PORT=4000 npm start
```

Su Windows PowerShell:

```powershell
$env:PORT=4000; npm start
```

## Struttura

```text
.
├── public/
│   ├── index.html       # Home
│   ├── regalo.html      # Lista nozze
│   └── assets/          # CSS, JS, font e immagini locali
├── server.js            # Server statico minimale (solo file)
├── package.json
└── README.md
```

## Note

- Tutti gli asset (CSS, font, immagini) sono serviti localmente: zero richieste esterne.
- Non ci sono script Squarespace: animazioni, parallasse e menu sono implementati in `public/assets/site.js` e `public/assets/local.css`.
- Il server comprime automaticamente con gzip HTML, CSS, JS e SVG.
- La Home ha una comparsa a cascata nella landing: sottotitolo → titolo → data/luogo → marquee.
- La pagina Lista nozze ha una comparsa a cascata: testo → pulsante IBAN → "Intestato a".
- Il sito è pensato mobile-first e mantiene l'effetto parallasse dello sfondo.
- Il progetto non contiene backend né raccolta di dati.
