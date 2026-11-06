function fEnter(){document.getElementById('portfolio').style.display='none';document.getElementById('felixEditorShell').style.display='block'}
function fOpenSignup(){document.getElementById('fSignup').classList.add('open')}
function fCloseSignup(){document.getElementById('fSignup').classList.remove('open')}
function fSignupSubmit(e){e.preventDefault();const n=document.getElementById('fName').value.trim();fCloseSignup();alert('Obrigado, '+n+'! A tela de cadastro está pronta. Para criar contas reais, falta conectar um sistema de autenticação.')}
(function felixMotion(){
 const root=document.getElementById('portfolio');if(!root)return;
 const cur=document.getElementById('fCursor'),glow=document.getElementById('fGlow'),glass=document.getElementById('fGlass');
 let tx=innerWidth/2,ty=innerHeight/2,cx=tx,cy=ty,gx=tx,gy=ty;
 root.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;root.style.setProperty('--mx',tx+'px');root.style.setProperty('--my',ty+'px')});
 function move(){cx+=(tx-cx)*.22;cy+=(ty-cy)*.22;gx+=(tx-gx)*.07;gy+=(ty-gy)*.07;if(cur)cur.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`;if(glow)glow.style.transform=`translate(${gx}px,${gy}px) translate(-50%,-50%)`;requestAnimationFrame(move)}move();
 root.querySelectorAll('button,a,.f-card').forEach(el=>{el.addEventListener('pointerenter',()=>{if(cur){cur.style.width='52px';cur.style.height='52px';cur.style.background='#b6ff4a18'}});el.addEventListener('pointerleave',()=>{if(cur){cur.style.width='28px';cur.style.height='28px';cur.style.background='transparent'}})});
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});
 root.querySelectorAll('.f-reveal').forEach(el=>observer.observe(el));
 const visual=document.getElementById('fVisual');
 visual.addEventListener('pointermove',e=>{const r=visual.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;glass.style.transform=`translateY(-8px) rotateX(${-y*13}deg) rotateY(${x*16}deg)`});
 visual.addEventListener('pointerleave',()=>{glass.style.transform=''});
})();
function fBackToPortfolio(){document.getElementById('felixEditorShell').style.display='none';document.getElementById('portfolio').style.display='';}
document.querySelectorAll('.f-navlinks a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.f-navlinks').classList.remove('open')));

// O editor (iframe) avisa o site para voltar ao portfólio
window.addEventListener('message',e=>{if(e.data==='felix:back')fBackToPortfolio()});
