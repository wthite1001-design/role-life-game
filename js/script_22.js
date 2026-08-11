
/* === 3.26 TEST Hotfix: shop purchase / hero dialogue / one-month activity / date simulator / stability === */
(function(){
  const EVENT_START = Date.parse("2026-08-18T00:00:00+08:00");
  const EVENT_END   = Date.parse("2026-09-18T00:00:00+08:00"); // exclusive
  const TEST_TIME_KEY="role_life_test_fake_now_v1";

  function testNowMs(){
    const x=Number(localStorage.getItem(TEST_TIME_KEY)||0);
    return Number.isFinite(x)&&x>0 ? x : Date.now();
  }
  function testNow(){ return new Date(testNowMs()); }
  function activityActive(){
    const n=testNowMs();
    return n>=EVENT_START && n<EVENT_END;
  }
  window.testNowMs=testNowMs;
  window.testNow=testNow;
  window.npcEventIsActive=activityActive;
  window.launchEventIsActive=activityActive;

  /* ---------- one-month event visibility ---------- */
  function enforceEventVisibility(){
    const active=activityActive();
    const inGame=!!document.getElementById("game") && !document.getElementById("game").classList.contains("hidden");

    const launch=document.getElementById("launchActivityFab");
    if(launch) launch.classList.toggle("hidden", !(active&&inGame));

    const npc=document.getElementById("npcTownFab");
    if(npc) npc.classList.toggle("hidden", !(active&&inGame));

    if(!active){
      document.getElementById("launchActivityModal")?.classList.add("hidden");
      document.getElementById("npcShopModal")?.classList.add("hidden");
    }

    const hint=document.getElementById("npcEventPeriodHint");
    if(hint){
      hint.textContent=`🎊 限定活動：2026/08/18 ～ 2026/09/17・${active?"活動進行中":"活動已結束，入口已關閉"}`;
    }
  }
  window.enforceEventVisibility=enforceEventVisibility;

  /* Override launch activity time checks to use simulated clock. */
  window.updateLaunchActivityFab=function(){
    enforceEventVisibility();
    const st=typeof launchState==="function"?launchState():{lastSeenTotal:0};
    const count=typeof launchCompletionCounts==="function"?launchCompletionCounts():{total:0};
    const dot=document.getElementById("launchActivityDot");
    if(dot) dot.classList.toggle("hidden",count.total<=0||st.lastSeenTotal===count.total);
  };

  const oldRenderLaunch=window.renderLaunchActivity;
  if(typeof oldRenderLaunch==="function"){
    window.renderLaunchActivity=function(){
      if(!activityActive()){
        document.getElementById("launchActivityModal")?.classList.add("hidden");
        enforceEventVisibility();
        return;
      }
      oldRenderLaunch();
      const remain=Math.max(0,EVENT_END-testNowMs());
      const days=Math.floor(remain/86400000),hours=Math.floor(remain%86400000/3600000);
      const cd=document.getElementById("launchActivityCountdown");
      if(cd)cd.textContent=`活動期間：8/18～9/17・剩餘 ${days} 天 ${hours} 小時`;
    };
  }

  window.openLaunchActivity=async function(){
    if(!activityActive())return toast?.("🎊 開服活動已結束。",3000);
    try{ await evaluateLaunchActivity?.(true); }catch(e){console.warn(e)}
    const st=launchState?.(),count=launchCompletionCounts?.();
    if(st&&count){st.lastSeenTotal=count.total;saveLaunchState?.(st)}
    document.getElementById("launchActivityDot")?.classList.add("hidden");
    document.getElementById("launchActivityModal")?.classList.remove("hidden");
    renderLaunchActivity?.();
  };

  /* Existing click listener was bound to old function; capture phase guarantees expiry. */
  document.addEventListener("click",e=>{
    if(e.target.closest("#launchActivityFab")&&!activityActive()){
      e.preventDefault();e.stopImmediatePropagation();
      enforceEventVisibility();
      toast?.("🎊 開服活動已結束。",3000);
    }
    if(e.target.closest("#npcTownFab")&&!activityActive()){
      e.preventDefault();e.stopImmediatePropagation();
      enforceEventVisibility();
      toast?.("🏪 限定 NPC 活動已結束。",3000);
    }
  },true);

  /* ---------- robust NPC shop purchase ---------- */
  const SHOP_ITEMS={
    npc_crystal_chip:{id:"npc_crystal_chip",name:"💎 紫晶碎片",price:90},
    npc_cat_cookie:{id:"npc_cat_cookie",name:"🐾 貓掌餅乾",price:60},
    npc_lucky_bell:{id:"npc_lucky_bell",name:"🔔 小幸運鈴",price:140},
    npc_regular_box:{id:"npc_regular_box",name:"🎁 熟客小盒",price:220},
    npc_under_counter:{id:"npc_under_counter",name:"🔐 櫃檯下的黑盒",price:666}
  };

  function robustNpcBuy(id){
    if(!activityActive())return toast?.("🏪 限定 NPC 活動已結束，無法購買。",3200);
    const item=SHOP_ITEMS[id];
    if(!item)return toast?.("找不到這項商品。",3000);
    const c=typeof cur==="function"?cur():null;
    if(!c)return toast?.("請先進入角色再購買。",3000);

    c.inventory??={};
    let st=typeof npcState==="function"?npcState():null;
    if(!st)return toast?.("NPC 商店資料讀取失敗。",3200);

    st.dailyPurchases??={date:typeof npcToday==="function"?npcToday():new Date().toDateString(),items:{}};
    st.dailyPurchases.items??={};

    if(id==="npc_cat_cookie"){
      const used=Number(st.dailyPurchases.items[id]||0);
      if(used>=2)return toast?.("🐾 貓掌餅乾今天已經買滿 2 個了。",3200);
    }
    if(id==="npc_under_counter" && Number(c.inventory[id]||0)>0)
      return toast?.("🔐 黑盒只能購買一次。",3200);

    const money=Math.max(0,Number(c.money||0));
    if(money<item.price)return toast?.(`🪙 金幣不夠，需要 ${item.price}。`,3200);

    // Commit atomically after all validation.
    c.money=Math.max(0,Math.min(999999999,money-item.price));
    c.inventory[id]=Math.max(0,Number(c.inventory[id]||0))+1;

    st.purchaseCount=Math.max(0,Number(st.purchaseCount||0))+1;
    st.loyalty=Math.max(0,Number(st.loyalty||0))+1;
    st.purchasedIds??=[];
    if(!st.purchasedIds.includes(id))st.purchasedIds.push(id);
    if(id==="npc_cat_cookie")
      st.dailyPurchases.items[id]=Number(st.dailyPurchases.items[id]||0)+1;
    if(st.purchaseCount%5===0)
      st.affection=Math.max(0,Math.min(100,Number(st.affection||0)+1));

    try{saveNpcState?.(st)}catch(e){console.warn("save npc",e)}
    try{saveLocal?.()}catch(e){console.warn("save local",e)}
    try{npcCheckUnlocks?.(st)}catch(e){}
    try{renderGame?.()}catch(e){}
    try{renderNpcShop?.()}catch(e){}
    try{updateNpcStats?.()}catch(e){}
    try{reconcileNpcEventAchievements?.()}catch(e){}

    toast?.(`🛍️ 買下 ${item.name}・熟客度 +1`,2800);
  }
  window.robustNpcBuy=robustNpcBuy;

  /* Intercept old lexical npcBuy handler, which could bypass newer wrappers. */
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-npc-buy]");
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    robustNpcBuy(b.dataset.npcBuy);
  },true);

  /* ---------- shop hero: image + visible dialogue switch together ---------- */
  const HERO_TAPS=[
    {face:"happy",text:"你來啦。今天想看看什麼？"},
    {face:"shy",text:"……你一直看著我，是有什麼事嗎？"},
    {face:"annoyed",text:"再盯著我看，我就要收參觀費了喔。"},
    {face:"surprised",text:"咦？今天不是來買東西的？"},
    {face:"soft",text:"今天也來了啊……嗯，我有注意到。"},
    {face:"normal",text:"慢慢看吧，有需要再叫我。"},
    {face:"happy",text:"偷偷告訴你，今天有一樣東西我覺得很適合你。"},
    {face:"shy",text:"只是剛好記得你喜歡什麼而已，別想太多。"}
  ];
  let heroTapIndex=0;

  function heroDialogueNode(){
    return document.querySelector(".npcHero .npcHeroShade .small")
      || document.querySelector(".npcHeroShade .small")
      || document.querySelector(".npcHero .small");
  }
  function heroTap(ev){
    const hero=document.querySelector(".npcHero");
    if(!hero||!hero.contains(ev.target))return;
    if(ev.target.closest("button,a,input,select,textarea"))return;
    const isImg=!!ev.target.closest("img");
    const line=heroDialogueNode();
    const isLine=!!line&&(ev.target===line||line.contains(ev.target));
    if(!isImg&&!isLine)return;

    ePrevent(ev);
    const item=HERO_TAPS[heroTapIndex++%HERO_TAPS.length];
    try{setNpcExpression?.(item.face)}catch(e){}
    if(line){
      line.textContent=`「${item.text}」`;
      line.classList.remove("npcTapPulse");
      void line.offsetWidth;
      line.classList.add("npcTapPulse");
    }
  }
  function ePrevent(ev){ev.preventDefault();ev.stopImmediatePropagation();}
  document.addEventListener("click",heroTap,true);

  /* ---------- stability guards for historical issues ---------- */
  window.safeSetText=function(id,text){
    const el=typeof id==="string"?document.getElementById(id):id;
    if(el)el.textContent=text??"";
    return el;
  };
  window.clampGameValue=function(v,min=0,max=100){
    v=Number(v);if(!Number.isFinite(v))v=min;
    return Math.max(min,Math.min(max,v));
  };

  /* ---------- TEST date simulator ---------- */
  function makeDateTester(){
    if(document.getElementById("testDateSimulator"))return;
    const box=document.createElement("div");
    box.id="testDateSimulator";
    box.className="card";
    box.style.cssText="position:fixed;left:10px;right:10px;bottom:10px;z-index:5000;max-width:480px;margin:auto;padding:10px;background:#fffdfd;border:1px solid #d9cce2;box-shadow:0 8px 25px #0003";
    box.innerHTML=`
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
        <b>🧪 活動日期測試</b>
        <button id="closeDateSimulator" style="min-height:32px;padding:4px 9px">×</button>
      </div>
      <div id="testDateNow" class="small"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px">
        <button data-test-date="2026-08-17T12:00:00+08:00">8/17 活動前</button>
        <button data-test-date="2026-08-18T12:00:00+08:00">8/18 活動中</button>
        <button data-test-date="2026-09-17T20:00:00+08:00">9/17 結束前</button>
        <button data-test-date="2026-09-18T00:01:00+08:00">9/18 活動後</button>
        <button id="resetTestDate" style="grid-column:1/-1">🕒 恢復真實時間</button>
      </div>`;
    document.body.appendChild(box);

    const update=()=>{
      const fake=Number(localStorage.getItem(TEST_TIME_KEY)||0);
      const el=document.getElementById("testDateNow");
      if(el)el.textContent=`目前判定時間：${testNow().toLocaleString("zh-TW")} ${fake?"（模擬）":"（真實）"}・活動${activityActive()?"✅開放":"⛔關閉"}`;
      enforceEventVisibility();
      try{renderLaunchActivity?.()}catch(e){}
      try{renderNpcShop?.()}catch(e){}
    };
    box.addEventListener("click",e=>{
      const b=e.target.closest("[data-test-date]");
      if(b){
        localStorage.setItem(TEST_TIME_KEY,String(new Date(b.dataset.testDate).getTime()));
        update();return;
      }
      if(e.target.closest("#resetTestDate")){
        localStorage.removeItem(TEST_TIME_KEY);update();return;
      }
      if(e.target.closest("#closeDateSimulator"))box.classList.add("hidden");
    });
    update();
  }
  window.openTestDateSimulator=function(){
    makeDateTester();
    document.getElementById("testDateSimulator")?.classList.remove("hidden");
  };

  // Add a compact button to settings if present, otherwise GM/debug area.
  function installDateTestButton(){
    if(document.getElementById("openTestDateSimulator"))return;
    const btn=document.createElement("button");
    btn.id="openTestDateSimulator";
    btn.type="button";
    btn.textContent="🧪 測試活動日期";
    btn.style.cssText="width:100%;margin-top:8px";
    btn.addEventListener("click",openTestDateSimulator);
    const target=document.getElementById("extraSettings")
      ||document.getElementById("extraGM")
      ||document.querySelector(".npcRelationIntro")?.parentElement;
    if(target)target.appendChild(btn);
  }

  /* Replace visible date text in NPC helper. */
  window.npcEventPeriodText=function(){return "🎊 限定 NPC 活動：2026/08/18 ～ 2026/09/17";};
  window.refreshNpcEventPeriodHint=function(){enforceEventVisibility();};

  /* Poll only for visibility/date simulation; does not award anything. */
  setInterval(enforceEventVisibility,1000);
  setTimeout(()=>{installDateTestButton();enforceEventVisibility();},400);
})();
