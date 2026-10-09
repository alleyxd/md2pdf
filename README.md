# MD2PDF

Write Markdown on the left, see it styled on the right, download a clean PDF.

**Live demo: [md2pdf-2n1z.onrender.com](https://md2pdf-2n1z.onrender.com)** (free hosting, so the first load after a
quiet period can take up to a minute while the server wakes up)

## Features

- **Live preview** that updates as you type.
- **Seven themes:** Light, Academic, Swiss, Blueprint, Forest, Plum and Resume.
- **Compact mode** for tighter spacing, handy for one-page documents and CVs.
- **Page-break preview** to see where pages will end before you download.
- **Real PDF output:** rendered server-side by headless Chromium, so text stays selectable and links stay clickable.

## How it works

The front end (`public/`) renders the Markdown preview in the browser and applies the selected theme. When you click
Download, it posts the Markdown, theme and compact setting to `POST /generate-pdf`. The Express server (`server.js`)
converts it with [md-to-pdf](https://github.com/simonhaenisch/md-to-pdf), which drives headless Chromium through
Puppeteer, using the same theme stylesheet, and streams back an A4 PDF. Only known theme names are accepted, so the
request cannot point the renderer at arbitrary files.

## Run it locally

With Docker (the same image the demo runs on):

```bash
docker build -t md2pdf .
docker run -p 3000:3000 md2pdf
# open http://localhost:3000
```

The Docker image installs Chromium and fonts for many scripts (including CJK and Thai), and the server is set up to
use that Chromium. Running without Docker needs Node 18+ and a Chromium at `/usr/bin/chromium`, so Docker is the
easier route.

## Deploy

The repository deploys as-is to any host that builds a Dockerfile (the demo uses Render). The server listens on the
`PORT` environment variable, defaulting to 3000.

## Adding a theme

Add `public/themes/<name>.css`, add the name to the theme selector in `public/index.html`, and add it to the
`allowedThemes` list in `server.js`.

## License

MIT
