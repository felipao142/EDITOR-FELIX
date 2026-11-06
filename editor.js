const $=id=>document.getElementById(id),cv=$('cv'),ctx=cv.getContext('2d');
const nid=()=>Math.random().toString(36).slice(2,9),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ls={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},d:k=>{try{localStorage.removeItem(k)}catch(e){}},k:()=>{try{return Object.keys(localStorage)}catch(e){return[]}}};
const db=new Promise(r=>{try{const q=indexedDB.open('ve',1);q.onupgradeneeded=()=>q.result.createObjectStore('m');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
const idb=async(m,...a)=>{const d=await db;if(!d)return;return new Promise(r=>{const q=d.transaction('m',m=='get'?'readonly':'readwrite').objectStore('m')[m](...a);q.onsuccess=()=>r(q.result);q.onerror=()=>r()})};
let P,clips=[],texts=[],media={},els={},sel=null,t=0,playing=false,zoom=50,loop=false,snap=true,last=performance.now(),exporting=false,inEd=false,W=1280,H=720,AC,mdest,hist=[],hi=-1,drag=null,cd=null,rec,chunks=[],ke='smooth',stab='media',itab='mover',subStop=null,FPS=30,lay=[];
const len=c=>(c.out-c.in)/c.speed,total=()=>Math.max(0,...clips.map(c=>c.st+len(c)),...texts.map(x=>x.start+x.dur));
const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'),z2=n=>String(n).padStart(2,'0');
const tc=s=>z2(Math.floor(s/60))+':'+z2(Math.floor(s%60))+':'+z2(Math.floor(s%1*FPS)),clamp=x=>Math.max(0,Math.min(total(),x));
const toast=m=>{const e=$('toast');e.textContent=m;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2200)};
const SV=d=>`<svg viewBox="0 0 24 24">${d}</svg>`,IC={media:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>'),texto:SV('<path d="M5 6h14M12 6v13M9 19h6"/>'),sub:SV('<path d="M4 5h16v11H9l-5 4z"/>'),fx:SV('<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>'),adj:SV('<path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>'),img:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/>')};
function sheet(w,tn){const e=$('ed');e.classList.remove('sh-side','sh-insp');if(w)e.classList.add('sh-'+w);if(tn){stab=tn;rSide(1)}}
function initMbar(){$('mbar').innerHTML=[['media','Mídia',"sheet('side','media')"],['texto','Texto',"sheet('side','texto')"],['sub','Legendas',"sheet('side','sub')"],['fx','Efeitos',"sheet('side','fx')"],['adj','Ajustes',"sheet('insp')"],['img','Imagem','ieStart()']].map(([i,n,a])=>`<button onclick="${a}">${IC[i]}<span>${n}</span></button>`).join('');
 $('prev').addEventListener('pointerdown',()=>{if(matchMedia('(max-width:760px)').matches)sheet()})}
/* ---------- constantes ---------- */
const F=()=>({b:100,c:100,s:100,bl:0,g:0,se:0,h:0}),FK=['b','c','s','bl','g','se','h'];
const fs=f=>`brightness(${f.b}%) contrast(${f.c}%) saturate(${f.s}%) blur(${f.bl}px) grayscale(${f.g}%) sepia(${f.se}%) hue-rotate(${f.h||0}deg)`;
const PR={Original:[100,100,100,0,0,0,0],'Vívido':[105,115,150,0,0,0,0],'P&B':[100,110,0,0,100,0,0],Vintage:[105,90,80,0,0,60,0],'Dramático':[90,150,110,0,0,0,0],Suave:[110,90,100,1.5,0,0,0],Cyber:[105,125,160,0,0,0,260],Sonho:[115,92,125,1,0,12,320],Frio:[100,105,110,0,0,0,180],Quente:[105,105,120,0,0,25,350]};
const AN=(k,p)=>{p=p*p*(3-2*p);const r=[1,1,0,0,1];if(['fade','zoom','slide','up'].includes(k))r[0]=p;if(k=='zoom')r[1]=.5+.5*p;if(k=='slide')r[2]=(p-1)*.3;if(k=='up')r[3]=(1-p)*.25;if(k=='pop')r[1]=.3+.7*Math.min(1,p*1.15),r[0]=p;if(k=='wipe')r[4]=p;return r};
const OP=[['none','Nenhuma'],['fade','Fade'],['zoom','Zoom'],['slide','Deslizar'],['up','Subir'],['pop','Pop'],['wipe','Cortina']];
const BM=[['source-over','Normal'],['screen','Tela'],['multiply','Multiplicar'],['overlay','Sobrepor'],['lighten','Clarear'],['darken','Escurecer'],['difference','Diferença']];
const EZ=[['smooth','Suave'],['linear','Linear'],['in','Acelerar'],['out','Desacelerar'],['hold','Degrau']];
const EA={linear:p=>p,smooth:p=>p*p*(3-2*p),in:p=>p*p,out:p=>1-(1-p)*(1-p),hold:()=>0};
const FONTS=[['sans-serif','Padrão'],['Impact, Haettenschweiler, sans-serif','Impacto'],['Georgia, serif','Serifada'],["'Courier New', monospace",'Mono'],["'Trebuchet MS', sans-serif",'Trebuchet'],["'Comic Sans MS', cursive",'Casual'],['Verdana, sans-serif','Verdana']];
const KPC=['x','y','sc','rot','op'],KPT=['x','y','size','rot','op'],KL={x:'X',y:'Y',sc:'Escala',size:'Tamanho',rot:'Rotação',op:'Opacidade'};
const ROWS=[2,1,0,3,4],RN={2:'V3',1:'V2',0:'V1',3:'A1',4:'A2'},RH=42,TH=30,RUL=26;
const isA=c=>c.type=='audio',isTx=o=>texts.includes(o),kp=o=>isTx(o)?KPT:KPC,st0=o=>isTx(o)?o.start:o.st,ln=o=>isTx(o)?o.dur:len(o);
const SUBD={size:44,color:'#ffffff',bg:'#000000',bga:.6,y:.88,up:0,sk:'#000000',sw:4};
const TD=s=>({text:'Seu texto',start:s,dur:3,x:.5,y:.8,size:56,color:'#ffffff',font:'sans-serif',wt:700,it:0,up:0,sk:'#000000',sw:6,bg:'#000000',bga:0,sh:0,rot:0,op:1,ai:'fade',ao:'none',kf:[]});
const TPS=[['Título',{size:96,wt:800,y:.5,sw:8}],['Subtítulo',{size:48,y:.62}],['Neon',{size:80,color:'#34f5a0',sh:28,sw:0,font:'Impact, Haettenschweiler, sans-serif',y:.5}],['Roxo',{size:80,color:'#ffffff',sk:'#8b5cf6',sw:14,y:.5,font:'Impact, Haettenschweiler, sans-serif'}],['Tarja',{size:44,bga:.85,bg:'#6d3fe0',sw:0,y:.84}],['Máquina',{size:56,ai:'type',font:"'Courier New', monospace",y:.5}]];
/* ---------- keyframes ---------- */
function kfAt(o,u){const k=o.kf;if(!k||!k.length)return o;if(u<=k[0].u)return k[0];const L=k[k.length-1];if(u>=L.u)return L;let i=0;while(i<k.length-2&&k[i+1].u<u)i++;
 const a=k[i],b=k[i+1],p=(EA[a.e]||EA.smooth)((u-a.u)/(b.u-a.u)),r={};kp(o).forEach(q=>r[q]=a[q]+(b[q]-a[q])*p);return r}
const gv=(o,p)=>{const k=o.kf&&o.kf.length;return k&&kp(o).includes(p)?kfAt(o,t-st0(o))[p]:o[p]};
function setKf(o,over){const u=Math.max(0,Math.min(ln(o),t-st0(o))),c=kfAt(o,u),old=(o.kf||[]).find(x=>Math.abs(x.u-u)<.05),k={u,e:old?old.e:ke};kp(o).forEach(q=>k[q]=c[q]);Object.assign(k,over);
 o.kf=(o.kf||[]).filter(x=>Math.abs(x.u-u)>=.05);o.kf.push(k);o.kf.sort((a,b)=>a.u-b.u)}
function addKfBtn(){if(!sel){toast('Selecione um clipe ou texto');return}const o=sel.o;if(t<st0(o)-.02||t>st0(o)+ln(o)+.02){toast('Mova o cursor para dentro do item selecionado');return}
 const has=o.kf&&o.kf.some(x=>Math.abs(x.u-(t-st0(o)))<.05);if(has){o.kf=o.kf.filter(x=>Math.abs(x.u-(t-st0(o)))>=.05)}else setKf(o,{});commit();rTL();rIn()}
function delKf(i){sel.o.kf.splice(i,1);commit();rTL();rIn()}
function goKf(i){t=clamp(st0(sel.o)+sel.o.kf[i].u);rIn()}
function jk(d){if(!sel||!sel.o.kf||!sel.o.kf.length)return;const s=st0(sel.o),ts=sel.o.kf.map(k=>s+k.u),n=d>0?ts.find(x=>x>t+.02):[...ts].reverse().find(x=>x<t-.02);if(n!=null){playing=false;t=clamp(n);rIn()}}
function clrKf(){if(!sel)return;const o=sel.o,v=kfAt(o,t-st0(o));if(o.kf&&o.kf.length)kp(o).forEach(q=>o[q]=v[q]);o.kf=[];commit();rTL();rIn()}
function setEz(i,v){sel.o.kf[i].e=v;commit()}
function splitKf(o,u){const k=o.kf||[];if(!k.length)return[[],[]];const v=kfAt(o,u),mk2=(x,uu)=>{const r={u:uu,e:x};kp(o).forEach(q=>r[q]=v[q]);return r};let e='smooth';for(const a of k)if(a.u<=u)e=a.e;
 return[[...k.filter(a=>a.u<u-.01).map(a=>({...a})),mk2(e,u)],[mk2(e,0),...k.filter(a=>a.u>u+.01).map(a=>({...a,u:a.u-u}))]]}
/* ---------- gif ---------- */
function lzw(mc,data,n){const clr=1<<mc,eoi=clr+1,pre=new Uint16Array(4096),suf=new Uint8Array(4096),stk=new Uint8Array(4097),out=new Uint8Array(n);
 let cs=mc+1,nx=eoi+1,mask=(1<<cs)-1,bits=0,bc=0,di=0,op=0,old=-1,first=0;for(let i=0;i<clr;i++)suf[i]=i;
 while(op<n){while(bc<cs&&di<data.length){bits|=data[di++]<<bc;bc+=8}if(bc<cs)break;
  let code=bits&mask;bits>>=cs;bc-=cs;
  if(code==clr){cs=mc+1;nx=eoi+1;mask=(1<<cs)-1;old=-1;continue}
  if(code==eoi)break;
  if(old==-1){out[op++]=suf[code];old=code;first=code;continue}
  const inc=code;let sp=0;if(code>=nx){stk[sp++]=first;code=old}
  while(code>=clr){stk[sp++]=suf[code];code=pre[code]}
  first=suf[code];stk[sp++]=first;
  if(nx<4096){pre[nx]=old;suf[nx]=first;nx++;if(nx>mask&&cs<12){cs++;mask=(1<<cs)-1}}
  old=inc;while(sp>0&&op<n)out[op++]=stk[--sp]}
 return out}
function parseGif(b){
 if(String.fromCharCode(b[0],b[1],b[2])!='GIF')throw new Error('gif');
 let p=6;const W0=b[p]|b[p+1]<<8,H0=b[p+2]|b[p+3]<<8,fl=b[p+4];p+=7;let gct=null;
 if(fl&128){const n=2<<(fl&7);gct=b.subarray(p,p+n*3);p+=n*3}
 const base=document.createElement('canvas');base.width=W0;base.height=H0;const g=base.getContext('2d',{willReadFrequently:true}),out=[];let gce=null;
 while(p<b.length){const bt=b[p++];
  if(bt==0x21){const lb=b[p++];if(lb==0xF9)gce={dp:(b[p+1]>>2)&7,tr:(b[p+1]&1)?b[p+4]:-1,d:(b[p+2]|b[p+3]<<8)/100};while(p<b.length&&b[p])p+=b[p]+1;p++}
  else if(bt==0x2C){
   const x=b[p]|b[p+1]<<8,y=b[p+2]|b[p+3]<<8,w=b[p+4]|b[p+5]<<8,h=b[p+6]|b[p+7]<<8,f=b[p+8];p+=9;
   let ct=gct;if(f&128){const n=2<<(f&7);ct=b.subarray(p,p+n*3);p+=n*3}
   const mc=b[p++],parts=[];let tl=0;
   while(p<b.length&&b[p]){parts.push(b.subarray(p+1,p+1+b[p]));tl+=b[p];p+=b[p]+1}p++;
   const data=new Uint8Array(tl);let o=0;for(const q of parts){data.set(q,o);o+=q.length}
   const idx=lzw(mc,data,w*h),dp=gce?gce.dp:0,tr=gce?gce.tr:-1,im=new ImageData(w,h),px=im.data,rows=[];
   if(f&64){for(const[s0,sp]of[[0,8],[4,8],[2,4],[1,2]])for(let r=s0;r<h;r+=sp)rows.push(r)}else for(let r=0;r<h;r++)rows.push(r);
   for(let i=0;i<h;i++){const r=rows[i];for(let c=0;c<w;c++){const v=idx[i*w+c];if(v==tr||!ct)continue;const q=(r*w+c)*4;px[q]=ct[v*3];px[q+1]=ct[v*3+1];px[q+2]=ct[v*3+2];px[q+3]=255}}
   const snapd=dp==3?g.getImageData(0,0,W0,H0):null,tcv=document.createElement('canvas');tcv.width=w;tcv.height=h;tcv.getContext('2d').putImageData(im,0,0);g.drawImage(tcv,x,y);
   const fc=document.createElement('canvas');fc.width=W0;fc.height=H0;fc.getContext('2d').drawImage(base,0,0);
   out.push({bm:fc,d:gce&&gce.d>=.02?gce.d:.1});
   if(dp==2)g.clearRect(x,y,w,h);else if(dp==3&&snapd)g.putImageData(snapd,0,0);
   gce=null}
  else break}
 return out}
async function decGif(blob){const buf=await blob.arrayBuffer();let fr=null;
 if(window.ImageDecoder&&!window.NO_IMGDEC){try{const d=new ImageDecoder({data:buf,type:'image/gif'});await d.tracks.ready;const n=d.tracks.selectedTrack.frameCount;fr=[];
  for(let i=0;i<n;i++){const r=await d.decode({frameIndex:i}),v=r.image,c=document.createElement('canvas');c.width=v.displayWidth;c.height=v.displayHeight;c.getContext('2d').drawImage(v,0,0);fr.push({bm:c,d:Math.max(.02,v.duration>0?v.duration/1e6:.1)});v.close()}d.close()}catch(e){fr=null}}
 if(!fr||!fr.length){try{fr=parseGif(new Uint8Array(buf))}catch(e){fr=null}}
 if(!fr||!fr.length)return null;let a=0;fr.forEach(f=>{f.s=a;a+=f.d});return{gf:fr,gd:a}}
const gframe=(m,l)=>{const g=m.gd,x=((l%g)+g)%g;let f=m.gf[0];for(const q of m.gf){if(q.s<=x)f=q;else break}return f.bm};
/* ---------- projetos ---------- */
function home(){inEd=false;playing=false;Object.values(els).forEach(e=>e.pause());$('ed').style.display='none';$('home').style.display='block';
 let c='<div class="card new" onclick="newP()">＋ Novo projeto</div>';
 ls.k().filter(k=>k.startsWith('vp:')).map(k=>{try{return JSON.parse(ls.g(k))}catch(e){return null}}).filter(Boolean).sort((a,b)=>b.upd-a.upd).forEach((p,i)=>{const cov=ls.g('vc:'+p.id),T=Math.max(0,...p.clips.map(c=>(c.st||0)+(c.out-c.in)/c.speed));
  c+=`<div class="card" style="animation:fi .4s ${i*.05}s backwards" onclick="openP('${p.id}')"><div class="cov" style="${cov?`background-image:url(${cov})`:''}">${cov?'':'🎬'}</div><div class="i"><b>${esc(p.name)}</b><br><span class="hint">${p.clips.length} clipes · ${fmt(T)} · ${new Date(p.upd).toLocaleDateString('pt-BR')}</span></div><button class="d" onclick="event.stopPropagation();delP('${p.id}')">🗑 Apagar</button></div>`});
 $('grid').innerHTML=c}
async function newP(){const n=await modal('Nome do projeto',' ');if(n==null)return;const p={id:nid(),name:n,ar:'16:9',clips:[],texts:[],upd:Date.now()};ls.s('vp:'+p.id,JSON.stringify(p));openP(p.id)}
async function delP(id){if(!await modal('Apagar este projeto? Isso não pode ser desfeito.'))return;ls.d('vp:'+id);ls.d('vc:'+id);const d=await db;if(d)d.transaction('m','readwrite').objectStore('m').delete(IDBKeyRange.bound(id+':',id+';'));home()}
function modal(msg,val){return new Promise(r=>{const m=$('md');m.innerHTML=`<div class="box"><p>${msg}</p>${val!=null?`<input type="text" id="mi" value="${esc(val)}">`:''}<div style="text-align:right"><button id="mc">Cancelar</button> <button class="p" id="mo">OK</button></div></div>`;m.style.display='flex';const k=v=>{m.style.display='none';r(v)};$('mc').onclick=()=>k(null);$('mo').onclick=()=>k(val!=null?($('mi').value||'Sem título'):true);if(val!=null){$('mi').focus();$('mi').onkeydown=e=>{if(e.key=='Enter')$('mo').click()}}})}
function norm(){P.tr=P.tr||{};P.sub=Object.assign({},SUBD,P.sub);P.bin=P.bin||[];let s0=0;
 clips.forEach(c=>{if(c.st==null){c.st=s0;c.tr=c.tr||0;s0+=len(c)}c.kf=c.kf||[];c.f=Object.assign(F(),c.f);if(c.bm==null)c.bm='source-over'});
 texts.forEach(x=>{const d=TD(0);for(const k in d)if(x[k]==null)x[k]=d[k];x.kf=x.kf||[]});
 for(const c of clips)if(!P.bin.some(b=>b.mid==c.mid))P.bin.push({mid:c.mid,name:c.name,type:c.type,dur:c.dur})}
async function openP(id){Object.values(els).forEach(e=>{e.pause();e.removeAttribute('src')});els={};P=JSON.parse(ls.g('vp:'+id));clips=P.clips;texts=P.texts;norm();media={};sel=null;t=0;playing=false;stab='media';itab='mover';
 $('home').style.display='none';$('ed').style.display='grid';inEd=true;$('ar').value=P.ar;setAr();$('pn').textContent=P.name;rSide();rTL();rIn();
 for(const b of P.bin)if(!media[b.mid]){const r=await idb('get',id+':'+b.mid);if(r){media[b.mid]={...r,url:URL.createObjectURL(r.blob)};mk(b.mid)}}
 clips=clips.filter(c=>media[c.mid]);P.bin=P.bin.filter(b=>media[b.mid]);hist=[];hi=-1;commit(1);rSide();rTL();rIn()}
$('pn').onclick=async()=>{const n=await modal('Renomear projeto',P.name);if(n){P.name=n;$('pn').textContent=n;save()}};
function save(){P.clips=clips;P.texts=texts;P.ar=$('ar').value;P.upd=Date.now();ls.s('vp:'+P.id,JSON.stringify(P))}
function back(){save();if(clips.length||texts.length){const c=document.createElement('canvas');c.width=240;c.height=135;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,240,135);const k=Math.min(240/cv.width,135/cv.height);x.drawImage(cv,(240-cv.width*k)/2,(135-cv.height*k)/2,cv.width*k,cv.height*k);ls.s('vc:'+P.id,c.toDataURL('image/jpeg',.6))}home()}
function commit(i){hist=hist.slice(0,hi+1);hist.push(JSON.stringify({clips,texts,tr:P.tr,sub:P.sub}));hi=hist.length-1;if(hist.length>60){hist.shift();hi--}if(!i)save()}
function undo(d){const n=hi+d;if(n<0||n>=hist.length)return;hi=n;const s=JSON.parse(hist[n]);clips=s.clips;texts=s.texts;P.tr=s.tr;P.sub=s.sub;sel=null;t=Math.min(t,total());save();rSide();rTL();rIn()}
function setAr(){const[a,b]=$('ar').value.split(':').map(Number);W=a>=b?(a==b?1080:1280):720;H=Math.round(W*b/a);cv.width=W;cv.height=H;guides(1)}
/* ---------- mídia ---------- */
async function mk(mid){const m=media[mid];
 if(m.type=='audio'){rSide();rTL();return}
 if(m.type=='gif'){m.th=[m.url];const g=await decGif(m.blob);if(g){m.gf=g.gf;m.gd=g.gd}else{m.im=new Image();m.im.src=m.url}rSide();rTL();return}
 if(m.type=='image'){m.im=new Image();m.im.src=m.url;try{await m.im.decode()}catch(e){}m.th=[m.url];rSide();rTL();return}
 const v=document.createElement('video');v.muted=true;v.src=m.url;await new Promise(r=>{v.onloadedmetadata=r;v.onerror=r});m.th=[];const c=document.createElement('canvas');c.width=96;c.height=54;
 for(let i=0;i<12;i++){await new Promise(r=>{v.onseeked=r;setTimeout(r,900);v.currentTime=Math.min(Math.max(0,m.dur-.05),(i+.5)*m.dur/12)});c.getContext('2d').drawImage(v,0,0,96,54);m.th.push(c.toDataURL('image/jpeg',.5))}rSide();rTL()}
async function importFiles(files){if(!P)return;for(const f of files){const mid=nid(),y=f.type,type=y=='image/gif'||/\.gif$/i.test(f.name)?'gif':y.startsWith('image')?'image':y.startsWith('audio')?'audio':y.startsWith('video')?'video':null;if(!type)continue;const url=URL.createObjectURL(f);let dur=60;
  if(type=='video'||type=='audio'){const v=document.createElement('video');v.src=url;await new Promise(r=>{v.onloadedmetadata=r;v.onerror=r});dur=isFinite(v.duration)?v.duration:10}
  const m0={blob:f,type,dur,name:f.name};idb('put',m0,P.id+':'+mid);media[mid]={...m0,url};P.bin.push({mid,name:f.name,type,dur});
  if(type=='gif')await mk(mid);else mk(mid);addClip(mid)}
 fi.value='';toast('Mídia importada')}
$('fi').onchange=e=>importFiles([...e.target.files]);
addEventListener('dragover',e=>{if(inEd)e.preventDefault()});addEventListener('drop',e=>{if(!inEd)return;e.preventDefault();importFiles([...e.dataTransfer.files])});
function addClip(mid){const m=media[mid];if(!m)return;const type=m.type,A=type=='audio',tr=A?3:type=='gif'?1:0,ends=clips.filter(c=>c.tr==tr).map(c=>c.st+len(c)),st=(A||type=='gif')?t:Math.max(0,...ends),gd=m.gd||0;
 const out=type=='video'||A?m.dur:type=='gif'?(gd?gd*Math.max(1,Math.ceil(2/gd)):3):5;
 const c={id:nid(),mid,name:m.name,type,tr,st,in:0,out,dur:(type=='video'||A)?m.dur:300,speed:1,vol:1,f:F(),x:0,y:0,sc:type=='gif'?.5:1,rot:0,op:1,ai:'none',ao:'none',bm:'source-over',kf:[]};
 clips.push(c);sel={k:'c',o:c};itab=A?'tempo':'mover';commit();rTL();rIn()}
/* ---------- edição ---------- */
function split(){const o=sel&&t>st0(sel.o)&&t<st0(sel.o)+ln(sel.o)?sel.o:null,c=o&&!isTx(o)?o:clips.filter(x=>t>x.st&&t<x.st+len(x)).sort((a,b)=>b.tr-a.tr)[0];
 if(o&&isTx(o)){const u=t-o.start;if(u<.2||o.dur-u<.2)return;const[kl,kr]=splitKf(o,u),n={...o,kf:kr,start:t,dur:o.dur-u,ai:'none'};o.dur=u;o.ao='none';o.kf=kl;texts.push(n);sel={k:'t',o:n};commit();rSide();rTL();rIn();return}
 if(!c)return;const u=t-c.st,s=c.in+u*c.speed;if(s<=c.in+.05||s>=c.out-.05)return;const[kl,kr]=splitKf(c,u);
 const n={...c,id:nid(),st:t,in:s,ai:'none',ad:0,f:{...c.f},kf:kr};c.out=s;c.ao='none';c.kf=kl;clips.push(n);sel={k:'c',o:n};commit();rTL();rIn()}
function detach(){const o=sel.o,a={...o,id:nid(),type:'audio',tr:3,f:F(),kf:[],ai:'none',ao:'none',name:'🎵 '+o.name};o.vol=0;clips.push(a);sel={k:'c',o:a};itab='tempo';commit();rTL();rIn()}
function trans(k){const o=sel.o,p=clips.filter(c=>c!==o&&c.tr==o.tr&&c.st<o.st).sort((a,b)=>b.st-a.st)[0];if(!p){toast('Coloque este clipe depois de outro na mesma trilha');return}
 if(k=='none'){o.ai='none';o.ad=0}else{const d=Math.min(.6,len(p),len(o));o.st=p.st+len(p)-d;o.ai=k;o.ad=d}commit();rTL();rIn()}
function del(){if(!sel)return;if(sel.k=='c')clips=clips.filter(c=>c!==sel.o);else texts=texts.filter(x=>x!==sel.o);sel=null;t=clamp(t);commit();rSide();rTL();rIn()}
function dup(){if(!sel)return;const cp=o=>JSON.parse(JSON.stringify(o));if(sel.k=='c'){const c={...cp(sel.o),id:nid(),st:sel.o.st+len(sel.o)};clips.push(c);sel={k:'c',o:c}}else{const x={...cp(sel.o),start:sel.o.start+sel.o.dur};texts.push(x);sel={k:'t',o:x}}commit();rSide();rTL();rIn()}
function addText(p){const o=Object.assign(TD(t),p||{});texts.push(o);sel={k:'t',o};itab='texto';commit();rSide();rTL();rIn()}
function shot(){cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='frame.png';a.click()})}
function step(d){playing=false;$('pp').textContent='▶';t=clamp(t+d/FPS)}
function guides(k){const g=$('gd');if(k===1){if(g.style.display!='block')return}else g.style.display=g.style.display=='block'?'none':'block';const b=cv.getBoundingClientRect(),s=$('stage').getBoundingClientRect();Object.assign(g.style,{left:b.left-s.left+'px',top:b.top-s.top+'px',width:b.width+'px',height:b.height+'px'})}
addEventListener('resize',()=>guides(1));
function fs2(){const e=$('stage');if(document.fullscreenElement)document.exitFullscreen();else if(e.requestFullscreen)e.requestFullscreen()}
function upd(p,v){const o=sel.o;if(p.includes('.')){const[a,b]=p.split('.');o[a][b]=v}else if(kp(o).includes(p)&&o.kf&&o.kf.length)setKf(o,{[p]:v});else o[p]=v;
 if(sel.k=='c'&&p=='in'&&o.in>o.out-.1)o.in=o.out-.1;if(sel.k=='c'&&p=='out'&&o.out<o.in+.1)o.out=o.in+.1;rTL()}
function preset(n){if(!sel||!PR[n])return;FK.forEach((k,i)=>sel.o.f[k]=PR[n][i]);commit();rIn()}
/* ---------- painel esquerdo ---------- */
const STABS=[['media','🎞 Mídia'],['texto','T Texto'],['sub','💬 Legendas'],['fx','✨ Efeitos']];
function tab(n){stab=n;rSide(1)}
function rSide(force){if(!P)return;const sp=$('spane');if(!force&&stab=='sub'&&sp.contains(document.activeElement)&&document.activeElement.tagName!='BODY')return;const sc=sp.scrollTop;
 $('stabs').innerHTML=STABS.map(([v,n])=>`<button class="${v==stab?'on':''}" onclick="tab('${v}')">${IC[v]}<span>${n.replace(/^\S+\s*/,'')}</span></button>`).join('');
 sp.innerHTML=({media:pMedia,texto:pTexto,sub:pSub,fx:pFx}[stab])();sp.scrollTop=sc}
function pMedia(){let h='<button class="p" style="width:100%" onclick="fi.click()">＋ Importar mídia</button><p class="hint">Vídeo, imagem, GIF ou áudio. Arraste arquivos para a janela. Clique em um item para colocá-lo na timeline.</p><div class="mg">';
 P.bin.forEach(b=>{const m=media[b.mid],th=m&&m.th&&m.th[0];h+=`<div class="mi" onclick="addClip('${b.mid}')"><div class="th" style="${th?`background-image:url(${th})`:''}">${th?'':(b.type=='audio'?'🎵':'🎬')}</div><b>${b.type=='gif'?'GIF':b.type=='audio'?'ÁUDIO':b.type=='video'?fmt(b.dur):'IMG'}</b><small>${esc(b.name)}</small></div>`});
 return h+'</div>'+(P.bin.length?'':'<p class="hint">Nenhuma mídia ainda.</p>')}
function pTexto(){return '<h4>Estilos de texto</h4><div class="mg">'+TPS.map(([n],i)=>`<div class="tp" onclick="addText(TPS[${i}][1])"><b>${n}</b></div>`).join('')+'</div><h4>Rápido</h4><button style="width:100%" onclick="addText()">T Texto simples no cursor</button><p class="hint">Selecione o texto na timeline para editar fonte, cor, contorno, caixa, brilho e <b>keyframes</b> (posição, tamanho, rotação e opacidade).</p>'}
const SR=(l,k,mn,mx,st)=>`<label>${l}<output>${fv(P.sub[k])}</output></label><input type="range" min="${mn}" max="${mx}" step="${st}" value="${P.sub[k]}" oninput="subSt('${k}',+this.value);this.previousElementSibling.querySelector('output').textContent=fv(+this.value)" onchange="commit()">`;
function pSub(){const S=P.sub,cs=texts.map((x,i)=>[x,i]).filter(a=>a[0].sub).sort((a,b)=>a[0].start-b[0].start);
 let h=`<button class="p" style="width:100%" onclick="autoSub()">🎙 Legenda automática (voz)</button><div class="two" style="margin-top:6px"><button onclick="$('sf').click()">📄 Importar .srt</button><button onclick="pasteSub()">📝 Colar texto</button><button onclick="addCue()">＋ Fala no cursor</button><button onclick="srt()">⬇ Exportar .srt</button></div><input type="file" id="sf" accept=".srt" hidden onchange="impSrt(this)"><div class="hint" style="margin:6px 0">A automática usa o reconhecimento de voz do navegador (Chrome/Edge): o vídeo toca em voz alta e o microfone escuta. Use sem fone, em ambiente silencioso.</div>`;
 h+='<h4>Estilo (todas as falas)</h4>'+SR('Tamanho','size',20,120,1)+SR('Posição vertical','y',.1,.97,.01)+SR('Fundo (opacidade)','bga',0,1,.05)+SR('Contorno','sw',0,16,1)+`<div class="two"><div><label>Cor</label><input type="color" value="${S.color}" oninput="subSt('color',this.value)" onchange="commit()"></div><div><label>Fundo</label><input type="color" value="${S.bg}" oninput="subSt('bg',this.value)" onchange="commit()"></div></div><button style="width:100%;margin-top:6px" class="${S.up?'on':''}" onclick="subSt('up',P.sub.up?0:1);commit();rSide(1)">AA Maiúsculas</button>`;
 h+=`<h4>Falas (${cs.length})</h4>`+(cs.length?'':'<p class="hint">Nenhuma legenda ainda. Use a automática, importe um .srt, cole um texto ou adicione uma fala no cursor.</p>');
 h+=cs.map(([x,i])=>`<div class="cue${t>=x.start&&t<x.start+x.dur?' cur':''}"><div class="r"><button class="ic" onclick="seekCue(${i})" title="Ir para a fala">▶</button><input type="number" step=".1" min="0" value="${x.start.toFixed(2)}" onchange="cueEd(${i},'start',+this.value)" title="Início (s)"><input type="number" step=".1" min="0" value="${(x.start+x.dur).toFixed(2)}" onchange="cueEd(${i},'end',+this.value)" title="Fim (s)"><span style="flex:1"></span><button class="ic" onclick="cueDel(${i})">✕</button></div><textarea oninput="cueTx(${i},this.value)" onchange="commit()">${esc(x.text)}</textarea></div>`).join('');
 return h}
function pFx(){const ok=sel&&sel.k=='c'&&!isA(sel.o);
 let h=`<h4>Filtros ${ok?'':'<span class="hint">(selecione um clipe)</span>'}</h4><div class="mg">`+Object.keys(PR).map(n=>`<div class="fx" onclick="applyFx('${n}')"><i style="filter:${fs(Object.fromEntries(FK.map((k,j)=>[k,PR[n][j]])))}"></i><span>${n}</span></div>`).join('')+'</div>';
 h+='<h4>Transição com o clipe anterior</h4><div class="two">'+[['none','Nenhuma'],['fade','Dissolver'],['slide','Deslizar'],['zoom','Zoom'],['wipe','Cortina']].map(([v,n])=>`<button onclick="applyTr('${v}')">${n}</button>`).join('')+'</div>';
 h+='<h4>Animação de entrada</h4><div class="two">'+OP.map(([v,n])=>`<button onclick="setAnim('ai','${v}')">${n}</button>`).join('')+'</div><h4>Animação de saída</h4><div class="two">'+OP.map(([v,n])=>`<button onclick="setAnim('ao','${v}')">${n}</button>`).join('')+'</div>';return h}
function applyFx(n){if(!sel||sel.k!='c'||isA(sel.o)){toast('Selecione um clipe de vídeo, imagem ou GIF');return}preset(n)}
function applyTr(k){if(!sel||sel.k!='c'||isA(sel.o)){toast('Selecione um clipe');return}trans(k)}
function setAnim(k,v){if(!sel||(sel.k=='c'&&isA(sel.o))){toast('Selecione um clipe ou texto');return}sel.o[k]=v;commit();rIn()}
/* ---------- legendas ---------- */
const SB=(s,a,d)=>Object.assign(TD(a),P.sub,{text:s,dur:d,sub:1,ai:'fade',ao:'none'});
function subSt(k,v){P.sub[k]=v;texts.forEach(x=>{if(x.sub&&!(k=='y'&&x.kf&&x.kf.length))x[k]=v})}
function seekCue(i){const x=texts[i];sel={k:'t',o:x};itab='texto';t=x.start+.01;playing=false;rIn();rTL()}
function cueEd(i,f,v){const x=texts[i];if(f=='start'){const e=x.start+x.dur;x.start=Math.max(0,v);x.dur=Math.max(.2,e-x.start)}else x.dur=Math.max(.2,v-x.start);commit();rTL();rSide(1)}
function cueTx(i,v){texts[i].text=v}
function cueDel(i){if(sel&&sel.o===texts[i])sel=null;texts.splice(i,1);commit();rSide(1);rTL();rIn()}
function addCue(){const x=SB('Nova fala',t,2.5);texts.push(x);sel={k:'t',o:x};itab='texto';commit();rSide(1);rTL();rIn()}
function askText(msg){return new Promise(r=>{const m=$('md');m.innerHTML=`<div class="box"><p>${msg}</p><textarea id="mi" rows="6"></textarea><div style="text-align:right;margin-top:8px"><button id="mc">Cancelar</button> <button class="p" id="mo">OK</button></div></div>`;m.style.display='flex';$('mi').focus();$('mc').onclick=()=>{m.style.display='none';r(null)};$('mo').onclick=()=>{const v=$('mi').value;m.style.display='none';r(v)}})}
async function pasteSub(){const s=await askText('Cole o texto da fala. Cada frase (terminada em . ! ?) vira uma legenda, distribuída ao longo do clipe selecionado ou da timeline.');if(!s||!s.trim())return;
 const p=s.trim().split(/(?<=[.!?])\s+|\n+/).filter(Boolean),c=sel&&sel.k=='c'?sel.o:null,a=c?c.st:0,L=c?len(c):(total()||p.length*2.5),d=L/p.length;
 p.forEach((x,i)=>texts.push(SB(x,a+i*d,d)));commit();rSide(1);rTL();toast(p.length+' legendas criadas')}
async function impSrt(i){const f=i.files[0];if(!f)return;const tx=(await f.text()).replace(/\r/g,''),tm=s=>{const[a,b]=s.trim().split(/[,.]/),[h,m,x]=a.split(':').map(Number);return h*3600+m*60+x+(+b||0)/1000};let n=0;
 tx.split(/\n\n+/).forEach(b=>{const l=b.trim().split('\n'),k=l.findIndex(x=>x.includes('-->'));if(k<0)return;const[a,z]=l[k].split('-->');texts.push(SB(l.slice(k+1).join('\n'),tm(a),Math.max(.2,tm(z)-tm(a))));n++});i.value='';commit();rSide(1);rTL();toast(n+' legendas importadas')}
function srt(){const f=s=>`${z2(Math.floor(s/3600))}:${z2(Math.floor(s/60)%60)}:${z2(Math.floor(s%60))},${String(Math.min(999,Math.round(s%1*1000))).padStart(3,'0')}`;
 const L=texts.filter(x=>x.sub).sort((a,b)=>a.start-b.start).map((x,i)=>`${i+1}\n${f(x.start)} --> ${f(x.start+x.dur)}\n${x.text}\n`).join('\n');if(!L){toast('Não há legendas para exportar');return}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L],{type:'text/plain'}));a.download=P.name+'.srt';a.click()}
function stopSub(){if(subStop){subStop();subStop=null;commit();rSide(1);rTL()}}
function autoSub(){const SR2=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR2){toast('Este navegador não tem reconhecimento de voz. Use Chrome/Edge ou importe um .srt');return}
 if(!clips.length){toast('Adicione um vídeo ou áudio primeiro');return}
 const r=new SR2();r.lang='pt-BR';r.continuous=true;r.interimResults=false;let s0=0;initAudio();t=0;playing=true;$('pp').textContent='⏸';subStop=()=>{r.onend=null;try{r.stop()}catch(x){}};
 r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal){texts.push(SB(e.results[i][0].transcript.trim(),s0,Math.max(1.5,t-s0)));s0=t;rTL()}};
 r.onerror=e=>toast('Microfone indisponível ('+e.error+'). Importe um .srt ou cole o texto');
 r.onend=()=>{if(playing){try{r.start()}catch(x){}}};try{r.start();toast('Ouvindo… a legenda é criada enquanto o vídeo toca')}catch(x){}}
/* ---------- inspetor ---------- */
const fv=v=>Math.abs(v)>=100?Math.round(v):+(+v).toFixed(2),hasKfAt=o=>o.kf&&o.kf.some(k=>Math.abs(k.u-(t-st0(o)))<.05);
const R=(l,p,mn,mx,st)=>{const o=sel.o,v=p.includes('.')?p.split('.').reduce((a,k)=>a[k],o):gv(o,p),an=kp(o).includes(p);
 return `<label>${l}<span>${an?`<button class="kb${hasKfAt(o)?' at':''}${o.kf&&o.kf.length?' on':''}" onclick="addKfBtn()" title="Keyframe no cursor">◆</button>`:''}<output>${fv(v)}</output></span></label><input type="range" data-p="${p}" min="${mn}" max="${mx}" step="${st}" value="${v}" oninput="upd('${p}',+this.value);this.previousElementSibling.querySelector('output').textContent=fv(+this.value)" onchange="commit();this.blur()">`};
const S=(l,p,ops)=>`<label>${l}<span></span></label><select onchange="upd('${p}',this.value);commit();this.blur()">${ops.map(([v,n])=>`<option value="${v}"${sel.o[p]==v?' selected':''}>${n}</option>`).join('')}</select>`;
const CL=(l,p)=>`<div><label>${l}<span></span></label><input type="color" value="${sel.o[p]}" oninput="upd('${p}',this.value)" onchange="commit()"></div>`;
function pProj(){const T=total();return `<h4>Projeto</h4><div class="hint">Duração: <b style="color:var(--ac)">${tc(T)}</b><br>Clipes: ${clips.length} · Textos: ${texts.filter(x=>!x.sub).length} · Legendas: ${texts.filter(x=>x.sub).length}<br>Resolução: ${W}×${H}</div><h4>Como usar</h4><div class="hint">• Clique em um item da timeline para editar.<br>• Arraste as bordas para cortar e o corpo para mover (também entre trilhas).<br>• <b>◆ Keyframes</b> funcionam em clipes, GIFs, textos e legendas.<br>• Aba <b>Legendas</b>: voz, .srt ou texto colado.<br>• Pressione <b>?</b> para ver os atalhos.</div>`}
function iMover(o){const tx=isTx(o);
 return `<h4>${tx?'Posição e tamanho':'Transformar'}</h4>`+(tx?R('Tamanho','size',8,500,1)+R('Posição X','x',0,1,.005)+R('Posição Y','y',0,1,.005):R('Escala','sc',.05,8,.01)+R('Posição X','x',-1,1,.005)+R('Posição Y','y',-1,1,.005))+R('Rotação','rot',-180,180,1)+R('Opacidade','op',0,1,.01)
  +(tx?'':'<h4>Mistura</h4>'+S('Modo de mistura','bm',BM)+'<button style="width:100%;margin-top:8px" onclick="upd(\'x\',0);upd(\'y\',0);upd(\'sc\',1);upd(\'rot\',0);commit();rIn()">Redefinir transformação</button>')}
function iTexto(o){const fo=FONTS.map(([v,n])=>`<option value="${v}"${o.font==v?' selected':''}>${n}</option>`).join('');
 return `<h4>Conteúdo</h4><textarea rows="3" oninput="upd('text',this.value)" onchange="commit();rSide()">${esc(o.text)}</textarea>`
  +`<h4>Fonte</h4><select onchange="upd('font',this.value);commit()">${fo}</select><div class="two" style="margin-top:6px"><button class="${o.wt>=700?'on':''}" onclick="upd('wt',sel.o.wt>=700?400:700);commit();rIn()"><b>B</b> Negrito</button><button class="${o.it?'on':''}" onclick="upd('it',sel.o.it?0:1);commit();rIn()"><i>I</i> Itálico</button></div><button style="width:100%;margin-top:6px" class="${o.up?'on':''}" onclick="upd('up',sel.o.up?0:1);commit();rIn()">AA Maiúsculas</button>`
  +`<h4>Cores</h4><div class="two">${CL('Texto','color')}${CL('Contorno','sk')}</div>`+R('Espessura do contorno','sw',0,24,1)+R('Brilho (glow)','sh',0,60,1)
  +`<h4>Caixa de fundo</h4><div class="two">${CL('Cor','bg')}<span></span></div>`+R('Opacidade da caixa','bga',0,1,.05)
  +`<h4>Tempo</h4>`+R('Início (s)','start',0,Math.max(60,total()+10),.05)+R('Duração (s)','dur',.3,60,.05)}
function iTempo(o){const au=isA(o);return `<h4>Tempo</h4>`+R('Início na timeline (s)','st',0,Math.max(60,total()+10),.05)+R('Início do corte (s)','in',0,Math.min(o.dur,o.type=='gif'?60:o.dur),.05)+R('Fim do corte (s)','out',.1,o.dur,.05)+R('Velocidade','speed',.25,4,.05)+((o.type=='video'||au)?'<h4>Áudio</h4>'+R('Volume','vol',0,1,.05):'')+(o.type=='video'?'<button style="width:100%;margin-top:10px" onclick="detach()">🎵 Separar áudio</button>':'')}
function iCor(o){return '<h4>Predefinições</h4><select onchange="preset(this.value);this.blur()"><option>—</option>'+Object.keys(PR).map(n=>`<option>${n}</option>`).join('')+'</select><h4>Ajustes</h4>'+R('Brilho','f.b',0,200,1)+R('Contraste','f.c',0,200,1)+R('Saturação','f.s',0,300,1)+R('Matiz','f.h',0,360,1)+R('Desfoque','f.bl',0,20,.5)+R('Preto e branco','f.g',0,100,1)+R('Sépia','f.se',0,100,1)+'<button style="width:100%;margin-top:10px" onclick="preset(\'Original\')">Redefinir cor</button>'}
function iAnim(o){const tx=isTx(o);return '<h4>Animação</h4>'+S('Entrada','ai',tx?[...OP,['type','Digitar']]:OP)+S('Saída','ao',OP)+(tx?'':'<h4>Transição</h4><select onchange="trans(this.value);this.blur()"><option value="none">—</option><option value="fade">Dissolver</option><option value="slide">Deslizar</option><option value="zoom">Zoom</option><option value="wipe">Cortina</option></select><div class="hint">Sobrepõe o início deste clipe ao fim do anterior na mesma trilha.</div>')}
function iKf(o){const k=o.kf||[];return `<h4>Keyframes</h4><div class="two"><button onclick="jk(-1)">◀ ◆ Anterior</button><button onclick="jk(1)">◆ Próximo ▶</button></div><button class="p" style="width:100%;margin-top:6px" onclick="addKfBtn()">◆ Adicionar / remover no cursor</button><label>Suavização dos novos pontos<span></span></label><select onchange="ke=this.value">${EZ.map(([v,n])=>`<option value="${v}"${ke==v?' selected':''}>${n}</option>`).join('')}</select><h4>Pontos (${k.length})</h4>`
 +k.map((q,j)=>`<div class="kfrow"><a onclick="goKf(${j})">◆ ${q.u.toFixed(2)}s</a><select onchange="setEz(${j},this.value)">${EZ.map(([v,n])=>`<option value="${v}"${(q.e||'smooth')==v?' selected':''}>${n}</option>`).join('')}</select><button class="ic" onclick="delKf(${j})">✕</button></div>`).join('')
 +`<button style="width:100%;margin-top:6px" onclick="clrKf()">Limpar todos</button><div class="hint" style="margin-top:8px">Cada ponto guarda posição, ${isTx(o)?'tamanho':'escala'}, rotação e opacidade. Com keyframes, mexer nos controles ou arrastar no preview grava um ponto no cursor. Arraste os losangos da timeline para mudar o tempo; clique duplo remove.</div>`}
function rIn(){const tb=$('itabs'),pane=$('ipane');if(!P)return;const sc=pane.scrollTop;
 if(!sel){tb.innerHTML='<button class="on">Projeto</button>';pane.innerHTML=pProj();return}
 const o=sel.o,au=sel.k=='c'&&isA(o),TB=sel.k=='t'?[['texto','Texto'],['mover','Mover'],['anim','Animar'],['kf','◆ KF']]:au?[['tempo','Tempo']]:[['mover','Mover'],['tempo','Tempo'],['cor','Cor'],['anim','Animar'],['kf','◆ KF']];
 if(!TB.some(a=>a[0]==itab))itab=TB[0][0];
 tb.innerHTML=TB.map(([v,n])=>`<button class="${v==itab?'on':''}" onclick="itab='${v}';rIn()">${n}</button>`).join('');
 pane.innerHTML=({texto:iTexto,mover:iMover,tempo:iTempo,cor:iCor,anim:iAnim,kf:iKf}[itab])(o);pane.scrollTop=sc;$('info').textContent=(sel.k=='t'?(o.sub?'Legenda selecionada':'Texto selecionado'):isA(o)?'Áudio selecionado':'Clipe selecionado')}
function syncIn(){if(!sel)return;const o=sel.o,u=t-st0(o);
 document.querySelectorAll('#ipane input[data-p]').forEach(i=>{const p=i.dataset.p;if(kp(o).includes(p)&&document.activeElement!==i){const v=kfAt(o,u)[p];i.value=v;const out=i.previousElementSibling.querySelector('output');if(out)out.textContent=fv(v)}});
 document.querySelectorAll('#ipane .kb').forEach(b=>b.classList.toggle('at',hasKfAt(o)));
 document.querySelectorAll('.kd').forEach(e=>e.classList.toggle('on',Math.abs(t-+e.dataset.t)<.05))}
/* ---------- timeline ---------- */
let tBase=0,sBase=0,laneOf=new Map();
function layout(){lay=[];let y=RUL;ROWS.forEach(tr=>{lay.push({k:'v',tr,name:RN[tr],y,h:RH});y+=RH});laneOf=new Map();
 const lanes=arr=>{const L=[];[...arr].sort((a,b)=>a.start-b.start).forEach(x=>{let i=L.findIndex(e=>e<=x.start+.001);if(i<0){i=L.length;L.push(0)}L[i]=x.start+x.dur;laneOf.set(x,i)});return L.length};
 const tn=lanes(texts.filter(x=>!x.sub)),sn=lanes(texts.filter(x=>x.sub));
 tBase=y;for(let i=0;i<Math.max(1,tn);i++){lay.push({k:'t',name:i?'':'TXT',y,h:TH});y+=TH}
 sBase=y;for(let i=0;i<Math.max(1,sn);i++){lay.push({k:'s',name:i?'':'CC',y,h:TH});y+=TH}
 lay.push({k:'f',name:'◆ KF',y,h:30});return y+30}
const rowY=tr=>lay.find(r=>r.k=='v'&&r.tr==tr).y,trAt=y=>{const r=lay.find(r=>r.k=='v'&&y>=r.y&&y<r.y+r.h);return r?r.tr:null};
function togT(tr,k){P.tr[tr]=P.tr[tr]||{};P.tr[tr][k]=!P.tr[tr][k];commit();rTL()}
function rTL(){if(!P)return;const T=total(),w=Math.max(T+8,20)*zoom+200,TOT=layout();
 let h=`<div class="rl" style="width:${w}px">`;const stp=zoom<30?5:zoom<60?2:1;for(let s=0;s*zoom<w;s+=stp)h+=`<i style="left:${s*zoom}px">${fmt(s)}</i>`;h+='</div>';
 lay.forEach((r,i)=>h+=`<div class="row${i%2?' alt':''}" style="top:${r.y}px;height:${r.h}px;width:${w}px"></div>`);
 for(const c of clips){const m=media[c.mid]||{},wd=len(c)*zoom,n=Math.max(1,Math.ceil(wd/64)),th=!isA(c)&&m.th,lk=(P.tr[c.tr]||{}).l;let im='';
  if(th)for(let k=0;k<n;k++){const ts=c.in+(k+.5)*(c.out-c.in)/n,md=m.type=='gif'?1e9:m.dur;im+=`<img draggable="false" src="${th[Math.min(th.length-1,Math.floor(ts/md*th.length))]}" style="width:${wd/n}px">`}
  h+=`<div class="cl${isA(c)?' au':''}${c.type=='gif'?' gi':''}${sel&&sel.o===c?' sel':''}${lk?' lk':''}" data-i="c${c.id}" style="left:${c.st*zoom}px;top:${rowY(c.tr)+3}px;width:${wd}px">${im}<span>${esc(c.name)}${c.speed!=1?' · '+c.speed+'x':''}</span>${(c.kf||[]).map(k=>`<b class="kf" style="left:${k.u*zoom}px">◆</b>`).join('')}<u data-h="l"></u><u data-h="r"></u></div>`}
 texts.forEach((x,i)=>{const L=laneOf.get(x)||0,b=x.sub?sBase:tBase;h+=`<div class="tx${x.sub?' sb':''}${sel&&sel.o===x?' sel':''}" data-i="t${i}" style="left:${x.start*zoom}px;top:${b+L*TH+2}px;width:${x.dur*zoom}px"><span>${x.sub?'💬':'T'} ${esc(x.text.replace(/\n/g,' '))}</span>${(x.kf||[]).map(k=>`<b class="kf" style="left:${k.u*zoom}px">◆</b>`).join('')}<u data-h="l"></u><u data-h="r"></u></div>`});
 const fr=lay[lay.length-1];h+=`<div class="kl" style="top:${fr.y}px;width:${w}px">`;
 if(sel&&sel.o.kf&&sel.o.kf.length){const s=st0(sel.o);h+=`<div class="bar" style="left:${s*zoom}px;width:${ln(sel.o)*zoom}px"></div>`+sel.o.kf.map((k,j)=>`<b class="kd${Math.abs(t-(s+k.u))<.05?' on':''}" data-k="${j}" data-t="${s+k.u}" style="left:${(s+k.u)*zoom}px"></b>`).join('')}
 else h+='<span class="hint" style="position:absolute;left:8px;top:7px;font-size:11px">Selecione um item e adicione keyframes (◆ ou tecla K)</span>';h+='</div>';
 $('heads').innerHTML=lay.map(r=>{if(r.k=='v'){const s=P.tr[r.tr]||{},A=r.tr>=3,k=A?'m':'h';return `<div class="hd" style="height:${r.h}px"><b>${r.name}</b><div><button class="${s[k]?'on':''}" onclick="togT(${r.tr},'${k}')" title="${A?'Silenciar':'Ocultar'}">${A?'🔇':'👁'}</button><button class="${s.l?'on':''}" onclick="togT(${r.tr},'l')" title="Travar">🔒</button></div></div>`}return `<div class="hd" style="height:${r.h}px"><b>${r.name}</b></div>`}).join('');
 $('tl').style.cssText=`width:${w}px;height:${TOT}px`;$('tl').innerHTML=h+'<div id="ph"></div>'}
const sn=(v,o)=>{if(!snap)return v;const L=len(o),th=8/zoom;for(const x of [0,t,...clips.filter(c=>c!==o).flatMap(c=>[c.st,c.st+len(c)])]){if(Math.abs(v-x)<th)return x;if(Math.abs(v+L-x)<th)return x-L}return v};
$('tlw').onscroll=()=>{$('heads').scrollTop=$('tlw').scrollTop};
$('tlw').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom=Math.max(15,Math.min(220,zoom*(e.deltaY<0?1.12:.89)));document.querySelector('#tlbar input[type=range]').value=zoom;rTL()}},{passive:false});
$('tl').onpointerdown=e=>{const r=$('tl').getBoundingClientRect(),d=e.target.closest('[data-i]'),kd=e.target.closest('[data-k]');playing=false;$('pp').textContent='▶';t=clamp((e.clientX-r.left)/zoom);
 if(kd&&sel){const ko=sel.o.kf[+kd.dataset.k];t=clamp(st0(sel.o)+ko.u);drag={m:'k',ko,x0:e.clientX,u0:ko.u,r,mv:0};rTL();rIn();return}
 if(!d){if(!e.target.closest('.rl')&&!e.target.closest('.kl')){sel=null;rSide()}drag={m:'s',r};rTL();rIn();return}
 const i=d.dataset.i,o=i[0]=='c'?clips.find(c=>c.id==i.slice(1)):texts[+i.slice(1)];
 if(i[0]=='c'&&(P.tr[o.tr]||{}).l){toast('Trilha travada 🔒');return}
 sel={k:i[0],o};if(i[0]=='t')itab=itab=='tempo'||itab=='cor'?'texto':itab;if(i[0]=='c'&&itab=='texto')itab='mover';
 drag={m:e.target.dataset.h||'b',o,k:i[0],x0:e.clientX,i0:o.in,o0:o.out,s0:o.start,d0:o.dur,t0:o.st,r,mv:0};rTL();rIn();if(stab=='fx')rSide(1)};
document.addEventListener('pointermove',e=>{if(!drag)return;const o=drag.o,dx=(e.clientX-drag.x0)/zoom;
 if(drag.m=='s'){t=clamp((e.clientX-drag.r.left)/zoom);return}
 if(!drag.mv&&Math.abs(e.clientX-drag.x0)<4)return;drag.mv=1;
 if(drag.m=='k'){drag.ko.u=Math.max(0,Math.min(ln(sel.o),drag.u0+dx));sel.o.kf.sort((a,b)=>a.u-b.u);t=clamp(st0(sel.o)+drag.ko.u);rTL();return}
 if(drag.k=='c'){if(drag.m=='r')o.out=Math.max(o.in+.1,Math.min(o.dur,drag.o0+dx*o.speed));
  else if(drag.m=='l'){const ni=Math.max(0,Math.min(o.out-.1,drag.i0+dx*o.speed));o.st=Math.max(0,drag.t0+(ni-drag.i0)/o.speed);o.in=ni}
  else{o.st=Math.max(0,sn(drag.t0+dx,o));const tr=trAt(e.clientY-drag.r.top);if(tr!=null&&(tr>=3)==isA(o))o.tr=tr}}
 else{if(drag.m=='r')o.dur=Math.max(.3,drag.d0+dx);else if(drag.m=='l'){const ns=Math.max(0,Math.min(drag.s0+drag.d0-.3,drag.s0+dx));o.dur=drag.d0-(ns-drag.s0);o.start=ns}else o.start=Math.max(0,drag.s0+dx)}
 rTL()});
document.addEventListener('pointerup',()=>{if(!drag)return;const mv=drag.mv;
 if(drag.m=='k'&&mv){const k=sel.o.kf;for(let i=k.length-1;i>=0;i--)if(k[i]!==drag.ko&&Math.abs(k[i].u-drag.ko.u)<.05)k.splice(i,1)}
 drag=null;t=clamp(t);rTL();rIn();if(mv){commit();if(stab=='sub')rSide(1)}});
$('tl').ondblclick=e=>{const kd=e.target.closest('[data-k]');if(kd&&sel){delKf(+kd.dataset.k)}};
const BB=new Map();let rz=null,wt;
const active=o=>{const u=t-st0(o);return u>=0&&u<ln(o)&&(isTx(o)||(!isA(o)&&!(P.tr[o.tr]||{}).h))};
const toC=e=>{const b=cv.getBoundingClientRect();return[(e.clientX-b.left)*W/b.width,(e.clientY-b.top)*H/b.height]};
const inBox=(o,p)=>{const b=BB.get(o);if(!b)return false;const dx=p[0]-b.cx,dy=p[1]-b.cy,c=Math.cos(b.r),s=Math.sin(b.r);return Math.abs(dx*c+dy*s)<=b.w/2&&Math.abs(-dx*s+dy*c)<=b.h/2};
function pick(p){for(let i=texts.length-1;i>=0;i--)if(active(texts[i])&&inBox(texts[i],p))return texts[i];return clips.filter(c=>active(c)).sort((a,b)=>b.tr-a.tr||b.st-a.st).find(c=>inBox(c,p))||null}
function placeBx(){const bx=$('bx'),b=sel&&!exporting&&active(sel.o)&&BB.get(sel.o);if(!b||!cv.offsetWidth){bx.style.display='none';return}const k=cv.offsetWidth/W;
 Object.assign(bx.style,{display:'block',left:cv.offsetLeft+(b.cx-b.w/2)*k+'px',top:cv.offsetTop+(b.cy-b.h/2)*k+'px',width:b.w*k+'px',height:b.h*k+'px',transform:`rotate(${b.r}rad)`})}
function setSize(f){const T=sel.k=='t';if(T){const s=gv(sel.o,'size');let n=Math.round(s*f);if(n==Math.round(s))n+=f>1?1:-1;upd('size',Math.max(8,Math.min(500,n)))}else upd('sc',Math.max(.05,Math.min(8,gv(sel.o,'sc')*f)))}
document.querySelectorAll('#bx i').forEach(h=>{
 h.onpointerdown=e=>{e.stopPropagation();e.preventDefault();if(!sel)return;const r=$('bx').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,T=sel.k=='t';
  rz={cx,cy,d0:Math.hypot(e.clientX-cx,e.clientY-cy)||1,s0:gv(sel.o,T?'size':'sc'),T,mv:0};h.setPointerCapture(e.pointerId)};
 h.onpointermove=e=>{if(!rz)return;rz.mv=1;const r=Math.hypot(e.clientX-rz.cx,e.clientY-rz.cy)/rz.d0;
  if(rz.T)upd('size',Math.max(8,Math.min(500,Math.round(rz.s0*r))));else upd('sc',Math.max(.05,Math.min(8,rz.s0*r)));syncIn()};
 h.onpointerup=()=>{if(rz){const m=rz.mv;rz=null;if(m){rIn();commit()}}}});
cv.onpointerdown=e=>{const p=toC(e);
 if(!(sel&&active(sel.o)&&inBox(sel.o,p))){const o=pick(p);if(o){sel={k:isTx(o)?'t':'c',o};if(isTx(o))itab=itab=='tempo'||itab=='cor'?'texto':itab;else if(itab=='texto')itab='mover'}else sel=null;rTL();rIn()}
 if(!sel)return;const b=cv.getBoundingClientRect(),c=kfAt(sel.o,t-st0(sel.o));cd={x:e.clientX,y:e.clientY,ox:c.x,oy:c.y,w:b.width,h:b.height,mv:0};cv.setPointerCapture(e.pointerId)};
cv.onpointermove=e=>{if(!cd){cv.style.cursor=sel&&active(sel.o)&&inBox(sel.o,toC(e))?'move':'default';return}cd.mv=1;upd('x',cd.ox+(e.clientX-cd.x)/cd.w);upd('y',cd.oy+(e.clientY-cd.y)/cd.h);syncIn()};
cv.onpointerup=()=>{if(cd){const m=cd.mv;cd=null;if(m){rIn();commit()}}};
cv.onwheel=e=>{if(!sel||!active(sel.o))return;e.preventDefault();setSize(e.deltaY<0?1.06:1/1.06);syncIn();clearTimeout(wt);wt=setTimeout(()=>{rIn();commit()},400)};
function help(){const m=$('md');m.innerHTML=`<div class="box"><b>⌨ Atalhos</b><p class="hint" style="line-height:1.8"><b>Espaço</b> play/pausa · <b>S</b> dividir<br><b>←/→</b> ±1 frame · <b>Home</b> início · <b>End</b> fim<br><b>K</b> keyframe no cursor · <b>[ / ]</b> keyframe anterior/próximo<br><b>Delete</b> apagar · <b>Ctrl+D</b> duplicar<br><b>Ctrl+Z / Ctrl+Y</b> desfazer/refazer<br><b>Ctrl + roda</b> zoom da timeline · <b>Duplo clique</b> em ◆ remove</p><div style="text-align:right"><button class="p" onclick="$('md').style.display='none'">Fechar</button></div></div>`;m.style.display='flex'}
addEventListener('keydown',e=>{if(!inEd||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||$('md').style.display=='flex'||$('ie').style.display=='flex')return;const k=e.key.toLowerCase(),c=e.ctrlKey||e.metaKey;
 if(c&&k=='z'){e.preventDefault();undo(e.shiftKey?1:-1)}else if(c&&k=='y')undo(1);else if(c&&k=='d'){e.preventDefault();dup()}else if(e.code=='Space'){e.preventDefault();toggle()}else if(k=='s'&&!c)split();else if(k=='k')addKfBtn();else if(k=='[')jk(-1);else if(k==']')jk(1);
 else if(k=='delete'||k=='backspace')del();else if(k=='arrowleft')step(-1);else if(k=='arrowright')step(1);else if(k=='home')t=0;else if(k=='end')t=total();else if(k=='?')help()});
/* ---------- reprodução ---------- */
function initAudio(){if(AC){AC.resume();return}AC=new AudioContext();mdest=AC.createMediaStreamDestination();Object.values(els).forEach(att)}
function att(e){if(e.g||!AC)return;const s=AC.createMediaElementSource(e);e.g=AC.createGain();s.connect(e.g);e.g.connect(AC.destination);e.g.connect(mdest)}
function el(c){let e=els[c.id];if(!e){e=els[c.id]=document.createElement('video');e.playsInline=true;e.preload='auto';e.src=media[c.mid].url;att(e)}return e}
function toggle(){if(!clips.length&&!texts.length)return;initAudio();if(!playing&&t>=total()-.01)t=0;playing=!playing;$('pp').textContent=playing?'⏸':'▶';if(!playing)stopSub()}
function syncMedia(){for(const c of clips){if((c.type!='video'&&c.type!='audio')||!media[c.mid])continue;const e=el(c),on=t>=c.st&&t<c.st+len(c),s=P.tr[c.tr]||{};
  if(on){const l=c.in+(t-c.st)*c.speed;e.playbackRate=c.speed;e.muted=!!s.m;if(e.g)e.g.gain.value=c.vol;else e.volume=Math.min(1,c.vol);if(Math.abs(e.currentTime-l)>(playing?.35:.03))e.currentTime=l;if(playing&&e.paused)e.play().catch(()=>{});if(!playing&&!e.paused)e.pause()}
  else{if(!e.paused)e.pause();if(t<c.st&&c.st-t<.6&&Math.abs(e.currentTime-c.in)>.1)e.currentTime=c.in}}}
const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
function drawText(x,u){const v=kfAt(x,u),AD=Math.min(.5,x.dur/3);let A=[1,1,0,0,1],B=A,s=x.up?x.text.toUpperCase():x.text;
 if(u<AD)A=AN(x.ai,u/AD);if(x.dur-u<AD)B=AN(x.ao,(x.dur-u)/AD);
 if(x.ai=='type')s=s.slice(0,Math.ceil(s.length*Math.min(1,u/Math.min(1.5,x.dur/2))));
 const z=Math.max(4,v.size||x.size)*W/1280,lines=s.split('\n'),lh=z*1.2;
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(v.op??1)*A[0]*B[0]));ctx.translate((v.x+A[2]+B[2])*W,(v.y+A[3]+B[3])*H);ctx.rotate((v.rot||0)*Math.PI/180);const k=A[1]*B[1];ctx.scale(k,k);
 ctx.font=`${x.it?'italic ':''}${x.wt||700} ${z}px ${x.font||'sans-serif'}`;ctx.textAlign='center';ctx.lineJoin='round';
 const w=Math.max(...lines.map(l=>ctx.measureText(l).width)),y0=-(lines.length-1)*lh;{const rr=(v.rot||0)*Math.PI/180,cl=(y0-.6*z)/2;BB.set(x,{cx:(v.x+A[2]+B[2])*W-Math.sin(rr)*cl*k,cy:(v.y+A[3]+B[3])*H+Math.cos(rr)*cl*k,w:(w+z*.8)*k,h:((lines.length-1)*lh+1.3*z)*k,r:rr})}
 if(x.bg&&x.bga>0){ctx.fillStyle=hexA(x.bg,x.bga);ctx.fillRect(-w/2-z*.4,y0-z*.95,w+z*.8,(lines.length-1)*lh+z*1.3)}
 lines.forEach((l,i)=>{const y=y0+i*lh;if(x.sw>0){ctx.lineWidth=x.sw*W/1280;ctx.strokeStyle=x.sk;ctx.strokeText(l,0,y)}ctx.shadowColor=x.sh>0?x.color:'transparent';ctx.shadowBlur=(x.sh||0)*W/1280;ctx.fillStyle=x.color;ctx.fillText(l,0,y)});ctx.restore()}
function render(){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 for(const c of clips.filter(c=>!isA(c)&&t>=c.st&&t<c.st+len(c)&&!(P.tr[c.tr]||{}).h).sort((a,b)=>a.tr-b.tr||a.st-b.st)){const m=media[c.mid];if(!m)continue;let s,sw,sh;
  if(c.type=='video'){s=els[c.id];if(!s||s.readyState<2)continue;sw=s.videoWidth;sh=s.videoHeight}
  else if(c.type=='gif'&&m.gf&&m.gd){s=gframe(m,c.in+(t-c.st)*c.speed);sw=s.width;sh=s.height}
  else{s=m.im;sw=s&&s.naturalWidth;sh=s&&s.naturalHeight}
  if(!sw)continue;const d=len(c),u=t-c.st,v=kfAt(c,u),ad=c.ad||Math.min(.6,d/3),bd=Math.min(.6,d/3);let A=[1,1,0,0,1],B=A;if(u<ad)A=AN(c.ai,u/ad);if(d-u<bd)B=AN(c.ao,(d-u)/bd);
  const k=Math.min(W/sw,H/sh)*v.sc*A[1]*B[1],rv=Math.min(A[4],B[4]);BB.set(c,{cx:W/2+(v.x+A[2]+B[2])*W,cy:H/2+(v.y+A[3]+B[3])*H,w:sw*k,h:sh*k,r:v.rot*Math.PI/180});ctx.save();if(rv<1){ctx.beginPath();ctx.rect(0,0,W*rv,H);ctx.clip()}ctx.globalAlpha=Math.max(0,Math.min(1,v.op*A[0]*B[0]));ctx.globalCompositeOperation=c.bm||'source-over';
  ctx.translate(W/2+(v.x+A[2]+B[2])*W,H/2+(v.y+A[3]+B[3])*H);ctx.rotate(v.rot*Math.PI/180);ctx.filter=fs(c.f);ctx.drawImage(s,-sw*k/2,-sh*k/2,sw*k,sh*k);ctx.restore()}
 for(const x of texts)if(t>=x.start&&t<x.start+x.dur)drawText(x,t-x.start)}
let lastT=-1;
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(inEd&&P){const T=total();
  if(playing){t+=dt;if(t>=T){if(loop&&!exporting){t=0}else{t=T;playing=false;$('pp').textContent='▶';stopSub();if(exporting)setTimeout(()=>rec.stop(),300)}}}
  syncMedia();render();placeBx();
  $('tm').innerHTML='<b>'+tc(t)+'</b> / '+tc(T);const ph=$('ph'),sw=$('tlw'),L=t*zoom;if(ph)ph.style.left=L+'px';
  if(playing&&(L>sw.scrollLeft+sw.clientWidth-40||L<sw.scrollLeft))sw.scrollLeft=Math.max(0,L-40);
  if(sel&&sel.o.kf&&sel.o.kf.length&&(playing||t!=lastT))syncIn();lastT=t}
 requestAnimationFrame(frame)}
function exp(){if((!clips.length&&!texts.length)||exporting)return;initAudio();playing=false;t=0;chunks=[];
 const st=new MediaStream([...cv.captureStream(30).getVideoTracks(),...mdest.stream.getAudioTracks()]);let mt='video/webm;codecs=vp9,opus';if(!window.MediaRecorder||!MediaRecorder.isTypeSupported(mt))mt='video/webm';
 try{rec=new MediaRecorder(st,{mimeType:mt,videoBitsPerSecond:8e6})}catch(e){toast('Seu navegador não suporta exportação. Use Chrome ou Edge');return}
 rec.ondataavailable=e=>chunks.push(e.data);
 rec.onstop=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));a.download=P.name+'.webm';a.click();exporting=false;$('ex').textContent='⬇ Exportar';toast('Vídeo exportado')};
 rec.start();exporting=true;$('ex').textContent='Exportando…';setTimeout(()=>{playing=true;$('pp').textContent='⏸'},400)}
/* ---------- editor de imagem ---------- */
const IE={base:null,adj:{},curve:null,tool:'sel',tab:'a',hist:[],hi:-1,col:'#ff3b30',size:24,op:100,shape:'rect',fill:0,asp:0,crop:null,clip:null,before:0,ch:'m',q:0,hp:null};
const C0=()=>({m:[[0,0],[255,255]],r:[[0,0],[255,255]],g:[[0,0],[255,255]],b:[[0,0],[255,255]]}),CHC={m:'#ddd',r:'#f55',g:'#5d5',b:'#59f'};
const ic=$('ic'),IX=ic.getContext('2d',{willReadFrequently:true}),ieQ=()=>{if(!IE.q)IE.q=requestAnimationFrame(()=>{IE.q=0;ieR()})};
const TL=[['sel','✥','Selecionar'],['crop','✂','Cortar'],['bg','🪄','Remover fundo'],['brush','🖌','Pincel'],['erase','⌫','Borracha'],['text','T','Texto'],['shape','▭','Forma'],['pick','💧','Conta-gotas']];
const ADJ=[['Luz'],['ex','Exposição',-100,100],['ct','Contraste',-100,100],['hl','Realces',-100,100],['sh','Sombras',-100,100],['Cor'],['tp','Temperatura',-100,100],['tn','Tonalidade',-100,100],['sa','Saturação',-100,100],['vb','Vibração',-100,100],['hu','Matiz',-180,180],['Detalhe'],['sp','Nitidez',0,100],['bl','Desfoque',0,20],['Efeitos'],['vg','Vinheta',0,100],['gr','Granulação',0,100],['g','Preto e branco',0,100],['se','Sépia',0,100]];
const PRE={Original:{},'Vívido':{ct:15,sa:35,vb:20},'P&B':{g:100,ct:20},Vintage:{se:40,ct:-10,vg:35,gr:25,tp:20},'Dramático':{ct:45,sh:-20,hl:-15,sa:-15,vg:30},Suave:{ct:-15,hl:-20,bl:1,ex:8},Quente:{tp:45,sa:10},Frio:{tp:-45},Cinema:{tp:-15,tn:-10,ct:25,sa:-10,vg:40},Matte:{sh:40,ct:-15,sa:-10}};
function cl(pts){const P=[...pts].sort((a,b)=>a[0]-b[0]),n=P.length,dx=[],ms=[];for(let i=0;i<n-1;i++){dx[i]=P[i+1][0]-P[i][0]||1e-6;ms[i]=(P[i+1][1]-P[i][1])/dx[i]}
 const c=[ms[0]];for(let i=1;i<n-1;i++)c[i]=ms[i-1]*ms[i]<=0?0:(ms[i-1]+ms[i])/2;c[n-1]=ms[n-2];
 for(let i=0;i<n-1;i++){if(ms[i]==0){c[i]=c[i+1]=0}else{const a=c[i]/ms[i],b=c[i+1]/ms[i],s=a*a+b*b;if(s>9){const k=3/Math.sqrt(s);c[i]=k*a*ms[i];c[i+1]=k*b*ms[i]}}}
 const o=[];for(let v=0;v<256;v++){let i=0;while(i<n-2&&v>P[i+1][0])i++;const h=dx[i],t=(v-P[i][0])/h,t2=t*t,t3=t2*t;o[v]=Math.max(0,Math.min(255,(2*t3-3*t2+1)*P[i][1]+(t3-2*t2+t)*h*c[i]+(-2*t3+3*t2)*P[i+1][1]+(t3-t2)*h*c[i+1]))}return o}
function luts(a){const C=IE.curve,cm=cl(C.m),cr=cl(C.r),cg=cl(C.g),cb=cl(C.b),ex=Math.pow(2,(a.ex||0)/50),ct=1+(a.ct||0)/100,hl=(a.hl||0)/100,sh=(a.sh||0)/100,tp=(a.tp||0)/100,tn=(a.tn||0)/100,o=[[],[],[]];
 for(let v=0;v<256;v++){let x=v/255*ex;x=(x-.5)*ct+.5;const q=Math.min(1,Math.max(0,x));x=Math.min(1,Math.max(0,x+sh*.35*(1-q)*(1-q)+hl*.35*q*q));const m=Math.round(cm[Math.round(x*255)]);
  o[0][v]=cr[m]*(1+tp*.25+tn*.1);o[1][v]=cg[m]*(1-tn*.2);o[2][v]=cb[m]*(1-tp*.25+tn*.1)}return o}
function ieR(){const b=IE.base;if(!b)return;if(ic.width!=b.width||ic.height!=b.height){ic.width=b.width;ic.height=b.height}const a=IE.before?{}:IE.adj,w=ic.width,h=ic.height;
 IX.clearRect(0,0,w,h);IX.filter=`blur(${a.bl||0}px) hue-rotate(${a.hu||0}deg) grayscale(${a.g||0}%) sepia(${a.se||0}%) invert(${a.inv?100:0}%)`;IX.drawImage(IE.bgOn?IE.bgC:b,0,0);IX.filter='none';
 const d=IX.getImageData(0,0,w,h),p=d.data;
 if(!IE.before){const L=luts(a),sa=1+(a.sa||0)/100,vb=(a.vb||0)/100,vg=(a.vg||0)/100,gr=(a.gr||0)*2.2;
  for(let i=0,n=0;i<p.length;i+=4,n++){let r=L[0][p[i]],g=L[1][p[i+1]],bl=L[2][p[i+2]];
   if(sa!=1||vb){const y=.299*r+.587*g+.114*bl;let s=sa;if(vb){const mx=Math.max(r,g,bl),mn=Math.min(r,g,bl);s*=1+vb*(1-(mx?(mx-mn)/mx:0))}r=y+(r-y)*s;g=y+(g-y)*s;bl=y+(bl-y)*s}
   if(vg){const dx=(n%w)/w*2-1,dy=((n/w)|0)/h*2-1,f=1-vg*Math.pow(Math.min(1,Math.max(0,Math.hypot(dx,dy)/1.414-.25)/.75),1.5);r*=f;g*=f;bl*=f}
   if(gr){const z=(Math.random()-.5)*gr;r+=z;g+=z;bl+=z}p[i]=r;p[i+1]=g;p[i+2]=bl}
  if(a.sp){const o=new Uint8ClampedArray(p),s=a.sp/100*.8,w4=w*4;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const k=(y*w+x)*4;for(let c=0;c<3;c++){const j=k+c;p[j]=o[j]*(1+4*s)-s*(o[j-4]+o[j+4]+o[j-w4]+o[j+w4])}}}
  IX.putImageData(d,0,0)}
 IE.hp=p;ieH()}
function ieH(){const h=$('ih'),p=IE.hp;if(!h||!p)return;const x=h.getContext('2d'),B=[new Uint32Array(256),new Uint32Array(256),new Uint32Array(256)];for(let i=0;i<p.length;i+=16){B[0][p[i]]++;B[1][p[i+1]]++;B[2][p[i+2]]++}
 const m=Math.max(...B[0],...B[1],...B[2])||1;x.clearRect(0,0,256,64);x.globalCompositeOperation='lighter';['#f006','#0f06','#00f6'].forEach((c,k)=>{x.fillStyle=c;for(let v=0;v<256;v++){const q=B[k][v]/m*62;x.fillRect(v,64-q,1,q)}});x.globalCompositeOperation='source-over'}
function iePush(keep){if(!keep){IE.bgOn=false;IE.out=null;IE.ov=null}const b=IE.base,l=IE.hist[IE.hi];IE.hist=IE.hist.slice(0,IE.hi+1);IE.hist.push({d:keep&&l?l.d:b.getContext('2d').getImageData(0,0,b.width,b.height),a:{...IE.adj},c:JSON.stringify(IE.curve)});if(IE.hist.length>12)IE.hist.shift();IE.hi=IE.hist.length-1}
function ieUndo(d){const n=IE.hi+d;if(n<0||n>=IE.hist.length)return;IE.hi=n;IE.bgOn=false;IE.out=null;IE.ov=null;const h=IE.hist[n],b=document.createElement('canvas');b.width=h.d.width;b.height=h.d.height;b.getContext('2d').putImageData(h.d,0,0);IE.base=b;IE.adj={...h.a};IE.curve=JSON.parse(h.c);IE.crop=null;ieCropBox();rIe();ieR()}
function ieLoad(s){const w=s.videoWidth||s.naturalWidth||s.width,h=s.videoHeight||s.naturalHeight||s.height,k=Math.min(1,1600/Math.max(w,h)),b=document.createElement('canvas');b.width=Math.round(w*k);b.height=Math.round(h*k);b.getContext('2d').drawImage(s,0,0,b.width,b.height);
 IE.base=b;IE.bgOn=false;IE.bgCols=[];IE.ov=null;IE.out=null;IE.adj={};IE.curve=C0();IE.hist=[];IE.hi=-1;IE.crop=null;ieCropBox();iePush();rIe();ieR()}
function ieStart(){playing=false;$('pp').textContent='▶';let s=null;IE.clip=null;IE.gif=null;
 if(sel&&sel.k=='c'){const c=sel.o,m=media[c.mid];if(m&&c.type=='image'&&m.im&&m.im.naturalWidth){s=m.im;IE.clip=c}else if(m&&c.type=='gif'){s=m.gf?m.gf[0].bm:m.im;if(m.gf)IE.gif={gf:m.gf,gd:m.gd,clip:c,name:c.name}}else if(c.type=='video'){const e=els[c.id];if(e&&e.readyState>=2)s=e}}
 IE.tool='sel';IE.tab='a';$('ie').style.display='flex';
 if(s)ieLoad(s);else{const b=document.createElement('canvas');b.width=1280;b.height=720;const x=b.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,1280,720);ieLoad(b);toast('Documento em branco. Use 📂 Abrir para carregar uma foto')}}
$('ief').onchange=async e=>{const f=e.target.files[0];if(f){IE.clip=null;IE.gif=null;if(/gif/i.test(f.type)||/\.gif$/i.test(f.name)){const g=await decGif(f);if(g&&g.gf.length){ieLoad(g.gf[0].bm);IE.gif={gf:g.gf,gd:g.gd,clip:null,name:f.name};toast(`GIF com ${g.gf.length} quadros: o removedor de fundo vale para todos`);e.target.value='';return}}ieLoad(await createImageBitmap(f))}e.target.value=''};
const SL=(n,k,mn,mx)=>`<label>${n}<b>${IE[k]}</b></label><input type="range" min="${mn}" max="${mx}" value="${IE[k]}" oninput="IE.${k}=+this.value;this.previousElementSibling.querySelector('b').textContent=this.value">`;
function ieTool(k){IE.tool=k;IE.tab='t';if(k!='bg'&&IE.bgOn){IE.bgOn=false;IE.out=null;ieR()}if(k!='crop'){IE.crop=null;ieCropBox()}rIe()}
function ieA(k,v,el){IE.adj[k]=+v;el.previousElementSibling.querySelector('b').textContent=v;ieQ()}
function ieF(n){IE.adj={...PRE[n]};iePush(1);rIe();ieR()}
function rIe(){$('iet').innerHTML=TL.map(([k,i,n])=>`<button class="${IE.tool==k?'on':''}" title="${n}" onclick="ieTool('${k}')">${i}</button>`).join('')+'<hr style="width:30px;border:0;border-top:1px solid var(--bd)"><button title="Girar 90°" onclick="ieT(\'r\')">⟳</button><button title="Espelhar horizontal" onclick="ieT(\'h\')">⇋</button><button title="Espelhar vertical" onclick="ieT(\'v\')">⇅</button>';
 let h='<canvas id="ih" width="256" height="64"></canvas><div class="ietabs">'+[['a','Ajustes'],['c','Curvas'],['f','Filtros'],['t','Ferramenta']].map(([k,n])=>`<button class="${IE.tab==k?'on':''}" onclick="IE.tab='${k}';rIe()">${n}</button>`).join('')+'</div>';
 const col=`<label>Cor</label><input type="color" value="${IE.col}" oninput="IE.col=this.value">`,T=IE.tool;
 if(IE.tab=='a'){for(const r of ADJ){if(!r[2]&&r[2]!==0)h+=`<h4>${r[0]}</h4>`;else{const v=IE.adj[r[0]]||0;h+=`<label>${r[1]}<b>${v}</b></label><input type="range" min="${r[2]}" max="${r[3]}" value="${v}" oninput="ieA('${r[0]}',this.value,this)" onchange="iePush(1)">`}}
  h+=`<label><span>Inverter cores</span><input type="checkbox" ${IE.adj.inv?'checked':''} onchange="IE.adj.inv=this.checked?1:0;iePush(1);ieR()"></label><br><button onclick="IE.adj={};iePush(1);rIe();ieR()">↺ Redefinir ajustes</button>`}
 else if(IE.tab=='c')h+='<div class="chips">'+[['m','RGB'],['r','Vermelho'],['g','Verde'],['b','Azul']].map(([k,n])=>`<button class="${IE.ch==k?'on':''}" onclick="IE.ch='${k}';rIe()">${n}</button>`).join('')+'</div><canvas id="icv" width="240" height="240" style="width:100%;margin-top:8px;background:var(--bg);border-radius:6px;touch-action:none"></canvas><div class="hint">Clique para criar ponto, arraste para curvar, duplo clique remove.</div><button onclick="IE.curve=C0();iePush(1);rIe();ieR()">↺ Redefinir curvas</button>';
 else if(IE.tab=='f')h+='<div class="chips">'+Object.keys(PRE).map(n=>`<button onclick="ieF('${n}')">${n}</button>`).join('')+'</div>';
 else{if(T=='brush'||T=='erase')h+=SL('Tamanho','size',1,200)+SL('Opacidade','op',1,100)+(T=='brush'?col:'');
  else if(T=='text')h+='<label>Texto</label><input id="iet_t" type="text" value="Seu texto">'+SL('Tamanho','size',5,200)+col+'<div class="hint">Clique na imagem para colocar.</div>';
  else if(T=='shape')h+=`<label>Forma</label><select onchange="IE.shape=this.value"><option value="rect">Retângulo</option><option value="ell">Elipse</option><option value="line">Linha</option></select><label><span>Preenchida</span><input type="checkbox" ${IE.fill?'checked':''} onchange="IE.fill=this.checked"></label>`+SL('Espessura','size',3,120)+SL('Opacidade','op',1,100)+col;
  else if(T=='crop')h+='<label>Proporção</label><div class="chips">'+[['Livre',0],['1:1',1],['16:9',16/9],['9:16',9/16],['4:3',4/3]].map(([n,v])=>`<button onclick="IE.asp=${v}">${n}</button>`).join('')+'</div><br><button class="p" onclick="ieCrop()">✔ Aplicar corte</button> <button onclick="IE.crop=null;ieCropBox()">Cancelar</button><div class="hint">Arraste na imagem para desenhar a área de corte.</div>';
  else if(T=='bg')h+=bgPanel();
  else if(T=='pick')h+='<div class="hint">Clique na imagem para pegar uma cor.</div>'+col;else h+='<div class="hint">Escolha uma ferramenta à esquerda.</div>'}
 $('iep').innerHTML=h;if(IE.tab=='c')ieCvInit();ieH()}
function ieCv(){const c=$('icv'),x=c.getContext('2d'),pt=IE.curve[IE.ch],S=c.width;x.clearRect(0,0,S,S);x.strokeStyle='#8886';x.lineWidth=1;for(let i=1;i<4;i++){x.beginPath();x.moveTo(i*S/4,0);x.lineTo(i*S/4,S);x.moveTo(0,i*S/4);x.lineTo(S,i*S/4);x.stroke()}
 const L=cl(pt);x.strokeStyle=CHC[IE.ch];x.lineWidth=2;x.beginPath();for(let v=0;v<256;v++){const X=v/255*S,Y=S-L[v]/255*S;v?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();x.fillStyle='#fff';for(const[a,b]of pt){x.beginPath();x.arc(a/255*S,S-b/255*S,5,0,7);x.fill()}}
function ieCvInit(){const c=$('icv');ieCv();let di=-1;const cp=e=>{const r=c.getBoundingClientRect();return[Math.max(0,Math.min(255,(e.clientX-r.left)/r.width*255)),Math.max(0,Math.min(255,255-(e.clientY-r.top)/r.height*255))]};
 c.onpointerdown=e=>{const[x,y]=cp(e),pt=IE.curve[IE.ch];di=pt.findIndex(q=>Math.hypot(q[0]-x,q[1]-y)<14);if(di<0){pt.push([x,y]);pt.sort((a,b)=>a[0]-b[0]);di=pt.findIndex(q=>q[0]==x)}c.setPointerCapture(e.pointerId);ieCv();ieQ()};
 c.onpointermove=e=>{if(di<0)return;const pt=IE.curve[IE.ch],[x,y]=cp(e),end=di==0||di==pt.length-1;pt[di]=[end?pt[di][0]:Math.max(pt[di-1][0]+1,Math.min(pt[di+1][0]-1,x)),y];ieCv();ieQ()};
 c.onpointerup=()=>{if(di>=0){di=-1;iePush(1)}};
 c.ondblclick=e=>{const[x,y]=cp(e),pt=IE.curve[IE.ch],i=pt.findIndex((q,k)=>k>0&&k<pt.length-1&&Math.hypot(q[0]-x,q[1]-y)<14);if(i>0){pt.splice(i,1);ieCv();ieQ();iePush(1)}}}
function ieT(k){const b=IE.base,n=document.createElement('canvas'),w=b.width,h=b.height;if(k=='r'){n.width=h;n.height=w}else{n.width=w;n.height=h}const x=n.getContext('2d');
 if(k=='r'){x.translate(h,0);x.rotate(Math.PI/2)}else if(k=='h'){x.translate(w,0);x.scale(-1,1)}else{x.translate(0,h);x.scale(1,-1)}x.drawImage(b,0,0);IE.base=n;iePush();ieR()}
function ieCropBox(){const c=IE.crop,r=$('icr');if(!c){r.style.display='none';return}const k=ic.getBoundingClientRect().width/ic.width;Object.assign(r.style,{display:'block',left:ic.offsetLeft+c.x*k+'px',top:ic.offsetTop+c.y*k+'px',width:c.w*k+'px',height:c.h*k+'px'})}
function ieCrop(){const c=IE.crop;if(!c||c.w<4||c.h<4){toast('Arraste na imagem para escolher a área');return}const n=document.createElement('canvas');n.width=Math.round(c.w);n.height=Math.round(c.h);n.getContext('2d').drawImage(IE.base,c.x,c.y,c.w,c.h,0,0,n.width,n.height);IE.base=n;IE.crop=null;ieCropBox();iePush();ieR()}
function shp(x,a,b,c,d){x.save();x.globalAlpha=IE.op/100;x.strokeStyle=x.fillStyle=IE.col;x.lineWidth=Math.max(1,IE.size/3);x.beginPath();if(IE.shape=='rect')x.rect(a,b,c-a,d-b);else if(IE.shape=='ell')x.ellipse((a+c)/2,(b+d)/2,Math.abs(c-a)/2,Math.abs(d-b)/2,0,0,7);else{x.moveTo(a,b);x.lineTo(c,d)}IE.fill&&IE.shape!='line'?x.fill():x.stroke();x.restore()}
function stk(a,b,c,d){for(const x of [IE.base.getContext('2d'),IX]){x.save();x.globalAlpha=IE.op/100;x.globalCompositeOperation=IE.tool=='erase'?'destination-out':'source-over';x.strokeStyle=IE.col;x.lineWidth=IE.size;x.lineCap=x.lineJoin='round';x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke();x.restore()}}
const ptr=e=>{const r=ic.getBoundingClientRect();return[Math.max(0,Math.min(ic.width,(e.clientX-r.left)*ic.width/r.width)),Math.max(0,Math.min(ic.height,(e.clientY-r.top)*ic.height/r.height))]};let dr=null;
ic.onpointerdown=e=>{const[p,q]=ptr(e),T=IE.tool,b=IE.base.getContext('2d');dr={p,q,p0:p,q0:q};ic.setPointerCapture(e.pointerId);
 if(T=='pick'){const d=b.getImageData(p|0,q|0,1,1).data;IE.col='#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');dr=null;rIe();return}
 if(T=='bg'){if(IE.bm=='cor'){const d=b.getImageData(p|0,q|0,1,1).data;IE.bgCols.push([d[0],d[1],d[2]]);bgRun();rIe()}else if(IE.out)bgBrush(p,q);else toast('Rode o removedor primeiro');if(IE.bm=='cor'||!IE.out)dr=null;return}
 if(T=='text'){b.save();b.font=`bold ${IE.size*2}px sans-serif`;b.fillStyle=IE.col;b.globalAlpha=IE.op/100;b.textBaseline='middle';b.fillText($('iet_t')?$('iet_t').value:'Texto',p,q);b.restore();iePush();ieR();dr=null;return}
 if(T=='shape')dr.snap=IX.getImageData(0,0,ic.width,ic.height);if(T=='brush'||T=='erase')stk(p,q,p,q)};
ic.onpointermove=e=>{if(!dr)return;const[p,q]=ptr(e),T=IE.tool;
 if(T=='bg'){const n=Math.max(1,Math.ceil(Math.hypot(p-dr.p,q-dr.q)/Math.max(1,IE.size/3)));for(let k=1;k<=n;k++)bgBrush(dr.p+(p-dr.p)*k/n,dr.q+(q-dr.q)*k/n);dr.p=p;dr.q=q}
 else if(T=='brush'||T=='erase'){stk(dr.p,dr.q,p,q);dr.p=p;dr.q=q}
 else if(T=='shape'){IX.putImageData(dr.snap,0,0);shp(IX,dr.p0,dr.q0,p,q)}
 else if(T=='crop'){let w=Math.abs(p-dr.p0),h=IE.asp?w/IE.asp:Math.abs(q-dr.q0),x=Math.min(p,dr.p0),y=Math.min(q,dr.q0);if(IE.asp&&q<dr.q0)y=dr.q0-h;y=Math.max(0,y);w=Math.min(w,ic.width-x);h=Math.min(h,ic.height-y);IE.crop={x,y,w,h};ieCropBox()}};
ic.onpointerup=e=>{if(!dr)return;const[p,q]=ptr(e),T=IE.tool;if(T=='shape'){shp(IE.base.getContext('2d'),dr.p0,dr.q0,p,q);iePush();ieR()}else if(T=='brush'||T=='erase'){iePush();ieR()}dr=null};
const ieBlob=cb=>ic.toBlob(cb,'image/png');
function ieSave(){ieBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='imagem-editada.png';a.click()})}
addEventListener('keydown',e=>{if($('ie').style.display!='flex'||!(e.ctrlKey||e.metaKey))return;const k=e.key.toLowerCase();if(k=='z'){e.preventDefault();ieUndo(e.shiftKey?1:-1)}else if(k=='y'){e.preventDefault();ieUndo(1)}});
/* ---------- remover fundo (segmentação por cor, sem IA) + codificador de GIF ---------- */
Object.assign(IE,{bgC:document.createElement('canvas'),bo:{tol:60,soft:25,er:0,bl:1,con:1,dfr:1},bgCols:[],bm:'cor',bgOn:false,out:null,ov:null,bgD:null,bgSrc:null,gif:null,q2:0});
const bgQ=()=>{if(!IE.q2)IE.q2=requestAnimationFrame(()=>{IE.q2=0;bgRun()})};
function bgAuto(p,w,h){const m=new Map(),add=(x,y)=>{const k=(y*w+x)*4,r=p[k],g=p[k+1],b=p[k+2],key=(r>>4)<<8|(g>>4)<<4|(b>>4),e=m.get(key)||[0,0,0,0];e[0]+=r;e[1]+=g;e[2]+=b;e[3]++;m.set(key,e)};
 for(let x=0;x<w;x++){add(x,0);add(x,h-1)}for(let y=0;y<h;y++){add(0,y);add(w-1,y)}
 const all=[...m.values()].sort((a,b)=>b[3]-a[3]),tot=2*(w+h);let L=all.filter(e=>e[3]>tot*.06).slice(0,3);if(!L.length)L=all.slice(0,1);return L.map(e=>[e[0]/e[3],e[1]/e[3],e[2]/e[3]])}
function bgDist(p,n,cols){const D=new Float32Array(n),I=new Uint8Array(n);for(let i=0;i<n;i++){const r=p[i*4],g=p[i*4+1],b=p[i*4+2];let m=1e9,k=0;for(let j=0;j<cols.length;j++){const c=cols[j],e=Math.hypot(r-c[0],g-c[1],b-c[2]);if(e<m){m=e;k=j}}D[i]=m;I[i]=k}return{D,I}}
const sm=(d,a,b)=>d<=a?0:Math.min(1,(d-a)/Math.max(1,b-a));
function ero(A,w,h){const o=new Float32Array(A);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;o[i]=Math.min(A[i],A[i-1],A[i+1],A[i-w],A[i+w])}return o}
function blr(A,w,h){const t=new Float32Array(A.length),o=new Float32Array(A.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;t[i]=(A[x?i-1:i]+A[i]+A[x<w-1?i+1:i])/3}for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;o[i]=(t[y?i-w:i]+t[i]+t[y<h-1?i+w:i])/3}return o}
function bgAlpha(D,w,h,o){const n=w*h,lim=o.tol+o.soft;let A=new Float32Array(n).fill(1);
 if(o.con){const st=new Int32Array(n),seen=new Uint8Array(n);let sp=0;const push=i=>{if(!seen[i]&&D[i]<=lim){seen[i]=1;st[sp++]=i}};
  for(let x=0;x<w;x++){push(x);push((h-1)*w+x)}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1)}
  while(sp){const i=st[--sp],x=i%w,y=(i/w)|0;if(x>0)push(i-1);if(x<w-1)push(i+1);if(y>0)push(i-w);if(y<h-1)push(i+w)}
  for(let i=0;i<n;i++)if(seen[i])A[i]=sm(D[i],o.tol,lim)}
 else for(let i=0;i<n;i++)if(D[i]<=lim)A[i]=sm(D[i],o.tol,lim);
 for(let k=0;k<o.er;k++)A=ero(A,w,h);for(let k=0;k<o.bl;k++)A=blr(A,w,h);return A}
function bgOut(p,w,h,A,I,cols,o,ov){const out=new ImageData(w,h),q=out.data;for(let i=0;i<w*h;i++){const k=i*4;let a=A[i],r=p[k],g=p[k+1],b=p[k+2];
 if(ov&&ov[i]==1)a=1;else if(ov&&ov[i]==2)a=0;else if(a<1&&a>0&&o.dfr){const c=cols[I[i]];r=(r-(1-a)*c[0])/a;g=(g-(1-a)*c[1])/a;b=(b-(1-a)*c[2])/a}
 q[k]=r;q[k+1]=g;q[k+2]=b;q[k+3]=p[k+3]*a}return out}
function bgRun(){if(!IE.bgCols.length)return;const b=IE.base,w=b.width,h=b.height,p=b.getContext('2d').getImageData(0,0,w,h).data,sig=JSON.stringify(IE.bgCols)+w+h,d0=IE.hist[IE.hi]&&IE.hist[IE.hi].d;
 if(!IE.ov||IE.ov.length!=w*h)IE.ov=new Uint8Array(w*h);
 if(!IE.bgD||IE.bgD.sig!=sig||IE.bgD.d0!==d0)IE.bgD={...bgDist(p,w*h,IE.bgCols),sig,d0};
 const A=bgAlpha(IE.bgD.D,w,h,IE.bo),out=bgOut(p,w,h,A,IE.bgD.I,IE.bgCols,IE.bo,IE.ov);IE.bgSrc=p;IE.out=out;IE.bgC.width=w;IE.bgC.height=h;IE.bgC.getContext('2d').putImageData(out,0,0);IE.bgOn=true;ieR()}
function bgAutoRun(){const b=IE.base,d=b.getContext('2d').getImageData(0,0,b.width,b.height);IE.bgCols=bgAuto(d.data,b.width,b.height);bgRun();rIe()}
function bgBrush(x,y){if(!IE.out)return;const w=ic.width,h=ic.height,r=IE.size/2,q=IE.out.data,o=IE.bgSrc,v=IE.bm=='keep'?1:2;
 for(let j=Math.max(0,Math.floor(y-r));j<Math.min(h,y+r);j++)for(let i=Math.max(0,Math.floor(x-r));i<Math.min(w,x+r);i++)if((i-x)**2+(j-y)**2<=r*r){const n=j*w+i,k=n*4;IE.ov[n]=v;if(v==1){q[k]=o[k];q[k+1]=o[k+1];q[k+2]=o[k+2];q[k+3]=o[k+3]}else q[k+3]=0}
 IE.bgC.getContext('2d').putImageData(IE.out,0,0);ieQ()}
function bgApply(){if(!IE.bgOn){toast('Rode o removedor de fundo primeiro');return}const n=document.createElement('canvas');n.width=ic.width;n.height=ic.height;n.getContext('2d').drawImage(IE.bgC,0,0);IE.base=n;IE.bgOn=false;IE.out=null;IE.ov=null;IE.bgCols=[];iePush();rIe();ieR();toast('Fundo removido')}
function bgCancel(){IE.bgOn=false;IE.out=null;IE.ov=null;IE.bgCols=[];ieR();rIe()}
function bgPanel(){const o=IE.bo,sw=IE.bgCols.map((c,i)=>`<span title="Remover esta cor" onclick="IE.bgCols.splice(${i},1);bgRun();rIe()" style="display:inline-block;width:22px;height:22px;border-radius:5px;margin:2px;cursor:pointer;border:1px solid var(--bd);background:rgb(${c.map(Math.round)})"></span>`).join(''),
 S2=(n,k,mn,mx)=>`<label>${n}<b>${o[k]}</b></label><input type="range" min="${mn}" max="${mx}" value="${o[k]}" oninput="IE.bo.${k}=+this.value;this.previousElementSibling.querySelector('b').textContent=this.value;bgQ()">`,
 CK=(n,k)=>`<label><span>${n}</span><input type="checkbox" ${o[k]?'checked':''} onchange="IE.bo.${k}=this.checked?1:0;bgRun()"></label>`;
 return `<button class="p" style="width:100%" onclick="bgAutoRun()">✨ Remover fundo (automático)</button><div class="hint">Detecta o fundo pelas cores das bordas. Para outros fundos (ex.: tela verde), use o modo Cor e clique no fundo.</div><label>Clique na imagem para</label><div class="chips">`
 +[['cor','💧 Escolher cor'],['keep','＋ Restaurar'],['del','－ Apagar']].map(([k,n])=>`<button class="${IE.bm==k?'on':''}" onclick="IE.bm='${k}';rIe()">${n}</button>`).join('')+`</div><div>${sw}</div>`
 +S2('Tolerância','tol',0,200)+S2('Suavidade da borda','soft',0,100)+S2('Reduzir borda','er',0,6)+S2('Suavizar','bl',0,4)+CK('Só áreas ligadas às bordas','con')+CK('Limpar franjas de cor','dfr')+(IE.bm!='cor'?SL('Tamanho do pincel','size',2,200):'')
 +`<br><button class="p" onclick="bgApply()">✔ Aplicar</button> <button onclick="bgCancel()">Cancelar</button>`
 +(IE.gif?`<br><br><button class="p" style="width:100%" onclick="bgGifAll()">🎞 Aplicar nos ${IE.gif.gf.length} quadros do GIF</button><div class="hint">Gera um novo GIF com fundo transparente (o formato GIF só tem transparência total, sem semitransparência).</div>`:'')}
function lzwE(ix){let buf=[],bits=0,cur=0;const emit=(c,n)=>{cur|=c<<bits;bits+=n;while(bits>=8){buf.push(cur&255);cur>>=8;bits-=8}};let dict=new Map(),next=258,size=9;emit(256,size);let pre=ix[0];
 for(let i=1;i<ix.length;i++){const c=ix[i],key=pre<<8|c,v=dict.get(key);if(v!==undefined)pre=v;else{emit(pre,size);if(next<4096){dict.set(key,next++);if(next>(1<<size)&&size<12)size++}else{emit(256,size);dict=new Map();next=258;size=9}pre=c}}
 emit(pre,size);emit(257,size);if(bits>0)buf.push(cur&255);return buf}
function gifEnc(fr,w,h,dl){const cnt=new Uint32Array(32768);for(const f of fr){const p=f.data;for(let i=0;i<p.length;i+=12)if(p[i+3]>=128)cnt[(p[i]>>3)<<10|(p[i+1]>>3)<<5|(p[i+2]>>3)]++}
 const keys=[];for(let k=0;k<32768;k++)if(cnt[k])keys.push(k);if(!keys.length)keys.push(0);const bx=[keys];
 while(bx.length<255){let bi=-1,bs=1;bx.forEach((b,i)=>{if(b.length>bs){bs=b.length;bi=i}});if(bi<0)break;const b=bx[bi],mn=[31,31,31],mx=[0,0,0];
  for(const k of b){const c=[k>>10,(k>>5)&31,k&31];for(let j=0;j<3;j++){mn[j]=Math.min(mn[j],c[j]);mx[j]=Math.max(mx[j],c[j])}}
  const ch=[0,1,2].sort((a,c)=>(mx[c]-mn[c])-(mx[a]-mn[a]))[0],sh=[10,5,0][ch];b.sort((a,c)=>((a>>sh)&31)-((c>>sh)&31));
  let tot=0;for(const k of b)tot+=cnt[k]||1;let acc=0,sp=b.length>>1;for(let i=0;i<b.length;i++){acc+=cnt[b[i]]||1;if(acc>=tot/2){sp=Math.max(1,Math.min(b.length-1,i+1));break}}
  bx.splice(bi,1,b.slice(0,sp),b.slice(sp))}
 const pal=bx.map(b=>{let r=0,g=0,l=0,t=0;for(const k of b){const c=cnt[k]||1;r+=(k>>10)*c;g+=((k>>5)&31)*c;l+=(k&31)*c;t+=c}return[r/t*8+4,g/t*8+4,l/t*8+4].map(Math.round)}),T=255,cache=new Int16Array(32768).fill(-1);
 const near=k=>{if(cache[k]>=0)return cache[k];const r=(k>>10)*8+4,g=((k>>5)&31)*8+4,b=(k&31)*8+4;let m=1e9,s=0;for(let j=0;j<pal.length;j++){const d=(r-pal[j][0])**2+(g-pal[j][1])**2+(b-pal[j][2])**2;if(d<m){m=d;s=j}}return cache[k]=s};
 const o=[71,73,70,56,57,97,w&255,w>>8,h&255,h>>8,247,0,0];for(let j=0;j<256;j++)o.push(...(pal[j]||[0,0,0]));
 o.push(33,255,11,...[...'NETSCAPE2.0'].map(c=>c.charCodeAt(0)),3,1,0,0,0);
 fr.forEach((f,fi)=>{const p=f.data,ix=new Uint8Array(w*h);for(let i=0;i<w*h;i++){const k=i*4;ix[i]=p[k+3]<128?T:near((p[k]>>3)<<10|(p[k+1]>>3)<<5|(p[k+2]>>3))}
  const dly=Math.max(2,Math.round(dl[fi]*100));o.push(33,249,4,9,dly&255,dly>>8,T,0,44,0,0,0,0,w&255,w>>8,h&255,h>>8,0,8);const z=lzwE(ix);for(let i=0;i<z.length;i+=255){const c=z.slice(i,i+255);o.push(c.length,...c)}o.push(0)});
 o.push(59);return new Uint8Array(o)}
async function bgGifAll(){const g=IE.gif;if(!g||!IE.bgCols.length){toast('Rode o removedor no primeiro quadro antes');return}const w=ic.width,h=ic.height,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true}),fr=[],dl=[];
 for(let i=0;i<g.gf.length;i++){toast(`Quadro ${i+1}/${g.gf.length}`);await new Promise(r=>setTimeout(r,0));x.clearRect(0,0,w,h);x.drawImage(g.gf[i].bm,0,0,w,h);const p=x.getImageData(0,0,w,h).data,D=bgDist(p,w*h,IE.bgCols),A=bgAlpha(D.D,w,h,IE.bo);fr.push(bgOut(p,w,h,A,D.I,IE.bgCols,IE.bo,null));dl.push((g.gf[i+1]?g.gf[i+1].s:g.gd)-g.gf[i].s)}
 toast('Gerando GIF…');await new Promise(r=>setTimeout(r,0));await ieAddMedia(new Blob([gifEnc(fr,w,h,dl)],{type:'image/gif'}),'gif',g.clip,g.name)}
async function ieAddMedia(bl,type,clip,nm){$('ie').style.display='none';const mid=nid(),name=(nm||'imagem').replace(/\.[^.]+$/,'')+(type=='gif'?'-sem-fundo.gif':'-editada.png'),m0={blob:bl,type,dur:60,name};idb('put',m0,P.id+':'+mid);media[mid]={...m0,url:URL.createObjectURL(bl)};P.bin.push({mid,name,type,dur:60});await mk(mid);
 if(clip&&clips.includes(clip)){clip.mid=mid;clip.name=name;commit();rTL();rSide()}else addClip(mid);toast('Aplicado ao projeto')}
function ieApply(){ieBlob(bl=>ieAddMedia(bl,'image',IE.clip,IE.clip?IE.clip.name:'imagem'))}
initMbar();home();requestAnimationFrame(frame);
