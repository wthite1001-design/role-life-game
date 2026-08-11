

(function(){
  const body=document.getElementById("npcShopBody");
  if(!body)return;

  let startY=0,startScroll=0,active=false;

  body.addEventListener("touchstart",e=>{
    if(e.touches.length!==1)return;
    active=true;
    startY=e.touches[0].clientY;
    startScroll=body.scrollTop;
  },{passive:true});

  body.addEventListener("touchmove",e=>{
    /* v2: native scrolling is handled by the whole NPC card */
  },{passive:true});

  body.addEventListener("touchend",()=>{active=false},{passive:true});
  body.addEventListener("touchcancel",()=>{active=false},{passive:true});
})();

