import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from '@playwright/test';
const dir=mkdtempSync(join(tmpdir(),'flowers-production-'));
const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'3201',HOST:'127.0.0.1',FLOWERS_DATA_DIR:dir,NODE_ENV:'production',APP_ORIGIN:'http://127.0.0.1:3201'},stdio:['ignore','pipe','pipe']});
let browser;
try {
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('exit',()=>reject(new Error('Servidor não iniciou.')))});
 const base='http://127.0.0.1:3201';
 for(const [path,expected] of [['/loja','Nossa loja'],['/loja/buque-jardim','Poesia em flores'],['/admin','noindex,nofollow']]){const response=await fetch(base+path),html=await response.text();if(!html.includes(expected)||response.status!==200)throw new Error('Rota de produção inválida: '+path);if(!response.headers.get('content-security-policy'))throw new Error('CSP ausente.')}
 const range=await fetch(base+'/media/hero.mp4',{headers:{range:'bytes=0-1023'}});if(range.status!==206)throw new Error('Busca por trecho do vídeo falhou.');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 for(const width of [320,390,1440]){const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});await page.addInitScript(()=>sessionStorage.setItem('flowers-intro','1'));await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.locator('.hero-media img').evaluate(i=>i.decode());await page.waitForTimeout(1300);await page.screenshot({path:`/workspace/loja-pronta-${width}.png`});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Rolagem horizontal em '+width+'px');await page.goto(base+'/loja');await page.locator('.product-card').first().waitFor();if(errors.length)throw new Error('Erros no navegador: '+JSON.stringify(errors));await page.close()}
 console.log('Produção validada: rotas, metadados, CSP, vídeo, fontes e telas de 320/390/1440 px.');
} finally {await browser?.close();child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));rmSync(dir,{recursive:true,force:true})}
