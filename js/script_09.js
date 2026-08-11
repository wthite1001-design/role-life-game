

(function(){
  const el=document.getElementById("npcTownFab");if(!el)return;
  const KEY="role_life_test_npc_fab_pos_v1";
  let active=false,moved=false,sx=0,sy=0,sl=0,st=0;
  function clamp(x,y){const p=6,w=el.offsetWidth||90,h=el.offsetHeight||44;return{x:Math.max(p,Math.min(innerWidth-w-p,x)),y:Math.max(p,Math.min(innerHeight-h-p,y))}}
  try{const p=JSON.parse(localStorage.getItem(KEY)||"null");if(p){const q=clamp(p.x,p.y);el.style.left=q.x+"px";el.style.top=q.y+"px";el.style.right="auto";el.style.bottom="auto"}}catch(_){}
  el.style.touchAction="none";
  el.addEventListener("touchstart",e=>{if(e.touches.length!==1)return;const r=el.getBoundingClientRect(),t=e.touches[0];active=true;moved=false;sx=t.clientX;sy=t.clientY;sl=r.left;st=r.top},{passive:true});
  el.addEventListener("touchmove",e=>{if(!active||e.touches.length!==1)return;const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(!moved&&Math.hypot(dx,dy)>5)moved=true;if(!moved)return;e.preventDefault();const q=clamp(sl+dx,st+dy);el.style.left=q.x+"px";el.style.top=q.y+"px";el.style.right="auto";el.style.bottom="auto"},{passive:false});
  el.addEventListener("touchend",()=>{if(!active)return;active=false;if(moved){const r=el.getBoundingClientRect();localStorage.setItem(KEY,JSON.stringify({x:r.left,y:r.top}));el.dataset.dragBlock="1";setTimeout(()=>delete el.dataset.dragBlock,250)}},{passive:true});
  el.addEventListener("click",e=>{if(el.dataset.dragBlock==="1"){e.preventDefault();e.stopImmediatePropagation()}},true);
})();

