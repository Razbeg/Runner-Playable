const fs = require('fs');
const path = require('path');

function die(msg) {
  console.error('[pack-single-html] ' + msg);
  process.exit(1);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readUtf8(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeUtf8(p, s) {
  fs.writeFileSync(p, s, 'utf8');
}

function isSubPath(p, root) {
  const rp = path.resolve(p);
  const rr = path.resolve(root);
  return rp === rr || rp.startsWith(rr + path.sep);
}

function walkFiles(rootDir) {
  const out = [];
  const stack = [rootDir];

  while (stack.length) {
    const dir = stack.pop();
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) {
        stack.push(full);
      } else if (it.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

function extLower(p) {
  return path.extname(p).toLowerCase();
}

function mimeFromExt(ext) {
  switch (ext) {
    case '.js': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.html': return 'text/html; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.wasm': return 'application/wasm';
    case '.bin':
    case '.data':
    case '.mem': return 'application/octet-stream';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.mp3': return 'audio/mpeg';
    case '.ogg': return 'audio/ogg';
    case '.wav': return 'audio/wav';
    case '.mp4': return 'video/mp4';
    case '.ttf': return 'font/ttf';
    case '.otf': return 'font/otf';
    case '.woff': return 'font/woff';
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
}

function toDataUrl(buf, mime) {
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function isExternalUrl(u) {
  return /^https?:\/\//i.test(u) || /^\/\//.test(u) || /^data:/i.test(u) || /^blob:/i.test(u);
}

function cleanUrl(u) {
  return u.split('#')[0].split('?')[0];
}

function relPathFromBuild(buildDir, fileAbs) {
  const rel = path.relative(buildDir, fileAbs);
  return rel.split(path.sep).join('/');
}

function inlineLocalScriptsAndCss(html, buildDir) {
  html = html.replace(
    /<link\b([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
    (m, a, b, href, c) => {
      if (isExternalUrl(href)) return m;
      const clean = cleanUrl(href);
      const abs = path.resolve(buildDir, clean);
      if (!fs.existsSync(abs)) {
        console.warn('[pack-single-html] missing css:', clean);
        return m;
      }
      const css = readUtf8(abs);
      return `<style${a}${b}${c}>\n${css}\n</style>`;
    }
  );

  html = html.replace(
    /<script\b([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (m, a, src, b) => {
      if (isExternalUrl(src)) return m;
      const clean = cleanUrl(src);
      const abs = path.resolve(buildDir, clean);
      if (!fs.existsSync(abs)) {
        console.warn('[pack-single-html] missing script:', clean);
        return m;
      }
      const js = readUtf8(abs);
      return `<script${a}${b}>\n${js}\n</script>`;
    }
  );

  return html;
}

function buildInlineFileMap(buildDir, outHtmlAbs) {
  const filesAbs = walkFiles(buildDir);
  const map = Object.create(null);

  const ignoreExt = new Set([
    '.map',
    '.md',
    '.txt',
    '.log',
  ]);
  const ignoreNames = new Set([
    '.ds_store',
  ]);

  for (const fAbs of filesAbs) {
    if (!isSubPath(fAbs, buildDir)) continue;
    const rel = relPathFromBuild(buildDir, fAbs);
    const base = path.basename(fAbs).toLowerCase();
    const ext = extLower(fAbs);
    if (ignoreNames.has(base)) continue;
    if (ignoreExt.has(ext)) continue;
    if (rel === 'index.html') continue;
    if (outHtmlAbs && path.resolve(fAbs) === path.resolve(outHtmlAbs)) continue;

    const buf = fs.readFileSync(fAbs);
    const mime = mimeFromExt(ext);
    map[rel] = toDataUrl(buf, mime);
  }

  return map;
}

function injectRuntime(html, fileMap) {
  const mapJson = JSON.stringify(fileMap);

  const runtime = `\n<script>\n(function(){\n  // Embedded file map (relative-path -> data: URL)\n  window.__INLINE_FILES__ = ${mapJson};\n})();\n</script>\n` +
  `<script>\n(function(){\n  var FILES = window.__INLINE_FILES__ || {};\n\n  function normalizeKey(url){\n    if (!url) return '';\n    // Already a data/blob URL\n    if (url.indexOf('data:') === 0 || url.indexOf('blob:') === 0) return '';\n\n    // Strip query/hash\n    var u = url;\n    var q = u.indexOf('?'); if (q >= 0) u = u.slice(0, q);\n    var h = u.indexOf('#'); if (h >= 0) u = u.slice(0, h);\n\n    // Make absolute to extract pathname when possible\n    try {\n      var abs = new URL(u, location.href);\n      u = abs.pathname || u;\n      // On some environments, pathname can include full local path; keep only last known build-relative part\n      // Example: /C:/.../build/web-mobile/assets/xx -> assets/xx\n      // We fallback to scanning for '/assets/' or '/cocos-js/' or '/src/'\n      var s = u.replace(/\\\\/g, '/');\n      var markers = ['/assets/', '/cocos-js/', '/src/', '/remote/'];\n      for (var i=0;i<markers.length;i++){\n        var mi = s.lastIndexOf(markers[i]);\n        if (mi >= 0){\n          s = s.slice(mi+1);\n          break;\n        }\n      }\n      u = s;\n    } catch(e) {\n      // keep as-is\n    }\n\n    // Remove leading ./ or /\n    while (u.indexOf('./') === 0) u = u.slice(2);\n    while (u.indexOf('/') === 0) u = u.slice(1);\n\n    return decodeURIComponent(u);\n  }\n\n  function dataUrlToUint8(dataUrl){\n    var comma = dataUrl.indexOf(',');\n    var b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;\n    var bin = atob(b64);\n    var len = bin.length;\n    var arr = new Uint8Array(len);\n    for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i) & 255;\n    return arr;\n  }\n\n  function dataUrlMime(dataUrl){\n    var m = /^data:([^;]+);base64,/.exec(dataUrl);\n    return m ? m[1] : 'application/octet-stream';\n  }\n\n  // Patch fetch() so engine/wasm/chunks can load from FILES\n  if (typeof window.fetch === 'function'){\n    var _fetch = window.fetch;\n    window.fetch = function(input, init){\n      try {\n        var url = (typeof input === 'string') ? input : (input && input.url);\n        var key = normalizeKey(url);\n        if (key && FILES[key]){\n          var du = FILES[key];\n          var bytes = dataUrlToUint8(du);\n          var mime = dataUrlMime(du);\n          var headers = new Headers();\n          headers.set('Content-Type', mime);\n          return Promise.resolve(new Response(bytes, { status: 200, headers: headers }));\n        }\n      } catch(e) {}\n      return _fetch(input, init);\n    };\n  }\n\n  // Patch Image.src so textures can load from FILES\n  try {\n    var imgDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');\n    if (imgDesc && imgDesc.set){\n      Object.defineProperty(HTMLImageElement.prototype, 'src', {\n        get: imgDesc.get,\n        set: function(v){\n          var key = normalizeKey(v);\n          if (key && FILES[key]) return imgDesc.set.call(this, FILES[key]);\n          return imgDesc.set.call(this, v);\n        }\n      });\n    }\n  } catch(e) {}\n\n  // Patch Audio.src so audio can load from FILES\n  try {\n    var aDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');\n    if (aDesc && aDesc.set){\n      Object.defineProperty(HTMLMediaElement.prototype, 'src', {\n        get: aDesc.get,\n        set: function(v){\n          var key = normalizeKey(v);\n          if (key && FILES[key]) return aDesc.set.call(this, FILES[key]);\n          return aDesc.set.call(this, v);\n        }\n      });\n    }\n  } catch(e) {}\n\n})();\n</script>\n`;

  const headIdx = html.search(/<head[^>]*>/i);
  if (headIdx < 0) return runtime + html;
  const headEnd = html.indexOf('>', headIdx);
  if (headEnd < 0) return runtime + html;
  return html.slice(0, headEnd + 1) + runtime + html.slice(headEnd + 1);
}

function formatBytes(n) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let u = 0;
  let v = n;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
  return `${v.toFixed(u === 0 ? 0 : 2)} ${units[u]}`;
}

function main() {
  const buildDirArg = process.argv[2] || '';
  if (!buildDirArg) die('Missing buildDir. Example: node tools/pack-single-html.js build/web-mobile');

  const buildDir = path.resolve(process.cwd(), buildDirArg);
  if (!fs.existsSync(buildDir)) die('Build dir not found: ' + buildDir);

  const indexHtmlAbs = path.join(buildDir, 'index.html');
  if (!fs.existsSync(indexHtmlAbs)) die('index.html not found in: ' + buildDir);

  const outHtmlAbs = process.argv[3]
    ? path.resolve(process.cwd(), process.argv[3])
    : path.join(buildDir, 'single', 'index.html');

  ensureDir(path.dirname(outHtmlAbs));

  let html = readUtf8(indexHtmlAbs);
  html = inlineLocalScriptsAndCss(html, buildDir);

  const map = buildInlineFileMap(buildDir, outHtmlAbs);
  html = injectRuntime(html, map);

  writeUtf8(outHtmlAbs, html);

  const size = fs.statSync(outHtmlAbs).size;
  console.log('[pack-single-html] OK');
  console.log('  input :', indexHtmlAbs);
  console.log('  output:', outHtmlAbs);
  console.log('  size  :', formatBytes(size));
  console.log('  files embedded:', Object.keys(map).length);
  console.log('');
  console.log('Test: serve the folder and open the single html:');
  console.log('  npx http-server "' + path.dirname(outHtmlAbs) + '" -p 8080');
  console.log('  then open: http://localhost:8080/index.html');
}

main();