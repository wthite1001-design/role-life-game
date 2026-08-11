
/* === 3.26.6 Android renderer crash recovery === */
(function(){
  window.__fullGameRenderReady=false;

  // A previous full render must never leak into a new character entry.
  document.addEventListener("click",function(e){
    if(e.target.closest("[data-open]")) window.__fullGameRenderReady=false;
  },true);

  // Avoid cloud background loops while the game isn't actually open.
  document.addEventListener("visibilitychange",function(){
    if(document.hidden) return;
    if(!window.activeId && typeof stopPolling==="function") stopPolling();
  });

  // Make the error banner itself null-safe.
  const oldFatal=window.fatal;
  window.fatal=function(msg){
    try{
      const f=document.getElementById("fatal");
      if(f){f.textContent=String(msg||"程式發生錯誤");f.classList.remove("hidden");}
      else console.error(msg);
    }catch(e){console.error(msg,e)}
  };
})();
