

const FLOATING_BUTTON_POS_KEY="role_life_test_floating_button_positions_v1";

function loadFloatingButtonPositions(){
  try{return JSON.parse(localStorage.getItem(FLOATING_BUTTON_POS_KEY)||"{}")||{}}
  catch(e){return{}}
}
function saveFloatingButtonPosition(key,el){
  if(!el)return;
  let map=loadFloatingButtonPositions();
  let r=el.getBoundingClientRect();
  map[key]={left:Math.round(r.left),top:Math.round(r.top)};
  localStorage.setItem(FLOATING_BUTTON_POS_KEY,JSON.stringify(map));
}
function clampFloatingButton(el,left,top){
  const pad=6;
  const w=el.offsetWidth||80,h=el.offsetHeight||42;
  const maxLeft=Math.max(pad,window.innerWidth-w-pad);
  const maxTop=Math.max(pad,window.innerHeight-h-pad);
  return {
    left:Math.max(pad,Math.min(maxLeft,left)),
    top:Math.max(pad,Math.min(maxTop,top))
  };
}
function applyFloatingButtonPosition(key,el){
  if(!el)return;
  const pos=loadFloatingButtonPositions()[key];
  if(!pos)return;
  const p=clampFloatingButton(el,Number(pos.left)||0,Number(pos.top)||0);
  el.style.left=p.left+"px";
  el.style.top=p.top+"px";
  el.style.right="auto";
  el.style.bottom="auto";
}
function makeFloatingButtonDraggable(el,key){
  if(!el||el.dataset.dragReady==="1")return;
  el.dataset.dragReady="1";

  let dragging=false,moved=false,startX=0,startY=0,startLeft=0,startTop=0,pointerId=null;

  el.addEventListener("pointerdown",e=>{
    if(e.button!=null&&e.button!==0)return;
    const r=el.getBoundingClientRect();
    dragging=true;moved=false;pointerId=e.pointerId;
    startX=e.clientX;startY=e.clientY;startLeft=r.left;startTop=r.top;
    el.classList.add("dragging");
    try{el.setPointerCapture(pointerId)}catch(_){}
  });

  el.addEventListener("pointermove",e=>{
    if(!dragging||e.pointerId!==pointerId)return;
    let dx=e.clientX-startX,dy=e.clientY-startY;
    if(Math.abs(dx)>4||Math.abs(dy)>4)moved=true;
    if(!moved)return;
    e.preventDefault();
    let p=clampFloatingButton(el,startLeft+dx,startTop+dy);
    el.style.left=p.left+"px";
    el.style.top=p.top+"px";
    el.style.right="auto";
    el.style.bottom="auto";
  });

  const finish=e=>{
    if(!dragging||e.pointerId!==pointerId)return;
    dragging=false;
    el.classList.remove("dragging");
    try{el.releasePointerCapture(pointerId)}catch(_){}
    if(moved){
      saveFloatingButtonPosition(key,el);
      el.dataset.justDragged="1";
      setTimeout(()=>delete el.dataset.justDragged,80);
    }
  };
  el.addEventListener("pointerup",finish);
  el.addEventListener("pointercancel",finish);

  // Prevent the normal button action after a drag.
  el.addEventListener("click",e=>{
    if(el.dataset.justDragged==="1"){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);

  applyFloatingButtonPosition(key,el);
}

function initDraggableFloatingButtons(){
  makeFloatingButtonDraggable(document.getElementById("launchActivityFab"),"activity");
  makeFloatingButtonDraggable(document.getElementById("returnProdBtn"),"returnProd");
}

window.addEventListener("resize",()=>{
  const a=document.getElementById("launchActivityFab");
  const b=document.getElementById("returnProdBtn");
  if(a)applyFloatingButtonPosition("activity",a);
  if(b)applyFloatingButtonPosition("returnProd",b);
});

setTimeout(initDraggableFloatingButtons,0);

