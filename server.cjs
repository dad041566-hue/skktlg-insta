const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.woff2':'font/woff2'};
const allowed = new Set(['index.html','style.css','app.js','config.js','assets/hero.png','assets/package-promotion.png','assets/PretendardVariable.woff2']);
http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';}catch{res.writeHead(400).end();return;}
 if(!allowed.has(name)){res.writeHead(404).end('Not found');return;}
 fs.readFile(path.join(root,name),(err,body)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);});
}).listen(4173,'0.0.0.0',()=>console.log('Preview: http://localhost:4173'));
