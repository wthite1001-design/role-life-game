

/* === robust mobile draggable floating buttons v2 === */
(function(){
  const KEY="role_life_test_float_pos_v2";

  function positions(){
    try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(_){return{};}
  }
  function save(key,el){
    const all=positions(), r=el.getBoundingClientRect();
    all[key]={x:Math.round(r.left),y:Math.round(r.top)};
    localStorage.setItem(KEY,JSON.stringify(all));
  }
  function clamp(el,x,y){
    const p=6,w=el.offsetWidth||90,h=el.offsetHeight||44;
    return {
      x:Math.max(p,Math.min(window.innerWidth-w-p,x)),
      y:Math.max(p,Math.min(window.innerHeight-h-p,y))
    };
  }
  function place(key,el){
    const p=positions()[key];
    if(!p)return;
    const q=clamp(el,+p.x||0,+p.y||0);
    el.style.setProperty("left",q.x+"px","important");
    el.style.setProperty("top",q.y+"px","important");
    el.style.setProperty("right","auto","important");
    el.style.setProperty("bottom","auto","important");
  }
  function bind(el,key){
    if(!el || el.dataset.dragV2==="1") return;
    el.dataset.dragV2="1";
    el.style.touchAction="none";

    let active=false,moved=false,sx=0,sy=0,sl=0,st=0;

    function start(x,y){
      const r=el.getBoundingClientRect();
      active=true;moved=false;sx=x;sy=y;sl=r.left;st=r.top;
      el.classList.add("dragging");
    }
    function move(x,y,ev){
      if(!active)return;
      const dx=x-sx,dy=y-sy;
      if(!moved && Math.hypot(dx,dy)>5)moved=true;
      if(!moved)return;
      if(ev && ev.cancelable)ev.preventDefault();
      const q=clamp(el,sl+dx,st+dy);
      el.style.setProperty("left",q.x+"px","important");
      el.style.setProperty("top",q.y+"px","important");
      el.style.setProperty("right","auto","important");
      el.style.setProperty("bottom","auto","important");
    }
    function end(){
      if(!active)return;
      active=false;el.classList.remove("dragging");
      if(moved){
        save(key,el);
        el.dataset.dragBlockClick="1";
        setTimeout(()=>delete el.dataset.dragBlockClick,250);
      }
    }

    // Touch events: more reliable in Android/PWA/WebView.
    el.addEventListener("touchstart",e=>{
      if(e.touches.length!==1)return;
      const t=e.touches[0]; start(t.clientX,t.clientY);
    },{passive:true});
    el.addEventListener("touchmove",e=>{
      if(e.touches.length!==1)return;
      const t=e.touches[0]; move(t.clientX,t.clientY,e);
    },{passive:false});
    el.addEventListener("touchend",end,{passive:true});
    el.addEventListener("touchcancel",end,{passive:true});

    // Mouse fallback.
    el.addEventListener("mousedown",e=>{
      if(e.button!==0)return; start(e.clientX,e.clientY); e.preventDefault();
    });
    window.addEventListener("mousemove",e=>move(e.clientX,e.clientY,e));
    window.addEventListener("mouseup",end);

    // Block original onclick after an actual drag.
    el.addEventListener("click",e=>{
      if(el.dataset.dragBlockClick==="1"){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      }
    },true);

    place(key,el);
  }

  function init(){
    bind(document.getElementById("launchActivityFab"),"activity");
    bind(document.getElementById("returnProdBtn"),"returnProd");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
  setTimeout(init,500);
  setTimeout(init,1500);
  window.addEventListener("resize",()=>{
    const a=document.getElementById("launchActivityFab"),b=document.getElementById("returnProdBtn");
    if(a)place("activity",a); if(b)place("returnProd",b);
  });
})();

