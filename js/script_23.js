
/* === 3.26 expiry hard lock === */
(function(){
  // Gate launch auto-evaluation too, so pre-start / post-end cannot silently award.
  if(typeof window.evaluateLaunchActivity==="function"){
    const oldEval=window.evaluateLaunchActivity;
    window.evaluateLaunchActivity=async function(silent=false){
      if(typeof launchEventIsActive==="function"&&!launchEventIsActive()){
        enforceEventVisibility?.();
        return false;
      }
      return oldEval(silent);
    };
  }

  // Hard-block every limited NPC action after expiry, even if an old modal is somehow still open.
  document.addEventListener("click",e=>{
    if(typeof npcEventIsActive!=="function"||npcEventIsActive())return;
    const limited=e.target.closest(
      "[data-npc-action],[data-npc-buy],[data-npc-use],#npcTownFab,#launchActivityFab,[data-launch-tab]"
    );
    if(!limited)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    document.getElementById("npcShopModal")?.classList.add("hidden");
    document.getElementById("launchActivityModal")?.classList.add("hidden");
    enforceEventVisibility?.();
    toast?.("⏳ 限定活動已結束，現在只能查看已收藏內容。",3200);
  },true);

  // Story collection remains viewable; new milestone/final relationship unlocks are stopped.
  if(typeof window.maybePlayNpcMilestoneStory==="function"){
    const oldMilestone=window.maybePlayNpcMilestoneStory;
    window.maybePlayNpcMilestoneStory=function(){
      if(typeof npcEventIsActive==="function"&&!npcEventIsActive())return false;
      return oldMilestone();
    };
  }
  if(typeof window.finalizeShopkeeperRelation==="function"){
    const oldFinal=window.finalizeShopkeeperRelation;
    window.finalizeShopkeeperRelation=function(){
      if(typeof npcEventIsActive==="function"&&!npcEventIsActive())
        return toast?.("⏳ 限定 NPC 活動已結束，不能再取得新的關係結局。",3200);
      return oldFinal();
    };
  }
})();
