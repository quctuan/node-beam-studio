import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.zip':'application/zip','.md':'text/markdown; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/api/shared-default'){if(req.method!=='GET'){res.writeHead(405,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Production preset writes are disabled in local preview.'}));return;}const r=await fetch('https://nodeanimation.vercel.app/api/shared-default');res.writeHead(r.status,{'Content-Type':'application/json'});res.end(await r.text());return;}
let name=url.pathname==='/'&&url.searchParams.get('embedded')==='beam'?'/beam.html':url.pathname;if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+decodeURIComponent(name));if(!file.startsWith(root)){res.writeHead(403);res.end();return;}const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found. Run npm run build:site first.');}});
server.listen(5192,'127.0.0.1',()=>console.log('Node Motion Studio: http://127.0.0.1:5192/'));
