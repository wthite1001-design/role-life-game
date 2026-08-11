
/* === 3.26.2 GM/Owner bypass for test access gate === */
(function(){
  function gmOrOwnerActive(){
    try{
      if(window.gmSession?.user?.id) return true;
      if(window.gmProfile) return true;
      if(localStorage.getItem("role_life_gm_session")) return true;
      if(localStorage.getItem("gmSession")) return true;
      if(localStorage.getItem("gm_session")) return true;
      return false;
    }catch(e){ return false; }
  }
  window.gmOrOwnerActive=gmOrOwnerActive;

  function enterTestAsOwner(){
    try{
      const gate=document.getElementById("testAccessGate");
      if(gate) gate.classList.add("hidden");
      document.body.classList.add("test-access-ok");
      localStorage.setItem("test_access_granted_owner","1");
      toast?.("👑 GM / Owner 已直接進入測試服",2200);
      try{renderHome?.()}catch(e){}
      try{renderGame?.()}catch(e){}
      try{syncNpcFab?.()}catch(e){}
      try{updateLaunchActivityFab?.()}catch(e){}
      return true;
    }catch(e){
      console.warn("owner bypass failed",e);
      return false;
    }
  }
  window.enterTestAsOwner=enterTestAsOwner;

  /* GM/Owner 已登入時直接繞過 TEST 碼。 */
  function applyOwnerBypass(){
    if(gmOrOwnerActive()){
      enterTestAsOwner();
      return true;
    }
    return false;
  }

  /* 入口按鈕：如果是 GM/Owner，直接放行；一般測試員照原本 TEST 碼流程。 */
  document.addEventListener("click",e=>{
    const btn=e.target.closest("#verifyTestAccess,#testAccessVerify,#enterTestServerBtn,[data-test-access-verify]");
    if(!btn)return;
    if(gmOrOwnerActive()){
      e.preventDefault();
      e.stopImmediatePropagation();
      enterTestAsOwner();
    }
  },true);

  /* GM 登入成功後立刻檢查，不需要再輸入測試碼。 */
  document.addEventListener("click",e=>{
    if(e.target.closest("#gmLoginBtn,#gmSubmitLogin,#gmGateBtn")){
      setTimeout(applyOwnerBypass,250);
      setTimeout(applyOwnerBypass,800);
    }
  },true);

  /* 頁面載入時若已經保有 GM session，也直接放行。 */
  setTimeout(applyOwnerBypass,100);
  setTimeout(applyOwnerBypass,600);
  window.addEventListener("pageshow",applyOwnerBypass);

  /* 更新測試服版本顯示，避免入口仍寫 3.26.7-beta。 */
  const replacements=[
    ["Ver.3.26.7-beta","Ver.3.26.7-beta"],
    ["TEST • 3.26.7-beta","TEST • 3.26.7-beta"],
    ["TEST・3.26.7-beta","TEST・3.26.7-beta"],
    ["TEST • 3.26.1-beta","TEST • 3.26.7-beta"],
    ["TEST・3.26.1-beta","TEST・3.26.7-beta"]
  ];
  function updateVersionLabels(){
    document.querySelectorAll("body *").forEach(el=>{
      if(el.children.length===0 && typeof el.textContent==="string"){
        let t=el.textContent;
        for(const [a,b] of replacements)t=t.replace(a,b);
        if(t!==el.textContent)el.textContent=t;
      }
    });
    if(document.title.includes("3.26.7-beta"))document.title=document.title.replace("3.26.7-beta","3.26.7-beta");
    if(document.title.includes("3.26.1-beta"))document.title=document.title.replace("3.26.1-beta","3.26.7-beta");
  }
  updateVersionLabels();
  setTimeout(updateVersionLabels,500);
})();
