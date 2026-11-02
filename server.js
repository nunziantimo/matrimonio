const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
};

const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".svg", ".txt", ".xml"]);

function sendFile(req, res, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendNotFound(res);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    const compress = COMPRESSIBLE.has(ext) && acceptsGzip;

    const headers = {
      "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
      "Cache-Control": [".html", ".css", ".js"].includes(ext)
        ? "no-cache"
        : "public, max-age=86400",
    };

    if (compress) {
      headers["Content-Encoding"] = "gzip";
      headers["Vary"] = "Accept-Encoding";
    }

    res.writeHead(200, headers);

    const stream = fs.createReadStream(filePath);
    if (compress) {
      stream.pipe(zlib.createGzip()).pipe(res);
    } else {
      stream.pipe(res);
    }
  });
}

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Pagina non trovata");
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (error) {
    res.writeHead(400);
    res.end("Richiesta non valida");
    return;
  }

  if (pathname === "/" || pathname === "") {
    sendFile(req, res, path.join(PUBLIC_DIR, "index.html"));
    return;
  }

  const cleanPath = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const candidate = path.join(PUBLIC_DIR, cleanPath);

  // Prevent path traversal outside the public directory.
  const relative = path.relative(PUBLIC_DIR, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    sendNotFound(res);
    return;
  }

  // Pretty URLs: /regalo -> /regalo.html
  fs.stat(candidate, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(req, res, candidate);
      return;
    }
    if (!error && stats.isDirectory()) {
      sendFile(req, res, path.join(candidate, "index.html"));
      return;
    }
    sendFile(req, res, candidate + ".html");
  });
});

server.listen(PORT, () => {
  console.log(`Sito disponibile su http://localhost:${PORT}`);
});
