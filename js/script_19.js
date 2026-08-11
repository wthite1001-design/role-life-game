
/* === 3.25-beta 店長真實表情圖 + 商店首頁點擊互動 + NPC最終關係徽章 === */
(function(){
  const FACE = {
    annoyed:"assets/npc/shopkeeper_cat/annoyed.png",
    shy:"assets/npc/shopkeeper_cat/shy.png",
    happy:"assets/npc/shopkeeper_cat/happy.png",
    normal:"assets/npc/shopkeeper_cat/normal.png",
    soft:"assets/npc/shopkeeper_cat/soft.png",
    surprised:"assets/npc/shopkeeper_cat/surprised.png"
  };

  /* 表情圖改為外部檔案，請與 test.html 放在同一層。 */
  window.NPC_SHOPKEEPER_FACE_DATA = FACE;

  /* 覆蓋舊表情切換，RPG 劇情與商店首頁共用。 */
  window.setNpcExpression=function(face="normal"){
    if(!FACE[face]) face="normal";
    const src=FACE[face];
    const hero=document.querySelector(".npcHero img");
    const story=document.getElementById("npcStoryPortrait");
    [hero,story].forEach(img=>{
      if(img && img.src!==src) img.src=src;
      if(img) img.dataset.npcFace=face;
    });
    document.querySelectorAll(".npcExpressionBadge").forEach(x=>{
      x.textContent="";
      x.className=`npcExpressionBadge face-${face}`;
    });
  };

  /* 補上這次限定 NPC 關係收藏徽章。任何最終關係都送同一枚。 */
  const NPC_REL_BADGE_ID="badge_npc_shopkeeper_memory";
  function registerNpcRelationBadge(){
    try{
      if(typeof badgeDefs!=="undefined"){
        badgeDefs[NPC_REL_BADGE_ID]={
          icon:"💜",
          name:"紫晶店長的特別客人",
          desc:"與限定 NPC 走到任一最終關係後取得。"
        };
      }
    }catch(e){console.warn("NPC badge register",e)}
  }
  registerNpcRelationBadge();

  function grantNpcRelationBadge(){
    try{
      registerNpcRelationBadge();
      if(typeof unlockBadge==="function") unlockBadge(NPC_REL_BADGE_ID);
      else{
        local.sharedBadges??={};
        local.sharedBadges[NPC_REL_BADGE_ID]=1;
      }
      saveLocal?.();
      const c=typeof cur==="function"?cur():null;
      if(c && typeof renderBadges==="function") renderBadges(c);
      toast?.("🏅 獲得限定徽章「紫晶店長的特別客人」",4200);
    }catch(e){console.warn("NPC badge grant",e)}
  }

  /* 包住原本的固定 NPC 關係建立函式：建立成功才發徽章。 */
  const oldSetNpcRelationship=window.setNpcRelationship;
  if(typeof oldSetNpcRelationship==="function"){
    window.setNpcRelationship=function(c,npcId,type,note=""){
      const ok=oldSetNpcRelationship(c,npcId,type,note);
      if(ok && npcId==="shopkeeper_cat") grantNpcRelationBadge();
      return ok;
    };
  }

  /* 舊存檔補發：已經有店長最終關係的人不會漏徽章。 */
  function backfillNpcBadge(){
    try{
      registerNpcRelationBadge();
      const c=typeof cur==="function"?cur():null;
      const rel=c && typeof getNpcRelationship==="function"
        ? getNpcRelationship(c,"shopkeeper_cat") : null;
      if(!rel) return;
      if(typeof ensureBadges==="function") ensureBadges();
      local.sharedBadges??={};
      if(!local.sharedBadges[NPC_REL_BADGE_ID]){
        local.sharedBadges[NPC_REL_BADGE_ID]=1;
        saveLocal?.();
      }
    }catch(e){}
  }

  const SHOP_TAPS=[
    {face:"happy", text:"「歡迎回來。今天也有想看的東西嗎？」"},
    {face:"shy", text:"「……你一直盯著我看做什麼？」"},
    {face:"annoyed", text:"「再亂碰櫃檯上的東西，我真的要收你整理費了喔。」"},
    {face:"surprised", text:"「咦？你今天不是來買東西的？」"},
    {face:"soft", text:"「今天也來了啊……嗯，我有看到你。」"},
    {face:"normal", text:"「需要什麼就慢慢看，不用急。」"},
    {face:"happy", text:"「偷偷告訴你，今天有一樣東西我覺得很適合你。」"},
    {face:"shy", text:"「只是剛好記得你喜歡什麼而已，別想太多。」"}
  ];
  let shopTapIndex=Math.floor(Math.random()*SHOP_TAPS.length);

  function getShopDialogueNode(){
    const hero=document.querySelector(".npcHero");
    if(!hero) return null;
    /* 優先找畫面上原本那句店長台詞。 */
    return hero.querySelector(".npcHeroQuote,.npcQuote,.npcHeroText,.npcDialogue,.npcGreeting")
      || [...hero.querySelectorAll("div,p,span")].find(el=>/你來啦|買東西|今天/.test(el.textContent||""));
  }

  function shopkeeperTapInteraction(ev){
    const hero=document.querySelector(".npcHero");
    if(!hero || !hero.contains(ev.target)) return;
    if(ev.target.closest("button,a,input,select,textarea")) return;

    const img=ev.target.closest("img");
    const dialogue=getShopDialogueNode();
    const clickedDialogue=dialogue && (ev.target===dialogue || dialogue.contains(ev.target));
    if(!img && !clickedDialogue) return;

    ev.preventDefault();
    ev.stopPropagation();

    const item=SHOP_TAPS[shopTapIndex++ % SHOP_TAPS.length];
    setNpcExpression(item.face);

    if(dialogue){
      dialogue.textContent=item.text;
      dialogue.classList.add("npcTapPulse");
      setTimeout(()=>dialogue.classList.remove("npcTapPulse"),260);
    }else{
      toast?.(item.text.replace(/[「」]/g,""),2600);
    }
  }

  document.addEventListener("click",shopkeeperTapInteraction,true);

  const css=document.createElement("style");
  css.textContent=`
    .npcHero img{cursor:pointer;touch-action:manipulation}
    .npcHero .npcHeroQuote,.npcHero .npcQuote,.npcHero .npcHeroText,
    .npcHero .npcDialogue,.npcHero .npcGreeting{cursor:pointer;touch-action:manipulation}
    .npcTapPulse{animation:npcTapPulse .26s ease}
    @keyframes npcTapPulse{50%{transform:scale(1.018)}}
  `;
  document.head.appendChild(css);

  /* 商店第一次出現時換成真正 normal 圖；進角色後補發舊關係徽章。 */
  const obs=new MutationObserver(()=>{
    const hero=document.querySelector(".npcHero img");
    if(hero && !hero.dataset.npcFace){
      try{ updateNpcStats?.(); }catch(e){ setNpcExpression("normal"); }
    }
    backfillNpcBadge();
  });
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{backfillNpcBadge();try{updateNpcStats?.()}catch(e){setNpcExpression("normal")}},500);
})();
