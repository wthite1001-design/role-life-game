
/* === 3.26.3 actual GM gate recovery === */
(function(){
  function installOwnerGateRecovery(){
    const gate=document.getElementById("testAccessGate");
    const card=gate?.querySelector(".testAccessCard");
    if(!card)return;
    const saved=typeof loadGMSession==="function"?loadGMSession():null;
    let btn=document.getElementById("testOwnerDirectBtn");
    if(saved?.access_token){
      if(!btn){
        btn=document.createElement("button");
        btn.id="testOwnerDirectBtn";
        btn.type="button";
        btn.className="primary";
        btn.textContent="👑 GM／Owner 直接進入測試服";
        btn.style.cssText="width:100%;margin-top:8px";
        const redeem=document.getElementById("testRedeemBtn");
        redeem?.insertAdjacentElement("beforebegin",btn);
      }
      btn.onclick=function(e){
        e.preventDefault();e.stopPropagation();
        gmSession=loadGMSession();
        openTestGame("owner");
      };
    }else{
      btn?.remove();
    }
  }
  installOwnerGateRecovery();
  setTimeout(installOwnerGateRecovery,200);
  setTimeout(()=>checkCurrentTestAccess?.(),250);
})();
