const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.woff2':'font/woff2'};
const allowed = new Set(['index.html','style.css','survey.css','survey-model.js','app.js','config.js','admin.html','admin.css','admin.js','assets/hero.png','assets/package-promotion.png','assets/PretendardVariable.woff2']);
const routes={'api/consultations':require('./api/consultations.js'),'api/admin':require('./api/admin.js'),'api/cleanup':require('./api/cleanup.js')};
const server=http.createServer(async(req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';}catch{res.writeHead(400).end();return;}
 if(routes[name]){await routes[name](req,res);return;}
 if(name==='admin')name='admin.html';
 if(!allowed.has(name)){res.writeHead(404).end('Not found');return;}
 fs.readFile(path.join(root,name),(err,body)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);});
});
if(require.main===module){const port=Number(process.env.PORT)||4173;server.listen(port,'127.0.0.1',()=>console.log(`Preview: http://localhost:${port}`));}
module.exports=server;
