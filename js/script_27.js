
/* === 3.26.4 Supabase publishable-key / cloud initialization fix === */
(function(){
  const CLOUD_TIMEOUT_MS=10000;

  window.fetchWithTimeout=async function(url,options={},timeout=CLOUD_TIMEOUT_MS){
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),timeout);
    try{
      return await fetch(url,{...options,signal:ctrl.signal});
    }finally{
      clearTimeout(timer);
    }
  };

  /* Replace generic REST API with a timeout and clear errors.
     Publishable key is intentionally only in apikey, not Authorization Bearer. */
  window.api=async function(path,options={}){
    let res;
    try{
      res=await fetchWithTimeout(API+path,{
        ...options,
        headers:{...HEADERS,...(options.headers||{})}
      });
    }catch(e){
      if(e?.name==="AbortError")throw new Error("雲端連線逾時，請稍後再試。");
      throw new Error("無法連線至雲端："+(e?.message||"網路錯誤"));
    }
    const text=await res.text();
    let data=null;
    if(text){try{data=JSON.parse(text)}catch(e){data=text}}
    if(!res.ok){
      console.error("API error",res.status,data);
      let msg=(data&&data.message)||(data&&data.details)||(data&&data.hint)||`Supabase 錯誤 ${res.status}`;
      if(res.status===401)msg="雲端驗證失敗（401）。";
      if(res.status===403)msg="雲端權限被拒絕（403），請檢查 RLS。";
      if(res.status===540)msg="Supabase 專案目前已暫停。";
      throw new Error(msg);
    }
    return data;
  };

  /* RPC used by TEST access gate and referral system. */
  window.publicRpc=async function(name,args={}){
    let res;
    try{
      res=await fetchWithTimeout(`${API}/rpc/${encodeURIComponent(name)}`,{
        method:"POST",
        headers:{
          "apikey":SUPABASE_KEY,
          "Content-Type":"application/json"
        },
        body:JSON.stringify(args||{})
      });
    }catch(e){
      if(e?.name==="AbortError")throw new Error("測試服驗證逾時");
      throw new Error("測試服驗證連線失敗："+(e?.message||"網路錯誤"));
    }
    let text=await res.text(),data=null;
    if(text){try{data=JSON.parse(text)}catch(e){data=text}}
    if(!res.ok)throw new Error(data?.message||data?.hint||data?.details||`驗證失敗 ${res.status}`);
    return data;
  };

  window.testReferralRpc=async function(name,args={}){
    let res;
    try{
      res=await fetchWithTimeout(`${API}/rpc/${encodeURIComponent(name)}`,{
        method:"POST",
        headers:{
          "apikey":SUPABASE_KEY,
          "Content-Type":"application/json"
        },
        body:JSON.stringify(args||{})
      });
    }catch(e){
      if(e?.name==="AbortError")throw new Error("邀請系統連線逾時");
      throw new Error("邀請系統無法連線："+(e?.message||"網路錯誤"));
    }
    let text=await res.text(),data=null;
    if(text){try{data=JSON.parse(text)}catch(e){data=text}}
    if(!res.ok)throw new Error(data?.message||data?.hint||data?.details||`邀請系統連線失敗 ${res.status}`);
    return data;
  };

  /* Cloud health check visible to owner/testers instead of endless "讀取中". */
  window.testCloudHealth=async function(){
    try{
      const res=await fetchWithTimeout(`${API}/test_rooms?select=code&limit=1`,{
        headers:{"apikey":SUPABASE_KEY}
      },7000);
      if(!res.ok){
        let txt=await res.text();
        return {ok:false,status:res.status,message:txt.slice(0,180)};
      }
      return {ok:true,status:res.status,message:"OK"};
    }catch(e){
      return {ok:false,status:0,message:e?.name==="AbortError"?"連線逾時":(e?.message||"連線失敗")};
    }
  };

  async function refreshCloudHealthUI(){
    const health=await testCloudHealth();
    const stats=[document.getElementById("onlinePlayerCount"),document.getElementById("cloudCharacterCount")];
    if(!health.ok){
      for(const el of stats)if(el)el.textContent="!";
      const reward=document.getElementById("testReferralRewardStatus");
      if(reward && /檢查|讀取中|正在/.test(reward.textContent||"")){
        reward.textContent=`⚠️ 雲端連線異常：${health.status?`HTTP ${health.status}・`:""}${health.message}`;
      }
    }
    return health;
  }
  window.refreshCloudHealthUI=refreshCloudHealthUI;

  /* Protect "enter character" from an unhandled cloud exception.
     Local character page should still open; cloud relationship features can show offline state. */
  document.addEventListener("click",e=>{
    const btn=e.target.closest("[data-enter],button");
    if(!btn)return;
    const isEnter=btn.dataset?.enter || (btn.textContent||"").trim()==="進入";
    if(!isEnter)return;
    setTimeout(()=>{
      refreshCloudHealthUI().catch(()=>{});
    },50);
  },true);

  /* Replace endless referral loading with guaranteed success/error state. */
  const oldLoadReferral=window.loadTestReferralPanel;
  if(typeof oldLoadReferral==="function"){
    window.loadTestReferralPanel=async function(){
      const code=document.getElementById("testMyReferralCode");
      const reward=document.getElementById("testReferralRewardStatus");
      if(code)code.textContent="讀取中……";
      if(reward)reward.textContent="正在檢查……";
      try{
        await Promise.race([
          oldLoadReferral(),
          new Promise((_,rej)=>setTimeout(()=>rej(new Error("邀請系統讀取逾時")),10000))
        ]);
      }catch(e){
        if(code)code.textContent="讀取失敗";
        if(reward)reward.textContent="⚠️ "+(e?.message||"邀請系統讀取失敗");
      }
    };
  }

  /* Public stats should never stay as em-dash forever. */
  const oldRefreshStats=window.refreshPublicStats;
  if(typeof oldRefreshStats==="function"){
    window.refreshPublicStats=async function(){
      try{
        await Promise.race([
          oldRefreshStats(),
          new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),9000))
        ]);
      }catch(e){
        const a=document.getElementById("onlinePlayerCount");
        const b=document.getElementById("cloudCharacterCount");
        if(a)a.textContent="!";
        if(b)b.textContent="!";
      }
    };
  }

  /* Gate: clear status instead of hanging forever. */
  const oldRedeem=window.redeemTestInvite;
  if(typeof oldRedeem==="function"){
    window.redeemTestInvite=async function(){
      const st=document.getElementById("testGateStatus");
      try{
        await Promise.race([
          oldRedeem(),
          new Promise((_,rej)=>setTimeout(()=>rej(new Error("測試碼驗證逾時，請檢查雲端連線。")),11000))
        ]);
      }catch(e){
        if(st)st.textContent="❌ "+(e?.message||"驗證失敗");
      }
    };
    const redeem=document.getElementById("testRedeemBtn");
    if(redeem){
      const clone=redeem.cloneNode(true);
      redeem.replaceWith(clone);
      clone.addEventListener("click",()=>window.redeemTestInvite());
    }
  }

  setTimeout(()=>refreshCloudHealthUI().catch(()=>{}),800);
  setTimeout(()=>{
    try{ window.refreshPublicStats?.().catch?.(()=>{}); }catch(e){}
    try{ window.loadTestReferralPanel?.().catch?.(()=>{}); }catch(e){}
  },1200);
})();
