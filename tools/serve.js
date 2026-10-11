// Tiny static server for local testing: node tools/serve.js [port]
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),port=+process.argv[2]||8080;
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml','.md':'text/plain','.json':'application/json'};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('404');}
r.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(port,()=>console.log('http://localhost:'+port));
