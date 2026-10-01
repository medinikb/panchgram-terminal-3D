// A small local-only web server. GitHub Pages serves these same static files.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT || 4173);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be between 1 and 65535.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Method not allowed');return;}
  try{
    const url=new URL(req.url,'http://localhost');
    let relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if(!relative)relative='index.html';
    // Allow a repository-name prefix for testing GitHub Pages subpath deployment.
    if(relative.startsWith('panchgram-terminal-3d/'))relative=relative.slice('panchgram-terminal-3d/'.length)||'index.html';
    const file=path.resolve(root,relative);
    const inside=path.relative(root,file);
    if(inside.startsWith('..')||path.isAbsolute(inside)||inside.split(path.sep).some(segment=>segment.startsWith('.'))||!types[path.extname(file)]){res.writeHead(403);res.end('Forbidden');return;}
    if(!(await stat(file)).isFile())throw new Error('Not found');
    const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Length':content.length});res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(404);res.end('File not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Panchgram Terminal Atlas: http://127.0.0.1:${port}\nKeep this window open. Press Ctrl+C to stop.`)).on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Close the previous viewer server or set PORT to a different port.`:error.message);process.exitCode=1;});
