
/* === 3.26.1 activity-entry flicker fix === */
(function(){
  const TEST_TIME_KEY="role_life_test_fake_now_v1";
  const DEFAULT_TEST_DATE="2026-08-18T12:00:00+08:00";
  const INIT_KEY="role_life_test_activity_clock_initialized_v1";

  /* 測試服第一次進新版時，預設模擬活動開啟日，方便立即測試。
     玩家若按「恢復真實時間」，之後不會再次自動改回模擬時間。 */
  if(localStorage.getItem(INIT_KEY)!=="1"){
    if(!localStorage.getItem(TEST_TIME_KEY)){
      localStorage.setItem(TEST_TIME_KEY,String(new Date(DEFAULT_TEST_DATE).getTime()));
    }
    localStorage.setItem(INIT_KEY,"1");
  }

  function isGameOpen(){
    const game=document.getElementById("game");
    return !!game && !game.classList.contains("hidden");
  }

  window.enforceEventVisibility=function(){
    const active=typeof npcEventIsActive==="function"?npcEventIsActive():false;
    const show=active && isGameOpen();

    const launch=document.getElementById("launchActivityFab");
    const npc=document.getElementById("npcTownFab");

    [launch,npc].forEach(el=>{
      if(!el)return;
      el.classList.toggle("activityEntryVisible",show);
      /* 清掉舊控制器留下的 hidden，真正顯示交給 activityEntryVisible。 */
      el.classList.remove("hidden");
      el.setAttribute("aria-hidden",show?"false":"true");
      el.style.pointerEvents=show?"auto":"none";
    });

    document.body.classList.toggle("launch-game-open",isGameOpen());

    if(!active){
      document.getElementById("launchActivityModal")?.classList.add("hidden");
      document.getElementById("npcShopModal")?.classList.add("hidden");
    }

    const hint=document.getElementById("npcEventPeriodHint");
    if(hint){
      const fake=Number(localStorage.getItem(TEST_TIME_KEY)||0)>0;
      hint.textContent=`🎊 限定活動：2026/08/18 ～ 2026/09/17・${active?"活動進行中":"目前未開放"}${fake?"（測試日期）":""}`;
    }
  };

  /* 舊 NPC sync 每 1.5 秒仍會被 interval 呼叫，所以把它變成只呼叫單一控制器。 */
  window.syncNpcFab=function(){
    enforceEventVisibility();
  };

  /* 舊開服活動顯示函式也只交給單一控制器。 */
  window.updateLaunchActivityFab=function(){
    enforceEventVisibility();
    try{
      const st=launchState?.();
      const count=launchCompletionCounts?.();
      const dot=document.getElementById("launchActivityDot");
      if(dot&&st&&count)dot.classList.toggle("hidden",count.total<=0||st.lastSeenTotal===count.total);
    }catch(e){}
  };

  /* 如果舊 interval/函式在我們之後又加 hidden，觀察器立即矯正，不再肉眼閃爍。 */
  const observer=new MutationObserver(muts=>{
    let relevant=false;
    for(const m of muts){
      if(m.type==="attributes" && (m.target.id==="npcTownFab"||m.target.id==="launchActivityFab")){
        relevant=true;break;
      }
    }
    if(relevant){
      const active=typeof npcEventIsActive==="function"?npcEventIsActive():false;
      const show=active&&isGameOpen();
      for(const id of ["npcTownFab","launchActivityFab"]){
        const el=document.getElementById(id);if(!el)continue;
        if(show){
          el.classList.remove("hidden");
          el.classList.add("activityEntryVisible");
          el.style.pointerEvents="auto";
        }else{
          el.classList.remove("activityEntryVisible");
          el.style.pointerEvents="none";
        }
      }
    }
  });
  for(const id of ["npcTownFab","launchActivityFab"]){
    const el=document.getElementById(id);
    if(el)observer.observe(el,{attributes:true,attributeFilter:["class","style"]});
  }

  /* 日期模擬器按鈕切換後立即更新兩個入口。 */
  document.addEventListener("click",e=>{
    if(e.target.closest("[data-test-date],#resetTestDate")){
      setTimeout(enforceEventVisibility,0);
      setTimeout(enforceEventVisibility,80);
    }
  },true);

  /* 開頁、進出角色頁、切頁時同步。 */
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)enforceEventVisibility()});
  window.addEventListener("pageshow",enforceEventVisibility);
  setTimeout(enforceEventVisibility,50);
  setTimeout(enforceEventVisibility,400);
  setTimeout(enforceEventVisibility,1200);
})();
