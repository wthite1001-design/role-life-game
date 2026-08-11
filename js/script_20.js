
/* === 3.25-beta affection-100 / null-safe NPC hotfix === */
(function(){
  function $id(id){ return document.getElementById(id); }

  // 統一安全更新：NPC 視窗尚未掛載／暫時被替換時也不再丟 textContent null 錯誤。
  window.updateNpcStats=function(){
    const st=npcState();
    npcEnsureDaily(st);
    npcCheckUnlocks(st);
    const setText=(id,v)=>{const el=$id(id);if(el)el.textContent=v};
    const setWidth=(id,v)=>{const el=$id(id);if(el)el.style.width=v};
    setText('npcAffectionText',`${Number(st.affection||0)} / 100`);
    setText('npcLoyaltyText',Number(st.loyalty||0));
    setText('npcCatText',Number(st.cat||0));
    setWidth('npcAffectionFill',Math.max(0,Math.min(100,Number(st.affection||0)))+'%');
    setWidth('npcLoyaltyFill',Math.max(0,Math.min(100,Number(st.loyalty||0)/30*100))+'%');
    setWidth('npcCatFill',Math.max(0,Math.min(100,Number(st.cat||0)))+'%');
    setText('npcShopMood',npcMoodLine(st));
    const hints=[];
    if(st.affection<20)hints.push(`再提升 ${20-st.affection} 好感：貓貓會開始記得你`);
    else if(st.affection<40)hints.push(`再提升 ${40-st.affection} 好感：解鎖城鎮傳聞`);
    else if(st.affection<60)hints.push(`再提升 ${60-st.affection} 好感：解鎖打烊後對話`);
    else if(st.affection<100)hints.push(`再提升 ${100-st.affection} 好感：開啟特殊關係選項`);
    else if(!getNpcRelationship(cur?.(), 'shopkeeper_cat'))hints.push('💗 好感已滿：最終章已可以進行');
    if(st.loyalty<10)hints.push(`再消費 ${10-st.loyalty} 次：熟客商品`);
    setText('npcUnlockNotice',hints.join('・')||'✨ 你似乎已經把這間店探索得很熟了。');
  };

  // 直接重建互動卡片；每次都從 localStorage 重新讀值，避免 100 好感卻仍用舊 st。
  window.renderNpcTalkFresh=function(){
    const body=$id('npcShopBody');
    if(!body)return;
    const st=npcState();npcEnsureDaily(st);
    const hour=new Date().getHours();
    const used=Number(st.daily?.talk||0);
    const limit=10;
    const cards=[
      {icon:'💬',name:'跟貓貓聊天',desc:used>=limit?`今天 ${used}/${limit} 次・明天再聊吧`:`今天 ${used}/${limit} 次・隨機話題`,fn:'talk',disabled:used>=limit},
      {icon:'🎁',name:'送禮物',desc:`今天 ${st.daily?.gift||0}/2 次`,fn:'gift'},
      {icon:'🐈',name:'摸店貓',desc:`今天 ${st.daily?.cat||0}/3 次`,fn:'cat'},
      {icon:'🍬',name:'偷拿櫃檯糖果',desc:'你真的要這樣做嗎？',fn:'candy'},
      {icon:'💼',name:'幫忙顧店',desc:`今天 ${st.daily?.help||0}/1 次・隨機事件`,fn:'help'}
    ];
    if((hour>=22||hour<5)&&st.affection>=60)cards.push({icon:'🌙',name:'打烊後留下',desc:'只有深夜與高好感時出現。',fn:'night'});
    if(Number(st.affection||0)>=100){
      const c=typeof cur==='function'?cur():null;
      const rel=c?getNpcRelationship(c,'shopkeeper_cat'):null;
      cards.push({
        icon:'💗',
        name:rel?'特殊關係':'表達心意',
        desc:rel?`目前：${NPC_RELATION_LABELS[rel.type]||rel.type}`:'一路累積的選擇，似乎已經走到某個答案前。',
        fn:'confess'
      });
    }
    body.innerHTML=`<div class="npcChatLimitHint">💬 今日聊天 ${used}/${limit}・每次會隨機遇到不同話題，選擇會影響隱藏關係走向。</div><div class="npcActionGrid">${cards.map(x=>`<button class="npcActionCard" data-npc-action="${x.fn}" ${x.disabled?'disabled':''}><b>${x.icon} ${x.name}</b><span class="small">${x.desc}</span></button>`).join('')}</div>`;
  };

  // 全頁渲染也改成永遠使用最新狀態。
  window.renderNpcShop=function(){
    const st=npcState();npcEnsureDaily(st);saveNpcState(st);
    try{reconcileNpcEventAchievements?.()}catch(e){console.warn(e)}
    try{updateNpcStats()}catch(e){console.warn('NPC stats',e)}
    const body=$id('npcShopBody');if(!body)return;
    if(npcActiveTab==='talk') return renderNpcTalkFresh();
    const fresh=npcState();npcEnsureDaily(fresh);
    if(npcActiveTab==='shop')body.innerHTML=npcRenderShop(fresh);
    else if(npcActiveTab==='rumor')body.innerHTML=npcRenderRumor(fresh);
    else if(npcActiveTab==='story')body.innerHTML=npcRenderStory(fresh);
    else body.innerHTML=npcRenderItems();
  };

  // GM 快速調值後，如果商店正在開著，立即更新心意卡片。
  const oldRunNpcDebug=window.runNpcDebug;
  if(typeof oldRunNpcDebug==='function'){
    window.runNpcDebug=function(action){
      const r=oldRunNpcDebug(action);
      setTimeout(()=>{try{renderNpcShop()}catch(e){console.warn(e)}},30);
      return r;
    };
  }

  // 保險：切回互動頁時刷新最新值。
  document.querySelector('.npcTabs')?.addEventListener('click',()=>setTimeout(()=>{
    if(npcActiveTab==='talk')renderNpcTalkFresh();
  },0));

  setTimeout(()=>{try{updateNpcStats(); if(npcActiveTab==='talk')renderNpcTalkFresh()}catch(e){console.warn('NPC hotfix init',e)}},300);
})();
