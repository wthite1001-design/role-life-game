
(function(){
  const NPC_EVENT_START=new Date("2026-08-11T00:00:00+08:00");
  const NPC_EVENT_END=new Date("2026-10-11T23:59:59+08:00");

  window.npcEventIsActive=function(now=new Date()){
    return now>=NPC_EVENT_START&&now<=NPC_EVENT_END;
  };
  window.npcEventPeriodText=function(){
    return "🎊 限定 NPC 活動：2026/08/11 ～ 2026/10/11";
  };
  window.refreshNpcEventPeriodHint=function(){
    const el=document.getElementById("npcEventPeriodHint");
    if(el)el.textContent=npcEventPeriodText()+(npcEventIsActive()?"・活動進行中":"・活動已結束，已收藏內容仍可觀看");
  };
  window.resetMyNpcTestData=function(){
    const c=typeof cur==="function"?cur():null;
    if(!c)return toast("請先進入角色。");
    if(!confirm("確定重置目前角色的 NPC 測試資料嗎？\n\n會清除店長好感、熟客度、店貓親密、聊天/購買紀錄、故事收藏、NPC 活動成就與 NPC 關係。\n\n不會影響真人玩家關係與角色本身存檔。"))return;
    localStorage.removeItem(NPC_SHOP_KEY);
    c.npcRelationships??={};
    delete c.npcRelationships.shopkeeper_cat;
    if(c.achievements){
      Object.keys(c.achievements).forEach(id=>{if(id.startsWith("npc_evt_"))delete c.achievements[id]});
    }
    saveLocal();
    renderNpcRelationships?.();
    renderNpcShop?.();
    refreshNpcEventPeriodHint();
    toast("♻️ 你的 NPC 測試資料已重置",3500);
  };
  document.getElementById("npcSelfResetBtn")?.addEventListener("click",resetMyNpcTestData);
  setTimeout(refreshNpcEventPeriodHint,300);
})();
