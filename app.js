const I18N={"en":{"controls":"Controls","run":"▶ Run","step":"⏭ Step","reset":"↻ Reset","setup":"Setup","mode":"Mode","rule":"Rule","speed":"Speed","seed":"Seed","gen":"Generation","pop":"Population","about":"About","abouttext":"the simulation runs in real lua code, compiled to webassembly and executed in your browser via wasmoon. no server, no build step."},"de":{"controls":"Steuerung","run":"▶ Start","step":"⏭ Schritt","reset":"↻ Reset","setup":"Einstellungen","mode":"Modus","rule":"Regel","speed":"Tempo","seed":"Seed","gen":"Generation","pop":"Population","about":"Über","abouttext":"die simulation läuft in echtem lua-code, kompiliert zu webassembly und im browser über wasmoon ausgeführt. kein server, kein build-schritt."}};
let lang=localStorage.getItem('lang')||'en';
const t=k=>I18N[lang][k]||k;
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t(el.dataset.i));document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===lang));}
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;localStorage.setItem('lang',lang);applyLang();});

import {LuaFactory} from 'https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/+esm';
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');const $=id=>document.getElementById(id);
const W=110,H=62;
let lua=null,raf=null,last=0,acc=0,speed=15,running=false;
async function boot(){
  const factory=new LuaFactory();
  lua=await factory.newState();
  const code=await fetch('app.lua').then(r=>r.text());
  await lua.doString(code);
  syncParams();
}
async function syncParams(){
  if(!lua)return;
  lua.global.set('mode',$('mode').value);
  lua.global.set('rule',+$('rule').value);
  lua.global.set('seed',+$('seed').value||1);
  await lua.doString('init()');
  $('gen').textContent='0';$('pop').textContent='0';
}
function pop(){if(!lua)return 0;let p=0;const d=lua.global.get('frame_data')||'';for(const c of d)if(c==='1')p++;return p;}
function draw(){
  if(!lua)return;
  const d=lua.global.get('frame_data');if(!d)return;
  const r=cv.parentElement.getBoundingClientRect();
  const cw=r.width/devicePixelRatio,ch=r.height/devicePixelRatio;
  cv.width=r.width*devicePixelRatio;cv.height=r.height*devicePixelRatio;
  ctx.fillStyle='#06080f';ctx.fillRect(0,0,cv.width,cv.height);
  const sx=cv.width/W,sy=cv.height/H,sz=Math.min(sx,sy);
  const ox=(cv.width-W*sz)/2,oy=(cv.height-H*sz)/2;
  let i=0;
  for(let y=0;y<H;y++){
    const rowStart=i; i+=W;
    const row=d.slice(rowStart,i);
    for(let x=0;x<W;x++){
      if(row[x]==='1'){
        ctx.fillStyle='#39ff6a';
        ctx.fillRect(ox+x*sz,oy+y*sz,sz+0.5,sz+0.5);
      }
    }
  }
  $('gen').textContent=lua.global.get('gen');
  $('pop').textContent=pop();
}
async function loop(ts){if(!running)return;if(!lua){raf=requestAnimationFrame(loop);return;}acc+=ts-last;last=ts;const iv=1000/speed;let n=0;
  while(acc>iv&&n<10){acc-=iv;n++;await lua.doString('tick()');}
  draw();raf=requestAnimationFrame(loop);
}
$('run').onclick=()=>{running=!running;$('run').textContent=running?'⏸':'▶';if(running){last=performance.now();acc=0;raf=requestAnimationFrame(loop);}else cancelAnimationFrame(raf);};
$('step').onclick=async()=>{if(!lua)return;await lua.doString('tick()');draw();};
$('reset').onclick=()=>syncParams();
$('mode').onchange=()=>{$('rulewrap').classList.toggle('hidden',$('mode').value==='life');syncParams();};
$('rule').onchange=()=>syncParams();$('seed').onchange=()=>syncParams();$('dice').onclick=()=>{$('seed').value=Math.floor(Math.random()*9999);syncParams();};
$('speed').onchange=()=>{speed=+$('speed').value;};
boot().then(()=>{syncParams().then(()=>{draw();applyLang();});}).catch(e=>{document.querySelector('.stage').innerHTML='<p style="padding:30px;color:#f87171">lua runtime failed: '+e.message+'</p>';});