// Keep the fixed menu out of results until it is needed. Observe nested tables too.
export function initAutoNav(doc=globalThis.document,win=globalThis.window,now=()=>Date.now()){
 const nav=doc.getElementById('bottom-nav'),toggle=doc.getElementById('nav-toggle');
 if(!nav||!toggle)return;
 let open=false,pageAnchor=Number(win.scrollY)||0,ignoreUntil=0;
 const anchors=new WeakMap();
 function setOpen(value){
  open=value;
  if(!value&&nav.contains(doc.activeElement))toggle.focus();
  nav.classList.toggle('nav-collapsed',!value);nav.inert=!value;
  nav.setAttribute('aria-hidden',String(!value));
  toggle.setAttribute('aria-expanded',String(value));
  toggle.setAttribute('aria-label',value?'Sembunyikan menu utama':'Tunjukkan menu utama');
  toggle.textContent=value?'⌄ Tutup menu':'☰ Menu';
  doc.body.classList.toggle('menu-expanded',value);
 }
 toggle.addEventListener('click',()=>setOpen(!open));
 nav.addEventListener('click',e=>{if(e.target.closest('[data-page]')){ignoreUntil=now()+700;setOpen(false);}});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)setOpen(false);});
 doc.addEventListener('scroll',e=>{
  const target=e.target,isPage=target===doc||target===win||target===doc.documentElement||target===doc.body;
  if(!isPage&&!target?.matches?.('.table-scroll, .placement-list'))return;
  const y=Math.max(0,Number(isPage?win.scrollY:target.scrollTop)||0);
  const previous=isPage?pageAnchor:anchors.get(target)||0,delta=y-previous;
  if(now()<ignoreUntil){if(isPage)pageAnchor=y;else anchors.set(target,y);return;}
  if(Math.abs(delta)<10)return;
  if(isPage)pageAnchor=y;else anchors.set(target,y);
  setOpen(delta<0);
 },{capture:true,passive:true});
 setOpen(false);
 return {setOpen};
}
if(globalThis.document&&globalThis.window)initAutoNav();
