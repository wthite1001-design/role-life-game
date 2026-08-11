
/* === 3.26.7-beta NPC 店長互動深化 + 測試資料重置 === */
(function(){
  const RESET_MARK = "npc_shop_relation_reset_20260811_v1";

  function resetNpcTestDataOnce(){
    try{
      if(localStorage.getItem(RESET_MARK)==="1") return;
      // 店長商店/NPC本機紀錄
      [
        "npc_shop_state_v1","npc_shop_state","npcShopState",
        "npc_shopkeeper_state","npc_shop_purchase_history",
        "npc_shop_history","npc_shop_daily","npc_shop_stock"
      ].forEach(k=>localStorage.removeItem(k));

      // 清目前所有本機角色的 NPC 關係收藏（保留真人關係）
      const candidateKeys=["role_life_saves","roleLifeSaves","characters","role_life_characters"];
      for(const key of candidateKeys){
        const raw=localStorage.getItem(key);
        if(!raw) continue;
        try{
          const data=JSON.parse(raw);
          const clean=(c)=>{
            if(!c||typeof c!=="object") return;
            delete c.npcRelationships;
            delete c.npcRelationship;
            delete c.npcRelations;
            if(c.achievements && typeof c.achievements==="object"){
              Object.keys(c.achievements).forEach(id=>{
                if(/^npc_evt_|^npc_/.test(id)) delete c.achievements[id];
              });
            }
          };
          if(Array.isArray(data)) data.forEach(clean);
          else if(data && typeof data==="object"){
            if(Array.isArray(data.characters)) data.characters.forEach(clean);
            Object.values(data).forEach(v=>{ if(v&&typeof v==="object"&&!Array.isArray(v)) clean(v); });
          }
          localStorage.setItem(key,JSON.stringify(data));
        }catch(e){}
      }
      localStorage.setItem(RESET_MARK,"1");
      console.info("[TEST] NPC 商店與 NPC 關係測試紀錄已重置。");
    }catch(e){console.warn(e)}
  }

  // 每個玩家只在這個新版第一次開啟時重置一次，避免每次重新整理都清空。
  resetNpcTestDataOnce();

  // 前期重複互動遞減：同類低階聊天不再能高速刷滿。
  window.npcDiminishingGain=function(action,base=1){
    let st=typeof npcState==="function"?npcState():null;
    if(!st) return base;
    st.repeatActions??={};
    const n=Number(st.repeatActions[action]||0);
    st.repeatActions[action]=n+1;
    if(n>=6) return 0;
    if(n>=3) return Math.min(base,0.5);
    return base;
  };

  // 好感只代表親近程度；最終關係另外看隱藏傾向。
  window.npcRelationStage=function(st){
    st=st||(typeof npcState==="function"?npcState():{affection:0});
    const a=Number(st.affection||0);
    if(a>=100) return "非常重要的人";
    if(a>=80) return "親近";
    if(a>=60) return "熟悉";
    if(a>=30) return "熟客";
    return "初識";
  };

  // 取代舊的店長關係判定：100 好感不再保證戀人。
  window.judgeShopkeeperRelation=function(){
    const st=npcState();
    const sc=st.relationScore||{};
    const romance=Number(sc.romance||0);
    const trust=Number(sc.trust||0);
    const tease=Number(sc.tease||0);
    const cat=Number(sc.catChoice||0);
    const secret=Number(sc.secret||0) + (st.flags?.blackBoxOwned?3:0) + (st.flags?.nightEvent?2:0);

    let type="regular";
    if(cat>=10 && cat>=romance && Number(st.cat||0)>=70) type="catfriend";
    else if(tease>=10 && tease>romance && tease>=trust) type="bickering";
    else if(secret>=8 && secret>=romance && secret>=trust) type="confidant";
    else if(trust>=10 && trust>romance) type="bestfriend";
    else if(romance>=12 && romance>=trust+2 && st.affection>=100) type="lover";
    else if(trust>=7) type="bestfriend";

    return {type,note:(window.NPC_RELATION_NOTES||{})[type]||""};
  };

  // 熟客小盒：保底有價值內容；由既有開盒函式可逐步接入。
  window.NPC_REGULAR_BOX_RULES={
    price:220,
    guaranteed:true,
    description:"至少獲得一項實用內容，另有機率取得稀有道具、故事道具或特殊收藏。",
    pool:[
      {id:"coins",min:100,max:260,weight:40},
      {id:"npc_cat_cookie",qty:2,weight:25},
      {id:"npc_lucky_bell",qty:1,weight:12},
      {id:"npc_story_token",qty:1,weight:15},
      {id:"npc_rare_collection",qty:1,weight:8}
    ]
  };

  // 小幸運鈴正式用途。
  window.NPC_LUCKY_BELL_RULES={
    rareEventBonus:0.15,
    mistakeProtection:1,
    hintChance:0.25,
    description:"探索時提高稀有事件機率；部分故事可消耗 1 個獲得一次選項補救，偶爾提供特殊事件提示。"
  };

  // NPC 戀人與真人戀人永遠分開。
  window.npcRelationshipUsesPlayerSlot=function(){ return false; };
})();
