

document.getElementById("closeNpcDetail")?.addEventListener("click",()=>document.getElementById("npcDetailModal")?.classList.add("hidden"));
document.getElementById("npcDetailModal")?.addEventListener("click",e=>{if(e.target.id==="npcDetailModal")e.currentTarget.classList.add("hidden")});
document.getElementById("npcDetailBody")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-npc-story]");if(!b)return;
  let [kind,id]=String(b.dataset.npcStory||"").split("|");
  openNpcStory("shopkeeper_cat",kind,id);
});
document.getElementById("npcDebugBtn")?.addEventListener("click",openNpcDebug);
document.getElementById("closeNpcDebug")?.addEventListener("click",()=>document.getElementById("npcDebugModal")?.classList.add("hidden"));
document.getElementById("npcDebugModal")?.addEventListener("click",e=>{if(e.target.id==="npcDebugModal")e.currentTarget.classList.add("hidden")});
document.getElementById("npcDebugBody")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-npc-debug]");if(b)runNpcDebug(b.dataset.npcDebug);
});

