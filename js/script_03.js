
const PENDING_EVENT_TTL=3*60*60*1000;
let pendingEventRows=[],globalRealtimeBusy=false;

function roomOtherName(code,c){
  let rr=relationshipSummaries?.[String(code)];
  if(!rr)return "關係角色";
  let o=rr.host_char===c.id?rr.guest_state:rr.host_state;
  return o?.name||"關係角色";
}
function isFreshCreatedAt(v){
  let t=Date.parse(v||"");return Number.isFinite(t)&&(Date.now()-t)<=PENDING_EVENT_TTL;
}


const DAILY_RELATION_GIFT_LIMIT=5;
function ensureGiftSendCounter(c){
  c.dailyGiftSend??={date:"",used:0};
  let k=todayKey();
  if(c.dailyGiftSend.date!==k)c.dailyGiftSend={date:k,used:0};
  return c.dailyGiftSend;
}
function giftSendLeft(c){let x=ensureGiftSendCounter(c);return Math.max(0,DAILY_RELATION_GIFT_LIMIT-Number(x.used||0))}
function affectionGiftInfo(id){return affectionGiftShop.find(x=>x.id===id)||null}
function relationGiftOptions(c){
  if(!c)return [];
  return affectionGiftShop
    .filter(i=>Number(c.inventory?.[i.id]||0)>0)
    .map(i=>({
      id:i.id,
      n:Number(c.inventory?.[i.id]||0),
      name:i.n,
      affinity:Number(i.affinity||0)
    }));
}
function renderRelationGiftPanel(c){
  let panel=document.getElementById("relationGiftPanel"),sel=document.getElementById("relationGiftItem"),
      hint=document.getElementById("relationGiftHint");
  if(!panel||!sel||!c)return;
  let show=!!room&&!!partner;
  panel.classList.toggle("hidden",!show);
  if(!show)return;
  let items=relationGiftOptions(c);
  sel.innerHTML=items.length
    ?items.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}（持有 ${x.n}）</option>`).join("")
    :'<option value="">背包沒有可以送的物品</option>';
  let btn=document.getElementById("sendRelationGift");if(btn)btn.disabled=!items.length;
  let left=giftSendLeft(c);
  if(hint)hint.textContent=items.length?`今日還能送 ${left}/${DAILY_RELATION_GIFT_LIMIT} 次。送給 ${partner?.name||"對方"}後會直接消耗，並立即增加羈絆。`:"先到商店的「🎁 好感禮物」頁籤買一些禮物吧。";
  let sendBtn=document.getElementById("sendRelationGift");if(sendBtn)sendBtn.disabled=!items.length||left<=0;
}
async function sendRelationGift(){
  let c=cur();if(!c||!room||!partner)return toast("請先開啟一段已有對方的關係");
  let itemId=document.getElementById("relationGiftItem")?.value;
  let count=Math.max(1,Math.min(5,Number(document.getElementById("relationGiftCount")?.value)||1));
  if(!itemId)return toast("請選擇要送的好感禮物");

  let giftInfo=affectionGiftInfo(itemId);
  if(!giftInfo)return toast("只有「好感禮物」可以送給關係人。");
  if(Number(c.inventory?.[itemId]||0)<count)return toast("好感禮物數量不足");
  if(giftSendLeft(c)<=0)return toast("今天已經送過 5 次禮物了，明天 00:00 恢復。");

  let target=room.host_char===c.id?room.guest_char:room.host_char;
  let itemName=giftInfo.n||itemDisplayName(itemId);
  let affinity=Number(giftInfo.affinity||0);
  let totalAffinity=Math.max(0,affinity*count);

  if(!confirm(`確定要送給 ${partner.name||"對方"}？\n\n${itemName} ×${count}${totalAffinity?`\n送出成功後共同羈絆 +${totalAffinity}`:""}`))return;

  // Step 1: only this part determines whether "sending" succeeded.
  try{
    await api("/test_interactions",{
      method:"POST",
      body:JSON.stringify({
        room_code:room.code,
        from_char:c.id,
        to_char:target,
        text:`GIFT_SEND|${itemId}|${count}|${encodeURIComponent(itemName)}|${affinity}`
      })
    });

    // 羈絆在「送出成功」當下就成立；這筆紀錄不會因對方領取而消失。
    await api("/test_interactions",{
      method:"POST",
      body:JSON.stringify({
        room_code:room.code,
        from_char:c.id,
        to_char:target,
        text:`GIFT_BOND|${itemId}|${count}|${encodeURIComponent(itemName)}|${affinity}`
      })
    });
  }catch(e){
    toast("送禮物失敗："+(e?.message||"雲端寫入失敗"),4500);
    return;
  }

  // Step 2: cloud send succeeded, now consume the item exactly once.
  let before=Number(c.inventory?.[itemId]||0);
  c.inventory[itemId]=Math.max(0,before-count);
  if(c.inventory[itemId]<=0)delete c.inventory[itemId];

  let ctr=ensureGiftSendCounter(c);
  ctr.used=Number(ctr.used||0)+1;

  c.stats??={};
  c.stats.giftsSent=(c.stats.giftsSent||0)+1;
  c.achievements??={};
  if(c.stats.giftsSent>=1)c.achievements.gift1=1;
  if(c.stats.giftsSent>=10)c.achievements.gift10=1;

  c.relationshipEvents??={};
  c.relationshipEvents[room.code]??=[];
  c.relationshipEvents[room.code].push({
    id:`gift-${Date.now()}-${itemId}`,
    title:`送給 ${partner.name||"對方"}「${itemName}」`,
    choice:`${itemName} ×${count}`,
    result:totalAffinity?`共同羈絆 +${totalAffinity}`:"送出了一份禮物",
    icon:"🎁",
    createdAt:new Date().toISOString(),
    time:new Date().toLocaleString("zh-TW")
  });
  c.relationshipEvents[room.code]=c.relationshipEvents[room.code].slice(-50);

  logJournal(c,`送給 ${partner.name||"對方"}：${itemName} ×${count}${totalAffinity?`・共同羈絆 +${totalAffinity}`:""}`,"🎁");

  let saved=saveLocal();
  if(!saved){
    // If local save fails, restore the in-memory item so the player isn't silently charged.
    c.inventory[itemId]=before;
    ctr.used=Math.max(0,Number(ctr.used||0)-1);
    toast("⚠️ 禮物已送到對方，但本機存檔失敗；道具已先恢復，請重新整理後確認。",5500);
    return;
  }

  // 羈絆在送出後立即更新，不等待對方領取。
  await refreshBond(room.code).catch(e=>console.warn("送禮羈絆刷新",e));

  // Step 3: UI refresh is cosmetic and must never turn a successful send into a failure.
  safeCall(()=>renderExtras(c),"送禮後刷新");
  safeCall(()=>renderRelationGiftPanel(c),"送禮面板刷新");
  safeCall(()=>renderRelationEventLog(),"送禮紀錄刷新");
  safeCall(()=>safeRenderGame(),"角色畫面刷新");

  toast(`🎁 已送出 ${itemName} ×${count}・今日剩餘 ${giftSendLeft(c)} 次`,4200);
}
async function clearLegacyGiftNotice(ev){
  // 舊版曾把送禮做成「待領取」。3.23 起好感禮物是消耗品，
  // 舊通知只清除，不再把禮物加入收件人的背包。
  if(!ev?.row?.id)return;
  try{
    await api(`/test_interactions?id=eq.${encodeURIComponent(ev.row.id)}`,{method:"DELETE"});
  }catch(e){}
}
document.getElementById("sendRelationGift")?.addEventListener("click",sendRelationGift);
async function fetchPendingEvents(c){
  if(!c)return [];
  let rows=[];
  for(const code of c.roomCodes||[]){
    try{
      let ints=await api(`/test_interactions?room_code=eq.${encodeURIComponent(code)}&to_char=eq.${encodeURIComponent(c.id)}&select=*&order=created_at.desc&limit=30`);
      for(const x of ints||[]){
        let text=String(x.text||"");
        const persistentRelationDecision=text.startsWith("RELATION_SLOT_REQUEST|")||text.startsWith("RELATION_SLOT_RESULT|");
        if(!persistentRelationDecision&&!isFreshCreatedAt(x.created_at))continue;
        if(text.startsWith("OUTING_INVITE|"))rows.push({kind:"outing",id:x.id,code:String(code),created_at:x.created_at,row:x});
        if(text.startsWith("GAME_INVITE|"))rows.push({kind:"game",id:x.id,code:String(code),created_at:x.created_at,row:x});
        if(text.startsWith("RELATION_SLOT_REQUEST|"))rows.push({kind:"slot_request",id:x.id,code:String(code),created_at:x.created_at,row:x});
        if(text.startsWith("RELATION_SLOT_RESULT|"))rows.push({kind:"slot_result",id:x.id,code:String(code),created_at:x.created_at,row:x});
        // GIFT_SEND 是已消耗的好感禮物通知，不需要對方領取。
      }
      let msgs=await api(`/test_messages?room_code=eq.${encodeURIComponent(code)}&select=*&order=created_at.desc&limit=10`);
      let incoming=(msgs||[]).filter(x=>x.from_char!==c.id&&isFreshCreatedAt(x.created_at));
      if(incoming.length){
        let latest=incoming[0];
        let seen=Number(c.pendingMessageSeen?.[String(code)]||0);
        let ts=Date.parse(latest.created_at||"");
        if(ts>seen)rows.push({kind:"message",id:latest.id||`${code}-${ts}`,code:String(code),created_at:latest.created_at,row:latest});
      }
    }catch(e){console.warn("pending events room",code,e)}
  }
  ensureTransformState(c);
  // A "再想想" relation transform stays pending. When the bond enters a new stage,
  // the old pending choice is replaced by a fresh current-stage choice.
  for(const [key,p] of Object.entries(c.pendingRelationTransforms||{})){
    let current=currentTransformStage(p.code);
    if(current!==Number(p.stage)){
      delete c.pendingRelationTransforms[key];
      let rr=relationshipSummaries?.[p.code];
      let targets=rr?(relationTransformRules[rr.relation]||[]):[];
      if(current>=2&&targets.length){
        let nk=transformDecisionKey(p.code,current);
        c.pendingRelationTransforms[nk]={code:String(p.code),from:rr.relation,to:targets[0],stage:current,createdAt:new Date().toISOString()};
      }
      saveLocal();
      continue;
    }
    rows.push({kind:"transform",id:key,code:String(p.code),created_at:p.createdAt||new Date().toISOString(),transform:p});
  }
  rows.sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
  return rows;
}
async function renderPendingEvents(c){
  let box=document.getElementById("pendingEventList"),count=document.getElementById("pendingEventCount");
  if(!box||!c)return;
  pendingEventRows=await fetchPendingEvents(c);
  if(count)count.textContent=pendingEventRows.length?`(${pendingEventRows.length})`:"";
  if(!pendingEventRows.length){box.innerHTML='<div class="muted">目前沒有未處理事件。</div>';return}
  box.innerHTML=pendingEventRows.map((e,i)=>{
    let name=roomOtherName(e.code,c),ago=Math.max(0,Math.floor((Date.now()-Date.parse(e.created_at))/60000));
    if(e.kind==="message")return `<div class="pendingEventCard" data-pidx="${i}"><div class="pendingTop"><b>💬 你的${esc(name)}傳了訊息給你</b><span class="small">${ago} 分前</span></div><div class="small">${esc(String(e.row.text||"").slice(0,80))}</div><div class="pendingActions"><button data-pending-open="${i}">查看訊息</button></div></div>`;
    if(e.kind==="outing")return `<div class="pendingEventCard" data-pidx="${i}"><div class="pendingTop"><b>💌 你的${esc(name)}有外出邀約你喔！</b><span class="small">${ago} 分前</span></div><div class="pendingActions"><button data-pending-open="${i}">處理邀約</button></div></div>`;
    if(e.kind==="transform"){
      let p=e.transform;
      if(p.waitingSlot)return `<div class="pendingEventCard" data-pidx="${i}"><div class="pendingTop"><b>⏳ 等待關係位置決定</b><span class="small">第 ${Number(p.stage)+1} 階</span></div><div class="small">${relationLabel(p.from)} → ${relationLabel(p.to)}，正在等待目前的「${relationLabel(p.to)}」本人回覆。</div></div>`;
      return `<div class="pendingEventCard" data-pidx="${i}"><div class="pendingTop"><b>🔄 待決定的關係轉換</b><span class="small">第 ${Number(p.stage)+1} 階</span></div><div class="small">${p.chooseLater?`${esc(name)}・目前維持「${relationLabel(p.from)}」，尚未選擇轉換方向。`:`${esc(name)}・${relationLabel(p.from)} → ${relationLabel(p.to)}`}</div><div class="pendingActions"><button data-pending-open="${i}">前往處理</button></div></div>`;
    }
    if(e.kind==="slot_request"){
      let q=String(e.row.text||"").split("|"),from=q[2],to=q[3];
      return `<div class="pendingEventCard" data-pidx="${i}"><div class="pendingTop"><b>⚠️ 關係位置請求</b><span class="small">需要你決定</span></div><div class="small">${esc(name)}想讓另一段關係轉成「${relationLabel(to)}」，但目前這個位置是你。是否願意解除你們現在的「${relationLabel(to)}」關係？</div><div class="pendingActions"><button data-pending-open="${i}">本人決定</button></div></div>`;
    }
    if(e.kind==="slot_result"){
      let q=String(e.row.text||"").split("|"),to=q[3],result=q[5];
      return `<div class="pendingEventCard" data-pidx="${i}"><div class="pendingTop"><b>${result==="accepted"?"✅ 對方同意解除關係":"❌ 對方不同意更換"}</b></div><div class="small">${result==="accepted"?`「${relationLabel(to)}」位置已釋出，系統正在完成你的關係轉換。`:"這次關係轉換已取消，原本所有關係維持不變。"}</div><div class="pendingActions"><button data-pending-open="${i}">確認</button></div></div>`;
    }
    return `<div class="pendingEventCard" data-pidx="${i}"><div class="pendingTop"><b>🎮 你的${esc(name)}邀請你玩小遊戲！</b><span class="small">${ago} 分前</span></div><div class="pendingActions"><button data-pending-open="${i}">立即回覆</button></div></div>`;
  }).join("");
}
async function showGlobalGameInvite(ev){
  let c=cur();if(!c||!ev)return;
  let p=String(ev.row.text||"").split("|"),type=p[1],g=miniGames[type];
  pendingGlobalGameInvite={id:ev.row.id,type,roomCode:ev.code,from:ev.row.from_char};
  let name=roomOtherName(ev.code,c);
  gameInviteBody.innerHTML=`<b>${esc(name)}</b> 邀請你玩<br><h3 style="margin:8px 0">${g?.icon||"🎮"} ${esc(g?.name||type)}</h3><div class="small">${esc(g?.desc||"雙人小遊戲")}<br>接受後會立即開始作答，不需要切換關係。</div>`;
  gameInviteModal.classList.remove("hidden");
}
async function pollGlobalRealtime(){
  if(globalRealtimeBusy)return;
  let c=cur();if(!c)return;
  globalRealtimeBusy=true;
  try{
    await renderPendingEvents(c);

    // Incoming game invite: immediate modal regardless of currently opened relationship.
    let incoming=pendingEventRows.find(x=>x.kind==="game");
    if(incoming&&!pendingGlobalGameInvite&&!gameInviteModal.classList.contains("hidden")){}
    else if(incoming&&!pendingGlobalGameInvite)await showGlobalGameInvite(incoming);

    // If an invite being shown was cancelled/deleted by the sender, close it immediately.
    if(pendingGlobalGameInvite){
      let rows=await api(`/test_interactions?id=eq.${encodeURIComponent(pendingGlobalGameInvite.id)}&select=id`);
      if(!rows.length){
        gameInviteModal.classList.add("hidden");
        pendingGlobalGameInvite=null;
      }
    }

    // Sender waiting flow.
    if(pendingOutgoingGameInvite){
      let p=pendingOutgoingGameInvite;
      let still=await api(`/test_interactions?id=eq.${encodeURIComponent(p.id)}&select=id`);
      let signals=await api(`/test_interactions?room_code=eq.${encodeURIComponent(p.roomCode)}&to_char=eq.${encodeURIComponent(c.id)}&select=*&order=created_at.desc&limit=20`);
      let start=signals.find(x=>String(x.text||"").startsWith(`GAME_START|${p.type}|`));
      let decline=signals.find(x=>String(x.text||"").startsWith(`GAME_DECLINE|${p.type}|`));
      if(start){
        let sp=String(start.text).split("|");
        try{await api(`/test_interactions?id=eq.${encodeURIComponent(start.id)}`,{method:"DELETE"})}catch(e){}
        let rs=await api(`/test_rooms?code=eq.${encodeURIComponent(p.roomCode)}&select=*`);
        gameRoomContext=rs?.[0]||null;
        gameWaitModal.classList.add("hidden");
        pendingOutgoingGameInvite=null;
        openGameSession(sp[2],p.type);
      }else if(decline){
        try{await api(`/test_interactions?id=eq.${encodeURIComponent(decline.id)}`,{method:"DELETE"})}catch(e){}
        gameWaitModal.classList.add("hidden");
        pendingOutgoingGameInvite=null;
        toast(`${p.name||"對方"}婉拒了小遊戲邀請。`);
      }else if(!still.length){
        gameWaitModal.classList.add("hidden");
        pendingOutgoingGameInvite=null;
      }
    }
  }catch(e){console.warn("global realtime",e)}
  finally{globalRealtimeBusy=false}
}
document.getElementById("cancelGameInviteBtn")?.addEventListener("click",async()=>{
  let p=pendingOutgoingGameInvite;if(!p)return;
  try{await api(`/test_interactions?id=eq.${encodeURIComponent(p.id)}`,{method:"DELETE"})}catch(e){}
  pendingOutgoingGameInvite=null;gameWaitModal.classList.add("hidden");
  toast("已取消小遊戲邀約。");
});
document.getElementById("pendingEventList")?.addEventListener("click",async e=>{
  let b=e.target.closest("[data-pending-open]");if(!b)return;
  let ev=pendingEventRows[Number(b.dataset.pendingOpen)],c=cur();if(!ev||!c)return;
  if(ev.kind==="transform"){
    let p=ev.transform;
    activeRoomCode=String(ev.code);
    try{await loadRoom(ev.code)}catch(err){console.warn(err)}
    if(p.chooseLater){
      let rr=relationshipSummaries?.[activeRoomCode];
      let targets=rr?(relationTransformRules[rr.relation]||[]):[];
      relationTransformBody.innerHTML=`<div class="small">第 ${Number(p.stage)+1} 階的關係轉換還在等待你的決定。你可以選擇方向，也可以繼續再想想或拒絕本階段所有轉換。</div><div class="outingChoiceList">${targets.map(t=>{let occ=relationOccupant(c,t,activeRoomCode);return `<button data-transform="${t}">${relationLabel(rr.relation)} → ${relationLabel(t)}${occ?`　⚠️ ${esc(occ.other?.name||"已有角色")}`:""}</button>`}).join("")}<button data-transform-later-all="1">⏳ 再想想</button><button class="dangerSoft" data-transform-reject-all="1">🚫 拒絕本階段任何關係轉換</button></div>`;
      relationTransformModal.classList.remove("hidden");
    }else{
      openTransformDecision(c,ev.code,p.from,p.to,p.stage);
    }
    return;
  }
  if(ev.kind==="slot_request"){
    let q=String(ev.row.text||"").split("|"),sourceCode=q[1],from=q[2],to=q[3],stage=Number(q[4]||0);
    relationTransformBody.innerHTML=`<b>⚠️ 關係位置請求</b><p>${esc(roomOtherName(ev.code,c))} 想讓另一段關係變成「${relationLabel(to)}」。</p><div class="small">你目前就是這個「${relationLabel(to)}」位置的人。這次由你本人決定：</div><div class="outingChoiceList"><button class="primary" data-slot-answer="release" data-pidx="${Number(b.dataset.pendingOpen)}">同意解除目前關係</button><button data-slot-answer="keep" data-pidx="${Number(b.dataset.pendingOpen)}">不同意，維持現狀</button></div>`;
    relationTransformModal.classList.remove("hidden");
    return;
  }
  if(ev.kind==="slot_result"){
    let q=String(ev.row.text||"").split("|"),sourceCode=q[1],from=q[2],to=q[3],stage=Number(q[4]||0),result=q[5];
    try{await api(`/test_interactions?id=eq.${encodeURIComponent(ev.row.id)}`,{method:"DELETE"})}catch(e){}
    ensureTransformState(c);
    let key=transformDecisionKey(sourceCode,stage);
    if(result==="accepted"){
      try{
        let retained=await applyBondDecay(sourceCode,from,to);
        await applyRelationChange(sourceCode,to);
        consumeTransformForStage(c,sourceCode,stage);
        markRelationTypeTransformed(c,from);
        recordRelationHistory(c,sourceCode,from,to);
        logJournal(c,`關係從「${relationLabel(from)}」轉變為「${relationLabel(to)}」，羈絆保留 ${retained}%`,"🔄");
        toast(`✅ 對方同意解除位置，關係已轉為「${relationLabel(to)}」`,4200);
      }catch(err){toast("完成關係轉換失敗："+err.message)}
    }else{
      delete c.pendingRelationTransforms[key];
      toast("❌ 對方選擇維持目前關係，這次轉換取消。",4200);
    }
    saveLocal();
    await refreshRelationships();await renderPendingEvents(c);renderGame();
    return;
  }
  if(ev.kind==="message"){
    c.pendingMessageSeen??={};c.pendingMessageSeen[ev.code]=Date.parse(ev.created_at||"")||Date.now();saveLocal();
    activeRoomCode=ev.code;await loadRoom(ev.code);await renderPendingEvents(c);
    document.getElementById("roomActive")?.scrollIntoView({behavior:"smooth",block:"start"});

document.getElementById("gmGiftInbox")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-open-mailbox]");if(!b)return;
  document.querySelector('[data-nav="mailbox"]')?.click();
});

  }else if(ev.kind==="game"){
    await showGlobalGameInvite(ev);
  }else if(ev.kind==="outing"){
    let q=String(ev.row.text||"").split("|"),pid=q[1],pl=places.find(x=>x[0]===pid);
    pendingAcceptedOuting={id:ev.row.id,code:ev.code,pid,pl};
    outingChoiceTitle.textContent=`💌 ${pl?.[2]||"外出"}邀請`;
    outingChoiceBody.innerHTML=`<div class="small">對方已經選完，現在輪到你。</div><div class="outingChoiceList"><button data-reply="relax">🌿 一起悠閒走走</button><button data-reply="talk">💬 趁機聊聊</button><button data-reply="surprise">✨ 配合驚喜</button></div>`;
    outingChoiceModal.classList.remove("hidden");
  }
});
setInterval(pollGlobalRealtime,5000);

let mailboxBackgroundTimer=setInterval(()=>{
  try{
    let c=cur();
    if(c&&!document.getElementById("game")?.classList.contains("hidden"))loadMailbox(c);
  }catch(e){}
},12000);

document.getElementById("badgeList")?.addEventListener("click",async e=>{
  let c=cur();if(!c)return;

  let profileBtn=e.target.closest("[data-profile-badge]");
  if(profileBtn){
    let id=profileBtn.dataset.profileBadge;
    ensureBadges();
    if(!local.sharedBadges?.[id])return toast("這枚徽章尚未取得");
    toggleProfileBadge(c,id);
    await refreshCustomBadgeDefs();
    renderBadges(c);
    if(activeRoomCode&&room){
      try{await syncState();await refreshRelationships();}catch(err){console.warn("徽章展示同步",err)}
    }
    return;
  }

  let mainBtn=e.target.closest("[data-badge]");
  if(mainBtn){
    let id=mainBtn.dataset.badge;
    ensureBadges();
    if(!local.sharedBadges?.[id])return toast("這枚徽章尚未取得");
    c.equippedBadge=id;
    saveBadgeShowcaseBackup(c);saveLocal();
    await refreshCustomBadgeDefs();
    renderBadges(c);
    toast("🏅 已設為主徽章");
    if(activeRoomCode&&room){
      try{await syncState();await refreshRelationships();}catch(err){console.warn("主徽章同步",err)}
    }
  }
});

document.getElementById("openRelationsShortcut")?.addEventListener("click",()=>{
  document.querySelector('[data-nav="relations"]')?.click();
});

function renderBadgeManager(){
  let c=cur();if(!c)return;
  ensureBadges();ensureProfileBadgeSlots(c);
  let defs=allBadgeDefs();
  let ids=Object.keys(local.sharedBadges||{}).filter(id=>local.sharedBadges[id]);
  let box=document.getElementById("badgeManagerList");if(!box)return;
  if(!ids.length){
    box.innerHTML='<div class="muted">目前還沒有取得任何徽章。</div>';
    return;
  }
  box.innerHTML=ids.map(id=>{
    let b=defs[id]||{icon:"🏅",name:"徽章",desc:""};
    let main=c.equippedBadge===id,show=c.profileBadges?.includes(id);
    return `<div class="itemRow">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="font-size:26px">${esc(b.icon||"🏅")}</div>
        <div style="flex:1"><b>${esc(b.name||"徽章")}</b><div class="small">${esc(b.desc||"")}</div></div>
      </div>
      <div class="actions" style="margin-top:7px">
        <button data-bm-main="${esc(id)}" ${main?"disabled":""}>${main?"主徽章":"設為主徽章"}</button>
        <button data-bm-profile="${esc(id)}">${show?"移出展示":"加入展示"}</button>
      </div>
    </div>`;
  }).join("");
}
document.getElementById("openBadgeManager")?.addEventListener("click",async()=>{
  await refreshCustomBadgeDefs();
  renderBadgeManager();
  document.getElementById("badgeManagerModal")?.classList.remove("hidden");
});
document.getElementById("closeBadgeManager")?.addEventListener("click",()=>document.getElementById("badgeManagerModal")?.classList.add("hidden"));
document.getElementById("badgeManagerList")?.addEventListener("click",async e=>{
  let c=cur();if(!c)return;
  let a=e.target.closest("[data-bm-main]");
  if(a){
    c.equippedBadge=a.dataset.bmMain;
    saveLocal();renderBadges(c);renderBadgeManager();
    await syncBadgeShowcaseToAllRelations(c).catch(()=>{});
    toast("🏅 已設為主徽章");
    return;
  }
  let b=e.target.closest("[data-bm-profile]");
  if(b){
    toggleProfileBadge(c,b.dataset.bmProfile);
    renderBadgeManager();
  }
});
