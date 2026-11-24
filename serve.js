// Range 요청(영상 시크)을 지원하는 정적 서버: node serve.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = +process.argv[2] || 8000;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.jpg':'image/jpeg','.mp4':'video/mp4','.m4v':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.ogv':'video/ogg'};
http.createServer((req, res) => {
  let p = path.normalize(path.join(root, decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(root)) { res.writeHead(403).end(); return; }
  if (p.endsWith(path.sep)) p += 'index.html';
  fs.stat(p, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end('Not found'); return; }
    const type = types[path.extname(p).toLowerCase()] || 'application/octet-stream';
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const start = m[1] ? +m[1] : st.size - +m[2], end = m[1] && m[2] ? +m[2] : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, {'Content-Range': `bytes */${st.size}`}).end(); return; }
      res.writeHead(206, {'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${st.size}`});
      fs.createReadStream(p, {start, end}).pipe(res);
    } else {
      res.writeHead(200, {'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': st.size});
      fs.createReadStream(p).pipe(res);
    }
  });
}).listen(port, () => console.log(`http://localhost:${port}`));
