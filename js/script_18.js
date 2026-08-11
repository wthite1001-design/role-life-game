
/* === NPC 成就修正 + 店長表情系統 === */
(function(){
  // 1) 活動成就真正加入目前遊戲使用的 protoAch，並加入「活動」頁籤。
  window.fixNpcAchievementRegistry=function(){
    if(typeof protoAch==="undefined"||typeof NPC_EVENT_ACHIEVEMENTS==="undefined")return;
    const existing=new Set(protoAch.filter(Array.isArray).map(a=>a[0]));
    for(const [id,d] of Object.entries(NPC_EVENT_ACHIEVEMENTS)){
      if(existing.has(id))continue;
      const icon=(String(d.name).match(/^(\S+)/)||["","🏆"])[1];
      const title=String(d.name).replace(/^(\S+)\s*/,"");
      protoAch.push([id,icon,title,d.desc,"活動"]);
      existing.add(id);
    }
  };

  fixNpcAchievementRegistry();

  // 修正成就同步：判定後立即保存，並交給既有通知系統處理。
  const oldReconcileNpcEventAchievements=window.reconcileNpcEventAchievements;
  window.reconcileNpcEventAchievements=function(){
    fixNpcAchievementRegistry();
    const c=typeof cur==="function"?cur():null;
    if(!c)return;
    const before={...(c.achievements||{})};
    oldReconcileNpcEventAchievements?.();
    if(typeof ensureSharedAchievements==="function")ensureSharedAchievements();
    // NPC 成就也同步進帳號共用成就池
    if(typeof local!=="undefined"){
      local.sharedAchievements??={};
      for(const id of Object.keys(NPC_EVENT_ACHIEVEMENTS)){
        if(c.achievements?.[id])local.sharedAchievements[id]=1;
      }
      c.achievements=local.sharedAchievements;
    }
    saveLocal?.();

    // 新取得的活動成就照一般成就跳通知
    for(const id of Object.keys(NPC_EVENT_ACHIEVEMENTS)){
      if(c.achievements?.[id]&&!before[id]){
        const a=protoAch.find(x=>Array.isArray(x)&&x[0]===id);
        if(a&&typeof enqueueAchievementToast==="function"){
          enqueueAchievementToast(`${a[1]} ${a[2]}`);
        }
      }
    }
  };

  // 讓主成就頁有「活動」分類。
  const observer=new MutationObserver(()=>{
    const f=document.getElementById("achievementFilters");
    if(!f||f.querySelector('[data-af="活動"]'))return;
    const hidden=f.querySelector('[data-af="隱藏"]');
    const b=document.createElement("button");
    b.type="button"; b.className="achievementCategoryTab"; b.dataset.af="活動"; b.textContent="活動";
    hidden?f.insertBefore(b,hidden):f.appendChild(b);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  // 2) 店長表情：目前沒額外圖片也能運作；之後把同名圖片放進資料夾就會自動切換。
  const NPC_FACE_IMAGES={
    normal:"assets/npc/shopkeeper_cat/normal.png",
    happy:"assets/npc/shopkeeper_cat/happy.png",
    shy:"assets/npc/shopkeeper_cat/shy.png",
    annoyed:"assets/npc/shopkeeper_cat/annoyed.png",
    surprised:"assets/npc/shopkeeper_cat/surprised.png",
    soft:"assets/npc/shopkeeper_cat/soft.png"
  };
  const NPC_FACE_EMOJI={normal:"",happy:"✨",shy:"///",annoyed:"💢",surprised:"！",soft:"♡"};
  const existingCache={normal:true};

  function preloadNpcFace(face){
    if(face==="normal"||existingCache[face]!==undefined)return;
    const im=new Image();
    im.onload=()=>existingCache[face]=true;
    im.onerror=()=>existingCache[face]=false;
    im.src=NPC_FACE_IMAGES[face];
  }
  Object.keys(NPC_FACE_IMAGES).forEach(preloadNpcFace);

  window.setNpcExpression=function(face="normal"){
    const hero=document.querySelector(".npcHero img");
    const story=document.getElementById("npcStoryPortrait");
    const src=existingCache[face]?NPC_FACE_IMAGES[face]:NPC_FACE_IMAGES.normal;
    [hero,story].forEach(img=>{if(img&&img.getAttribute("src")!==src)img.src=src});
    document.querySelectorAll(".npcExpressionBadge").forEach(x=>{
      x.textContent=NPC_FACE_EMOJI[face]||"";
      x.className=`npcExpressionBadge face-${face}`;
    });
  };

  window.npcExpressionFromLine=function(line){
    const t=String(line?.text||"");
    if(/臉紅|耳尖|害羞|別開視線|勾住|想見妳|想見你/.test(t))return"shy";
    if(/笑|開心|歡迎|明天也來|期待|柔和|謝/.test(t))return"happy";
    if(/出去|很煩|閉嘴|不、能|不行|抓包/.test(t))return"annoyed";
    if(/愣住|等等|突然|！|原來/.test(t))return"surprised";
    if(/相信|放心|只屬於|安靜|溫柔|陪|等你/.test(t))return"soft";
    return"normal";
  };

  // RPG 每句台詞自動帶表情。
  const oldRenderNpcRpgLine=window.renderNpcRpgLine;
  window.renderNpcRpgLine=function(){
    oldRenderNpcRpgLine?.();
    const st=window.npcStoryPlayerState;
    const line=st?.lines?.[st.index];
    setNpcExpression(npcExpressionFromLine(line));
  };

  // 商店首頁依好感與狀態改表情。
  const oldUpdateNpcStats=window.updateNpcStats;
  window.updateNpcStats=function(){
    oldUpdateNpcStats?.();
    const st=npcState();
    let face="normal";
    if(st.affection>=80)face="soft";
    else if(st.affection>=40)face="happy";
    setNpcExpression(face);
  };

  // 結束故事恢復商店表情。
  const oldFinishFace=window.finishNpcRpgStory;
  window.finishNpcRpgStory=function(){
    const r=oldFinishFace?.();
    setTimeout(()=>{try{updateNpcStats()}catch(e){}},30);
    return r;
  };

  // 初次進頁就補判定一次。
  setTimeout(()=>{
    try{
      fixNpcAchievementRegistry();
      reconcileNpcEventAchievements();
      updateNpcStats();
    }catch(e){console.warn("NPC init patch",e)}
  },450);
})();
