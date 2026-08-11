
const TEST_SERVER_DATA_ISOLATED=true;
const SUPABASE_URL = "https://uaanvqqjwfcfmecjhyjn.supabase.co";
const SUPABASE_KEY = "sb_publishable_h3YN0v-lcO0eW95UHuPkLw_KLZSoPY4";
const API = SUPABASE_URL + "/rest/v1";

const AUTH_API=SUPABASE_URL+"/auth/v1";
const GM_SESSION_KEY="role_life_gm_session_v1";
let gmSession=null,gmProfile=null;

function loadGMSession(){
  try{
    let x=JSON.parse(localStorage.getItem(GM_SESSION_KEY)||"null");
    if(x?.access_token&&x?.user)return x;
  }catch(e){}
  return null;
}
function saveGMSession(v){
  gmSession=v||null;
  if(v)localStorage.setItem(GM_SESSION_KEY,JSON.stringify(v));
  else localStorage.removeItem(GM_SESSION_KEY);
}
async function gmAuthFetch(path,options={}){
  if(!gmSession?.access_token)throw new Error("管理員尚未登入");
  let res=await fetch(API+path,{
    ...options,
    headers:{
      "apikey":SUPABASE_KEY,
      "Authorization":"Bearer "+gmSession.access_token,
      "Content-Type":"application/json",
      ...(options.headers||{})
    }
  });
  let text=await res.text(),data=null;
  if(text){try{data=JSON.parse(text)}catch(e){data=text}}
  if(!res.ok)throw new Error(data?.message||data?.hint||`GM API 錯誤 ${res.status}`);
  return data;
}

async function gmRpc(name,args={}){
  if(!gmSession?.access_token)throw new Error("請先登入 GM");
  let res=await fetch(`${API}/rpc/${encodeURIComponent(name)}`,{
    method:"POST",
    headers:{
      "apikey":SUPABASE_KEY,
      "Authorization":"Bearer "+gmSession.access_token,
      "Content-Type":"application/json"
    },
    body:JSON.stringify(args||{})
  });
  let text=await res.text(),data=null;
  if(text){try{data=JSON.parse(text)}catch(e){data=text}}
  if(!res.ok)throw new Error(data?.message||data?.hint||`RPC 錯誤 ${res.status}`);
  return data;
}
async function verifyGM(){
  gmSession=loadGMSession();
  gmProfile=null;
  if(!gmSession?.access_token){renderGMState();return false}
  try{
    let res=await fetch(AUTH_API+"/user",{
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+gmSession.access_token}
    });
    if(!res.ok)throw new Error("登入已失效");
    let user=await res.json();
    gmSession.user=user;saveGMSession(gmSession);
    let rows=await gmAuthFetch(`/admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,role&limit=1`);
    if(!rows?.length)throw new Error("這個帳號不是管理員");
    gmProfile=rows[0];
    renderGMState();
    setTimeout(()=>loadGMTestInvites().catch(()=>{}),0);
    return true;
  }catch(e){
    console.warn("GM verify",e);
    saveGMSession(null);gmProfile=null;renderGMState();
    return false;
  }
}
function renderGMState(){
  let ok=!!gmProfile;
  document.getElementById("gmNavBtn")?.classList.toggle("hidden",!ok);
  document.getElementById("gmDrawerLoginBtn")?.classList.toggle("hidden",ok);
  document.getElementById("gmLoginBtn")?.classList.toggle("hidden",ok);
  document.getElementById("gmLogoutBtn")?.classList.toggle("hidden",!ok);
  let chip=document.getElementById("gmHomeChip");
  if(chip)chip.textContent=ok?`GM・${gmProfile.role||"admin"}`:"未登入";
  let st=document.getElementById("gmHomeStatus");
  if(st)st.textContent=ok?`已登入：${gmSession?.user?.email||"管理員"}`:"";
  let rc=document.getElementById("gmRoleChip");
  if(rc)rc.textContent=gmProfile?.role||"GM";
}
async function gmSignIn(email,password){
  let res=await fetch(AUTH_API+"/token?grant_type=password",{
    method:"POST",
    headers:{"apikey":SUPABASE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email,password})
  });
  let data=await res.json();
  if(!res.ok)throw new Error(data?.error_description||data?.msg||"登入失敗");
  saveGMSession(data);
  if(!await verifyGM())throw new Error("登入成功，但這個帳號沒有 GM 權限");
  return true;
}
async function gmSignOut(){
  try{
    if(gmSession?.access_token){
      await fetch(AUTH_API+"/logout",{method:"POST",headers:{
        "apikey":SUPABASE_KEY,"Authorization":"Bearer "+gmSession.access_token
      }});
    }
  }catch(e){}
  saveGMSession(null);gmSession=null;gmProfile=null;renderGMState();
}


const bgmAudio=document.getElementById("bgm");
const BGM_PREF_KEY="role_life_bgm_enabled_v1";
let bgmEnabled=localStorage.getItem(BGM_PREF_KEY)!=="0";
bgmAudio.volume=0.32;

async function tryStartBgm(){
  if(!bgmEnabled||!bgmAudio)return false;
  try{
    await bgmAudio.play();
    let n=document.getElementById("bgmUnlockNotice");if(n)n.classList.add("hidden");
    updateBgmButtons();return true;
  }catch(e){
    let n=document.getElementById("bgmUnlockNotice");if(n)n.classList.remove("hidden");
    updateBgmButtons();return false;
  }
}
function setBgmEnabled(on){
  bgmEnabled=!!on;
  localStorage.setItem(BGM_PREF_KEY,bgmEnabled?"1":"0");
  if(bgmEnabled)tryStartBgm();else bgmAudio.pause();
  updateBgmButtons();
}
function updateBgmButtons(){
  document.querySelectorAll("[data-bgm-toggle]").forEach(b=>{b.textContent=bgmEnabled?"🎵 BGM：開":"🔇 BGM：關"});
  let playing=bgmEnabled&&!bgmAudio.paused;
  let bt=document.getElementById("bgmToggle");if(bt)bt.textContent=playing?"⏸ 暫停":"▶ 播放";
  let hbt=document.getElementById("homeBgmToggle");if(hbt)hbt.textContent=playing?"⏸ 暫停":"▶ 播放";
  let hv=document.getElementById("homeBgmVolume");if(hv&&document.activeElement!==hv)hv.value=String(bgmAudio.volume);
  let gv=document.getElementById("bgmVolume");if(gv&&document.activeElement!==gv)gv.value=String(bgmAudio.volume);
}
function installBgmGestureUnlock(){
  const unlock=async()=>{
    if(!bgmEnabled)return;
    let ok=await tryStartBgm();
    if(ok){document.removeEventListener("pointerdown",unlock);document.removeEventListener("keydown",unlock)}
  };
  document.addEventListener("pointerdown",unlock,{passive:true});
  document.addEventListener("keydown",unlock);
}


const outingChoiceModal=document.getElementById("outingChoiceModal");
const outingChoiceTitle=document.getElementById("outingChoiceTitle");
const outingChoiceBody=document.getElementById("outingChoiceBody");
const closeOutingChoice=document.getElementById("closeOutingChoice");
const gameInviteModal=document.getElementById("gameInviteModal");
const gameInviteBody=document.getElementById("gameInviteBody");
const acceptGameInviteBtn=document.getElementById("acceptGameInviteBtn");
const declineGameInviteBtn=document.getElementById("declineGameInviteBtn");
const closeGameInvite=document.getElementById("closeGameInvite");
const relationEventModal=document.getElementById("relationEventModal");
const relationEventRarity=document.getElementById("relationEventRarity");
const relationEventTitle=document.getElementById("relationEventTitle");
const relationEventText=document.getElementById("relationEventText");
const relationEventChoices=document.getElementById("relationEventChoices");
const relationTransformModal=document.getElementById("relationTransformModal");
const relationTransformBody=document.getElementById("relationTransformBody");
const closeRelationTransform=document.getElementById("closeRelationTransform");
const transformRelationBtn=document.getElementById("transformRelationBtn");


const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Content-Type": "application/json"
};

const LOCAL_KEY="role_life_test_v2";
const PLAYER_KEY="role_life_test_player_v2";
const BADGE_SHOWCASE_KEY="role_life_test_badge_showcase_v1";
function loadBadgeShowcaseBackup(){
  try{return JSON.parse(localStorage.getItem(BADGE_SHOWCASE_KEY)||"{}")||{}}catch(e){return{}}
}
function saveBadgeShowcaseBackup(c){
  if(!c?.id)return;
  let map=loadBadgeShowcaseBackup();
  map[String(c.id)]={
    equippedBadge:c.equippedBadge||"",
    profileBadges:Array.isArray(c.profileBadges)?c.profileBadges.filter(Boolean).slice(0,3):[]
  };
  localStorage.setItem(BADGE_SHOWCASE_KEY,JSON.stringify(map));
}
function restoreBadgeShowcaseBackup(c){
  if(!c?.id)return;
  let b=loadBadgeShowcaseBackup()[String(c.id)];
  if(!b)return;
  // Backup wins only when current save is missing/empty, so normal player changes still work.
  if(!c.equippedBadge&&b.equippedBadge)c.equippedBadge=b.equippedBadge;
  if((!Array.isArray(c.profileBadges)||!c.profileBadges.length)&&Array.isArray(b.profileBadges)){
    c.profileBadges=b.profileBadges.filter(Boolean).slice(0,3);
  }
}

const defs={
  lover:{name:"戀人",bond:1.5,exp:1.25,desc:"羈絆×1.5、經驗×1.25",actions:[["抱抱","抱抱你"],["約會","邀請你去約會"],["撒嬌","跑來向你撒嬌"],["分享甜點","想和你分享甜點"],["說想你","說有點想你"],["互動小遊戲","game"]]},
  bestfriend:{name:"摯友",bond:1.35,exp:1.18,desc:"羈絆×1.35、經驗×1.18",actions:[["聊八卦","想找你聊八卦"],["出去玩","約你出去玩"],["分零食","分你一點零食"],["擊掌","向你伸手擊掌"],["打氣","替你加油"],["互動小遊戲","game"]]},
  family:{name:"家人",bond:1.4,exp:1.12,desc:"羈絆×1.4、經驗×1.12",actions:[["一起吃飯","叫你一起吃飯"],["關心","問你今天過得怎樣"],["陪伴","想陪你待一下"],["幫忙","說要幫你做點事"],["送伴手禮","帶了小東西給你"],["互動小遊戲","game"]]},
  partner:{name:"搭檔",bond:1.15,exp:1.3,desc:"經驗×1.3",actions:[["訓練","邀請你一起訓練"],["討論計畫","想和你討論計畫"],["交換情報","來交換情報"],["掩護","表示會替你掩護"],["慶祝","邀你慶祝一下"],["互動小遊戲","game"]]},
  rival:{name:"宿敵",bond:.8,exp:1.4,desc:"經驗×1.4，羈絆較慢",actions:[["挑戰","向你發起挑戰"],["比戰績","要和你比較戰績"],["挑釁","故意來挑釁你"],["再戰","丟下一句下次再戰"],["嘴硬稱讚","嘴硬地稱讚你"],["互動小遊戲","game"]]},
  enemy:{name:"仇敵",bond:.45,exp:1.32,desc:"經驗×1.32，羈絆很慢",actions:[["下戰帖","向你下戰帖"],["嘲諷","對你冷嘲熱諷"],["正面較量","邀你正面較量"],["警告","對你發出警告"],["宣戰","表示絕對不會認輸"],["互動小遊戲","game"]]}
};

const routines=[
  [0,6,"熟睡中","抱著被子安穩睡著。"],
  [6,7,"剛起床","還有點迷迷糊糊。"],
  [7,8,"吃早餐","正在吃早餐。"],
  [8,12,"做自己的事","工作、練習或處理今天的事。"],
  [12,13,"吃午餐","暫時休息吃午餐。"],
  [13,17,"繼續忙碌","午後繼續自己的生活。"],
  [17,18,"散步回家","慢慢走在回家的路上。"],
  [18,19,"吃晚餐","正在吃晚餐。"],
  [19,21,"悠閒時間","窩著休息。"],
  [21,22,"洗澡","洗去一天疲憊。"],
  [22,24,"準備睡覺","鑽進被窩準備睡了。"]
];
const routineMeta=[
  {key:"sleep",emoji:"😴",label:"00–06 熟睡中"},
  {key:"wake",emoji:"🥱",label:"06–07 剛起床"},
  {key:"breakfast",emoji:"🍞",label:"07–08 吃早餐"},
  {key:"morning",emoji:"💻",label:"08–12 做自己的事"},
  {key:"lunch",emoji:"🍱",label:"12–13 吃午餐"},
  {key:"afternoon",emoji:"📝",label:"13–17 繼續忙碌"},
  {key:"walkhome",emoji:"🚶",label:"17–18 散步回家"},
  {key:"dinner",emoji:"🍚",label:"18–19 吃晚餐"},
  {key:"relax",emoji:"🛋️",label:"19–21 悠閒時間"},
  {key:"bath",emoji:"🛁",label:"21–22 洗澡"},
  {key:"bed",emoji:"🌙",label:"22–24 準備睡覺"}
];
const routinePresets={
  default:[
    [0,6,"😴","熟睡中","抱著被子安穩睡著。"],
    [6,8,"🥱","起床與早餐","慢慢醒來，準備開始新的一天。"],
    [8,12,"💻","做自己的事","工作、練習或處理今天的事。"],
    [12,13,"🍱","吃午餐","暫時休息吃午餐。"],
    [13,18,"📝","午後忙碌","繼續自己的生活與工作。"],
    [18,19,"🍚","吃晚餐","正在吃晚餐。"],
    [19,22,"🛋️","悠閒時間","窩著休息、娛樂或聊天。"],
    [22,24,"🌙","準備睡覺","洗漱後準備鑽進被窩。"]
  ],
  early:[
    [0,5,"😴","熟睡中","早早睡下，正在補充精神。"],
    [5,7,"🌅","早起","清晨就醒來，慢慢整理自己。"],
    [7,8,"🍞","吃早餐","吃點早餐準備出門。"],
    [8,12,"💻","上午忙碌","精神很好地處理今天的事。"],
    [12,13,"🍱","吃午餐","暫時停下來吃午餐。"],
    [13,17,"📝","午後行程","繼續完成今天的安排。"],
    [17,20,"🏠","回家與晚餐","回到家、吃飯並慢慢放鬆。"],
    [20,24,"🌙","休息與睡眠","提早休息，準備睡覺。"]
  ],
  night:[
    [0,3,"🌙","夜間活動","夜深了還精神很好。"],
    [3,10,"😴","熟睡中","一路睡到接近中午。"],
    [10,12,"🥱","慢慢起床","剛醒來，還有點迷迷糊糊。"],
    [12,13,"🍱","第一餐","終於開始吃今天的第一餐。"],
    [13,18,"💻","下午忙碌","下午才正式開始處理事情。"],
    [18,20,"🍚","晚餐與休息","吃飯後稍微放鬆。"],
    [20,23,"🎮","夜晚時間","娛樂、聊天或做自己喜歡的事。"],
    [23,24,"✨","深夜精神","真正有精神的時間才剛開始。"]
  ],
  free:[
    [0,7,"😴","睡覺","沒有鬧鐘的夜晚。"],
    [7,10,"☕","慢慢醒來","不急著開始今天。"],
    [10,12,"🌿","隨意活動","想到什麼就做什麼。"],
    [12,14,"🍽️","吃飯休息","慢慢吃飯，不趕時間。"],
    [14,18,"🎨","自由時間","做喜歡的事或隨意出門。"],
    [18,20,"🍲","晚餐","吃晚餐順便休息。"],
    [20,23,"🛋️","放鬆","娛樂、追劇或聊天。"],
    [23,24,"🌙","準備休息","慢慢收尾今天。"]
  ]
};
function cloneRoutinePreset(name="default"){return routinePresets[name].map(x=>[...x])}
function ensureCharacterRoutine(c){
  if(!c)return cloneRoutinePreset();
  if(!Array.isArray(c.customRoutine)||!c.customRoutine.length)c.customRoutine=cloneRoutinePreset("default");
  c.customRoutine=c.customRoutine.slice(0,8).map((x,i)=>{
    let a=Number(x[0]),b=Number(x[1]);
    return [
      Number.isFinite(a)?a:(i?c.customRoutine[i-1]?.[1]||0:0),
      Number.isFinite(b)?b:24,
      String(x[2]||"🕒"),
      String(x[3]||"自由活動"),
      String(x[4]||"正在做自己的事。")
    ];
  });
  return c.customRoutine;
}
function routine(c=cur()){
  let arr=ensureCharacterRoutine(c),h=new Date().getHours();
  return arr.find(r=>h>=r[0]&&h<r[1])||arr[arr.length-1]||cloneRoutinePreset()[0];
}
function routineIndex(c=cur()){
  let arr=ensureCharacterRoutine(c),h=new Date().getHours();
  let i=arr.findIndex(r=>h>=r[0]&&h<r[1]);return i>=0?i:0;
}
function routineMetaNow(c=cur()){
  let r=routine(c);
  return {key:`custom_${routineIndex(c)}`,emoji:r[2]||"🕒",label:`${String(r[0]).padStart(2,"0")}–${String(r[1]).padStart(2,"0")} ${r[3]}`};
}
function renderRoutineEditor(c){
  let box=document.getElementById("routineEditor");if(!box||!c)return;
  let arr=ensureCharacterRoutine(c);
  box.innerHTML=arr.map((r,i)=>`<div class="routineEditRow" data-ridx="${i}">
    <input type="number" min="0" max="23" step="1" data-r-start value="${r[0]}" aria-label="開始時間">
    <span>～</span>
    <input type="number" min="1" max="24" step="1" data-r-end value="${r[1]}" aria-label="結束時間">
    <input maxlength="4" data-r-emoji value="${esc(r[2])}" aria-label="圖示">
    <input maxlength="18" data-r-name value="${esc(r[3])}" placeholder="活動名稱">
    <input maxlength="60" data-r-detail value="${esc(r[4])}" placeholder="狀態說明">
  </div>`).join("");
  renderRoutinePreview(c);
}
function renderRoutinePreview(c){
  let el=document.getElementById("routinePreview");if(!el||!c)return;
  let r=routine(c);
  el.innerHTML=`<b>現在會顯示：</b> ${esc(r[2])} ${esc(r[3])}<div class="small">${esc(r[4])}</div>`;
}
function readRoutineEditor(){
  let rows=[...document.querySelectorAll("#routineEditor .routineEditRow")];
  let out=rows.map((row,i)=>[
    Math.max(0,Math.min(23,Math.floor(Number(row.querySelector("[data-r-start]")?.value)||0))),
    Math.max(1,Math.min(24,Math.floor(Number(row.querySelector("[data-r-end]")?.value)||24))),
    row.querySelector("[data-r-emoji]")?.value.trim()||"🕒",
    row.querySelector("[data-r-name]")?.value.trim()||"自由活動",
    row.querySelector("[data-r-detail]")?.value.trim()||"正在做自己的事。"
  ]);
  for(let i=0;i<out.length;i++){
    if(out[i][1]<=out[i][0])throw new Error(`第 ${i+1} 個時段的結束時間必須晚於開始時間`);
    if(i>0&&out[i][0]!==out[i-1][1])throw new Error(`第 ${i+1} 個時段必須從 ${out[i-1][1]}:00 開始，不能留下空檔`);
  }
  if(out[0][0]!==0)throw new Error("第一個時段必須從 0:00 開始");
  if(out[out.length-1][1]!==24)throw new Error("最後一個時段必須到 24:00");
  return out;
}


const eventPool=[
  {id:"oversleep",title:"睡過頭了",text:"睜開眼時才發現比預定時間晚了不少。",minE:0,maxE:100,minH:0,maxH:100,minM:0,maxM:100,choices:[
    {label:"再躺五分鐘",energy:10,hunger:-5,mood:2,exp:0,money:0,result:"你又縮回被窩一下，精神好多了，但肚子也更餓了。"},
    {label:"立刻起床",energy:-3,hunger:-2,mood:0,exp:4,money:0,result:"你強迫自己爬起來，雖然有點累，卻很有完成一件事的感覺。"}
  ]},
  {id:"breakfast",title:"早餐的香味",text:"附近傳來早餐香味，肚子也剛好叫了一聲。",maxH:75,choices:[
    {label:"自己弄點吃的",energy:-2,hunger:18,mood:3,exp:2,money:0,result:"簡單吃了一頓，肚子終於安靜下來。"},
    {label:"出去買早餐",energy:-1,hunger:24,mood:4,exp:0,money:-25,result:"花了一點錢，但吃得很滿足。"}
  ]},
  {id:"nap",title:"午後的睏意",text:"午後突然一陣睏意襲來。",maxE:65,choices:[
    {label:"小睡一下",energy:16,hunger:-4,mood:3,exp:0,money:0,result:"短短睡了一會，醒來後精神好多了。"},
    {label:"撐著把事情做完",energy:-7,hunger:-2,mood:-1,exp:7,money:0,result:"有點辛苦，但總算把事情完成了。"}
  ]},
  {id:"tidy",title:"房間有點亂",text:"你忽然發現房間比想像中還亂。",choices:[
    {label:"認真整理",energy:-6,hunger:-2,mood:7,exp:5,money:0,result:"整理完後整個空間都清爽了不少。"},
    {label:"先算了",energy:2,hunger:0,mood:-2,exp:0,money:0,result:"你決定先不管它，但路過時還是忍不住看了幾眼。"}
  ]},
  {id:"rain",title:"突然下雨",text:"出門沒多久，天空忽然開始下雨。",choices:[
    {label:"跑去躲雨",energy:-4,hunger:-1,mood:1,exp:2,money:0,result:"你狼狽地跑到屋簷下，總算沒有淋得太濕。"},
    {label:"買一把傘",energy:-1,hunger:0,mood:3,exp:0,money:-35,result:"雖然臨時花了錢，但之後走起路來輕鬆多了。"}
  ]},
  {id:"coin",title:"路邊的零錢",text:"你在路邊看到幾枚掉落的硬幣。",choices:[
    {label:"撿起來",energy:0,hunger:0,mood:2,exp:0,money:18,result:"今天似乎有點小幸運。"},
    {label:"留在原地",energy:0,hunger:0,mood:3,exp:2,money:0,result:"你沒有拿走，也許原本的主人會回來找。"}
  ]},
  {id:"sweet",title:"突然很想吃甜食",text:"腦袋裡突然一直浮現甜點。",maxH:90,choices:[
    {label:"買個小甜點",energy:1,hunger:10,mood:8,exp:0,money:-30,result:"甜味讓心情一下子好了很多。"},
    {label:"忍住",energy:0,hunger:-1,mood:-1,exp:3,money:0,result:"你成功忍住了誘惑，但還是有點惦記。"}
  ]},
  {id:"exercise",title:"今天想動一動",text:"身體狀態好像不錯，突然有點想活動。",minE:55,choices:[
    {label:"出去運動",energy:-12,hunger:-6,mood:8,exp:8,money:0,result:"流了一身汗，反而覺得整個人都輕鬆了。"},
    {label:"做伸展就好",energy:-3,hunger:-1,mood:4,exp:3,money:0,result:"簡單活動一下，身體舒服多了。"}
  ]},
  {id:"lowmood",title:"什麼都不太想做",text:"今天不知道為什麼，有點提不起勁。",maxM:45,choices:[
    {label:"讓自己休息",energy:10,hunger:-2,mood:8,exp:0,money:0,result:"沒有勉強自己，反而慢慢恢復了一點。"},
    {label:"出去走走",energy:-4,hunger:-3,mood:12,exp:2,money:-10,result:"吹了吹風，心情比剛才好多了。"}
  ]},
  {id:"highmood",title:"今天特別有精神",text:"今天心情很好，做什麼都覺得順。",minM:80,choices:[
    {label:"趁機做點新嘗試",energy:-6,hunger:-3,mood:-2,exp:10,money:0,result:"你試了平常不太會做的事，意外學到不少。"},
    {label:"好好享受今天",energy:2,hunger:-2,mood:1,exp:2,money:0,result:"沒有特別安排，也是一個很舒服的日子。"}
  ]},
  {id:"coupon",title:"意外拿到優惠券",text:"你收到一張快到期的優惠券。",choices:[
    {label:"趁現在用掉",energy:0,hunger:7,mood:5,exp:0,money:-12,result:"用很便宜的價格買到了一點小東西。"},
    {label:"留著紀念",energy:0,hunger:0,mood:1,exp:1,money:0,result:"你把它塞進抽屜，說不定哪天會再看到。"}
  ]},
  {id:"broken",title:"小東西壞掉了",text:"常用的小東西突然壞掉，讓人有點措手不及。",choices:[
    {label:"自己修看看",energy:-5,hunger:-1,mood:3,exp:7,money:0,result:"雖然修得不算漂亮，但至少又能用了。"},
    {label:"直接換新的",energy:0,hunger:0,mood:4,exp:0,money:-45,result:"花錢解決最省事，新東西用起來也很順手。"}
  ]},
  {id:"oldphoto",title:"抽屜裡的舊照片",text:"整理東西時翻到一張看不太清楚的舊照片。",choices:[
    {label:"仔細看看",energy:-1,hunger:0,mood:5,exp:3,money:0,result:"照片讓你想起一些模糊卻溫柔的片段。",memory:"舊照片"},
    {label:"先收好",energy:0,hunger:0,mood:2,exp:1,money:0,result:"你把照片重新收好，決定改天再看。"}
  ]},
  {id:"book",title:"一本看起來很有趣的書",text:"你注意到一本封面很吸引人的書。",choices:[
    {label:"坐下來看一會",energy:-3,hunger:-2,mood:5,exp:8,money:0,result:"不知不覺看了很久，腦袋裡多了不少新想法。"},
    {label:"先記下書名",energy:0,hunger:0,mood:2,exp:2,money:0,result:"你把書名記下來，準備之後有空再找。"}
  ]},
  {id:"nightwalk",title:"夜晚還不想睡",text:"晚上意外地沒有睡意。",minE:35,choices:[
    {label:"出去散步",energy:-5,hunger:-3,mood:8,exp:2,money:0,result:"夜風很舒服，回家時心情平靜了很多。"},
    {label:"泡杯熱飲",energy:3,hunger:5,mood:5,exp:0,money:-15,result:"暖暖的飲料讓夜晚變得安靜又舒服。"}
  ]},
  {id:"goal",title:"突然想起拖很久的事",text:"有件一直擱著的事情突然浮上心頭。",choices:[
    {label:"今天就做完",energy:-10,hunger:-4,mood:4,exp:12,money:0,result:"終於完成後，整個人都有種鬆了一口氣的感覺。"},
    {label:"先列個計畫",energy:-2,hunger:0,mood:3,exp:5,money:0,result:"至少把步驟整理清楚了，感覺沒那麼難開始。"}
  ]},
  {id:"snack",title:"翻到一包零食",text:"櫃子裡居然還有一包之前忘記的零食。",maxH:80,choices:[
    {label:"現在吃掉",energy:1,hunger:12,mood:5,exp:0,money:0,result:"意外的零食總是特別好吃。"},
    {label:"留到晚上",energy:0,hunger:0,mood:2,exp:1,money:0,result:"你把它放到更顯眼的位置，避免再次忘記。"}
  ]},
  {id:"refund",title:"意外收到退款",text:"你發現之前的一筆小額付款被退回來了。",choices:[
    {label:"收下這份驚喜",energy:0,hunger:0,mood:6,exp:0,money:40,result:"原本沒期待的錢回來了，心情自然很好。"},
    {label:"先存起來",energy:0,hunger:0,mood:3,exp:2,money:40,result:"你決定先不亂花，默默把這筆錢留下。"}
  ]},
  {id:"music",title:"突然聽到喜歡的旋律",text:"不知道從哪裡傳來一段很好聽的音樂。",choices:[
    {label:"停下來聽",energy:2,hunger:0,mood:9,exp:1,money:0,result:"短短幾分鐘，心情就被旋律拉了起來。"},
    {label:"邊走邊哼",energy:0,hunger:-1,mood:6,exp:2,money:0,result:"一路哼著旋律，連步伐都變輕快了。"}
  ]},
  {id:"mysterybox",title:"神秘的小包裹",text:"門口出現一個沒有署名的小包裹。",minDay:5,choices:[
    {label:"小心拆開",energy:-1,hunger:0,mood:5,exp:5,money:12,result:"裡面只是一些小東西和零錢，沒有危險，卻讓人很好奇。",memory:"神秘包裹"},
    {label:"先放著觀察",energy:0,hunger:0,mood:1,exp:3,money:0,result:"你決定晚點再處理，神秘感反而更重了。"}
  ]}
,
  {id:"badweather",title:"悶熱又潮濕的天氣",text:"空氣又悶又黏，連平常的小事都變得有點煩躁。",minM:55,choices:[
    {label:"硬著頭皮把事情做完",hint:"效率有了，但心情會明顯下降。",energy:-6,hunger:-2,mood:-8,exp:9,money:0,result:"事情是完成了，但整個人都被悶熱天氣弄得有點暴躁。"},
    {label:"先去買杯冰飲",hint:"花點錢緩和一下，但還是有些煩。",energy:1,hunger:3,mood:-3,exp:1,money:-25,result:"冰飲有幫上一點忙，只是今天還是讓人提不起勁。"}
  ]},
  {id:"missedbus",title:"眼睜睜錯過一班車",text:"你才剛走到站牌，車門就在眼前關上了。",minM:50,choices:[
    {label:"等下一班",hint:"沒什麼損失，就是很煩。",energy:-1,hunger:-1,mood:-6,exp:2,money:0,result:"你只能站在原地等，越想越覺得剛才就差那麼幾秒。"},
    {label:"改叫車",hint:"花錢換時間，但心情還是被影響。",energy:0,hunger:0,mood:-2,exp:1,money:-45,result:"至少不用繼續等，只是這筆臨時支出讓人有點心疼。"}
  ]},
  {id:"lostitem",title:"東西怎麼找都找不到",text:"一件明明記得放在附近的小東西，突然完全找不到了。",minM:60,choices:[
    {label:"翻遍整個房間",hint:"會很累、很煩，但能獲得一些經驗。",energy:-8,hunger:-2,mood:-9,exp:8,money:0,result:"最後還是找到了，但房間也被你翻得更亂了。"},
    {label:"先放棄",hint:"省下體力，心裡卻會一直惦記。",energy:2,hunger:0,mood:-5,exp:0,money:0,result:"你決定晚點再找，但腦袋還是會不時想到它。"}
  ]},
  {id:"smallmistake",title:"一個很低級的小失誤",text:"事情本來很順，卻因為一個很簡單的疏忽得重來一部分。",minM:65,choices:[
    {label:"安靜重做",hint:"心情下降，但完成後經驗不少。",energy:-7,hunger:-2,mood:-7,exp:10,money:0,result:"你沒有再抱怨，只是重做完後還是忍不住嘆了口氣。"},
    {label:"先抱怨兩句",hint:"稍微省力，但今天會更煩躁。",energy:-3,hunger:0,mood:-10,exp:4,money:0,result:"抱怨完是舒服一點，但整個下午的氣氛都被影響了。"}
  ]},
  {id:"unexpectedbill",title:"突然多出一筆支出",text:"你發現有一筆完全沒預料到的費用今天必須處理。",minM:55,choices:[
    {label:"直接付掉",hint:"損失金錢，也會有點心痛。",energy:0,hunger:0,mood:-6,exp:2,money:-55,result:"事情解決了，但看著錢包還是讓人很難高興起來。"},
    {label:"先重新安排預算",hint:"省下一點錢，但會消耗精神。",energy:-5,hunger:-1,mood:-4,exp:7,money:-25,result:"你花了一些時間重新整理支出，至少沒有完全失控。"}
  ]},
  {id:"badfood",title:"期待很久的東西不好吃",text:"你滿心期待地吃了一口，卻發現味道完全不如想像。",minH:25,minM:60,choices:[
    {label:"勉強吃完",hint:"填飽肚子，但心情真的不太行。",energy:0,hunger:15,mood:-8,exp:1,money:0,result:"肚子是飽了，只是這餐完全沒有帶來任何幸福感。"},
    {label:"乾脆別吃了",hint:"保住心情一點，但會更餓。",energy:0,hunger:-6,mood:-3,exp:2,money:0,result:"你決定不再勉強自己，只是等等大概得再找東西吃。"}
  ]},
  {id:"awkward",title:"一場有點尷尬的對話",text:"你和某個人聊到一半，氣氛突然不知道該怎麼接下去。",minM:60,choices:[
    {label:"努力把話題救回來",hint:"很耗精神，但算是一次社交經驗。",energy:-4,hunger:0,mood:-5,exp:8,money:0,result:"最後勉強把氣氛拉了回來，但你還是想起來就覺得尷尬。"},
    {label:"假裝什麼都沒發生",hint:"最省事，但尷尬感會留更久。",energy:0,hunger:0,mood:-8,exp:2,money:0,result:"你們很自然地換了話題，只是那幾秒沉默一直留在腦袋裡。"}
  ]},
  {id:"badluck",title:"今天就是有點不順",text:"沒有發生什麼大事，但每一件小事都剛好差那麼一點。",minM:70,choices:[
    {label:"照常把今天過完",hint:"心情會掉一些，但能累積不少經驗。",energy:-5,hunger:-3,mood:-9,exp:11,money:0,result:"你還是把該做的都做完了，只是今天確實不怎麼討喜。"},
    {label:"提早結束今天",hint:"恢復一些體力，心情仍會稍微下降。",energy:7,hunger:-2,mood:-4,exp:1,money:0,result:"你決定今天就到這裡，至少不用再和壞運氣硬碰硬。"}
  ]}

  ,{id:"smallchange",title:"口袋裡的意外收穫",text:"整理外套口袋時，摸到幾枚早就忘記的零錢。",maxMoney:45,choices:[
    {label:"收進錢包",energy:0,hunger:0,mood:2,exp:0,money:18,result:"雖然不多，但現在每一枚硬幣都很珍貴。"}
  ]}
  ,{id:"bottle",title:"順手回收",text:"路邊剛好有一些可以拿去回收的瓶罐。",maxMoney:35,choices:[
    {label:"拿去回收",energy:-3,hunger:-1,mood:1,exp:2,money:25,result:"跑了一小趟，換回一點零用錢。"},
    {label:"今天先算了",energy:0,hunger:0,mood:0,exp:0,money:0,result:"你決定先省點力氣。"}
  ]}
  ,{id:"tinyhelp",title:"臨時的小幫忙",text:"附近有人正好需要幫忙搬一點東西，願意給些小費。",maxMoney:55,minE:12,choices:[
    {label:"幫個忙",energy:-6,hunger:-2,mood:2,exp:3,money:32,result:"事情不難，做完後也拿到了一點謝禮。"},
    {label:"婉拒",energy:0,hunger:0,mood:0,exp:0,money:0,result:"你今天不太想勉強自己。"}
  ]}
];


function resizeImageFile(file,maxSide=320,quality=.62){
 return new Promise((resolve,reject)=>{
   let fr=new FileReader();
   fr.onerror=reject;
   fr.onload=()=>{
     let img=new Image();
     img.onerror=reject;
     img.onload=()=>{
       let scale=Math.min(1,maxSide/Math.max(img.width,img.height));
       let w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
       let cv=document.createElement("canvas");cv.width=w;cv.height=h;
       cv.getContext("2d").drawImage(img,0,0,w,h);
       resolve(cv.toDataURL("image/jpeg",quality));
     };
     img.src=fr.result;
   };
   fr.readAsDataURL(file);
 });
}
let local=loadLocal();
let playerId=localStorage.getItem(PLAYER_KEY);
if(!playerId){playerId=(crypto.randomUUID?crypto.randomUUID():"p"+Date.now()+Math.random().toString(16).slice(2));localStorage.setItem(PLAYER_KEY,playerId)}
const DEVICE_FIRST_SEEN_KEY="role_life_test_device_first_seen_v1";
if(!localStorage.getItem(DEVICE_FIRST_SEEN_KEY)){
  localStorage.setItem(DEVICE_FIRST_SEEN_KEY,new Date().toISOString());
}
const DEVICE_STARTER_CLAIMS_KEY="role_life_test_device_starter_claims_v1";
function deviceFirstSeenAt(){
  let t=Date.parse(localStorage.getItem(DEVICE_FIRST_SEEN_KEY)||"");
  return Number.isFinite(t)?t:Date.now();
}
function deviceStarterClaims(){
  try{return JSON.parse(localStorage.getItem(DEVICE_STARTER_CLAIMS_KEY)||"{}")||{}}catch(e){return{}}
}
function saveDeviceStarterClaims(map){
  localStorage.setItem(DEVICE_STARTER_CLAIMS_KEY,JSON.stringify(map||{}));
}
function isDeviceStarterClaimed(mailId){
  return !!deviceStarterClaims()[String(mailId)];
}
function markDeviceStarterClaimed(mailId){
  let m=deviceStarterClaims();
  m[String(mailId)]=new Date().toISOString();
  saveDeviceStarterClaims(m);
}

let activeId=null, room=null, partner=null, pollTimer=null, gameId=null, gamePollTimer=null, activeRoomCode="", relationshipSummaries={}, bondCache={};
let gameRoomContext=null,pendingOutgoingGameInvite=null,pendingGlobalGameInvite=null;
let publicStatsTimer=null;
let lastOpenSheetId="";

function loadLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY))||{characters:[]}}catch(e){return{characters:[]}}}
function saveLocal(){
  local.characters?.forEach(c=>{normalizeWholeStats(c);saveBadgeShowcaseBackup(c)});
  try{let c=cur();if(c)c.money=safeMoney(c.money)}catch(e){}

  try{
    // Avoid storing the same shared achievement object inside every character.
    let payload={
      ...local,
      characters:(local.characters||[]).map(c=>{
        let copy={...c};
        delete copy.achievements;
        delete copy.achievementNotified;
        delete copy.achievementNoticeReady;
        return copy;
      })
    };
    localStorage.setItem(LOCAL_KEY,JSON.stringify(payload));
    return true;
  }catch(e){
    console.error("saveLocal failed",e);
    if(e?.name==="QuotaExceededError"||String(e).includes("quota")){
      toast?.("⚠️ 瀏覽器儲存空間不足。請減少時間段圖片或換較小的圖片。",5000);
    }
    return false;
  }
}

function ensureSharedAchievements(){
  local.sharedAchievements??={};
  local.sharedAchievementNotified??={};
  // Migrate every achievement earned by any existing character into the account-wide pool.
  (local.characters||[]).forEach(c=>{
    Object.entries(c.achievements||{}).forEach(([id,done])=>{if(done)local.sharedAchievements[id]=1});
    Object.entries(c.achievementNotified||{}).forEach(([id,done])=>{if(done)local.sharedAchievementNotified[id]=1});
  });
  // All characters point at the same live object while the page is open.
  (local.characters||[]).forEach(c=>{c.achievements=local.sharedAchievements});
  return local.sharedAchievements;
}
function sharedAchievements(){
  return ensureSharedAchievements();
}

function cur(){return local.characters.find(x=>x.id===activeId)}
function ensureRelations(c){
  if(!c)return;
  restoreBadgeShowcaseBackup(c);
  c.level=Number(c.level)||1;c.exp=Number(c.exp)||0;
  normalizeLevelProgress(c);
  c.energy=Number.isFinite(Number(c.energy))?Number(c.energy):90;
  c.mood=Number.isFinite(Number(c.mood))?Number(c.mood):82;
  c.hunger=Number.isFinite(Number(c.hunger))?Number(c.hunger):85;
  c.money=safeMoney(Number.isFinite(Number(c.money))?Number(c.money):300);
  c.events=Array.isArray(c.events)?c.events:[];
  c.inventory=c.inventory&&typeof c.inventory==="object"?c.inventory:{};
  c.memories=Array.isArray(c.memories)?c.memories:[];
  c.start=c.start||new Date().toISOString().slice(0,10);
  ensureSharedAchievements();
  c.achievements=local.sharedAchievements;
  if(!c.journal)c.journal={};if(!Array.isArray(c.personalEventHistory))c.personalEventHistory=[];if(!c.relationshipEvents)c.relationshipEvents={};if(!c.stats)c.stats={};if(!c.dailyTasks)c.dailyTasks=[];if(!c.dailyBaseline)c.dailyBaseline={};if(c.dailyRewardClaimed==null)c.dailyRewardClaimed=false;if(c.dailyWorkUsed==null)c.dailyWorkUsed=0;if(!c.dailyRelationUses)c.dailyRelationUses={};
  if(!Array.isArray(c.roomCodes))c.roomCodes=[];
  if(c.roomCode && !c.roomCodes.includes(c.roomCode))c.roomCodes.push(c.roomCode);
  c.roomCodes=[...new Set(c.roomCodes.filter(Boolean))];
  delete c.roomCode;
}


function addMemory(c,title,desc=""){
  if(!c)return;
  c.memories=Array.isArray(c.memories)?c.memories:[];
  c.memories.unshift({
    t:title,
    d:desc||new Date().toLocaleDateString("zh-TW")
  });
  c.memories=c.memories.slice(0,100);
}
function logJournal(c,text,icon="📝"){
  if(!c)return;
  c.journal??={};
  let key=todayKey();
  c.journal[key]??=[];
  c.journal[key].unshift({time:new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"}),icon,text});
  c.journal[key]=c.journal[key].slice(0,30);
}
function uuid(){return crypto.randomUUID?crypto.randomUUID():"id"+Date.now()+Math.random().toString(16).slice(2)}
function newChar(name,gender){
  const createdAt=new Date().toISOString();
  return{id:uuid(),name,gender,level:1,exp:0,energy:90,mood:82,bond:0,image:"",
    start:createdAt.slice(0,10),
    createdAt,
    events:[],lastEvent:Date.now(),roomCodes:[],hunger:85,money:300,inventory:{},memories:[],
    achievements:{},dailyDate:"",dailyDone:0,dailyTasks:[],dailyBaseline:{},dailyRewardClaimed:false,
    dailyWorkUsed:0,dailyRelationUses:{},journal:{}};
}

function day(c){let a=new Date(c.start+"T00:00:00"),b=new Date();b.setHours(0,0,0,0);return Math.max(1,Math.floor((b-a)/86400000)+1)}

function safeMoney(v){return Math.max(0,Math.floor(Number(v)||0))}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function show(id){document.getElementById("home").classList.toggle("hidden",id!=="home");document.getElementById("game").classList.toggle("hidden",id!=="game")
  setTimeout(()=>syncLaunchActivityVisibility(),0);
}

function publicState(c){
  let r=routine(c);
  return{
    name:c.name,gender:c.gender||"",image:c.image||"",level:c.level,
    energy:Math.round(c.energy),mood:Math.round(c.mood),
    activity:`${r[2]} ${r[3]}`,
    badges:(c.profileBadges||[]).slice(0,3).map(id=>{
      let b=allBadgeDefs?.()?.[id];
      return b?{id,icon:b.icon||"🏅",name:b.name||"徽章"}:{id,icon:"🏅",name:"徽章"};
    }),
    updated:Date.now()
  }
}
const ONLINE_TIMEOUT_MS=20000;
function isOnlineState(state){
  if(!state||!state.updated)return false;
  return (Date.now()-Number(state.updated))<=ONLINE_TIMEOUT_MS;
}
function lastSeenText(state){
  if(!state||!state.updated)return "⚪ 離線";
  if(isOnlineState(state))return "🟢 在線";
  const diff=Math.max(0,Date.now()-Number(state.updated));
  const mins=Math.floor(diff/60000);
  if(mins<1)return "⚪ 剛剛上線";
  if(mins<60)return `⚪ ${mins} 分鐘前上線`;
  const hours=Math.floor(mins/60);
  if(hours<24)return `⚪ ${hours} 小時前上線`;
  const days=Math.floor(hours/24);
  if(days<30)return `⚪ ${days} 天前上線`;
  return "⚪ 很久以前上線";
}
function presenceText(state){
  return lastSeenText(state);
}

function relDef(){return room?defs[room.relation]:null}
function fatal(msg){let f=document.getElementById("fatal");f.textContent=msg;f.classList.remove("hidden")}
function clearFatal(){document.getElementById("fatal").classList.add("hidden")}

async function api(path,options={}){
  const res=await fetch(API+path,{...options,headers:{...HEADERS,...(options.headers||{})}});
  const text=await res.text();
  let data=null;
  if(text){try{data=JSON.parse(text)}catch(e){data=text}}
  if(!res.ok){
    console.error("API error",res.status,data);
    throw new Error((data&&data.message)||((data&&data.details)?data.details:"")||("Supabase 錯誤 "+res.status));
  }
  return data;
}


const SAVE_BACKUP_TYPE="relationship-in-progress-save";
const SAVE_BACKUP_VERSION=2;


function deepClone(v){return JSON.parse(JSON.stringify(v));}

/* 新版本匯入舊存檔時，先以「目前版本的預設資料」為骨架，
   再把玩家舊資料覆蓋回去。如此新版新增欄位會保留，新舊進度也能沿用。 */
function mergeSaveDefaults(defaults,oldValue){
  if(Array.isArray(oldValue))return deepClone(oldValue);
  if(oldValue===null||typeof oldValue!=="object")return oldValue===undefined?deepClone(defaults):oldValue;
  const base=(defaults&&typeof defaults==="object"&&!Array.isArray(defaults))?deepClone(defaults):{};
  for(const [k,v] of Object.entries(oldValue)){
    if(v&&typeof v==="object"&&!Array.isArray(v)){
      base[k]=mergeSaveDefaults(base[k]&&typeof base[k]==="object"?base[k]:{},v);
    }else{
      base[k]=deepClone(v);
    }
  }
  return base;
}

function normalizeImportedCharacter(oldChar){
  // 以新版本新角色結構當預設模板，但保留舊角色的 ID / 名稱 / 所有進度。
  let template={};
  try{
    // 避免真的建立角色，只整理目前遊戲已知的必要欄位。
    template={
      roomCodes:[],events:[],memories:[],inventory:{},stats:{},journal:{},
      relationships:{},daily:{},work:{},specialOwned:{},specialShopState:{}
    };
  }catch(e){}
  const c=mergeSaveDefaults(template,oldChar||{});
  ensureRelations(c);
  c.events=Array.isArray(c.events)?c.events:[];
  c.memories=Array.isArray(c.memories)?c.memories:[];
  c.roomCodes=Array.isArray(c.roomCodes)?c.roomCodes:[];
  c.inventory=(c.inventory&&typeof c.inventory==="object")?c.inventory:{};
  c.stats=(c.stats&&typeof c.stats==="object")?c.stats:{};
  c.journal=(c.journal&&typeof c.journal==="object")?c.journal:{};
  return c;
}

function migrateImportedSave(rawData,fromVersion=0){
  // 永遠從「目前 local 結構」取得新版欄位，再套入舊存檔。
  const currentSkeleton=deepClone(local||{});
  let migrated=mergeSaveDefaults(currentSkeleton,rawData||{});
  migrated.characters=Array.isArray(rawData?.characters)
    ?rawData.characters.map(normalizeImportedCharacter)
    :[];
  // 共享成就、徽章等舊資料若存在就保留；新版缺的欄位由 ensure 補齊。
  return migrated;
}

function createPreImportBackup(){
  try{
    const key=`role_life_preimport_${Date.now()}`;
    localStorage.setItem(key,JSON.stringify({
      type:SAVE_BACKUP_TYPE,version:SAVE_BACKUP_VERSION,
      exportedAt:new Date().toISOString(),data:local
    }));
    // 只保留最近 3 份匯入前安全備份。
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);if(k?.startsWith("role_life_test_preimport_"))keys.push(k);
    }
    keys.sort().reverse().slice(3).forEach(k=>localStorage.removeItem(k));
    return key;
  }catch(e){console.warn("建立匯入前備份失敗",e);return "";}
}

function makeSaveBackup(){
  return {
    type:SAVE_BACKUP_TYPE,
    version:SAVE_BACKUP_VERSION,
    exportedAt:new Date().toISOString(),
    localKey:LOCAL_KEY,
    data:local
  };
}
function safeFilenamePart(v){
  return String(v||"save").replace(/[\\/:*?"<>|]+/g,"_").replace(/\s+/g,"_").slice(0,40);
}
function exportGameSave(){
  try{
    saveLocal();
    const blob=new Blob([JSON.stringify(makeSaveBackup(),null,2)],{type:"application/json;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const date=new Date().toISOString().slice(0,10);
    const names=(local.characters||[]).map(x=>x.name).filter(Boolean).slice(0,2).join("_")||"角色";
    a.href=url;
    a.download=`關係進行式_存檔_${safeFilenamePart(names)}_${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast("💾 存檔已匯出");
  }catch(err){
    console.error("export save failed",err);
    alert("匯出存檔失敗："+(err?.message||"未知錯誤"));
  }
}
function validateImportedSave(payload){
  if(!payload||typeof payload!=="object")throw new Error("檔案內容不是有效的 JSON 存檔。");
  const wrapped=payload.type===SAVE_BACKUP_TYPE;
  const data=wrapped?payload.data:payload;
  const version=wrapped?Number(payload.version||0):0;
  if(!data||typeof data!=="object"||!Array.isArray(data.characters)){
    throw new Error("這不是《關係進行式》的有效存檔。");
  }
  if(version>SAVE_BACKUP_VERSION){
    throw new Error(`這份存檔來自更高的存檔版本（v${version}），請先更新遊戲再匯入。`);
  }
  return {data,version};
}
async function importGameSaveFile(file){
  if(!file)return;
  let oldLocal=deepClone(local);
  try{
    const parsed=JSON.parse(await file.text());
    const checked=validateImportedSave(parsed);
    const incoming=checked.data;
    const fromVersion=checked.version;
    const count=incoming.characters?.length||0;
    const names=(incoming.characters||[]).map(x=>x.name).filter(Boolean).slice(0,5).join("、")||"無角色";
    const versionNote=fromVersion<SAVE_BACKUP_VERSION
      ?`\n\n♻️ 舊存檔 v${fromVersion} → 會自動升級為目前格式 v${SAVE_BACKUP_VERSION}，新版新增內容會保留。`
      :"\n\n✅ 存檔格式與目前版本相容。";
    if(!confirm(`準備匯入存檔。\n\n角色數：${count}\n角色：${names}${versionNote}\n\n角色進度、背包、成就等舊資料會沿用；新版新增的欄位會自動補上。\n\n確定繼續嗎？`))return;

    createPreImportBackup();
    const migrated=migrateImportedSave(incoming,fromVersion);
    local=migrated;
    local.characters??=[];
    local.characters.forEach(c=>ensureRelations(c));
    ensureSharedAchievements();
    ensureBadges();

    if(!saveLocal())throw new Error("寫入瀏覽器儲存空間失敗。");

    // 再讀一次確認寫入後仍有角色陣列，失敗就回復匯入前資料。
    const verify=JSON.parse(localStorage.getItem(LOCAL_KEY)||"null");
    if(!verify||!Array.isArray(verify.characters))throw new Error("新存檔驗證失敗，已取消匯入。");

    activeId="";activeRoomCode="";room=null;partner=null;stopPolling();
    renderHome();show("home");
    toast(`📂 匯入成功：${count} 個角色${fromVersion<SAVE_BACKUP_VERSION?"・已自動升級存檔":""}`,5000);
  }catch(err){
    console.error("import save failed",err);
    try{local=oldLocal;saveLocal();renderHome();}catch(e){}
    alert("匯入存檔失敗："+(err?.message||"檔案格式不正確")+"\n\n原本的本機存檔已保留。");
  }finally{
    const input=document.getElementById("importSaveFile");if(input)input.value="";
  }
}

async function refreshPublicStats(){
  try{
    let rows=await api("/test_rooms?select=host_player,guest_player,host_char,guest_char,host_state,guest_state");
    let chars=new Set(),onlinePlayers=new Set();
    for(const r of rows||[]){
      if(r.host_char)chars.add(String(r.host_char));
      if(r.guest_char)chars.add(String(r.guest_char));
      if(r.host_player&&isOnlineState(r.host_state))onlinePlayers.add(String(r.host_player));
      if(r.guest_player&&isOnlineState(r.guest_state))onlinePlayers.add(String(r.guest_player));
    }
    let a=document.getElementById("onlinePlayerCount"),b=document.getElementById("cloudCharacterCount");
    if(a)a.textContent=onlinePlayers.size;
    if(b)b.textContent=chars.size;
  }catch(e){
    console.warn("public stats failed",e);
    let a=document.getElementById("onlinePlayerCount"),b=document.getElementById("cloudCharacterCount");
    if(a)a.textContent="連線失敗";
    if(b)b.textContent="連線失敗";
  }
}
function startPublicStats(){
  clearInterval(publicStatsTimer);
  refreshPublicStats();
  publicStatsTimer=setInterval(()=>{if(!document.getElementById("home")?.classList.contains("hidden"))refreshPublicStats()},15000);
}



function itemDisplayName(id){
  let all=[...(typeof protoShop!=="undefined"?protoShop:[]),...(typeof specialItems!=="undefined"?specialItems:[])];
  let x=all.find(v=>v.id===id);
  return x?.n||id;
}
function badgeDisplayInfo(id){
  let b=allBadgeDefs?.()?.[id]||gmBadgeDefs?.[id]||badgeDefs?.[id];
  return b||{icon:"🏅",name:id,desc:""};
}

async function ensureBadgeOwnedAndDefined(id){
  if(!id)return false;
  ensureBadges();

  // Load exact custom badge definition directly from Supabase.
  if(!(badgeDefs?.[id]||gmBadgeDefs?.[id])){
    try{
      let rows=await api(`/test_gm_custom_badges?badge_id=eq.${encodeURIComponent(id)}&select=badge_id,name,icon,description,rarity,active&limit=1`);
      let b=rows?.[0];
      if(b){
        gmBadgeDefs[id]={
          icon:b.icon||"🏅",
          name:b.name||"限定徽章",
          desc:b.description||"",
          rarity:b.rarity||"限定",
          custom:true
        };
      }
    }catch(e){console.warn("exact custom badge load",e)}
  }

  local.sharedBadges[id]=1;
  return true;
}

async function autoCloseDuplicateBadgeGifts(c,badgeId,exceptKind,exceptId){
  if(!c||!badgeId)return;
  const rawId=String(c.id||"");
  const shortId=displayCharacterId(c).toUpperCase();

  // Close duplicate direct gifts for the same badge and same character.
  try{
    let rows=await api(`/test_gm_gifts?gift_type=eq.badge&gift_value=eq.${encodeURIComponent(badgeId)}&claimed=eq.false&select=id,target_char`);
    for(const g of rows||[]){
      let t=String(g.target_char||"").trim();
      let mine=t===rawId || t.toUpperCase()===`CHR-${rawId}`.toUpperCase() || t.toUpperCase()===shortId;
      if(!mine)continue;
      if(exceptKind==="direct" && String(g.id)===String(exceptId))continue;
      try{
        await api(`/test_gm_gifts?id=eq.${encodeURIComponent(g.id)}`,{
          method:"PATCH",
          body:JSON.stringify({claimed:true,claimed_at:new Date().toISOString()})
        });
      }catch(e){}
    }
  }catch(e){}

  // Close duplicate broadcast claims for the same badge.
  try{
    let broadcasts=await api(`/test_gm_broadcasts?active=eq.true&gift_type=eq.badge&gift_value=eq.${encodeURIComponent(badgeId)}&select=id`);
    let now=new Date().toISOString();
    for(const b of broadcasts||[]){
      if(exceptKind==="mail" && String(b.id)===String(exceptId))continue;
      try{
        await api("/test_gm_mail_claims",{
          method:"POST",
          headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},
          body:JSON.stringify({char_id:c.id,mail_id:b.id,read_at:now,claimed_at:now})
        });
      }catch(e){}
    }
  }catch(e){}
}
function giftReceivedText(g){
  let count=Math.max(1,Number(g?.gift_count||1));
  if(g?.gift_type==="money")return `🪙 金錢 ${Number(g.gift_value||0)*count}`;
  if(g?.gift_type==="item")return `${itemDisplayName(g.gift_value)} ×${count}`;
  if(g?.gift_type==="badge"){
    let b=badgeDisplayInfo(g.gift_value);
    return `${b.icon||"🏅"} 徽章「${b.name||g.gift_value}」`;
  }
  return "官方禮物";
}
async function ensureGiftBadgeDefinition(id){
  if(!id)return;
  if(badgeDefs?.[id]||gmBadgeDefs?.[id])return;
  try{
    let rows=await api(`/test_gm_custom_badges?badge_id=eq.${encodeURIComponent(id)}&select=badge_id,name,icon,description,rarity&limit=1`);
    let b=rows?.[0];
    if(b){
      gmBadgeDefs[id]={
        icon:b.icon||"🏅",name:b.name||"限定徽章",
        desc:b.description||"",rarity:b.rarity||"限定",custom:true
      };
    }
  }catch(e){console.warn("badge definition load",e)}
}
function mailAttachmentText(m){
  if(!m?.gift_type)return "無附件";
  let c=Math.max(1,Number(m.gift_count||1));
  if(m.gift_type==="money")return `🪙 ${m.gift_value} ×${c}`;
  if(m.gift_type==="item")return `🎒 ${m.gift_value} ×${c}`;
  if(m.gift_type==="badge")return `🏅 ${m.gift_value} ×${c}`;
  return "附件";
}
function charCreatedAt(c){
  // New characters have an exact timestamp.
  let exact=Date.parse(c?.createdAt||c?.created_at||"");
  if(Number.isFinite(exact))return exact;

  // Compatibility recovery for characters created in versions before createdAt existed:
  // on day 1, lastEvent is initially created at almost the same time as the character.
  let startDay=Date.parse((c?.start||"")+"T00:00:00");
  let last=Number(c?.lastEvent||0);
  if(Number.isFinite(startDay)&&last>=startDay&&last<startDay+86400000&&day(c)===1){
    return last;
  }

  // Legacy saves remain treated as having existed since the start of that date.
  return Number.isFinite(startDay)?startDay:0;
}
async function loadMailbox(c){
  let box=document.getElementById("mailList"),uc=document.getElementById("mailUnreadCount");
  if(!box||!c)return;
  try{
    const rawId=String(c.id||"");
    const shortId=displayCharacterId(c).toUpperCase();

    // GM 單人禮物：同時相容真正角色 UUID、舊 CHR-UUID、以及新版短 CHR-ID。
    let directAll=[];
    try{
      directAll=await api(`/test_gm_gifts?select=*&order=created_at.desc`);
    }catch(e){
      console.warn("direct gifts load",e);
    }

    let direct=(directAll||[]).filter(g=>{
      let t=String(g.target_char||"").trim();
      if(t===rawId)return true;
      if(t.toUpperCase()===`CHR-${rawId}`.toUpperCase())return true;
      if(t.toUpperCase()===shortId)return true;
      return false;
    });

    let global=[],claims=[];
    let broadcastLoadError=null;
    try{
      global=await api(`/test_gm_broadcasts?active=eq.true&select=*&order=created_at.desc`);
    }catch(e){
      broadcastLoadError=e;
      console.error("broadcast load",e);
    }
    try{
      claims=await api(`/test_gm_mail_claims?char_id=eq.${encodeURIComponent(rawId)}&select=mail_id,read_at,claimed_at`);
    }catch(e){console.warn("mail claims load",e)}

    let claimMap=new Map((claims||[]).map(x=>[String(x.mail_id),x]));
    let created=charCreatedAt(c),now=Date.now();
    let mails=[];

    (direct||[]).forEach(g=>{
      mails.push({
        key:`gift:${g.id}`,
        kind:"direct",
        id:g.id,
        title:"🎁 官方禮物",
        body:g.message||"GM 送來了一份禮物。",
        created_at:g.created_at,
        gift_type:g.gift_type,
        gift_value:g.gift_value,
        gift_count:g.gift_count,
        claimed:!!g.claimed,
        read:!!g.claimed
      });
    });

    for(const mail of (global||[])){
      let expires=mail.expires_at?Date.parse(mail.expires_at):0;
      if(expires&&expires<now)continue;
      // current: existing characters and legacy characters may receive it.
      // starter: intended for characters created after the mail; legacy saves without a reliable timestamp are allowed.
      if(mail.mode==="starter"){
        // 補發制：每一筆 starter 郵件都是獨立的新手禮物項目。
        // 不論這台裝置何時開始玩，只要這一筆尚未領過，就可以看到並補領。
      }
      let claim=claimMap.get(String(mail.id));
      const deviceClaimed=mail.mode==="starter"&&isDeviceStarterClaimed(mail.id);
      mails.push({
        key:`mail:${mail.id}`,
        kind:"mail",
        id:mail.id,
        title:mail.title||"官方郵件",
        body:mail.body||"",
        created_at:mail.created_at,
        gift_type:mail.gift_type,
        gift_value:mail.gift_value,
        gift_count:mail.gift_count,
        claimed:deviceClaimed||!!claim?.claimed_at,
        read:deviceClaimed||!!claim?.read_at,
        mode:mail.mode
      });
    }

    // 已經擁有的徽章，普通重複禮物可隱藏；
    // 但「永久新手禮物」仍要讓每個新角色看到自己的新手郵件。
    mails=mails.filter(mail=>{
      if(mail.gift_type!=="badge")return true;
      if(mail.mode==="starter")return true;
      if(!local.sharedBadges?.[mail.gift_value])return true;
      return !!mail.claimed;
    });

    // 同一款普通未領徽章只顯示最新一封，避免重複群發洗版。
    // Starter 郵件以 mail id 區分，保留每個角色應有的新手信。
    let seenBadge=new Set();
    mails=mails.filter(mail=>{
      if(mail.gift_type!=="badge"||mail.claimed)return true;
      if(mail.mode==="starter")return true;
      let k=String(mail.gift_value||"");
      if(seenBadge.has(k))return false;
      seenBadge.add(k);
      return true;
    });

    mails.sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0));
    let unread=mails.filter(x=>!x.read).length;
    let unclaimed=mails.filter(x=>x.gift_type&&!x.claimed).length;
    if(uc)uc.textContent=unread?`(${unread} 未讀)`:"";
    let dot=document.querySelector('[data-dot="mailbox"]');
    if(dot){
      dot.classList.toggle("hidden",unread<=0&&unclaimed<=0);
      dot.textContent=(unread||unclaimed)?String(Math.max(unread,unclaimed)):"";
    }
    let pending=document.getElementById("gmGiftInbox");
    if(pending){
      if(unread>0||unclaimed>0){
        pending.innerHTML=`<div class="pendingEventCard">
          <div class="pendingTop"><b>📬 你有 ${unread>0?unread+" 封未讀信件":unclaimed+" 份未領附件"}</b></div>
          <div class="small">${unclaimed>0?`其中 ${unclaimed} 份有附件尚未領取。`:"有新的官方郵件尚未查收。"}</div>
          <div class="pendingActions"><button type="button" data-open-mailbox>前往信箱</button></div>
        </div>`;
      }else pending.innerHTML="";
    }

    if(!mails.length){
      if(broadcastLoadError){
        box.innerHTML='<div class="muted">⚠️ 信箱無法讀取官方群發。請先套用第3.22版的 Supabase 信箱權限 SQL。</div>';
      }else{
        box.innerHTML='<div class="muted">目前沒有信件。</div>';
      }
      box._mailRows=[];
      return;
    }

    box.innerHTML=mails.map((mail,i)=>{
      let attachment=mail.gift_type?`<div class="mailAttach">${esc(mailAttachmentText(mail))}</div>`:"";
      return `<div class="mailCard ${mail.read?"":"unread"}">
        <div class="mailHead">
          <b>${mail.read?"":"<span class='mailDot'></span>"}${esc(mail.title)}</b>
          <span class="small">${esc(new Date(mail.created_at).toLocaleString("zh-TW"))}</span>
        </div>
        <div class="small" style="margin-top:6px">${esc(mail.body)}</div>
        ${attachment}
        <div class="mailActions">
          ${!mail.read&&mail.kind==="mail"?`<button data-mail-read="${i}">標為已讀</button>`:""}
          ${mail.gift_type&&!mail.claimed?`<button class="primary" data-mail-claim="${i}">領取附件</button>`:""}
          ${mail.claimed?'<span class="small">✅ 已領取</span>':""}
        </div>
      </div>`;
    }).join("");
    box._mailRows=mails;
  }catch(e){
    console.error("mailbox load failed",e);
    box.innerHTML=`<div class="muted">信箱載入失敗：${esc(e.message||"未知錯誤")}</div>`;
  }
}
async function markMailRead(c,m){
  if(!c||!m||m.kind!=="mail")return;
  try{
    await api("/test_gm_mail_claims",{method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({
      char_id:c.id,mail_id:m.id,read_at:new Date().toISOString()
    })});
    await loadMailbox(c);
  }catch(e){toast("標記已讀失敗："+e.message)}
}
async function claimMailAttachment(c,m){
  if(!c||!m?.gift_type)return;
  try{
    if(m.mode==="starter"&&isDeviceStarterClaimed(m.id)){
      return toast("這台裝置已經領過這份新手禮物。");
    }
    if(m.kind==="direct"){
      await claimOfficialGift(m.id);
      await loadMailbox(c);return;
    }
    // claim-once protected by unique(char_id, mail_id)
    let existing=await api(`/test_gm_mail_claims?char_id=eq.${encodeURIComponent(c.id)}&mail_id=eq.${encodeURIComponent(m.id)}&select=*`);
    if(existing?.[0]?.claimed_at)return toast("這份附件已經領取過。");
    let count=Math.max(1,Number(m.gift_count||1));
    if(m.gift_type==="money"){
      c.money=safeMoney((c.money||0)+(Number(m.gift_value)||0)*count);
    }else if(m.gift_type==="item"){
      c.inventory??={};c.inventory[m.gift_value]=(c.inventory[m.gift_value]||0)+count;
    }else if(m.gift_type==="badge"){
      const alreadyOwned=!!local.sharedBadges?.[m.gift_value];
      await ensureBadgeOwnedAndDefined(m.gift_value);
      m._badgeAlreadyOwned=alreadyOwned;
    }
    let now=new Date().toISOString();
    await api("/test_gm_mail_claims",{method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({
      char_id:c.id,mail_id:m.id,read_at:now,claimed_at:now
    })});
    if(m.mode==="starter")markDeviceStarterClaimed(m.id);
    logJournal(c,`領取官方郵件「${m.title}」附件`,"📬");
    saveLocal();renderGame();renderBadges(c);
  refreshCustomBadgeDefs().then(()=>renderBadges(c)).catch(()=>{});
    toast(
      m.gift_type==="badge"&&m._badgeAlreadyOwned
        ?`✅ 新手／補發禮物已領取：${giftReceivedText(m)}（徽章已在收藏櫃中）`
        :`✅ 已領取：${giftReceivedText(m)}`,
      5000
    );
    await loadMailbox(c);
  }catch(e){toast("領取附件失敗："+e.message)}
}


async function gmCheckCurrentCharacterBroadcast(){
  let c=cur();if(!c)return toast("目前沒有開啟角色");
  try{
    let rows=await api(`/test_gm_broadcasts?active=eq.true&select=*&order=created_at.desc`);
    let now=Date.now(),created=charCreatedAt(c);
    let visible=(rows||[]).filter(mail=>{
      let exp=mail.expires_at?Date.parse(mail.expires_at):0;
      if(exp&&exp<now)return false;
      if(mail.mode==="starter"&&isDeviceStarterClaimed(mail.id))return false;
      return true;
    });
    if(!visible.length)return alert("目前角色沒有符合條件的有效群發郵件。");
    alert("✅ 資料庫裡確實有目前角色可收的群發。\n如果玩家信箱仍顯示沒有信件，代表 Supabase RLS 尚未允許玩家讀取 gm_broadcasts。\n\n"+visible.slice(0,10).map(x=>`#${x.id}｜${x.title}\n模式：${x.mode}\n附件：${x.gift_type||"無"} ${x.gift_value||""} ×${x.gift_count||1}`).join("\\n\\n"));
  }catch(e){toast("群發檢查失敗："+e.message)}
}
async function gmCheckRecentBroadcast(){
  if(!gmProfile)return toast("請先登入 GM");
  try{
    let rows=await gmAuthFetch("/test_gm_broadcasts?select=id,mode,title,gift_type,gift_value,gift_count,active,created_at&order=created_at.desc&limit=5");
    if(!rows?.length)return alert("目前資料庫裡沒有群發郵件。");
    alert(rows.map(x=>`#${x.id} ${x.active?"啟用":"停用"}｜${x.title}\\n${x.mode}｜${x.gift_type||"無附件"} ${x.gift_value||""} ×${x.gift_count||1}`).join("\\n\\n"));
  }catch(e){toast("檢查失敗："+e.message)}
}
async function gmSendBroadcast(){
  if(!gmProfile)return toast("請先登入 GM");
  let mode=document.getElementById("gmBroadcastMode")?.value||"current";
  let title=document.getElementById("gmBroadcastTitle")?.value.trim();
  let body=document.getElementById("gmBroadcastBody")?.value.trim()||"";
  let gift_type=document.getElementById("gmBroadcastGiftType")?.value||null;
  let gift_value=document.getElementById("gmBroadcastGiftValue")?.value.trim()||null;
  let gift_count=Math.max(1,Math.min(9999,Number(document.getElementById("gmBroadcastGiftCount")?.value)||1));
  let expRaw=document.getElementById("gmBroadcastExpires")?.value;
  let expires_at=expRaw?new Date(expRaw).toISOString():null;
  if(!title)return toast("請輸入郵件標題");
  if(mode==="future"&&!expires_at)return toast("「包含之後的新角色」需要設定期限");
  if(mode==="starter")expires_at=null;
  if(gift_type&&!gift_value)return toast("有附件時請填寫金額／道具 ID／徽章 ID");
  if(!confirm(`確定要發送「${title}」？\n\n模式：${mode==="current"?"目前所有角色":mode==="future"?"包含期限內新角色":"永久新手禮物（單項補發制）"}`))return;
  try{
    await gmAuthFetch("/test_gm_broadcasts",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      mode,title,body,gift_type,gift_value,gift_count,expires_at,active:true,sent_by:gmSession.user.id
    })});
    toast("📢 群發郵件已送出");
    let cc=cur();
    if(cc){
      await loadMailbox(cc);
      let mailBtn=document.querySelector('[data-nav="mailbox"]');
      let dot=document.querySelector('[data-dot="mailbox"]');
      if(dot)dot.classList.remove("hidden");
    }
    document.getElementById("gmBroadcastTitle").value="";
    document.getElementById("gmBroadcastBody").value="";
    await loadGMLog();
  }catch(e){toast("群發失敗："+e.message,5000)}
}

function shortCharacterId(raw){
  raw=String(raw||"");
  // Stable 8-character public code; the real UUID remains unchanged internally.
  let h1=2166136261>>>0, h2=2246822519>>>0;
  for(let i=0;i<raw.length;i++){
    let x=raw.charCodeAt(i);
    h1=Math.imul(h1^x,16777619)>>>0;
    h2=Math.imul(h2^x,3266489917)>>>0;
  }
  return (h1.toString(36)+h2.toString(36)).toUpperCase().replace(/[^A-Z0-9]/g,"").padEnd(8,"0").slice(0,8);
}
function displayCharacterId(c){
  if(!c)return "—";
  return `CHR-${shortCharacterId(c.id)}`;
}
function rawCharacterIdFromDisplay(v){
  // GM may paste either a real UUID or a short CHR code.
  return String(v||"").trim();
}
async function resolveCharacterId(v){
  v=String(v||"").trim();
  if(!v)return "";
  if(!/^CHR-/i.test(v))return v;
  let code=v.replace(/^CHR-/i,"").toUpperCase();
  try{
    let rows=await api(`/test_rooms?select=host_char,guest_char`);
    let ids=new Set();
    for(const r of rows||[]){
      if(r.host_char)ids.add(String(r.host_char));
      if(r.guest_char)ids.add(String(r.guest_char));
    }
    for(const id of ids){
      if(shortCharacterId(id)===code)return id;
    }
  }catch(e){}
  return "";
}
async function copyTextValue(v){
  try{
    await navigator.clipboard.writeText(v);
    toast("📋 已複製角色 ID");
  }catch(e){
    let ta=document.createElement("textarea");
    ta.value=v;document.body.appendChild(ta);ta.select();
    document.execCommand("copy");ta.remove();
    toast("📋 已複製角色 ID");
  }
}
async function gmSearchCharactersByName(){
  if(!gmProfile)return toast("請先登入 GM");
  let q=document.getElementById("gmSearchName")?.value.trim();
  let box=document.getElementById("gmSearchResults");
  if(!box)return;
  if(!q){box.innerHTML='<div class="small">請輸入角色名稱。</div>';return}

  box.innerHTML='<div class="small">搜尋中……</div>';
  try{
    // Search cloud relationship room snapshots because that's where current public character states live.
    let rows=await api(`/test_rooms?select=host_char,guest_char,host_state,guest_state`);
    let found=new Map();
    for(const r of rows||[]){
      let pairs=[
        [r.host_char,r.host_state],
        [r.guest_char,r.guest_state]
      ];
      for(const [id,state] of pairs){
        if(!id||!state)continue;
        let name=String(state.name||"");
        if(!name.toLowerCase().includes(q.toLowerCase()))continue;
        if(!found.has(String(id))){
          found.set(String(id),{
            id:String(id),
            name:name||"未命名角色",
            level:Number(state.level||1),
            gender:state.gender||"",
            online:isOnlineState(state)
          });
        }
      }
    }

    let list=[...found.values()];
    if(!list.length){
      box.innerHTML='<div class="small">找不到符合的角色。尚未建立任何雲端關係的純本機角色目前無法被 GM 搜尋。</div>';
      return;
    }

    box.innerHTML=list.map((x,i)=>`
      <div class="gmSearchRow">
        <div>
          <b>${esc(x.name)}</b>
          <div class="gmSearchMeta">${x.online?"🟢 在線":"⚪ 離線"}　Lv.${x.level}　${esc(displayCharacterId({id:x.id}))}</div>
        </div>
        <button type="button" data-gm-pick="${i}">選擇</button>
      </div>
    `).join("");
    box._gmFound=list;
  }catch(e){
    box.innerHTML=`<div class="small">搜尋失敗：${esc(e.message)}</div>`;
  }
}

function makeCustomBadgeId(name){
  let base=String(name||"badge").trim().toLowerCase()
    .replace(/\s+/g,"_").replace(/[^\w\u4e00-\u9fff-]/g,"");
  return `gm_${base||"badge"}_${Date.now().toString(36)}`;
}
function updateGMBadgePreview(){
  let name=document.getElementById("gmBadgeName")?.value.trim()||"新徽章";
  let icon=document.getElementById("gmBadgeIcon")?.value.trim()||"🌱";
  let desc=document.getElementById("gmBadgeDesc")?.value.trim()||"尚未填寫說明";
  let rarity=document.getElementById("gmBadgeRarity")?.value||"限定";
  document.getElementById("gmBadgePreviewName").textContent=name;
  document.getElementById("gmBadgePreviewIcon").textContent=icon;
  document.getElementById("gmBadgePreviewDesc").textContent=desc;
  document.getElementById("gmBadgePreviewRarity").textContent=rarity;
}
let gmCustomBadgeRows=[];
function renderGMCustomBadges(){
  let box=document.getElementById("gmCustomBadgeList");
  let count=document.getElementById("gmCustomBadgeSearchCount");
  if(!box)return;
  let q=(document.getElementById("gmBadgeSearch")?.value||"").trim().toLowerCase();
  let rows=(gmCustomBadgeRows||[]).filter(b=>{
    if(!q)return true;
    return [
      b.name,b.badge_id,b.rarity,b.description,b.icon
    ].some(v=>String(v||"").toLowerCase().includes(q));
  });
  if(count)count.textContent=q?`找到 ${rows.length} / ${gmCustomBadgeRows.length} 枚`:`共 ${gmCustomBadgeRows.length} 枚`;
  if(!rows.length){
    box.innerHTML=`<div class="small">${gmCustomBadgeRows.length?"找不到符合的徽章。":"尚未建立自訂徽章。"}</div>`;
    box._badges=[];
    return;
  }
  box.innerHTML=rows.map((b,i)=>`<div class="gmCustomBadgeRow">
    <div><b>${esc(b.icon||"🏅")} ${esc(b.name)}</b><div class="small">${esc(b.rarity||"限定")} · ${esc(b.badge_id)}</div></div>
    <button type="button" data-copy-badge="${i}">複製 ID</button>
  </div>`).join("");
  box._badges=rows;
}
async function loadGMCustomBadges(){
  let box=document.getElementById("gmCustomBadgeList");if(!box)return;
  try{
    gmCustomBadgeRows=await api("/test_gm_custom_badges?select=*&order=created_at.desc")||[];
    renderGMCustomBadges();
  }catch(e){
    gmCustomBadgeRows=[];
    box.innerHTML=`<div class="small">徽章清單載入失敗：${esc(e.message)}</div>`;
  }
}
async function gmCreateCustomBadge(){
  if(!gmProfile)return toast("請先登入 GM");
  let name=document.getElementById("gmBadgeName")?.value.trim();
  let icon=document.getElementById("gmBadgeIcon")?.value.trim()||"🏅";
  let desc=document.getElementById("gmBadgeDesc")?.value.trim()||"";
  let rarity=document.getElementById("gmBadgeRarity")?.value||"限定";
  let badge_id=document.getElementById("gmBadgeCustomId")?.value.trim()||makeCustomBadgeId(name);
  badge_id=badge_id.replace(/\s+/g,"_");
  if(!name)return toast("請輸入徽章名稱");
  try{
    await gmAuthFetch("/test_gm_custom_badges",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      badge_id,name,icon,description:desc,rarity,created_by:gmSession.user.id,active:true
    })});
    toast(`🏅 已建立「${name}」`);
    document.getElementById("gmBadgeCustomId").value=badge_id;
    await loadGMCustomBadges();
  }catch(e){toast("建立徽章失敗："+e.message,5000)}
}

async function gmCheckTargetGifts(){
  if(!gmProfile)return toast("請先登入 GM");
  let target=document.getElementById("gmTargetChar")?.value.trim();
  if(!target)return toast("請先輸入角色 ID");
  try{
    let rows=await gmAuthFetch(`/test_gm_gifts?target_char=eq.${encodeURIComponent(target)}&claimed=eq.false&select=id,gift_type,gift_value,gift_count,created_at&order=created_at.desc`);
    if(!rows?.length)return alert("這個角色目前沒有未領取的 GM 禮物。");
    alert(rows.map(x=>`#${x.id}　${x.gift_type}　${x.gift_value} ×${x.gift_count}`).join("\\n"));
  }catch(e){toast("檢查失敗："+e.message)}
}


async function gmCloudCharacterNameMap(){
  let map=new Map();
  try{
    let rooms=await api("/test_rooms?select=host_char,guest_char,host_state,guest_state");
    for(const r of rooms||[]){
      if(r.host_char){
        let n=String(r.host_state?.name||"").trim();
        if(n&&!map.has(String(r.host_char)))map.set(String(r.host_char),n);
      }
      if(r.guest_char){
        let n=String(r.guest_state?.name||"").trim();
        if(n&&!map.has(String(r.guest_char)))map.set(String(r.guest_char),n);
      }
    }
  }catch(e){console.warn("GM character name map",e)}
  return map;
}
let gmSentGiftRows=[];
function gmSentGiftLabel(g){
  return g.gift_type==="money"
    ?`🪙 金錢 ${g.gift_value}`
    :g.gift_type==="item"
    ?`🎒 ${itemDisplayName(g.gift_value)} ×${g.gift_count||1}`
    :`🏅 ${badgeDisplayInfo(g.gift_value)?.name||g.gift_value}`;
}
function renderGMSentGifts(){
  let box=document.getElementById("gmSentGiftList");if(!box)return;
  let filter=document.getElementById("gmSentFilter")?.value||"all";
  let q=(document.getElementById("gmSentSearch")?.value||"").trim().toLowerCase();
  let rows=(gmSentGiftRows||[]).filter(g=>{
    if(filter==="unclaimed"&&g.claimed)return false;
    if(filter==="claimed"&&!g.claimed)return false;
    if(!q)return true;
    let label=gmSentGiftLabel(g);
    return [
      g._targetName,
      g.target_char,
      displayCharacterId({id:g.target_char}),
      label,
      g.gift_value,
      g.message,
      g.claimed?"已領取":"未領取"
    ].some(v=>String(v||"").toLowerCase().includes(q));
  });
  let count=document.getElementById("gmSentSearchCount");
  if(count)count.textContent=(q||filter!=="all")?`顯示 ${rows.length} / ${gmSentGiftRows.length} 筆`:`共 ${gmSentGiftRows.length} 筆`;
  if(!rows.length){
    box.innerHTML='<div class="small">目前沒有符合搜尋條件的已發送禮物。</div>';
    box._rows=[];
    return;
  }
  box.innerHTML=rows.map((g,i)=>{
    let label=gmSentGiftLabel(g),name=g._targetName||"未知角色";
    return `<div class="gmSentRow">
      <div class="gmSentTop">
        <div>
          <b>${esc(label)}</b>
          <div class="gmSentMeta">
            👤 ${esc(name)}<br>
            ID：${esc(displayCharacterId({id:g.target_char}))}<br>
            ${esc(new Date(g.created_at).toLocaleString("zh-TW"))}
          </div>
        </div>
        <span class="chip">${g.claimed?"✅ 已領取":"📬 未領取"}</span>
      </div>
      ${g.message?`<div class="small" style="margin-top:6px">留言：${esc(g.message)}</div>`:""}
      ${!g.claimed?`<button type="button" class="gmDangerBtn" data-revoke-gift="${i}" style="width:100%;margin-top:8px">↩️ 撤回給 ${esc(name)} 的這份禮物</button>`:""}
    </div>`;
  }).join("");
  box._rows=rows;
}
async function loadGMSentGifts(){
  if(!gmProfile)return;
  let box=document.getElementById("gmSentGiftList");if(!box)return;
  box.innerHTML='<div class="small">載入中……</div>';
  try{
    let [rows,nameMap]=await Promise.all([
      gmAuthFetch("/test_gm_gifts?select=id,target_char,gift_type,gift_value,gift_count,message,claimed,claimed_at,created_at&order=created_at.desc&limit=100"),
      gmCloudCharacterNameMap()
    ]);
    gmSentGiftRows=(rows||[]).map(g=>({...g,_targetName:nameMap.get(String(g.target_char))||""}));
    renderGMSentGifts();
  }catch(e){
    gmSentGiftRows=[];
    box.innerHTML=`<div class="small">載入失敗：${esc(e.message)}</div>`;
  }
}

async function revokeGMGift(g){
  if(!gmProfile||!g)return;
  if(g.claimed)return toast("這份禮物已經被領取，不能直接撤回。");
  if(!confirm(`確定要撤回這份禮物？\n\n目標角色：${g.target_char}\n內容：${g.gift_type} ${g.gift_value} ×${g.gift_count||1}\n\n撤回後，玩家信箱會在下次刷新時消失。`))return;
  try{
    await gmAuthFetch(`/test_gm_gifts?id=eq.${encodeURIComponent(g.id)}&claimed=eq.false`,{method:"DELETE"});
    toast("↩️ 已撤回未領取禮物");
    await loadGMSentGifts();
    let c=cur();if(c)await loadMailbox(c);
  }catch(e){
    toast("撤回失敗："+e.message,5000);
  }
}
async function gmSendOfficialGift(){
  if(!gmProfile)return toast("請先登入 GM 帳號");
  let targetInput=rawCharacterIdFromDisplay(document.getElementById("gmTargetChar")?.value.trim());
  let target=targetInput.trim();
  if(!target)return toast("請輸入角色 ID");
  let type=document.getElementById("gmGiftType")?.value;
  let value=document.getElementById("gmGiftValue")?.value.trim();
  let count=Math.max(1,Math.min(9999,Number(document.getElementById("gmGiftCount")?.value)||1));
  let message=document.getElementById("gmGiftMessage")?.value.trim()||"";
  if(!target)return toast("請輸入目標角色 ID");
  if(!value)return toast("請輸入要發送的內容");

  let previewText=type==="money"
    ?`🪙 金錢 ${value}`
    :type==="item"
    ?`🎒 ${itemDisplayName(value)} ×${count}`
    :`🏅 ${badgeDisplayInfo(value)?.name||value}`;
  if(!confirm(`確定要送出這份官方禮物？\n\n目標角色：${target}\n內容：${previewText}\n${message?`留言：${message}\n`:""}\n請再次確認角色 ID 是否正確。`))return;
  try{
    await gmAuthFetch("/test_gm_gifts",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      target_char:target,gift_type:type,gift_value:value,gift_count:count,message,
      sent_by:gmSession.user.id
    })});
    toast("🎁 官方禮物已送出");
    document.getElementById("gmGiftMessage").value="";
    await loadGMLog();
  }catch(e){toast("GM 發送失敗："+e.message,5000)}
}
async function loadGMLog(){
  let box=document.getElementById("gmLog");if(!box||!gmProfile)return;
  try{
    let rows=await gmAuthFetch("/gm_logs?select=*&order=created_at.desc&limit=30");
    if(!rows.length){box.innerHTML='<div class="muted">目前沒有操作紀錄。</div>';return}
    box.innerHTML=rows.map(x=>`<div class="gmLogItem"><b>${esc(x.action||"GM 操作")}</b><div class="small">${esc(x.detail||"")}<br>${esc(new Date(x.created_at).toLocaleString("zh-TW"))}</div></div>`).join("");
  }catch(e){box.innerHTML=`<div class="muted">紀錄讀取失敗：${esc(e.message)}</div>`}
}
async function loadOfficialGifts(c){
  let box=document.getElementById("gmGiftInbox");if(!box||!c)return;
  try{
    let rows=await api(`/test_gm_gifts?target_char=eq.${encodeURIComponent(c.id)}&claimed=eq.false&select=*&order=created_at.asc`);
    if(!rows.length){box.innerHTML="";return}
    box.innerHTML=rows.map(x=>`<div class="pendingEventCard"><b>🎁 來自官方的禮物</b><div class="small">${x.message?esc(x.message):"GM 送來了一份禮物。"}<br>${x.gift_type==="money"?"🪙 "+esc(x.gift_value):x.gift_type==="item"?"🎒 "+esc(x.gift_value):"🏅 "+esc(x.gift_value)} ×${Number(x.gift_count||1)}</div><div class="pendingActions"><button data-claim-gm="${x.id}">收下</button></div></div>`).join("");
  }catch(e){
    // Table may not exist before SQL setup; keep silent for ordinary players.
    box.innerHTML="";
  }
}
async function claimOfficialGift(id){
  let c=cur();if(!c)return;
  try{
    const rawId=String(c.id||"");
    const shortId=displayCharacterId(c).toUpperCase();

    let rows=await api(`/test_gm_gifts?id=eq.${encodeURIComponent(id)}&claimed=eq.false&select=*`);
    let g=rows?.[0];
    if(!g)return toast("這份禮物已經領取或不存在");

    let target=String(g.target_char||"").trim();
    let validTarget=
      target===rawId ||
      target.toUpperCase()===`CHR-${rawId}`.toUpperCase() ||
      target.toUpperCase()===shortId;

    if(!validTarget)return toast("這份禮物不是寄給目前角色的。");

    let count=Math.max(1,Number(g.gift_count||1));
    if(g.gift_type==="money"){
      c.money=safeMoney((c.money||0)+(Number(g.gift_value)||0)*count);
    }else if(g.gift_type==="item"){
      c.inventory??={};
      c.inventory[g.gift_value]=(c.inventory[g.gift_value]||0)+count;
    }else if(g.gift_type==="badge"){
      await ensureBadgeOwnedAndDefined(g.gift_value);
    }

    await api(`/test_gm_gifts?id=eq.${encodeURIComponent(id)}`,{
      method:"PATCH",
      body:JSON.stringify({claimed:true,claimed_at:new Date().toISOString()})
    });

    logJournal(c,"領取了一份官方禮物","🎁");
    saveLocal();
    renderGame();
    renderBadges(c);
    toast(`✅ 已領取：${giftReceivedText(g)}`,5000);
    await loadMailbox(c);
  }catch(e){
    toast("領取失敗："+e.message);
  }
}

async function refreshDeviceStarterGiftHint(){
  const panel=document.getElementById("deviceStarterGiftPanel");
  if(!panel)return;
  try{
    const rows=await api("/test_gm_broadcasts?active=eq.true&mode=eq.starter&select=id,created_at,title,gift_type,gift_value&order=created_at.desc");
    const eligible=(rows||[]).filter(x=>!isDeviceStarterClaimed(x.id));
    panel.classList.toggle("hidden",eligible.length===0);
    const text=document.getElementById("deviceStarterGiftText");
    if(text&&eligible.length){
      text.textContent=`這台裝置有 ${eligible.length} 份新手禮物待領。建立或開啟角色後，到信箱領取即可；之後新增項目也會補發。`;
    }
  }catch(e){
    panel.classList.add("hidden");
  }
}
function renderHome(){
  refreshDeviceStarterGiftHint().catch(()=>{});
  ensureBadges();
  refreshPublicStats();
  document.getElementById("saveCount").textContent=`${local.characters.length}/5`;
  let box=document.getElementById("saveList");box.innerHTML="";
  if(!local.characters.length)box.innerHTML='<div class="muted">還沒有角色，先創建一個吧。</div>';
  local.characters.forEach(c=>{
    ensureRelations(c);
    let d=document.createElement("div");d.className="save";
    d.innerHTML=`<div class="pic">${c.image?`<img src="${c.image}">`:"🐾"}</div><div><div class="saveName">${esc(c.name)} ${c.gender==="male"?"♂":c.gender==="female"?"♀":""}</div><div class="muted">Lv.${c.level} · 第 ${day(c)} 天 ${c.roomCodes.length?`· ${c.roomCodes.length} 段關係`:""}</div>${c.equippedBadge&&local.sharedBadges?.[c.equippedBadge]?`<div class="badgeDisplay">${badgeDefs[c.equippedBadge]?.icon||"🏅"} ${esc(badgeDefs[c.equippedBadge]?.name||"徽章")}</div>`:""}<div class="actions"><button class="primary" data-open="${c.id}">進入</button><button class="danger" data-del="${c.id}">刪除</button></div></div>`;
    box.appendChild(d);
  });
  saveLocal();
}



document.getElementById("openUpdateNotice")?.addEventListener("click",()=>document.getElementById("updateNoticeModal")?.classList.remove("hidden"));
document.getElementById("closeUpdateNotice")?.addEventListener("click",()=>document.getElementById("updateNoticeModal")?.classList.add("hidden"));
document.getElementById("updateNoticeOk")?.addEventListener("click",()=>document.getElementById("updateNoticeModal")?.classList.add("hidden"));
document.getElementById("updateNoticeModal")?.addEventListener("click",e=>{if(e.target.id==="updateNoticeModal")e.currentTarget.classList.add("hidden")});






["gmBadgeName","gmBadgeIcon","gmBadgeDesc","gmBadgeRarity"].forEach(id=>{
  document.getElementById(id)?.addEventListener("input",updateGMBadgePreview);
  document.getElementById(id)?.addEventListener("change",updateGMBadgePreview);
});
document.getElementById("gmCreateBadgeBtn")?.addEventListener("click",gmCreateCustomBadge);
document.getElementById("gmCustomBadgeList")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-copy-badge]");if(!b)return;
  let box=document.getElementById("gmCustomBadgeList"),x=box?._badges?.[Number(b.dataset.copyBadge)];
  if(x)copyTextValue(x.badge_id);
});

document.getElementById("copyCharIdBtn")?.addEventListener("click",()=>{
  let c=cur();if(c)copyTextValue(displayCharacterId(c));
});
document.getElementById("gmCheckGiftBtn")?.addEventListener("click",gmCheckTargetGifts);
document.getElementById("gmSearchBtn")?.addEventListener("click",gmSearchCharactersByName);
document.getElementById("gmSearchName")?.addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();gmSearchCharactersByName();}
});
document.getElementById("gmSearchResults")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-gm-pick]");if(!b)return;
  let box=document.getElementById("gmSearchResults"),list=box?._gmFound||[];
  let x=list[Number(b.dataset.gmPick)];if(!x)return;
  let input=document.getElementById("gmTargetChar");
  if(input)input.value=displayCharacterId({id:x.id});
  toast(`✅ 已選擇 ${x.name}`);
});

document.getElementById("mailList")?.addEventListener("click",e=>{
  let box=document.getElementById("mailList"),rows=box?._mailRows||[],c=cur();
  let rb=e.target.closest("[data-mail-read]");
  if(rb){let m=rows[Number(rb.dataset.mailRead)];if(m)markMailRead(c,m);return}
  let cb=e.target.closest("[data-mail-claim]");
  if(cb){let m=rows[Number(cb.dataset.mailClaim)];if(m)claimMailAttachment(c,m);}
});
document.getElementById("gmCheckBroadcastBtn")?.addEventListener("click",gmCheckRecentBroadcast);
document.getElementById("gmCheckCurrentCharBroadcastBtn")?.addEventListener("click",gmCheckCurrentCharacterBroadcast);

document.getElementById("gmRefreshSentGifts")?.addEventListener("click",loadGMSentGifts);
document.getElementById("gmSentFilter")?.addEventListener("change",renderGMSentGifts);

document.getElementById("gmBadgeSearch")?.addEventListener("input",renderGMCustomBadges);
document.getElementById("gmBadgeSearchClear")?.addEventListener("click",()=>{
  let x=document.getElementById("gmBadgeSearch");if(x)x.value="";
  renderGMCustomBadges();
});
document.getElementById("gmSentSearch")?.addEventListener("input",renderGMSentGifts);
document.getElementById("gmSentSearchClear")?.addEventListener("click",()=>{
  let x=document.getElementById("gmSentSearch");if(x)x.value="";
  renderGMSentGifts();
});
document.getElementById("gmSentGiftList")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-revoke-gift]");if(!b)return;
  let box=document.getElementById("gmSentGiftList"),rows=box?._rows||[];
  let g=rows[Number(b.dataset.revokeGift)];
  if(g)revokeGMGift(g);
});

document.getElementById("gmSendBroadcast")?.addEventListener("click",gmSendBroadcast);

document.getElementById("gmLoginBtn")?.addEventListener("click",()=>document.getElementById("gmLoginModal")?.classList.remove("hidden"));
document.getElementById("gmDrawerLoginBtn")?.addEventListener("click",(e)=>{
  e.preventDefault();e.stopPropagation();
  document.getElementById("drawer")?.classList.add("hidden");
  document.getElementById("drawerShade")?.classList.add("hidden");
  document.getElementById("gmLoginModal")?.classList.remove("hidden");
});
document.getElementById("closeGMLogin")?.addEventListener("click",()=>document.getElementById("gmLoginModal")?.classList.add("hidden"));
document.getElementById("gmDoLogin")?.addEventListener("click",async()=>{
  let st=document.getElementById("gmLoginStatus");
  try{
    st.textContent="登入中……";
    await gmSignIn(document.getElementById("gmEmail").value.trim(),document.getElementById("gmPassword").value);
    st.textContent="✅ 管理員登入成功";
    document.getElementById("gmLoginModal").classList.add("hidden");
    toast("👑 GM 權限已解鎖");
  }catch(e){st.textContent="❌ "+e.message}
});

async function loadGMTestInvites(){
  let box=document.getElementById("gmTestInviteList"),st=document.getElementById("gmTestInviteStatus");
  if(!box)return;
  if(!gmProfile){box.innerHTML='<div class="small">請先登入 GM。</div>';return}
  box.innerHTML='<div class="small">載入中……</div>';
  try{
    let rows=await gmAuthFetch("/test_invites?select=id,code,active,used,device_name,device_id,created_at,used_at&order=created_at.desc&limit=100");
    if(st)st.textContent=`目前共 ${rows?.length||0} 組測試碼`;
    if(!rows?.length){
      box.innerHTML='<div class="small">目前還沒有測試碼。</div>';box._rows=[];return;
    }
    box.innerHTML=rows.map((x,i)=>`
      <div class="gmTestInviteRow">
        <div class="gmTestInviteTop">
          <div>
            <div class="gmTestInviteCode">${esc(x.code)}</div>
            <div class="small">
              ${x.active?(x.used?"🟢 已授權":"🟡 未使用"):"⚫ 已停用"}
              ${x.device_name?`・${esc(x.device_name)}`:""}
            </div>
            <div class="small">${esc(new Date(x.created_at).toLocaleString("zh-TW"))}</div>
          </div>
          <span class="chip">${x.used?"已使用":"未使用"}</span>
        </div>
        <div class="gmTestInviteButtons">
          <button type="button" data-test-copy="${i}">📋 複製</button>
          <button type="button" data-test-toggle="${i}" ${!x.active?"disabled":""}>${x.active?"🚫 停用":"已停用"}</button>
        </div>
      </div>
    `).join("");
    box._rows=rows;
  }catch(e){
    if(st)st.textContent="⚠️ 測試碼清單目前無法讀取";
    box.innerHTML=`<div class="small">載入失敗：${esc(e.message)}<br>如果你剛建立 test_invites，請跑我附的「第8步權限 SQL」。</div>`;
  }
}

async function gmCreateTestInvite(){
  let st=document.getElementById("gmTestInviteStatus");
  try{
    if(st)st.textContent="正在產生測試碼……";
    let code=await gmRpc("gm_create_test_invite",{});
    if(Array.isArray(code))code=code[0];
    code=String(code||"").replace(/^"|"$/g,"");
    if(!code)throw new Error("Supabase 沒有回傳測試碼");
    let panel=document.getElementById("gmLatestTestCode");
    let text=document.getElementById("gmLatestTestCodeText");
    if(text)text.textContent=code;
    panel?.classList.remove("hidden");
    if(st)st.textContent="✅ 已產生新的測試碼";
    await loadGMTestInvites();
  }catch(e){
    if(st)st.textContent="❌ "+e.message;
    toast("產生測試碼失敗："+e.message,4500);
  }
}

async function gmDisableTestInvite(row){
  if(!row?.id)return;
  if(!confirm(`確定停用測試碼 ${row.code}？\n\n如果這組碼已經綁定測試裝置，之後該裝置也會失去測試資格。`))return;
  try{
    await gmAuthFetch(`/test_invites?id=eq.${encodeURIComponent(row.id)}`,{
      method:"PATCH",
      headers:{"Prefer":"return=minimal"},
      body:JSON.stringify({active:false})
    });
    toast(`🚫 已停用 ${row.code}`);
    await loadGMTestInvites();
  }catch(e){toast("停用測試碼失敗："+e.message,4500)}
}

document.getElementById("gmLogoutBtn")?.addEventListener("click",async()=>{await gmSignOut();toast("已登出 GM");});

document.getElementById("gmCreateTestInvite")?.addEventListener("click",gmCreateTestInvite);
document.getElementById("gmRefreshTestInvites")?.addEventListener("click",loadGMTestInvites);
document.getElementById("gmCopyLatestTestCode")?.addEventListener("click",()=>{
  let code=document.getElementById("gmLatestTestCodeText")?.textContent.trim();
  if(code)copyTextValue(code);
});
document.getElementById("gmTestInviteList")?.addEventListener("click",async e=>{
  let box=document.getElementById("gmTestInviteList"),rows=box?._rows||[];
  let cp=e.target.closest("[data-test-copy]");
  if(cp){let row=rows[Number(cp.dataset.testCopy)];if(row)copyTextValue(row.code);return}
  let tg=e.target.closest("[data-test-toggle]");
  if(tg){let row=rows[Number(tg.dataset.testToggle)];if(row)await gmDisableTestInvite(row)}
});

document.getElementById("gmSendGift")?.addEventListener("click",gmSendOfficialGift);
document.getElementById("gmRefreshLog")?.addEventListener("click",loadGMLog);
document.getElementById("gmGiftInbox")?.addEventListener("click",e=>{let b=e.target.closest("[data-claim-gm]");if(b)claimOfficialGift(b.dataset.claimGm)});
document.getElementById("exportSaveBtn")?.addEventListener("click",exportGameSave);
document.getElementById("importSaveBtn")?.addEventListener("click",()=>document.getElementById("importSaveFile")?.click());
document.getElementById("importSaveFile")?.addEventListener("change",e=>importGameSaveFile(e.target.files?.[0]));

document.getElementById("createChar").onclick=()=>{
  try{
    if(local.characters.length>=5)return alert("最多 5 個角色。");
    let n=document.getElementById("newName").value.trim()||`角色 ${local.characters.length+1}`;
    let gender=document.getElementById("newGender").value;
    if(!gender)return alert("請先選擇角色性別：男或女。");
    ensureSharedAchievements();
    let c=newChar(n,gender);
    c.achievements=local.sharedAchievements;
    local.characters.push(c);
    if(!saveLocal()){
      local.characters=local.characters.filter(x=>x!==c);
      return alert("角色沒有建立成功：瀏覽器儲存空間可能不足。請先少放幾張時間段圖片，建立角色後再逐張補上。");
    }
        document.getElementById("newName").value="";
    document.getElementById("newGender").value="";
    renderHome();
    loadTestReferralPanel().catch(()=>{});
    evaluateLaunchActivity(false).catch(()=>{});
    toast("✅ 角色建立成功");
  }catch(err){
    console.error("create character failed",err);
    alert("角色建立失敗："+(err?.message||"未知錯誤"));
  }
};

document.getElementById("saveList").onclick=async e=>{
  let openBtn=e.target.closest("[data-open]");
  let delBtn=e.target.closest("[data-del]");
  if(openBtn){e.preventDefault();await openChar(openBtn.dataset.open);return}
  if(delBtn){
    e.preventDefault();
    let c=local.characters.find(x=>x.id===delBtn.dataset.del);
    if(c&&confirm(`確定刪除「${c.name}」？`)){
      local.characters=local.characters.filter(x=>x.id!==c.id);saveLocal();renderHome();
    }
  }
};

async function openChar(id){
  clearFatal();

  // 3.26.5: entering a character is LOCAL-FIRST.
  // No cloud request is allowed to block the first visible render.
  rememberOpenSheet("");
  document.querySelectorAll(".pageCard").forEach(x=>x.classList.remove("active"));
  pageTitle.textContent="角色生活";

  let found=local.characters.find(x=>x.id===id);
  if(!found)return alert("找不到這個角色存檔。請重新整理頁面後再試。");
  activeId=id;
  let c=found;

  try{
    ensureRelations(c);ensureMeta(c);
    if(!["male","female"].includes(c.gender)){
      let pick=prompt("這是舊角色存檔，請設定角色性別：\n輸入 1＝男\n輸入 2＝女");
      if(pick!=="1"&&pick!=="2"){ activeId=null; return; }
      c.gender=pick==="1"?"male":"female";
    }
    resetDailyIfNeeded(c);
    saveLocal();
  }catch(e){
    console.error("local character migration failed",e);
    fatal("角色本機存檔整理失敗："+(e?.message||"未知錯誤"));
    return;
  }

  room=null;partner=null;
  relationshipSummaries={};
  activeRoomCode=(c.roomCodes||[])[0]||"";

  // 3.26.6: Show the game with a LIGHT first paint.
  // Android Chrome was crashing because the old path rendered the whole game twice,
  // including every hidden page, achievement list, shop and cloud pending-event query.
  window.__fullGameRenderReady=false;
  show("game");
  try{restoreBadgeShowcaseBackup(c)}catch(e){console.warn("badge restore",e)}
  safeRenderGame();

  // Nonessential local systems are delayed until the browser has painted the role page.
  // 3.26.7 SAFE MODE: never do an automatic full hidden-page render after entering.
  // Hidden systems are opened/rendered only when the player actually taps them.
  setTimeout(()=>{
    if(activeId!==id)return;
    try{maybeEvent()}catch(e){console.warn("maybeEvent",e)}
  },700);

  // No relationship = absolutely no relationship cloud work.
  if(!(c.roomCodes||[]).length){
    activeRoomCode="";
    room=null;partner=null;
    stopPolling();
    return;
  }

  // Start a guarded, slower poller only for characters that actually have relationships.
  startPolling();

  // Everything cloud-related is background-only. openChar returns immediately.
  Promise.resolve().then(async()=>{
    try{
      await refreshCustomBadgeDefs().catch(()=>{});
      await refreshRelationships();
      await refreshAllBondSummaries(c);
      if(activeId!==id)return;
      activeRoomCode=activeRoomCode||c.roomCodes?.[0]||"";
      if(activeRoomCode){
        await loadRoom(activeRoomCode);
        await Promise.allSettled([loadMessages(),loadInbox(),checkDirectGamePopups()]);
      }
      if(activeId===id)safeRenderGame();
    }catch(e){
      console.warn("background relationship sync failed",e);
      if(activeId===id){
        toast("☁️ 雲端同步暫時失敗；角色仍可用本機模式遊玩。",4200);
        safeRenderGame();
      }
    }
  });
}

document.getElementById("back").onclick=()=>{
  stopPolling();rememberOpenSheet("");activeId=null;room=null;partner=null;activeRoomCode="";relationshipSummaries={};show("home");renderHome();
};

async function makeCode(){
  for(let i=0;i<15;i++){
    let code=String(Math.floor(100000+Math.random()*900000));
    let rows=await api(`/test_rooms?code=eq.${encodeURIComponent(code)}&select=code&limit=1`);
    if(!rows.length)return code;
  }
  throw new Error("無法產生房間碼，請再試一次。");
}


const relationTypeLabels={
  lover:"戀人",
  bestfriend:"摯友",
  family:"家人",
  partner:"搭檔",
  rival:"宿敵",
  enemy:"仇敵"
};
function relationLabel(type){
  return relationTypeLabels[type]||defs?.[type]?.name||type||"未知關係";
}
function ownedRelationTypes(c){
  let set=new Set();
  for(const code of c?.roomCodes||[]){
    let rr=relationshipSummaries?.[String(code)];
    if(rr?.relation)set.add(rr.relation);
    else if(room?.code===String(code)&&room?.relation)set.add(room.relation);
  }
  return set;
}

function duplicateRelationMessage(type){
  const funny={
    lover:"你已經有一個戀人了，還想幹嘛這個渣渣 😂",
    bestfriend:"你的摯友席已經有人坐了，再塞一個要變摯友大會了 😂",
    family:"這個家人位置已經有人了，一個坑先別塞兩個人啦。",
    partner:"你已經有固定搭檔了，先別偷偷組第二隊 😂",
    rival:"宿敵只能有一個最特別的，不然到底誰才是宿敵？",
    enemy:"仇敵席已經有人了。你到底是有多少仇要報 😂"
  };
  return funny[type]||`你已經有「${relationLabel(type)}」關係了。每種關係只能綁定 1 人。`;
}
function canAddRelationType(c,type){
  if(!c||!type)return false;
  // Cloud-loaded summaries are preferred.
  if(ownedRelationTypes(c).has(type))return false;

  // If one of the local room codes has not synced yet, check it lazily when possible.
  // Do not block unrelated types merely because cloud is temporarily unavailable.
  return true;
}
document.getElementById("recoverRelations").onclick=async()=>{
  let c=cur();if(!c)return;
  try{
    await refreshRelationships();
    if(c.roomCodes.length){
      for(const code of c.roomCodes){
        if(!relationshipSummaries[String(code)]){
          try{
            let rs=await api(`/test_rooms?code=eq.${encodeURIComponent(code)}&select=*`);
            if(rs.length)relationshipSummaries[String(code)]=rs[0];
          }catch(e){console.warn("recover room",code,e)}
        }
      }
      activeRoomCode=String(c.roomCodes[0]);
      await loadRoom(activeRoomCode);
      toast(`☁️ 已重新同步 ${c.roomCodes.length} 段關係`);
    }else toast("目前沒有可找回的關係房間。")
  }catch(e){alert("找回關係失敗："+(e?.message||"請稍後再試"))}
};

document.getElementById("createRoom").onclick=async()=>{
  try{
    clearFatal();
    let c=cur(); if(!c)return;ensureRelations(c);
    let relation=document.getElementById("relation").value;
    if(!canAddRelationType(c,relation))return alert(duplicateRelationMessage(relation));
    let code=await makeCode();
    await api("/test_rooms",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      code,relation,host_player:playerId,host_char:c.id,host_state:publicState(c)
    })});
    c.roomCodes.push(code);activeRoomCode=code;saveLocal();await refreshRelationships();await loadRoom(code);startPolling();
  }catch(e){alert(e.message)}
};

document.getElementById("joinRoom").onclick=async()=>{
  try{
    clearFatal();
    let c=cur();ensureRelations(c);
    let code=document.getElementById("joinCode").value.replace(/\D/g,"");
    if(code.length!==6)return alert("請輸入 6 位房間碼。");
    if(c.roomCodes.includes(code))return alert("這段關係已經在你的列表裡。");
    let rows=await api(`/test_rooms?code=eq.${encodeURIComponent(code)}&select=*`);
    if(!rows.length)return alert("找不到這個房間。");
    let r=rows[0];
    if(!canAddRelationType(c,r.relation))return alert(duplicateRelationMessage(r.relation));
    if(r.guest_char && r.guest_char!==c.id)return alert("這個房間已經有兩個角色。");
    await api(`/test_rooms?code=eq.${encodeURIComponent(code)}`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      guest_player:playerId,guest_char:c.id,guest_state:publicState(c)
    })});
    c.roomCodes.push(code);activeRoomCode=code;saveLocal();await refreshRelationships();await loadRoom(code);startPolling();
  }catch(e){alert(e.message)}
};


const relationStages={
 lover:["初識心動","互有好感","親密戀人","熱戀相伴","深愛彼此","無可取代"],
 bestfriend:["初識","聊得來","好朋友","摯友","知己","靈魂摯友"],
 family:["熟悉","親近","互相照顧","深厚家人","彼此依靠","不可取代的家人"],
 partner:["初次合作","有些默契","固定搭檔","默契十足","生死與共","最強搭檔"],
 rival:["競爭者","對手","勁敵","宿敵","一生之敵","命定對手"],
 enemy:["看不順眼","敵視","針鋒相對","水火不容","不死不休","宿命之敵"]
};
const relationTransformRules={
 lover:["bestfriend","family","partner","rival","enemy"],
 bestfriend:["lover","family","partner","rival","enemy"],
 family:["lover","bestfriend","partner","rival","enemy"],
 partner:["lover","bestfriend","family","rival","enemy"],
 rival:["lover","bestfriend","family","partner","enemy"],
 enemy:["lover","bestfriend","family","partner","rival"]
};
function relationOccupant(c,type,ignoreCode=""){
  for(let code of c.roomCodes||[]){
    if(code===ignoreCode)continue;
    let rr=relationshipSummaries?.[code];if(rr?.relation===type)return {code,rr,other:rr.host_char===c.id?rr.guest_state:rr.host_state};
  }
  return null;
}

const relationTransformRetention={
  "bestfriend>lover":0.80,
  "bestfriend>partner":0.90,
  "partner>bestfriend":0.90,
  "rival>bestfriend":0.70,
  "rival>lover":0.60,
  "lover>enemy":0.50,
  "enemy>rival":0.80,
  "family>bestfriend":0.90,
  "bestfriend>family":0.90,
  "family>partner":0.85,
  "partner>family":0.85,
  "lover>bestfriend":0.75,
  "lover>family":0.70,
  "lover>partner":0.75,
  "lover>rival":0.55,
  "enemy>bestfriend":0.65,
  "enemy>family":0.55,
  "enemy>partner":0.60,
  "rival>partner":0.70,
  "rival>family":0.60
};
function transformRetention(from,to){return relationTransformRetention[`${from}>${to}`]??0.75}
function transformDecisionKey(code,stage){return `${String(code)}:${Number(stage||0)}`}
function ensureTransformState(c){
  c.relationTransformDecisions??={};
  c.pendingRelationTransforms??={};
}
function currentTransformStage(code){
  return Number(bondCache?.[String(code)]?.stage||0);
}
function clearOlderTransformPending(c,code,stage){
  ensureTransformState(c);
  for(const k of Object.keys(c.pendingRelationTransforms)){
    let p=c.pendingRelationTransforms[k];
    if(String(p?.code)===String(code)&&Number(p?.stage)!==Number(stage))delete c.pendingRelationTransforms[k];
  }
}
function savePendingTransform(c,code,from,to,stage){
  ensureTransformState(c);
  clearOlderTransformPending(c,code,stage);
  let key=transformDecisionKey(code,stage);
  c.pendingRelationTransforms[key]={code:String(code),from,to,stage:Number(stage),createdAt:new Date().toISOString()};
  saveLocal();
}
function rejectTransformForStage(c,code,stage){
  ensureTransformState(c);
  let key=transformDecisionKey(code,stage);
  c.relationTransformDecisions[key]="rejected";
  delete c.pendingRelationTransforms[key];

  // Rejecting the whole stage also clears any older pending choice for this room/stage.
  for(const k of Object.keys(c.pendingRelationTransforms||{})){
    let p=c.pendingRelationTransforms[k];
    if(String(p?.code)===String(code) && Number(p?.stage)===Number(stage)){
      delete c.pendingRelationTransforms[k];
    }
  }
  saveLocal();
}
function consumeTransformForStage(c,code,stage){
  ensureTransformState(c);
  let key=transformDecisionKey(code,stage);
  c.relationTransformDecisions[key]="accepted";
  delete c.pendingRelationTransforms[key];
  saveLocal();
}
async function applyBondDecay(code,from,to){
  // Current bond is interaction-count based. Remove the newest normal bond interactions
  // until the retained total approximates the configured percentage.
  let rows=await api(`/test_interactions?room_code=eq.${encodeURIComponent(code)}&select=id,text,created_at&order=created_at.desc&limit=1000`);
  let normal=(rows||[]).filter(x=>!String(x.text||"").startsWith("RELATION_BREAK|"));
  let keep=Math.max(0,Math.floor(normal.length*transformRetention(from,to)));
  let remove=normal.slice(0,Math.max(0,normal.length-keep));
  for(const x of remove){
    try{await api(`/test_interactions?id=eq.${encodeURIComponent(x.id)}`,{method:"DELETE"})}catch(e){console.warn("羈絆衰減",e)}
  }
  await refreshBond(code);
  return Math.round(transformRetention(from,to)*100);
}
function openTransformDecision(c,code,from,to,stage){
  let occ=relationOccupant(c,to,code);
  relationTransformBody.innerHTML=`
    <b>🔄 是否要轉換關係？</b>
    <p><b>${relationLabel(from)} → ${relationLabel(to)}</b></p>
    <div class="small">目前為第 ${Number(stage)+1} 階。只有真正同意並完成轉換後才會改變關係與衰減羈絆。</div>
    ${occ?`<div class="small" style="margin-top:6px">⚠️ 「${relationLabel(to)}」目前已有 ${esc(occ.other?.name||"其他角色")}，同意後會再進入關係平衡事件。</div>`:""}
    <div class="outingChoiceList">
      <button class="primary" data-transform-decision="accept" data-transform-to="${esc(to)}">同意</button>
      <button data-transform-decision="reject" data-transform-to="${esc(to)}">拒絕</button>
      <button data-transform-decision="later" data-transform-to="${esc(to)}">再想想</button>
    </div>`;
  relationTransformModal.classList.remove("hidden");
}
function renderRelationTransform(c){
 if(!transformRelationBtn)return;
 let rr=relationshipSummaries?.[activeRoomCode],b=bondCache?.[activeRoomCode],targets=rr?(relationTransformRules[rr.relation]||[]):[];
 let stage=Number(b?.stage||0);
 ensureTransformState(c);
 clearOlderTransformPending(c,activeRoomCode,stage);
 let rejected=c.relationTransformDecisions?.[transformDecisionKey(activeRoomCode,stage)]==="rejected";
 let show=!!rr&&!!partner&&stage>=2&&targets.length>0&&!rejected;
 transformRelationBtn.classList.toggle("hidden",!show);
 transformRelationBtn.onclick=()=>{
   if(!show)return;
   relationTransformBody.innerHTML=`<div class="small">第 ${stage+1} 階已解鎖關係轉變。你可以查看可能的轉換方向；沒有按下同意前，關係不會改變。</div><div class="outingChoiceList">${targets.map(t=>{let occ=relationOccupant(c,t,activeRoomCode);return `<button data-transform="${t}">${relationLabel(rr.relation)} → ${relationLabel(t)}${occ?`　⚠️ ${esc(occ.other?.name||"已有角色")}`:""}</button>`}).join("")}<button data-transform-later-all="1">⏳ 再想想</button><button class="dangerSoft" data-transform-reject-all="1">🚫 拒絕本階段任何關係轉換</button></div>`;
   relationTransformModal.classList.remove("hidden");
 };
}


// 每一個互動按鈕都有獨立事件池：普通 / 稀有 / 特殊。
// min 1/3/5 對應羈絆階段逐步解鎖。
function relEv(min,rarity,title,text,choices){
  return {min,rarity,title,text:n=>text.replaceAll("{n}",n),choices};
}
function relChoices(rel,rarity,label){
  const bonus=rarity==="特殊"?4:rarity==="稀有"?2:0;
  const sets={
    lover:[
      [`順著「${label}」的氣氛繼續`,6+bonus,4+bonus,"你們沒有刻意說破，卻都感覺彼此又靠近了一點。"],
      ["故意逗逗對方",4+bonus,5+bonus,"對方被你弄得有點無奈，最後還是笑了。"],
      ["安靜看著對方",5+bonus,4+bonus,"短暫的安靜沒有尷尬，反而變得很柔軟。"]
    ],
    bestfriend:[
      [`把「${label}」玩到底`,6+bonus,5+bonus,"事情一路失控，但也成了你們新的共同笑話。"],
      ["順便挖一點黑歷史",4+bonus,6+bonus,"你默默記下來，對方立刻警告你不准到處講。"],
      ["認真回應一次",6+bonus,4+bonus,"玩笑停了一瞬，你們難得很認真地理解了彼此。"]
    ],
    family:[
      [`好好接受這次「${label}」`,6+bonus,4+bonus,"這種平凡的小事，反而讓人很安心。"],
      ["也替對方做點什麼",7+bonus,5+bonus,"你們互相照顧得太自然，連誰先開始都記不得了。"],
      ["嘴上嫌棄一下",4+bonus,4+bonus,"嘴上雖然嫌棄，最後還是默默留在彼此身邊。"]
    ],
    partner:[
      [`按照默契完成「${label}」`,6+bonus,4+bonus,"幾乎不用多說，你們就知道下一步該做什麼。"],
      ["臨場換一個做法",7+bonus,4+bonus,"你突然改變節奏，對方仍然立刻跟了上來。"],
      ["把主導權交給對方",5+bonus,5+bonus,"這一次你選擇相信對方，而結果證明沒有信錯。"]
    ],
    rival:[
      [`正面接下「${label}」`,5+bonus,4+bonus,"誰也不肯先退一步，熟悉的勝負心又被點燃。"],
      ["故意刺激對方",6+bonus,3+bonus,"果然一句話就讓對方更加不服輸。"],
      ["難得承認對方不錯",7+bonus,5+bonus,"稱讚出口的瞬間，兩個人都覺得哪裡怪怪的。"]
    ],
    enemy:[
      [`毫不退讓地回應「${label}」`,4+bonus,3+bonus,"氣氛瞬間繃緊，誰都沒有讓步的意思。"],
      ["冷冷地反擊",5+bonus,3+bonus,"你的平靜反而讓對方更火大了。"],
      ["先觀察對方真正的目的",6+bonus,4+bonus,"你沒有立刻出手，卻發現這次的敵意似乎藏著別的東西。"]
    ]
  };
  return sets[rel]||sets.lover;
}

const relationshipEventSeeds={
 lover:{
  "抱抱":[
    ["普通","猝不及防的擁抱","你才剛張開手，{n}就像早有預感似地先一步靠了過來。"],
    ["稀有","不想先放手","擁抱已經持續了一會，{n}卻完全沒有要鬆手的意思。"],
    ["特殊","聽見彼此的心跳","四周安靜下來後，你突然發現自己能清楚聽見{n}靠近時的心跳。"]
  ],
  "約會":[
    ["普通","臨時決定的約會","原本沒有任何計畫，{n}卻突然問你要不要一起出去走走。"],
    ["稀有","只有兩個人的小路","你和{n}意外走進一條沒什麼人的小路，像是整個世界突然安靜了。"],
    ["特殊","捨不得結束的一天","約會明明已經到了該回去的時間，{n}卻遲遲沒有說出那句『回家吧』。"]
  ],
  "撒嬌":[
    ["普通","今天特別黏人","{n}今天不知道怎麼了，比平常更愛往你身邊靠。"],
    ["稀有","只對你這樣","你發現{n}在別人面前明明很正常，一到你旁邊卻完全換了一個樣子。"],
    ["特殊","偶爾也想被你寵","{n}沉默了一會，難得直接承認：今天就是想被你好好哄一下。"]
  ],
  "分享甜點":[
    ["普通","多出來的一口","{n}把甜點往你這邊推了一點，說自己好像吃不完。"],
    ["稀有","最後一口給誰","盤子裡只剩最後一口甜點，你和{n}同時停下了動作。"],
    ["特殊","記得你的口味","{n}帶來的甜點竟然完全是你喜歡的口味，而且連你自己都不記得什麼時候提過。"]
  ],
  "說想你":[
    ["普通","只是突然想到你","{n}看似隨口地說，剛才做事情時突然想到你了。"],
    ["稀有","沒見到你的那一天","{n}難得說起你不在時發生的事，最後小聲補了一句：其實有點不習慣。"],
    ["特殊","藏不住的思念","{n}本來想把話帶過，最後卻還是看著你說：『我是真的很想你。』"]
  ]
 },
 bestfriend:{
  "聊八卦":[
    ["普通","話題越來越離譜","你和{n}原本只是在聊一件小事，結果話題一路歪到完全回不去。"],
    ["稀有","不能讓第三個人知道","{n}突然壓低聲音，說接下來這件事絕對只能你知道。"],
    ["特殊","玩笑後的真心話","聊著聊著，{n}突然把一件平常總拿來開玩笑的事情認真說了出來。"]
  ],
  "出去玩":[
    ["普通","說走就走","{n}突然提議乾脆什麼都別計畫，現在就出去亂晃。"],
    ["稀有","迷路也很好玩","你和{n}走著走著完全不知道自己在哪，卻誰都沒有急著找路。"],
    ["特殊","只有我們知道的地方","{n}帶你去了一個自己很喜歡、卻幾乎沒帶別人來過的地方。"]
  ],
  "分零食":[
    ["普通","這個給你一半","{n}拆開零食後很自然地把其中一半倒到你手裡。"],
    ["稀有","最後一包珍藏","{n}拿出一包藏很久的零食，嘴上說只是快過期，卻明顯有點捨不得。"],
    ["特殊","特地替你留下","你後來才知道，{n}從一開始就把你最喜歡的口味留下來了。"]
  ],
  "擊掌":[
    ["普通","默契的擊掌","事情順利完成後，你和{n}幾乎同時抬起手。"],
    ["稀有","不用說也知道","你才看了{n}一眼，兩個人就同時笑著伸出手。"],
    ["特殊","我們一直都是一隊","{n}伸手等著你，笑著說不管怎樣，你們永遠站同一邊。"]
  ],
  "打氣":[
    ["普通","一句就夠了","{n}沒有講大道理，只拍了拍你說：『你可以啦。』"],
    ["稀有","比你更相信你","你都快想放棄了，{n}卻一副完全不覺得你會失敗的樣子。"],
    ["特殊","只有你知道的低潮","打氣到最後，{n}反而坦白自己也曾經有過幾乎撐不下去的時候。"]
  ]
 },
 family:{
  "一起吃飯":[
    ["普通","今晚吃什麼","{n}一看到你就問晚餐想吃什麼，像這是每天最自然的事情。"],
    ["稀有","久違的一桌菜","你和{n}難得很認真地準備了一整桌飯菜。"],
    ["特殊","留著你的位子","即使你晚了很久，{n}還是把飯菜熱著，也一直留著你的位子。"]
  ],
  "關心":[
    ["普通","今天還好嗎","{n}很普通地問了一句今天過得怎樣，卻真的停下來等你的答案。"],
    ["稀有","一眼就看出來了","你明明說自己沒事，{n}卻立刻皺起眉頭，顯然完全沒被騙過。"],
    ["特殊","什麼都不用藏","{n}告訴你，在這裡不用總裝成沒事的樣子。"]
  ],
  "陪伴":[
    ["普通","一起待著就好","你和{n}沒有特別做什麼，只是各自做事、待在同一個空間。"],
    ["稀有","睡著也沒關係","你不知不覺靠著睡著了，醒來時{n}還在旁邊。"],
    ["特殊","不問原因的陪伴","{n}沒有問你發生了什麼，只說如果你需要，他今天哪裡都不去。"]
  ],
  "幫忙":[
    ["普通","搭把手","你還沒開口，{n}就已經順手接過一半事情。"],
    ["稀有","嘴上嫌麻煩","{n}一路嫌你怎麼這麼會給人添麻煩，手上的事情卻完全沒停。"],
    ["特殊","這次換我照顧你","{n}直接把事情全部接過去，說你今天只需要好好休息。"]
  ],
  "送伴手禮":[
    ["普通","順手帶回來的","{n}把一個小東西塞給你，硬說只是路過順便買的。"],
    ["稀有","看到就想到你","{n}承認自己一看到這件東西，第一個想到的人就是你。"],
    ["特殊","一直記得的喜好","這份伴手禮是你很久以前隨口提過喜歡的東西，連你自己都快忘了。"]
  ]
 },
 partner:{
  "訓練":[
    ["普通","基本配合","你和{n}重新跑了一遍最基本的配合流程。"],
    ["稀有","突然加碼","{n}臨時提高難度，像是想看看你到底能跟到什麼程度。"],
    ["特殊","背對背也能相信","訓練進入最混亂的階段時，你們甚至不需要確認彼此的位置。"]
  ],
  "討論計畫":[
    ["普通","桌上的草稿","你和{n}對著同一張草稿改了又改。"],
    ["稀有","意見完全相反","這次你和{n}第一次對計畫有完全不同的看法。"],
    ["特殊","只要你在計畫裡","討論到最後，{n}表示某個高風險方案只有在你同行時才會考慮。"]
  ],
  "交換情報":[
    ["普通","新的線索","{n}帶來一條剛拿到的新消息，要你一起判斷真假。"],
    ["稀有","不能寫下來的情報","{n}只肯當面告訴你這件事，連任何紀錄都不願留下。"],
    ["特殊","只告訴你的底牌","{n}第一次把自己一直保留的最後手段告訴了你。"]
  ],
  "掩護":[
    ["普通","交給我","{n}很自然地接下後方的位置，讓你不用回頭確認。"],
    ["稀有","差一點出事","一次意外讓{n}為了替你掩護，做了比原本計畫更冒險的選擇。"],
    ["特殊","不會讓你留在這裡","最糟的情況下，{n}仍然只說了一句：『我會帶你一起回去。』"]
  ],
  "慶祝":[
    ["普通","任務後的小乾杯","忙完之後，{n}提議至少要為今天乾杯一下。"],
    ["稀有","難得放鬆","你第一次看到{n}完全放下警戒、真正開心地笑。"],
    ["特殊","下一次也一起","慶祝快結束時，{n}沒有談這次的成功，反而先約好了你們的下一次。"]
  ]
 },
 rival:{
  "挑戰":[
    ["普通","又來了","{n}才看到你沒多久，就立刻丟下一句『比一場？』。"],
    ["稀有","加上賭注","{n}這次不只要比，還堅持一定要加一個輸家必須完成的賭注。"],
    ["特殊","只想贏過你","有人提出更強的對手時，{n}卻毫不猶豫地說自己現在只想贏你。"]
  ],
  "比戰績":[
    ["普通","差一點點","你和{n}把最近的成績擺在一起，差距小得讓人更加不甘心。"],
    ["稀有","誰也不肯認輸","數字明明已經很明顯，落後的那個人卻硬是找出另一個項目繼續比。"],
    ["特殊","一直在追著你的背影","{n}第一次承認，自己之所以變得這麼強，有一部分是因為一直拿你當目標。"]
  ],
  "挑釁":[
    ["普通","一句話就點著了","你才說一句，{n}的表情立刻寫滿了『你再說一次』。"],
    ["稀有","故意踩線","你精準地挑中了{n}最不能忍的那一句話。"],
    ["特殊","別人不准說你","別人跟著你一起挑釁時，{n}反而突然冷下臉，說那不是他們能講的。"]
  ],
  "再戰":[
    ["普通","下次一定","{n}離開前還不忘回頭提醒你，下次絕對不會是這個結果。"],
    ["稀有","凌晨的挑戰訊息","你沒想到{n}連休息時間都還在研究怎麼贏你。"],
    ["特殊","我們還有很多次下次","{n}說著『下次再戰』時，語氣裡第一次沒有只有勝負。"]
  ],
  "嘴硬稱讚":[
    ["普通","勉強算不錯","{n}盯著你的成果半天，最後只擠出一句『還行吧』。"],
    ["稀有","稱讚完立刻後悔","{n}才剛認真稱讚你一句，就像突然意識到自己做了什麼似地立刻改口。"],
    ["特殊","我比誰都知道你很強","被別人質疑時，{n}反而第一個替你說話，然後又極力否認那是在幫你。"]
  ]
 },
 enemy:{
  "下戰帖":[
    ["普通","正式宣告","{n}把話說得很清楚：這次不會再只是口頭上的衝突。"],
    ["稀有","指定只有你","{n}拒絕其他人的介入，堅持這件事只能由你來應戰。"],
    ["特殊","延續太久的戰帖","你發現{n}保存著很久以前你們第一次真正敵對時留下的東西。"]
  ],
  "嘲諷":[
    ["普通","冷嘲熱諷","{n}才開口沒幾句，就精準挑中你最不想聽的地方。"],
    ["稀有","反常地沒有繼續","你準備好反擊時，{n}卻突然收住了原本更傷人的下一句。"],
    ["特殊","知道得太多","你忽然意識到，{n}之所以總能刺中痛處，是因為他其實非常了解你。"]
  ],
  "正面較量":[
    ["普通","誰都別躲","你和{n}終於把話說開，決定乾脆正面分個高下。"],
    ["稀有","意外的平手","這場較量最後沒有任何人真正贏下來。"],
    ["特殊","最懂你的對手","交手到最後，你們甚至能預判彼此下一步會做什麼。"]
  ],
  "警告":[
    ["普通","別再往前","{n}冷冷地提醒你不要再插手接下來的事情。"],
    ["稀有","不像威脅的警告","這次的警告聽起來不像要傷害你，反而更像是在阻止你靠近危險。"],
    ["特殊","到底是在保護誰","你追問之後，{n}第一次沒有辦法乾脆回答這句警告到底是為了什麼。"]
  ],
  "宣戰":[
    ["普通","到此為止","{n}明確表示下一次見面，雙方就不必再留任何餘地。"],
    ["稀有","沒有退路的宣言","{n}說這場恩怨已經不可能再用普通方式結束。"],
    ["特殊","執念的名字","你終於從{n}口中聽見：這場漫長的敵對，早就不只是單純的恨意。"]
  ]
 }
};

const relationshipEventPools={};
Object.entries(relationshipEventSeeds).forEach(([rel,actions])=>{
  relationshipEventPools[rel]={};
  Object.entries(actions).forEach(([label,seeds])=>{
    relationshipEventPools[rel][label]=seeds.map(([rarity,title,text],idx)=>{
      const mins=[1,3,5],choices=relChoices(rel,rarity,label);
      return relEv(mins[idx],rarity,title,text,choices);
    });
  });
});

function getEligibleRelationEvents(rel,label,stage){
  return (relationshipEventPools[rel]?.[label]||[]).filter(e=>e.min<=stage+1);
}
let activeRelationEvent=null;

function repairLegacyGiftEventDisplay(c){
  if(!c?.relationshipEvents)return false;
  const giftByName={};
  try{
    for(const g of affectionGiftShop||[])giftByName[String(g.n||"")]=Number(g.affinity||0);
  }catch(e){}
  let changed=false;
  for(const arr of Object.values(c.relationshipEvents||{})){
    if(!Array.isArray(arr))continue;
    for(const ev of arr){
      if(!String(ev?.title||"").includes("送給") && !String(ev?.title||"").includes("送給你"))continue;
      let choice=String(ev?.choice||"");
      let m=choice.match(/^(.*)\s×(\d+)$/);
      if(!m)continue;
      let name=m[1].trim(),count=Math.max(1,Number(m[2])||1);
      let unit=giftByName[name];
      if(unit==null){
        // tolerate emoji/name normalization differences
        let key=Object.keys(giftByName).find(k=>k===name||k.endsWith(name)||name.endsWith(k));
        if(key)unit=giftByName[key];
      }
      if(unit==null)continue;
      let total=Math.max(0,Number(unit||0)*count);
      let expected=total?`共同羈絆 +${total}`:"送出了一份禮物";
      if(ev.result!==expected){ev.result=expected;changed=true}
    }
  }
  return changed;
}

function renderRelationEventLog(){
  let box=document.getElementById("relationEventLog"),c=cur();
  if(!box||!c||!activeRoomCode)return;
  c.relationshipEvents??={};
  if(repairLegacyGiftEventDisplay(c))saveLocal();
  const REL_EVENT_TTL=24*60*60*1000;
  const now=Date.now();
  const original=c.relationshipEvents[activeRoomCode]||[];
  const kept=original.filter(x=>{
    let ts=Date.parse(x.createdAt||x.time||"");
    // 舊紀錄若無法解析時間則保留，避免更新時誤刪；新紀錄都有 createdAt。
    return !Number.isFinite(ts)||(now-ts)<REL_EVENT_TTL;
  });
  if(kept.length!==original.length){
    c.relationshipEvents[activeRoomCode]=kept;
    saveLocal();
  }
  let arr=kept.slice().reverse();
  if(!arr.length){
    box.innerHTML='<div class="muted">目前沒有最近 24 小時的共同事件。</div>';
    return;
  }
  box.innerHTML=`<div class="relationEventScroll">${arr.map(x=>`<div class="relEventCard"><b>${esc(x.icon||"💞")} ${esc(x.title)}</b><div class="small">${esc(x.time)}・${esc(x.choice)}</div><div class="result">${esc(x.result)}</div></div>`).join("")}</div>`;
}
function openRelationEvent(ev,label){
  activeRelationEvent={...ev,label};
  relationEventRarity.textContent=ev.rarity;
  relationEventTitle.textContent=ev.title;
  relationEventText.textContent=ev.text(partner?.name||"對方");
  relationEventChoices.innerHTML="";
  ev.choices.forEach(ch=>{
    let b=document.createElement("button");b.textContent=ch[0];
    b.onclick=async()=>{if(b.disabled)return;relationEventChoices.querySelectorAll("button").forEach(x=>x.disabled=true);try{await resolveRelationEvent(ch)}finally{relationEventChoices.querySelectorAll("button").forEach(x=>x.disabled=false)}};
    relationEventChoices.appendChild(b);
  });
  relationEventModal.classList.remove("hidden");
}
async function resolveRelationEvent(ch){
  if(!activeRelationEvent||!room||!partner)return;
  let c=cur(),ev=activeRelationEvent,isHost=room.host_char===c.id;
  let gain=Math.max(1,Math.round(ch[1]*(relDef()?.bond||1)));
  c.mood=Math.min(100,c.mood+(ch[2]||0));
  c.stats??={};c.stats.interactions=(c.stats.interactions||0)+1;c.stats.relationshipEvents=(c.stats.relationshipEvents||0)+1;
  let useCtr=ensureRelationCounter(c,room.code);useCtr.used=(useCtr.used||0)+1;saveLocal();
  c.relationshipEvents??={};c.relationshipEvents[room.code]??=[];
  c.relationshipEvents[room.code].push({
    id:uuid(),title:ev.title,choice:ch[0],result:ch[3],icon:ev.rarity==="特殊"?"✨":ev.rarity==="稀有"?"🌟":"💞",
    createdAt:new Date().toISOString(),time:new Date().toLocaleString("zh-TW")
  });
  c.relationshipEvents[room.code]=c.relationshipEvents[room.code].slice(-50);
  await api("/test_interactions",{method:"POST",body:JSON.stringify({
    room_code:room.code,from_char:c.id,to_char:isHost?room.guest_char:room.host_char,
    text:`EVENT|${ev.title}|${ch[0]}|${ch[3]}`
  })});
  saveLocal();relationEventModal.classList.add("hidden");activeRelationEvent=null;
  await refreshBond(room.code);renderGame();renderRelationEventLog();await loadInbox();
  infoTitle.textContent=`${ev.rarity==="特殊"?"✨":ev.rarity==="稀有"?"🌟":"💞"} ${ev.title}`;
  infoBody.innerHTML=`${esc(ch[3])}<br><br><b>共同羈絆 +${gain}</b>　🌸 心情 +${ch[2]||0}`;
  infoModal.classList.remove("hidden");
}
function bondInfoFromCount(code,count,bonus=0){
  let rr=relationshipSummaries[code]||room,def=rr?defs[rr.relation]:null;
  let total=Math.max(0,Math.round(count*4*(def?.bond||1))+Math.floor(Number(bonus)||0));
  let lv=Math.min(30,1+Math.floor(total/20));
  let into=total%20,stage=Math.min(5,Math.floor((lv-1)/5));
  return{count,total,lv,into,stage,max:lv>=30};
}
async function refreshBond(code){
  if(!code)return;
  try{
    let rows=await api(`/test_interactions?room_code=eq.${encodeURIComponent(code)}&select=id,text,from_char,to_char,created_at&limit=1000`);
    // 同步「送了什麼」到接收方的兩人事件紀錄；禮物本身不進背包。
    try{
      let me=cur();
      if(me){
        me.relationshipEvents??={};
        me.relationshipEvents[String(code)]??=[];
        for(const gx of rows.filter(x=>String(x.text||"").startsWith("GIFT_BOND|"))){
          if(String(gx.to_char||"")!==String(me.id||""))continue;
          let p=String(gx.text||"").split("|"),nm="";
          try{nm=decodeURIComponent(p[3]||"")}catch(e){nm=itemDisplayName(p[1])}
          let n=Math.max(1,Number(p[2])||1),unitAff=Math.max(0,Number(p[4])||0),aff=unitAff*n;
          let eid=`gift-cloud-${gx.id}`;
          if(me.relationshipEvents[String(code)].some(x=>x.id===eid))continue;
          me.relationshipEvents[String(code)].push({
            id:eid,
            title:`${roomOtherName(String(code),me)}送給你「${nm||itemDisplayName(p[1])}」`,
            choice:`${nm||itemDisplayName(p[1])} ×${n}`,
            result:aff?`共同羈絆 +${aff}`:"收到了一份心意",
            icon:"🎁",
            createdAt:new Date(gx.created_at||Date.now()).toISOString(),
            time:new Date(gx.created_at||Date.now()).toLocaleString("zh-TW")
          });
        }
        me.relationshipEvents[String(code)]=me.relationshipEvents[String(code)].slice(-50);
        saveLocal();
      }
    }catch(e){console.warn("同步送禮紀錄",e)}

    // 舊版補判定：只要雲端已經有自己送出的 GIFT_BOND，
    // 就補回「第一次送禮」與累積送禮成就，不必再浪費一份禮物。
    try{
      let me=cur();
      if(me){
        let sentGiftRecords=(rows||[]).filter(x=>
          String(x.from_char||"")===String(me.id||"") &&
          String(x.text||"").startsWith("GIFT_BOND|")
        ).length;
        if(sentGiftRecords>0){
          me.stats??={};
          me.achievements??={};
          me.stats.giftsSent=Math.max(Number(me.stats.giftsSent||0),sentGiftRecords);
          if(me.stats.giftsSent>=1)me.achievements.gift1=1;
          if(me.stats.giftsSent>=10)me.achievements.gift10=1;
          saveLocal();
        }
      }
    }catch(e){console.warn("送禮成就補判定",e)}

    let giftBonus=0;
    let normal=rows.filter(x=>{
      let t=String(x.text||"");
      if(t.startsWith("GIFT_BOND|")){
        let p=t.split("|");
        let giftCount=Math.max(1,Number(p[2])||1);
        let unitAffinity=Math.max(0,Number(p[4])||0);
        giftBonus+=giftCount*unitAffinity;
        return false;
      }
      if(t.startsWith("GIFT_EVENT|")||t.startsWith("GIFT_RECEIVED|"))return false;
      if(t.startsWith("RELATION_BREAK|"))return false;
      if(t.startsWith("OUTING_INVITE|")||t.startsWith("GAME_INVITE|")||t.startsWith("GAME_START|")||t.startsWith("GAME_DECLINE|"))return false;
      if(t.startsWith("RELATION_SLOT_REQUEST|")||t.startsWith("RELATION_SLOT_RESULT|")||t.startsWith("GIFT_SEND|"))return false;
      return true;
    });
    let info=bondInfoFromCount(code,normal.length,giftBonus);
    let marker=rows.find(x=>String(x.text||"").startsWith("RELATION_BREAK|"));
    if(marker){
      let p=String(marker.text).split("|"),rel=p[1],title=p[2]||topRelations[rel]?.title||"頂級關係";
      info.broken=true;info.topTitle=title;
      let c=cur(),top=topRelations[rel];
      if(c&&top){ensureSharedAchievements();c.achievements=local.sharedAchievements;c.achievements[top.ach]=1;c.achievements.break=1;unlockBadge(top.badge);checkTopAll(c);saveLocal()}
    }
    bondCache[code]=info;
  }catch(e){console.warn("bond",e)}
}
function renderBond(code){
  let b=bondCache[code]||bondInfoFromCount(code,0),rr=relationshipSummaries[code]||room;
  let stages=relationStages[rr?.relation]||["第1階","第2階","第3階","第4階","第5階","第6階"];
  let title=document.getElementById("bondTitle"),value=document.getElementById("bondValue"),fill=document.getElementById("bondFill"),stage=document.getElementById("bondStage");
  if(!title)return;
  title.textContent=b.broken?`🌟 頂級羈絆・${b.topTitle}`:`💗 共同羈絆 Lv.${b.lv}${b.max?" MAX":""}`;
  value.textContent=b.broken?"突破完成":(b.max?"MAX":`${b.into} / 20`);
  fill.style.width=(b.max?100:b.into/20*100)+"%";
  stage.textContent=b.broken?`✨ ${relationLabel(rr?.relation)}的最終階段已開啟`:`第 ${b.stage+1} 階・${stages[b.stage]}`;
}
function interactionStory(rel,label,name){
  const pools={
    lover:[`${name}愣了一下，耳尖似乎有點紅，最後還是笑著接受了你的「${label}」。`,`你做了「${label}」，兩個人的距離好像悄悄近了一點。`,`${name}沒有躲開。這個小小的「${label}」讓氣氛變得很甜。`],
    bestfriend:[`你對${name}做了「${label}」，結果兩個人很快笑成一團。`,`${name}立刻接住你的「${label}」，熟悉得像早就知道你會這麼做。`],
    family:[`你對${name}做了「${label}」。這份自然的關心，讓人覺得很安心。`,`${name}收下了你的「${label}」，像平常一樣留在你身邊。`],
    partner:[`你和${name}進行「${label}」，彼此的默契又多了一點。`,`${name}很快理解你的意思，「${label}」進行得比想像中順利。`],
    rival:[`你向${name}「${label}」，對方挑了挑眉，看起來完全不打算認輸。`,`${name}接下了你的「${label}」。空氣裡立刻多了一點火藥味。`],
    enemy:[`你對${name}「${label}」，對方冷冷回應，氣氛瞬間緊繃。`,`${name}沒有退讓。你們的「${label}」讓這段關係更加劍拔弩張。`]
  };
  let arr=pools[rel]||[`你和${name}完成了一次「${label}」。`];
  return arr[Math.floor(Math.random()*arr.length)];
}
function showInteractionResult(label,story,gain){
  infoTitle.textContent=`💞 ${label}`;
  infoBody.innerHTML=`${esc(story)}<br><br><b>共同羈絆 +${gain}</b>`;
  infoModal.classList.remove("hidden");
}

function openRoomInstant(code){
  code=String(code||"");
  let c=cur();if(!c||!code)return false;

  const cached=relationshipSummaries?.[code];
  if(!cached)return false;

  room=cached;
  activeRoomCode=code;
  partner=room.host_char===c.id?room.guest_state:room.host_state;

  // Render immediately from cached cloud state.
  safeRenderGame();
  return true;
}
async function loadRoom(code){
  code=String(code||"");
  let c=cur();if(!c||!code)return;

  // Instant first paint from relationshipSummaries if available.
  let cached=relationshipSummaries?.[code];
  if(cached){
    room=cached;
    activeRoomCode=code;
    partner=room.host_char===c.id?room.guest_state:room.host_state;
    safeRenderGame();
  }

  try{
    let rows=await api(`/test_rooms?code=eq.${encodeURIComponent(code)}&select=*`);
    if(!rows.length){
      console.warn("房間暫時查不到，保留快取資料",code);
      if(!cached){
        try{await refreshRelationships()}catch(e){console.warn(e)}
        cached=relationshipSummaries?.[code];
      }
      if(!cached)return;
      room=cached;
    }else{
      room=rows[0];
      relationshipSummaries[code]=room;
    }

    activeRoomCode=code;
    partner=room.host_char===c.id?room.guest_state:room.host_state;

    // Update UI immediately with latest room row.
    safeRenderGame();

    // The rest may finish in background; don't block the visible card.
    Promise.allSettled([
      syncState(),
      refreshBond(code),
      loadMessages(),
      loadInbox()
    ]).then(()=>{
      if(String(activeRoomCode)===code){
        partner=room.host_char===c.id?room.guest_state:room.host_state;
        safeRenderGame();
      }
    });
  }catch(e){
    console.warn("loadRoom background refresh failed",e);
    // Cached room remains usable.
    if(cached){
      room=cached;
      activeRoomCode=code;
      partner=room.host_char===c.id?room.guest_state:room.host_state;
      safeRenderGame();
    }else{
      throw e;
    }
  }
}

async function refreshRelationships(){
  let c=cur();if(!c)return;ensureRelations(c);
  relationshipSummaries={};
  try{
    // Cloud is authoritative: discover every room where this character is host or guest.
    let cid=encodeURIComponent(c.id);
    let rows=await api(`/test_rooms?or=(host_char.eq.${cid},guest_char.eq.${cid})&select=*`);
    let valid=[];
    for(let rr of rows||[]){
      if(!rr?.code)continue;
      let code=String(rr.code);
      relationshipSummaries[code]=rr;
      valid.push(code);
    }
    // Preserve local room codes unless cloud positively returns authoritative rooms.
    // An empty cloud result can be transient (network/cache/RLS timing), so never erase local relationships here.
    let old=(c.roomCodes||[]).map(String);
    let merged=valid.length
      ? [...old.filter(code=>valid.includes(code)),...valid.filter(code=>!old.includes(code))]
      : [...old];
    c.roomCodes=[...new Set(merged)];
    if(activeRoomCode&&!c.roomCodes.includes(activeRoomCode))activeRoomCode=c.roomCodes[0]||"";
    if(!activeRoomCode&&c.roomCodes.length)activeRoomCode=c.roomCodes[0];
    saveLocal();
  }catch(e){
    // If cloud lookup fails temporarily, never erase local relationships.
    console.warn("關係雲端恢復失敗，保留本機房間碼",e);
    for(const code of c.roomCodes||[]){
      try{
        const rows=await api(`/test_rooms?code=eq.${encodeURIComponent(code)}&select=*`);
        if(rows.length)relationshipSummaries[String(code)]=rows[0];
      }catch(err){console.warn(err)}
    }
  }
  renderGame();
}

async function syncState(){
  let c=cur();if(!c||!activeRoomCode||!room)return;
  let field=room.host_char===c.id?"host_state":"guest_state";
  let body={};body[field]=publicState(c);
  await api(`/test_rooms?code=eq.${encodeURIComponent(room.code)}`,{method:"PATCH",body:JSON.stringify(body)});
}

const levelMilestoneRewards={
  5:{money:80,energy:20,label:"第一次成長獎勵"},
  10:{money:120,item:"drink",count:1,label:"Lv.10 里程碑"},
  15:{money:160,mood:15,label:"Lv.15 里程碑"},
  20:{money:200,energy:30,label:"Lv.20 里程碑"},
  25:{money:250,item:"drink",count:2,label:"Lv.25 里程碑"},
  30:{money:300,energy:100,label:"Lv.30 里程碑"}
};
function levelNeed(level){return 60+level*25}
function grantLevelMilestone(c,lv){
  let r=levelMilestoneRewards[lv];if(!r)return null;
  c.money=(c.money||0)+(r.money||0);
  if(r.energy)c.energy=Math.min(100,(c.energy||0)+r.energy);
  if(r.mood)c.mood=Math.min(100,(c.mood||0)+r.mood);
  if(r.item){c.inventory??={};c.inventory[r.item]=(c.inventory[r.item]||0)+(r.count||1)}
  return r;
}

function normalizeLevelProgress(c){
  if(!c)return false;
  c.level=Math.max(1,Math.floor(Number(c.level)||1));
  c.exp=Math.max(0,Number(c.exp)||0);
  let changed=false, guard=0;
  while(c.exp>=levelNeed(c.level) && guard<500){
    c.exp-=levelNeed(c.level);
    c.level++;
    grantLevelMilestone(c,c.level);
    changed=true;
    guard++;
  }
  if(!Number.isFinite(c.exp)||c.exp<0){c.exp=0;changed=true}
  return changed;
}

function processLevelUps(c){
  let gained=[];
  while(c.exp>=levelNeed(c.level)){
    let need=levelNeed(c.level);
    c.exp-=need;
    c.level++;
    let reward=grantLevelMilestone(c,c.level);
    gained.push({lv:c.level,reward});
  }
  if(!gained.length)return;
  let last=gained[gained.length-1],r=last.reward;
  if(last.lv>=5){
    let rewardText="";
    if(r){
      let bits=[];
      if(r.money)bits.push(`🪙 ${r.money}`);
      if(r.energy)bits.push(`⚡ 體力 +${r.energy}`);
      if(r.mood)bits.push(`🌸 心情 +${r.mood}`);
      if(r.item)bits.push(`${protoShop.find(x=>x.id===r.item)?.n||"道具"} ×${r.count||1}`);
      rewardText=`<br><br><b>🎁 ${esc(r.label)}</b><br>${bits.join("　")}`;
    }else{
      rewardText="<br><br><span class='small'>下一個里程碑等級還會有額外獎勵。</span>";
    }
    infoTitle.textContent=`🎉 升級！Lv.${last.lv}`;
    infoBody.innerHTML=`角色成長到 <b>Lv.${last.lv}</b> 了！${rewardText}`;
    infoModal.classList.remove("hidden");
  }else{
    toast(`✨ 升級！目前 Lv.${last.lv}`);
  }
  logJournal(c,`升級到 Lv.${last.lv}`,"✨");
}
let relationshipPollBusy=false;
function startPolling(){
  stopPolling();
  relationshipPollBusy=false;
  pollTimer=setInterval(async()=>{
    if(relationshipPollBusy || document.hidden)return;
    let c=cur();
    if(!c || !(c.roomCodes||[]).length)return;
    relationshipPollBusy=true;
    try{
      ensureRelations(c);
      await refreshRelationships();
      await refreshAllBondSummaries(c);
      if(activeRoomCode){
        try{
          if(!room||String(room.code)!==String(activeRoomCode)){
            let rs=await api(`/test_rooms?code=eq.${encodeURIComponent(activeRoomCode)}&select=*`);
            if(rs.length){room=rs[0];relationshipSummaries[String(activeRoomCode)]=room}
          }
          if(room)await syncState();
        }catch(e){console.warn("presence sync",e)}
        await loadRoom(activeRoomCode);
        await Promise.allSettled([loadInbox(),checkDirectGamePopups()]);
      }else{
        room=null;partner=null;safeRenderGame();
      }
    }catch(e){
      console.warn("relationship poll",e);
    }finally{
      relationshipPollBusy=false;
    }
  },6000);
}
function stopPolling(){
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=null;
  relationshipPollBusy=false;
}


function rememberOpenSheet(id){lastOpenSheetId=id||""}
function restoreOpenSheet(){
  if(!lastOpenSheetId)return;
  let el=document.getElementById(lastOpenSheetId);
  if(el){document.querySelectorAll(".pageCard").forEach(x=>{if(x!==el)x.classList.remove("active")});el.classList.add("active")}
}
function safeCall(fn,label="功能"){
  try{return fn()}catch(e){console.error(label+" error",e);return null}
}
function safeRenderGame(){
  try{renderGame()}catch(e){
    console.error("renderGame error",e);
    let f=document.getElementById("fatal");
    if(f){f.textContent="部分功能載入失敗，但角色存檔仍在。請嘗試其他功能或重新整理。";f.classList.remove("hidden")}
  }
}


async function refreshAllBondSummaries(c){
  if(!c)return;
  ensureBadges();
  await Promise.allSettled((c.roomCodes||[]).map(code=>refreshBond(String(code))));
}
function renderGame(){
  normalizeWholeStats(cur());

  let c=cur();if(!c)return;resetDailyIfNeeded(c);let r=routine(c);
  document.getElementById("day").textContent=day(c);
  document.getElementById("charName").textContent=c.name;
  let cid=document.getElementById("charIdCode");
  if(cid)cid.textContent=displayCharacterId(c);
  let gb=document.getElementById("genderBadge");if(gb){gb.textContent=c.gender==="male"?"♂ 男":"♀ 女";gb.classList.toggle("hidden",!c.gender)}
  renderBadges(c);
  document.getElementById("level").textContent=c.level;
  document.getElementById("exp").textContent=`${Math.floor(c.exp)}/${levelNeed(c.level)}`;
  document.getElementById("energy").textContent=Math.floor(c.energy);
  document.getElementById("mood").textContent=Math.floor(c.mood);
  c.hunger ??= 85;c.money ??= 300;c.inventory ??= {};c.memories ??= [];ensureSharedAchievements();c.achievements=local.sharedAchievements;
  document.getElementById("hunger").textContent=Math.floor(c.hunger);
  document.getElementById("moneyTop").textContent=c.money;
  let wctr=ensureWorkCounter(c),qwl=document.getElementById("quickWorkLeft");
  if(qwl)qwl.textContent=`今日剩餘 ${Math.max(0,DAILY_WORK_LIMIT-(wctr.used||0))}/${DAILY_WORK_LIMIT}`;
  let qrs=document.getElementById("quickRestStatus");if(qrs)qrs.textContent=restStatusText(c);

  document.getElementById("energyFill").style.width=c.energy+"%";document.getElementById("hungerFill").style.width=c.hunger+"%";document.getElementById("moodFill").style.width=c.mood+"%";
  let expNeed=levelNeed(c.level);document.getElementById("expFill").style.width=Math.min(100,c.exp/expNeed*100)+"%";document.getElementById("drawerName").textContent=c.name;
  // 3.26.6: do NOT build every hidden page during the first character render.
  // Large saves + image data + all achievement/shop DOM at once can kill Android Chrome's renderer.
  if(window.__fullGameRenderReady){
    safeCall(()=>renderExtras(c),"附加功能");
    if((c.roomCodes||[]).length)renderPendingEvents(c).catch(()=>{});
  }
  document.getElementById("activity").textContent=`${routineMetaNow(c).emoji} ${r[3]}`;
  document.getElementById("activityDetail").textContent=r[4];

  let im=document.getElementById("avatarImg"),em=document.getElementById("emoji");
  if(c.image){
    if(im.src!==c.image)im.src=c.image;
    im.loading="lazy";im.decoding="async";
    im.style.display="block";em.style.display="none"
  }
  else{im.style.display="none";em.style.display="inline";em.textContent="🐾"}

  ensureRelations(c);
  document.getElementById("relationCount").textContent=`${c.roomCodes.length}/6`;
  document.getElementById("roomSetup").classList.toggle("hidden",ownedRelationTypes(c).size>=6);
  document.getElementById("roomActive").classList.toggle("hidden",!room);

  const list=document.getElementById("relationshipList");list.innerHTML="";
  if(!c.roomCodes.length){
    list.innerHTML='<div class="muted" style="padding:18px 4px">目前還沒有建立任何關係。可以在下方建立新的關係房間。</div>';
    room=null;partner=null;activeRoomCode="";
  }
  c.roomCodes.forEach(code=>{
    code=String(code);
    const rr=relationshipSummaries[code]||(room?.code===code?room:null);
    const isHost=rr?.host_char===c.id;
    const other=rr?(isHost?rr.guest_state:rr.host_state):null;
    const def=rr?defs[rr.relation]:null;
    const item=document.createElement("div");item.className="relItem "+(code===activeRoomCode?"active":"");
    let bi=bondCache[code]||null;
    let title=rr?(other?esc(other.name):"等待對方加入"):"☁️ 關係資料同步中";
    let relText=def?` · ${def.name}`:"";
    let presence=other?presenceText(other):(rr?"⚪ 等待加入":"☁️ 同步中");
    let bondText=bi?`💗 羈絆 Lv.${bi.lv}${bi.max?" MAX":""}`:"💗 羈絆同步中";
    let badgeMini=other?.badges?.length?`<div class="relMiniBadges">${other.badges.slice(0,3).map(b=>`<span class="relMiniBadge" title="${esc(b.name||"徽章")}">${esc(b.icon||"🏅")}</span>`).join("")}</div>`:"";
    item.innerHTML=`<div class="meta"><b>${title}${relText}</b><div class="small">${presence}　·　${bondText}</div>${badgeMini}<div class="small">房間 ${esc(code)}</div></div><div class="relActions"><button data-switch="${esc(code)}">開啟</button></div>`;
    list.appendChild(item);
  });

  if(room){
    document.getElementById("roomCode").textContent=room.code;
    document.getElementById("waiting").classList.toggle("hidden",!!partner);
    document.getElementById("partnerCard").classList.toggle("hidden",!partner);
    let grid=document.getElementById("interactionGrid");grid.innerHTML="";
    if(partner){
      let d=relDef();
      document.getElementById("partnerName").textContent=partner.name||"對方";
      document.getElementById("relationChip").textContent=d.name;
      document.getElementById("partnerStatus").textContent=`${presenceText(partner)}　·　${partner.activity||"未知狀態"}`;
      document.getElementById("partnerStats").textContent=`Lv.${partner.level||1}　體力 ${partner.energy??"?"}　心情 ${partner.mood??"?"}`;
      let pb=document.getElementById("partnerBadges");
      if(pb){
        let bs=partner.badges||[];
        pb.innerHTML=bs.length
          ? `<div class="partnerBadgeLabel">🏅 徽章展示</div><div class="partnerBadgeRow">${bs.slice(0,3).map(b=>`<span class="partnerMiniBadge" title="${esc(b.name||"徽章")}">${esc(b.icon||"🏅")} <span>${esc(b.name||"徽章")}</span></span>`).join("")}</div>`
          : '<span class="small muted">尚未展示徽章</span>';
      }
      document.getElementById("relationBonus").textContent=d.desc;
      renderBond(room.code);
      renderRelationEventLog();
      document.getElementById("partnerPic").innerHTML=partner.image?`<img src="${partner.image}">`:"♡";
      d.actions.forEach(([label,key])=>{let b=document.createElement("button");b.textContent=label;b.dataset.act=key;grid.appendChild(b)});
      let topBond=bondCache[room.code];
      if(topBond?.broken){let ub=document.createElement("button");ub.textContent=`🌟 ${topBond.topTitle}・專屬互動`;ub.dataset.act="ultimate";ub.classList.add("ultimateTag");grid.appendChild(ub)}
      updateInteractionLimit(c,room.code);
    }
  }

  renderRelationGiftPanel(c);

  document.getElementById("eventCount").textContent=`${c.events.length}/6`;
  let eb=document.getElementById("events");eb.innerHTML="";
  if(!c.events.length)eb.innerHTML='<div class="muted">目前沒有待抉擇的個人生活事件。</div>';
  c.events.forEach(ev=>{
    let d=document.createElement("div");d.className="event";
    d.innerHTML=`<div class="title">🎭 ${esc(ev.title)}</div><div class="small">${esc(ev.text)}</div><div class="choices"></div>`;
    let choices=d.querySelector(".choices");
    ev.choices.forEach(ch=>{
      let b=document.createElement("button");
      let moneyCost=Math.max(0,-Number(ch.money||0));
      let cannotAfford=moneyCost>(c.money||0);
      b.textContent=(ch.label||ch[0])+(cannotAfford?`　🪙不足（需要 ${moneyCost}）`:"");
      b.style.textAlign="left";
      b.disabled=cannotAfford;
      let ranges=[];
      [["體力",ch.energy],["飽食",ch.hunger],["心情",ch.mood],["EXP",ch.exp],["金錢",ch.money]].forEach(([n,v])=>{if(Number(v||0))ranges.push(`${n} ${eventValueRange(v)}`)});
      b.title=cannotAfford?"目前金錢不足，不能選擇這個選項。":(ranges.length?`可能結果：${ranges.join("、")}`:"");
      b.onclick=()=>{
        if(moneyCost>(c.money||0))return toast(`🪙 金錢不足，需要 ${moneyCost}。`);
        c.events=c.events.filter(x=>x.id!==ev.id);c.stats??={};
        let energy=eventFloatValue(ch.energy,"energy"),hunger=eventFloatValue(ch.hunger,"hunger"),mood=eventFloatValue(ch.mood,"mood"),xp=eventFloatValue(ch.exp,"exp"),money=eventFloatValue(ch.money,"money");
        // If this is a paid choice, never roll a larger cost than the affordability check allowed.
        if(Number(ch.money||0)<0)money=-Math.min(moneyCost,Math.abs(money));
        c.energy=wholeNumber(Math.max(0,Math.min(100,Number(c.energy||0)+energy)));
        c.hunger=wholeNumber(Math.max(0,Math.min(100,Number(c.hunger||0)+hunger)));
        c.mood=wholeNumber(Math.max(0,Math.min(100,Number(c.mood||0)+mood)));
        c.exp=wholeNumber(Math.max(0,Number(c.exp||0)+xp));
        processLevelUps(c);
        c.money=wholeNumber(safeMoney(Number(c.money||0)+money));
        c.stats.events=(c.stats.events||0)+1;c.stats.personalEvents=(c.stats.personalEvents||0)+1;
        if(ch.memory)c.memories.unshift({t:`🎭 ${ch.memory}`,d:new Date().toLocaleDateString("zh-TW")});
        logJournal(c,`個人事件「${ev.title}」：${ch.label||ch[0]}`,"🎭");
        saveLocal();renderGame();
        let parts=[];
        if(energy)parts.push(`⚡ 體力 ${energy>0?"+":""}${energy}`);
        if(hunger)parts.push(`🍙 飽食 ${hunger>0?"+":""}${hunger}`);
        if(mood)parts.push(`🌸 心情 ${mood>0?"+":""}${mood}`);
        if(xp)parts.push(`✨ EXP ${xp>0?"+":""}${xp}`);
        if(money)parts.push(`🪙 金錢 ${money>0?"+":""}${money}`);
        let resultText=ch.result||"事件處理完成。";
        if(parts.length)resultText+=`　｜　${parts.join("　")}`;
        toast(resultText,5200);
      };
      choices.appendChild(b)
    });
    eb.appendChild(d);
  });
}

document.getElementById("relationshipList").onclick=async e=>{
  const btn=e.target.closest("[data-switch]");
  const code=btn?.dataset.switch;if(!code)return;

  relationLogExpanded=false;
  activeRoomCode=String(code);

  // Show cached relation card instantly so it never feels broken.
  openRoomInstant(code);

  // Then update cloud data in the background.
  try{
    await loadRoom(code);
  }catch(err){
    console.warn("關係更新失敗，已保留快取畫面",err);
    toast("☁️ 關係資料更新稍慢，已先顯示最近資料",3000);
  }
};

document.getElementById("disconnectRoom").onclick=async()=>{
  if(!room||!activeRoomCode)return;
  const c=cur();
  const name=partner?.name||"對方";
  if(!confirm(`確定要解除和「${name}」的關係嗎？\n這段關係的房間、聊天、互動與小遊戲資料都會一起刪除。`))return;
  try{
    await api(`/test_rooms?code=eq.${encodeURIComponent(activeRoomCode)}`,{method:"DELETE"});
    c.roomCodes=c.roomCodes.filter(x=>x!==activeRoomCode);
    activeRoomCode=c.roomCodes[0]||"";
    room=null;partner=null;saveLocal();
    await refreshRelationships();
    if(activeRoomCode)await loadRoom(activeRoomCode);
    else renderGame();
  }catch(err){alert(err.message)}

  restoreOpenSheet();
};


function relationUseCount(c,code){return Number(ensureRelationCounter(c,code).used||0)}
function relationUseLeft(c,code){return Math.max(0,5-relationUseCount(c,code))}
function updateInteractionLimit(c,code){
  let el=document.getElementById("interactionLimit");if(!el)return;
  let used=relationUseCount(c,code),left=Math.max(0,5-used);
  el.textContent=`💗 今日羈絆互動：${used} / 5　｜　剩餘 ${left} 次　｜　每個按鈕有獨立事件池`;
  document.querySelectorAll("#interactionGrid button").forEach(b=>{
    if(b.dataset.act!=="game"&&b.dataset.act!=="ultimate"){
      b.disabled=left<=0;
      b.title=left<=0?"今天這段關係的羈絆互動次數已用完":"";
    }
  });
}

const ultimateRelationEvents={
 lover:{rarity:"極稀有",title:"如果未來一直是你",text:n=>`${n}沒有說什麼誇張的誓言，只是很自然地把未來的每一個計畫都留了一個你的位置。`,choices:[["把手交給對方",15,10,"你們沒有再確認什麼，因為答案早就存在彼此心裡。"],["笑著說那就約好了",14,12,"一句很普通的約定，卻像真的能延續很久。"]]},
 bestfriend:{rarity:"極稀有",title:"很多年以後也要這樣",text:n=>`${n}突然問，如果很多年以後你們都變了，還會不會像現在一樣。`,choices:[["當然會",15,10,"你回答得太快，兩個人都忍不住笑了。"],["那就一起確認",14,12,"你們決定把這句話留給很多年後的彼此驗證。"]]},
 family:{rarity:"極稀有",title:"你回來就好",text:n=>`你回來得比預計晚很多，${n}沒有責怪，只說了一句：『回來就好。』`,choices:[["好好抱一下",15,10,"那一刻你很清楚，這裡一直有你的位置。"],["一起坐下吃點東西",14,12,"再晚的時間，只要一起坐下來，就還像家。"]]},
 partner:{rarity:"極稀有",title:"最後一道防線",text:n=>`${n}把最重要的決定交給了你，也把自己的背後完全交給了你。`,choices:[["接下這份信任",15,10,"從這一刻開始，你們不再需要確認彼此會不會留下。"],["把自己的底牌也交出去",16,9,"真正的共同體，是雙方都不再保留最後一道防線。"]]},
 rival:{rarity:"極稀有",title:"只有你值得我追",text:n=>`${n}承認自己一直往前走的理由之一，就是不願意被你甩在身後。`,choices:[["那就別掉隊",15,10,"熟悉的挑釁裡，第一次多了一種只有彼此懂的重量。"],["我也一直看著你",16,9,"兩個最不願承認的人，終於承認彼此就是自己的標準。"]]},
 enemy:{rarity:"極稀有",title:"恨到最後留下的是你",text:n=>`漫長的敵意走到今天，${n}忽然問：如果有一天連恨都消失，你們之間還會剩下什麼？`,choices:[["那就到那天再看",15,10,"你們誰都沒有給出答案，卻也誰都沒有離開。"],["至少現在還有彼此",16,9,"這句話聽起來不像和解，卻比和解更難割捨。"]]}
};
document.getElementById("interactionGrid").onclick=async e=>{
  let key=e.target.dataset.act;if(!key||!room||!partner)return;
  if(key==="game")return startGame();
  let c=cur();
  if(key==="ultimate"){
    let b=bondCache[room.code],ev=ultimateRelationEvents[room.relation];
    if(!b?.broken||!ev)return toast("這段關係尚未完成頂級突破。");
    return openRelationEvent(ev,"🌟 頂級專屬互動");
  }
  if(relationUseLeft(c,room.code)<=0){
    infoTitle.textContent="💞 今天已經互動很多次了";
    infoBody.innerHTML="這段關係今天的羈絆互動已達 <b>5 / 5</b>。<br><br>明天 00:00 會恢復。聊天、共同外出和小遊戲不受這個限制。";
    infoModal.classList.remove("hidden");return;
  }
  let label=relDef().actions.find(x=>x[1]===key)?.[0]||"互動";
  let b=bondCache[room.code]||bondInfoFromCount(room.code,0),eligible=getEligibleRelationEvents(room.relation,label,b.stage);
  if(!eligible.length){
    infoTitle.textContent=`💞 ${label}`;
    infoBody.innerHTML=`目前這個羈絆階段還沒有對應事件。隨著羈絆提升，會解鎖新的「${label}」事件。`;
    infoModal.classList.remove("hidden");return;
  }
  // Higher rarity becomes possible as bond stage rises, but still random.
  let weighted=[];
  eligible.forEach(ev=>{
    let w=ev.rarity==="特殊"?Math.max(1,b.stage-3):ev.rarity==="稀有"?Math.max(2,b.stage):7;
    for(let i=0;i<w;i++)weighted.push(ev);
  });
  openRelationEvent(weighted[Math.floor(Math.random()*weighted.length)],label);
};

async function loadInbox(){
  if(!room)return;
  let c=cur();
  let data=await api(`/test_interactions?room_code=eq.${encodeURIComponent(room.code)}&to_char=eq.${encodeURIComponent(c.id)}&select=*&order=created_at.desc&limit=30`);
  let box=document.getElementById("inbox");if(!box)return;box.innerHTML="";
  const hiddenPrefixes=[
    "GAME_","OUTING_INVITE|","OUTING_DONE|","小遊戲|",
    "GIFT_SEND|","GIFT_BOND|","GIFT_EVENT|","GIFT_RECEIVED|"
  ];
  const seen=new Set();
  let visible=(data||[]).filter(x=>{
    let t=String(x.text||"");
    if(hiddenPrefixes.some(p=>t.startsWith(p)))return false;
    // 內部同步指令一律不直接顯示；只有正常互動與 EVENT 才進這個區塊。
    if(t.includes("|")&&!t.startsWith("EVENT|"))return false;
    let key=`${x.from_char}|${t}`;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  }).slice(0,8);
  if(!visible.length){box.innerHTML='<div class="muted">目前沒有新的互動事件。</div>';return}
  visible.forEach(x=>{
    let d=document.createElement("div"),parts=String(x.text||"").split("|"),kind=parts[0];d.className="notice";
    if(kind==="EVENT"){
      d.innerHTML=`<div class="title">💞 ${esc(partner?.name||"對方")}觸發了「${esc(parts[1]||"關係事件")}」</div><div class="small">選擇：${esc(parts[2]||"")}<br>${esc(parts.slice(3).join("|")||"")}</div>`;
    }else{
      let label=parts[0],story=parts.slice(1).join("|");
      d.innerHTML=`<div class="title">${esc(partner?.name||"對方")}：${esc(label)}</div><div class="small">${story?esc(story):"這個互動已同步到你的角色。"}</div>`;
    }
    box.appendChild(d);
  });
}



async function checkDirectGamePopups(){
  if(!room||!cur())return;
  let c=cur();
  let data=await api(`/test_interactions?room_code=eq.${encodeURIComponent(room.code)}&to_char=eq.${encodeURIComponent(c.id)}&select=*&order=created_at.desc&limit=20`);
  // Incoming invitation: pop immediately while online.
  let invite=data.find(x=>String(x.text||"").startsWith("GAME_INVITE|"));
  if(invite&&!seenGamePopupIds.has(invite.id)&&!pendingGameInvite){
    let p=String(invite.text).split("|"),type=p[1],g=miniGames[type];
    seenGamePopupIds.add(invite.id);
    pendingGameInvite={id:invite.id,type,from:invite.from_char};
    gameInviteBody.innerHTML=`<b>${esc(partner?.name||"對方")}</b> 邀請你玩<br><h3 style="margin:8px 0">${g?.icon||"🎮"} ${esc(g?.name||type)}</h3><div class="small">${esc(g?.desc||"雙人小遊戲")}</div>`;
    gameInviteModal.classList.remove("hidden");
  }

  // Inviter receives GAME_START: open the game window directly.
  let startMsg=data.find(x=>String(x.text||"").startsWith("GAME_START|")&&!seenGameStartIds.has(x.id));
  if(startMsg){
    let p=String(startMsg.text).split("|"),type=p[1],gid=p[2];
    seenGameStartIds.add(startMsg.id);
    try{await api(`/test_interactions?id=eq.${startMsg.id}`,{method:"DELETE"})}catch(e){}
    toast(`✅ ${partner?.name||"對方"}接受了小遊戲邀請！`);
    openGameSession(gid,type);
  }

  let decline=data.find(x=>String(x.text||"").startsWith("GAME_DECLINE|")&&!seenGameDeclineIds.has(x.id));
  if(decline){
    let p=String(decline.text).split("|"),g=miniGames[p[1]];
    seenGameDeclineIds.add(decline.id);
    try{await api(`/test_interactions?id=eq.${decline.id}`,{method:"DELETE"})}catch(e){}
    toast(`↩️ ${partner?.name||"對方"}婉拒了「${g?.name||"小遊戲"}」。`,3500);
  }
}

acceptGameInviteBtn.onclick=async()=>{
  let p=pendingGlobalGameInvite||pendingGameInvite;if(!p)return;
  await acceptGameInvite(p.id,p.type,p.roomCode||p.code||room?.code);
};
declineGameInviteBtn.onclick=async()=>{
  let p=pendingGlobalGameInvite||pendingGameInvite;if(!p)return;
  await declineGameInvite(p.id,p.type,p.roomCode||p.code||room?.code);
};
closeGameInvite.onclick=()=>gameInviteModal.classList.add("hidden");
document.getElementById("sendChat").onclick=sendChat;
document.getElementById("chatInput").onkeydown=e=>{if(e.key==="Enter")sendChat()};

async function sendChat(){
  try{
    let c=cur(),i=document.getElementById("chatInput"),t=i.value.trim();
    if(!t||!room||!partner)return;
    await api("/test_messages",{method:"POST",body:JSON.stringify({room_code:room.code,from_char:c.id,text:t})});
    c.stats??={};c.stats.messages=(c.stats.messages||0)+1;logJournal(c,`傳了一則訊息給${partner?.name||"關係角色"}`,"💬");saveLocal();
    i.value="";await loadMessages();renderGame();
  }catch(e){alert(e.message)}
}

async function loadMessages(){
  if(!room)return;
  let c=cur();
  let data=await api(`/test_messages?room_code=eq.${encodeURIComponent(room.code)}&select=*&order=created_at.asc&limit=60`);
  let box=document.getElementById("chatBox");box.innerHTML="";
  if(!data.length)box.innerHTML='<div class="muted">還沒有聊天紀錄。</div>';
  data.forEach(m=>{let d=document.createElement("div");d.className="msg "+(m.from_char===c.id?"me":"");d.innerHTML=`<div class="bubble">${esc(m.text)}</div>`;box.appendChild(d)});
  box.scrollTop=box.scrollHeight;
}


const miniGames={
  sync:{
    icon:"💞",name:"心有靈犀",desc:"兩個人各選一個最想一起做的事，看看答案會不會一樣。",
    choices:["甜點店","散步","看星星","看電影","逛書店"]
  },
  guess:{
    icon:"🔮",name:"猜猜我會選什麼",desc:"先選自己的答案，再猜對方會選哪一個。雙方都提交後揭曉。",
    choices:["海邊","遊樂園","咖啡店","宅在家"]
  },
  rps:{
    icon:"✊",name:"剪刀石頭布",desc:"最經典的勝負！平手也算一起完成遊戲。",
    choices:["✊ 石頭","✌️ 剪刀","✋ 布"]
  },
  quiz:{
    icon:"🧠",name:"默契快問快答",desc:"連續回答 5 題，最後比較你們有幾題相同。",
    questions:[
      ["休假最想？","睡到自然醒","出門走走"],
      ["甜的還是鹹的？","甜","鹹"],
      ["早起還是熬夜？","早起","熬夜"],
      ["計畫派還是隨性派？","計畫","隨性"],
      ["雨天想做什麼？","窩在家","出去踩雨"]
    ]
  },
  fortune:{
    icon:"🍀",name:"今日幸運籤",desc:"兩人各抽／選一張今日籤，組合會決定今天的小小運勢。",
    choices:["🌸 花籤","🌙 月籤","⭐ 星籤","☀️ 日籤","🍀 草籤"]
  },
  choice:{
    icon:"🛤️",name:"共同抉擇",desc:"遇到同一個情境，你們會做出相同選擇嗎？",
    choices:["先幫助陌生人","先完成自己的事","一起想兩全其美的方法"]
  }
};
let currentGameType="",currentGameDraft=null,rewardedGames=new Set();
let pendingGameInvite=null,seenGamePopupIds=new Set(),seenGameStartIds=new Set(),seenGameDeclineIds=new Set();

function gameLabel(type){let g=miniGames[type];return g?`${g.icon} ${g.name}`:type}

function startGame(){
  if(!room||!partner)return;
  let c=cur(),other=room.host_char===c.id?room.guest_state:room.host_state;
  if(!isOnlineState(other)){
    toast("對方目前離線，不能發送小遊戲邀請。");return;
  }
  gameTitle.textContent="🎮 雙人小遊戲中心";
  gameDesc.textContent=`選一款遊戲邀請 ${partner.name}。對方接受後雙方才會進入同一局。`;
  gameChoices.innerHTML=`<div class="gameMenuGrid">${Object.entries(miniGames).map(([k,g])=>`<button data-gamepick="${k}"><b>${g.icon} ${g.name}</b><div class="small">${g.desc}</div></button>`).join("")}</div>`;
  gameResult.textContent="小遊戲不消耗每日 5 次羈絆互動。";
  gameModal.classList.remove("hidden");
}

async function sendGameInvite(type){
  let c=cur(),g=miniGames[type];if(!c||!room||!partner||!g)return;
  let other=room.host_char===c.id?room.guest_state:room.host_state;
  if(!isOnlineState(other))return toast("對方剛剛離線了，邀請沒有送出。");
  let nonce=Date.now().toString(36);
  try{
    let data=await api("/test_interactions",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      room_code:room.code,from_char:c.id,to_char:partner.id|| (room.host_char===c.id?room.guest_char:room.host_char),
      text:`GAME_INVITE|${type}|${nonce}`
    })});
    let row=data?.[0]||{};
    pendingOutgoingGameInvite={id:row.id,roomCode:room.code,type,to:row.to_char||partner.id,name:partner.name};
    gameModal.classList.add("hidden");
    gameWaitBody.innerHTML=`已邀請 <b>${esc(partner.name)}</b> 玩<br><h3 style="margin:8px 0">${g.icon} ${esc(g.name)}</h3><div class="small">等待對方回覆中……你可以繼續切換其他關係或頁面。</div>`;
    gameWaitModal.classList.remove("hidden");
    logJournal(c,`邀請${partner.name}玩「${g.name}」`,"🎮");
  }catch(e){toast("小遊戲邀請失敗："+e.message)}
}

gameChoices.onclick=e=>{
  let pick=e.target.closest("[data-gamepick]");
  if(pick)return sendGameInvite(pick.dataset.gamepick);
  let ans=e.target.closest("[data-gameans]");
  if(ans)return handleGameAnswer(ans.dataset.gameans);
};

async function acceptGameInvite(interactionId,type,roomCode){
  let c=cur(),g=miniGames[type];if(!c||!g)return;
  try{
    let rs=await api(`/test_rooms?code=eq.${encodeURIComponent(roomCode)}&select=*`);
    let targetRoom=rs?.[0];if(!targetRoom)throw new Error("找不到這段關係");
    gameRoomContext=targetRoom;
    let data=await api("/test_games",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      room_code:targetRoom.code,host_char:targetRoom.host_char,guest_char:targetRoom.guest_char,host_choice:null,guest_choice:null
    })});
    let gid=data[0].id;
    await api(`/test_interactions?id=eq.${encodeURIComponent(interactionId)}`,{method:"DELETE"});
    let inviter=targetRoom.host_char===c.id?targetRoom.guest_char:targetRoom.host_char;
    await api("/test_interactions",{method:"POST",body:JSON.stringify({
      room_code:targetRoom.code,from_char:c.id,to_char:inviter,text:`GAME_START|${type}|${gid}`
    })});
    gameInviteModal.classList.add("hidden");
    pendingGlobalGameInvite=null;
    openGameSession(gid,type);
    await renderPendingEvents(c);
  }catch(e){toast("接受小遊戲邀請失敗："+e.message)}
}

async function declineGameInvite(interactionId,type,roomCode){
  let c=cur();if(!c)return;
  try{
    let rows=await api(`/test_interactions?id=eq.${encodeURIComponent(interactionId)}&select=*`);
    let x=rows[0];
    await api(`/test_interactions?id=eq.${encodeURIComponent(interactionId)}`,{method:"DELETE"});
    if(x){
      await api("/test_interactions",{method:"POST",body:JSON.stringify({
        room_code:roomCode,from_char:c.id,to_char:x.from_char,text:`GAME_DECLINE|${type}|${Date.now()}`
      })});
    }
    gameInviteModal.classList.add("hidden");pendingGlobalGameInvite=null;
    toast("已婉拒這次小遊戲邀請。");
    await renderPendingEvents(c);
  }catch(e){toast("處理邀請失敗："+e.message)}
}

function openGameSession(gid,type){
  gameId=Number(gid);currentGameType=type;currentGameDraft=null;
  let g=miniGames[type];if(!g)return;
  gameTitle.textContent=`${g.icon} ${g.name}`;
  gameDesc.textContent=g.desc;
  renderGameInput();
  gameModal.classList.remove("hidden");
  clearInterval(gamePollTimer);
  gamePollTimer=setInterval(()=>refreshGame().catch(()=>{}),1200);
  refreshGame().catch(()=>{});
}

function renderGameInput(){
  let g=miniGames[currentGameType];if(!g)return;
  if(currentGameType==="quiz"){
    currentGameDraft={answers:[],q:0};
    renderQuizQuestion();return;
  }
  if(currentGameType==="guess"){
    currentGameDraft={actual:null,guess:null,step:"actual"};
    gameResult.textContent="第一步：先選你自己的答案。";
    gameChoices.innerHTML=g.choices.map(x=>`<button data-gameans="${esc(x)}">${esc(x)}</button>`).join("");
    return;
  }
  gameChoices.innerHTML=g.choices.map(x=>`<button data-gameans="${esc(x)}">${esc(x)}</button>`).join("");
  gameResult.textContent="選好後會等待對方。";
}

function renderQuizQuestion(){
  let d=currentGameDraft,g=miniGames.quiz;
  if(d.q>=g.questions.length){submitGamePayload({answers:d.answers});return}
  let q=g.questions[d.q];
  gameDesc.textContent=`第 ${d.q+1}/5 題・${q[0]}`;
  gameChoices.innerHTML=q.slice(1).map(x=>`<button data-gameans="${esc(x)}">${esc(x)}</button>`).join("");
  gameResult.textContent=`目前已回答 ${d.answers.length}/5`;
}

async function handleGameAnswer(answer){
  if(!gameId||!(gameRoomContext||room)||!currentGameType)return;
  if(currentGameType==="quiz"){
    currentGameDraft.answers.push(answer);currentGameDraft.q++;renderQuizQuestion();return;
  }
  if(currentGameType==="guess"){
    if(currentGameDraft.step==="actual"){
      currentGameDraft.actual=answer;currentGameDraft.step="guess";
      gameDesc.textContent="第二步：猜猜對方會選哪一個。";
      gameResult.textContent=`你的答案：${answer}。現在猜對方。`;
      return;
    }
    currentGameDraft.guess=answer;
    return submitGamePayload({actual:currentGameDraft.actual,guess:answer});
  }
  return submitGamePayload({answer});
}

async function submitGamePayload(payload){
  let c=cur(),gr=gameRoomContext||room,field=gr.host_char===c.id?"host_choice":"guest_choice";
  let body={};body[field]=JSON.stringify({type:currentGameType,...payload});
  try{
    await api(`/test_games?id=eq.${gameId}`,{method:"PATCH",body:JSON.stringify(body)});
    gameChoices.innerHTML="";
    gameResult.textContent="答案已送出，等待對方……";
    await refreshGame();
  }catch(e){toast("送出答案失敗："+e.message)}
}

function parseGamePayload(v){
  if(!v)return null;
  try{return JSON.parse(v)}catch(e){
    // old 心有靈犀 game compatibility
    return {type:"sync",answer:String(v)};
  }
}
function rpsWinner(a,b){
  if(a===b)return 0;
  let beats={"✊ 石頭":"✌️ 剪刀","✌️ 剪刀":"✋ 布","✋ 布":"✊ 石頭"};
  return beats[a]===b?1:-1;
}
function resolveMiniGame(type,mine,other){
  if(type==="sync"){
    let same=mine.answer===other.answer;
    return {text:same?`心有靈犀！你們都選了「${mine.answer}」 ♡`:`你選「${mine.answer}」，對方選「${other.answer}」`,score:same?2:1,success:same};
  }
  if(type==="guess"){
    let myHit=mine.guess===other.actual,otherHit=other.guess===mine.actual;
    return {text:`你選「${mine.actual}」、猜「${mine.guess}」${myHit?" ✅":" ❌"}；對方猜你${otherHit?"中了 ✅":"沒中 ❌"}`,score:1+(myHit?1:0)+(otherHit?1:0),myHit,otherHit};
  }
  if(type==="rps"){
    let w=rpsWinner(mine.answer,other.answer);
    return {text:w===0?`平手！你們都出 ${mine.answer}`:w>0?`你贏了！${mine.answer} 對 ${other.answer}`:`對方贏了！${mine.answer} 對 ${other.answer}`,score:1};
  }
  if(type==="quiz"){
    let same=mine.answers.filter((x,i)=>x===other.answers[i]).length;
    return {text:`默契快問快答：5 題中有 ${same} 題一樣！${same===5?" 💯 完美默契！":""}`,score:1+Math.floor(same/2),same};
  }
  if(type==="fortune"){
    let pair=[mine.answer,other.answer].sort().join("+"),rare=/🌙 月籤.*⭐ 星籤|🍀 草籤.*☀️ 日籤/.test(pair);
    return {text:`你抽到 ${mine.answer}，對方抽到 ${other.answer}。${rare?"✨ 今天是稀有的幸運組合！":"今天也有屬於你們的小小運勢。"}`,score:rare?3:1,rare};
  }
  if(type==="choice"){
    let same=mine.answer===other.answer;
    return {text:same?`你們不約而同選了「${mine.answer}」！`:`你選「${mine.answer}」，對方選「${other.answer}」。不同想法也很有趣。`,score:same?2:1,success:same};
  }
  return {text:"小遊戲完成！",score:1};
}


async function reconcileSync3FromCloud(c,roomCode){
  if(!c||!roomCode||c.achievements?.sync3)return false;
  try{
    let rows=await api(`/test_games?room_code=eq.${encodeURIComponent(roomCode)}&select=id,host_choice,guest_choice,created_at&order=created_at.asc&limit=300`);
    let streak=0,best=0,totalWins=0;
    for(const g of rows||[]){
      let a=parseGamePayload(g.host_choice),b=parseGamePayload(g.guest_choice);
      if(!a||!b)continue;
      let type=a.type||b.type||"sync";
      if(type!=="sync")continue;
      let ok=a.answer===b.answer;
      if(ok){streak++;totalWins++;best=Math.max(best,streak)}
      else streak=0;
    }
    c.stats??={};
    c.achievements??={};
    c.stats.syncWins=Math.max(Number(c.stats.syncWins||0),totalWins);
    c.stats.syncBestStreak=Math.max(Number(c.stats.syncBestStreak||0),best);
    // Current streak can only be reconstructed from the latest sync sequence.
    c.stats.syncStreak=Math.max(Number(c.stats.syncStreak||0),streak);
    if(best>=3){
      c.achievements.sync3=1;
      saveLocal();
      return true;
    }
    saveLocal();
  }catch(e){console.warn("心有靈犀成就補判定",e)}
  return false;
}

async function refreshGame(){
  if(!gameId||!(gameRoomContext||room))return;
  let rows=await api(`/test_games?id=eq.${gameId}&select=*`);if(!rows.length)return;
  let gr=gameRoomContext||room,g=rows[0],c=cur();
  await reconcileSync3FromCloud(c,gr.code).catch(()=>{});
  let mine=parseGamePayload(gr.host_char===c.id?g.host_choice:g.guest_choice),other=parseGamePayload(gr.host_char===c.id?g.guest_choice:g.host_choice);
  if(!mine){
    if(!currentGameDraft)renderGameInput();
    return;
  }
  if(!other){gameChoices.innerHTML="";gameResult.textContent="你的答案已送出，等待對方完成……";return}
  let type=mine.type||other.type||currentGameType||"sync";
  currentGameType=type;
  let result=resolveMiniGame(type,mine,other);
  gameChoices.innerHTML="";gameDesc.textContent=miniGames[type]?.desc||"";
  gameResult.textContent=result.text;
  if(!rewardedGames.has(g.id)){
    rewardedGames.add(g.id);
    c.stats??={};c.stats.games=(c.stats.games||0)+1;
    c.stats.gameTypes??={};c.stats.gameTypes[type]=1;
    c.achievements??={};
    if(type==="sync"){
      if(result.success){
        c.stats.syncWins=(c.stats.syncWins||0)+1;
        c.stats.syncStreak=(c.stats.syncStreak||0)+1;
        c.stats.syncBestStreak=Math.max(Number(c.stats.syncBestStreak||0),Number(c.stats.syncStreak||0));
      }else{
        c.stats.syncStreak=0;
      }
    }
    if(type==="guess"&&result.myHit)c.stats.guessHits=(c.stats.guessHits||0)+1;
    if(type==="quiz"&&result.same===5)c.achievements.game_quizperfect=1;
    if(type==="fortune"&&result.rare)c.achievements.game_lucky=1;

    // 正確的成就 ID 是 sync3 / game1，不是 game_sync3。
    if((c.stats.syncBestStreak||0)>=3)c.achievements.sync3=1;
    if((c.stats.guessHits||0)>=5)c.achievements.game_guess5=1;
    if(Object.keys(c.stats.gameTypes).length>=6)c.achievements.game_variety=1;
    c.achievements.game1=1;
    logJournal(c,`和${partner?.name||"關係角色"}完成「${miniGames[type]?.name||"小遊戲"}」`,"🎮");
    saveLocal();
    // Host records shared bond once; score controls how many bond records (1-3).
    if(room.host_char===c.id){
      for(let i=0;i<Math.max(1,result.score||1);i++){
        let tag=`小遊戲|${type}|${g.id}|${i}`;
        let existing=await api(`/test_interactions?room_code=eq.${encodeURIComponent(room.code)}&text=eq.${encodeURIComponent(tag)}&select=id&limit=1`);
        if(!existing.length)await api("/test_interactions",{method:"POST",body:JSON.stringify({room_code:room.code,from_char:c.id,to_char:room.guest_char,text:tag})});
      }
    }
    await refreshBond(room.code);renderGame();
  }
}

document.getElementById("closeRelationEvent").onclick=()=>document.getElementById("relationEventModal").classList.add("hidden");
document.getElementById("closeGame").onclick=()=>{document.getElementById("gameModal").classList.add("hidden");clearInterval(gamePollTimer);gamePollTimer=null};

document.getElementById("avatar").onclick=()=>document.getElementById("imageInput").click();
document.getElementById("imageInput").onchange=e=>{
  let c=cur(),f=e.target.files[0];if(!c||!f)return;
  let rd=new FileReader();rd.onload=v=>{let im=new Image();im.onload=()=>{let cv=document.createElement("canvas"),w=im.width,h=im.height,max=320;if(w>h&&w>max){h=h*max/w;w=max}else if(h>=w&&h>max){w=w*max/h;h=max}cv.width=w;cv.height=h;cv.getContext("2d").drawImage(im,0,0,w,h);c.image=cv.toDataURL("image/jpeg",.65);saveLocal();refreshRelationships().then(()=>{if(activeRoomCode)return loadRoom(activeRoomCode)}).then(()=>syncState()).catch(e=>console.warn(e));renderGame()};im.src=v.target.result};rd.readAsDataURL(f);
};



function wholeNumber(v, fallback=0){
  const n=Number(v);
  return Number.isFinite(n)?Math.round(n):fallback;
}
function normalizeWholeStats(c){
  if(!c)return c;
  ["energy","hunger","mood","exp","money"].forEach(k=>{
    if(c[k]!==undefined)c[k]=wholeNumber(c[k],0);
  });
  if(c.level!==undefined)c.level=Math.max(1,wholeNumber(c.level,1));
  return c;
}
function eventFloatValue(base,key){
  base=Number(base||0);
  if(!base)return 0;
  const abs=Math.abs(base);
  // Preserve the original direction. Small values fluctuate less; larger effects fluctuate more.
  let spread=abs<=2?1:abs<=5?2:Math.max(2,Math.round(abs*0.25));
  let min=Math.max(1,abs-spread),max=abs+spread;
  let rolled=Math.round(Math.floor(Math.random()*(max-min+1))+min);
  return base<0?-rolled:rolled;
}
function eventValueRange(base){
  base=Number(base||0);if(!base)return "";
  const abs=Math.abs(base);
  let spread=abs<=2?1:abs<=5?2:Math.max(2,Math.round(abs*0.25));
  let min=Math.max(1,abs-spread),max=abs+spread;
  return base<0?`-${max}～-${min}`:`+${min}～+${max}`;
}
function personalEventEligible(c,ev){
  if(ev.minE!=null&&c.energy<ev.minE)return false;if(ev.maxE!=null&&c.energy>ev.maxE)return false;
  if(ev.minH!=null&&c.hunger<ev.minH)return false;if(ev.maxH!=null&&c.hunger>ev.maxH)return false;
  if(ev.minM!=null&&c.mood<ev.minM)return false;if(ev.maxM!=null&&c.mood>ev.maxM)return false;
  if(ev.minMoney!=null&&(c.money||0)<ev.minMoney)return false;if(ev.maxMoney!=null&&(c.money||0)>ev.maxMoney)return false;
  if(ev.minDay!=null&&day(c)<ev.minDay)return false;
  return true;
}
function maybeEvent(){
  let c=cur();if(!c||c.events.length>=6||Date.now()-c.lastEvent<90000||Math.random()>.65)return;
  c.lastEvent=Date.now();c.personalEventHistory??=[];
  let recent=new Set(c.personalEventHistory.slice(-8));
  let pool=eventPool.filter(ev=>personalEventEligible(c,ev)&&!recent.has(ev.id));
  if(!pool.length)pool=eventPool.filter(ev=>personalEventEligible(c,ev));
  if(!pool.length)return;

  // 金錢偏低時，提高小額進帳事件的出現率，但不保證每次都出現。
  if((c.money||0)<=55){
    let rescue=pool.filter(ev=>["smallchange","bottle","tinyhelp","coin"].includes(ev.id));
    if(rescue.length&&Math.random()<0.72)pool=rescue;
  }
  // 心情長期偏高時，稍微提高「有代價」事件的出現率。
  else if(c.mood>=85){
    let down=pool.filter(ev=>ev.choices?.some(ch=>Number(ch.mood||0)<0));
    if(down.length&&Math.random()<0.62)pool=down;
  }

  let ev=pool[Math.floor(Math.random()*pool.length)];
  c.personalEventHistory.push(ev.id);c.personalEventHistory=c.personalEventHistory.slice(-20);
  c.events.push({id:uuid(),eventId:ev.id,title:ev.title,text:ev.text,choices:ev.choices});
  saveLocal();renderGame();
}

setInterval(async()=>{
  let c=cur();if(!c)return;
  const relationMultipliers=Object.values(relationshipSummaries)
    .map(r=>defs[r.relation]?.exp||1);
  const expMultiplier=1+relationMultipliers.reduce((sum,x)=>sum+(x-1),0);
  c.exp+=1*expMultiplier;c.hunger=Math.max(0,c.hunger-.18);c.energy=Math.max(0,Math.min(100,c.energy+(new Date().getHours()<7?.8:-.1)));c.mood=Math.max(0,Math.min(100,c.mood+.15));
  processLevelUps(c)
  saveLocal();try{await syncState()}catch(e){console.warn(e)};maybeEvent();renderGame();
},60000);




const standardShop=[
  {id:"snack",n:"🍪 小餅乾",p:35,effect:"hunger",restore:22,desc:"飽食度 +22"},
  {id:"coffee",n:"☕ 熱咖啡",p:45,effect:"energy",restore:22,desc:"體力 +22"},
  {id:"tea",n:"🍵 花茶",p:40,effect:"mood",restore:10,desc:"心情 +10"},
  {id:"lunch",n:"🍱 便當",p:65,effect:"hunger",restore:22,desc:"飽食度 +22"},
  {id:"drink",n:"🥤 能量飲",p:70,effect:"energy",restore:38,desc:"體力 +38"},
  {id:"cake",n:"🍰 草莓蛋糕",p:80,effect:"mood",restore:10,desc:"心情 +10"},
  {id:"novel",n:"📕 小說",p:90,effect:"mood",restore:10,desc:"心情 +10"},
  {id:"lamp",n:"🕯️ 小夜燈",p:95,effect:"mood",restore:10,desc:"心情 +10"}
];
const affectionGiftShop=[
  {id:"gift_candy",n:"🍬 手工糖果",p:45,type:"affectionGift",affinity:1,desc:"每件送出後共同羈絆 +1"},
  {id:"gift_keychain",n:"🧸 小吊飾",p:70,type:"affectionGift",affinity:1,desc:"每件送出後共同羈絆 +1"},
  {id:"gift_flower",n:"🌷 一枝小花",p:85,type:"affectionGift",affinity:2,desc:"每件送出後共同羈絆 +2"},
  {id:"gift_letter",n:"💌 手寫卡片",p:95,type:"affectionGift",affinity:2,desc:"每件送出後共同羈絆 +2"},
  {id:"gift_plush",n:"🎀 小玩偶",p:130,type:"affectionGift",affinity:2,desc:"每件送出後共同羈絆 +2"},
  {id:"gift_music",n:"🎵 音樂小盒",p:165,type:"affectionGift",affinity:3,desc:"每件送出後共同羈絆 +3"}
];
const specialShop=[
{id:"oldkey",n:"🗝️ 舊鑰匙",p:120,type:"special",story:"被遺忘的故事"},
  {id:"letter",n:"✉️ 泛黃信紙",p:110,type:"special",story:"被遺忘的故事"},
  {id:"dryflower",n:"🥀 乾燥花",p:105,type:"special",story:"被遺忘的故事"},
  {id:"musicbox",n:"🎼 老音樂盒",p:145,type:"special",story:"某段沒有說完的旋律"},
  {id:"ticket",n:"🎟️ 舊電影票",p:130,type:"special",story:"某個被記住的午後"},
  {id:"ribbon",n:"🎀 褪色緞帶",p:125,type:"special",story:"很久以前留下的禮物"},
  {id:"picnic",n:"🧺 野餐籃",p:110,type:"special",story:"午後的小旅行"},
  {id:"flowers",n:"💐 小花束",p:75,type:"special",story:"午後的小旅行"}
];
const breakthroughShop=[
  {id:"break_lover",n:"💍 誓約指環",p:520,type:"breakthrough",rel:"lover",topTitle:"此生唯一"},
  {id:"break_bestfriend",n:"🌟 星光信物",p:480,type:"breakthrough",rel:"bestfriend",topTitle:"一生的知己"},
  {id:"break_family",n:"🏡 家之鑰",p:480,type:"breakthrough",rel:"family",topTitle:"永遠的歸處"},
  {id:"break_partner",n:"🛡️ 共誓徽記",p:500,type:"breakthrough",rel:"partner",topTitle:"最強搭檔"},
  {id:"break_rival",n:"⚡ 決勝徽章",p:500,type:"breakthrough",rel:"rival",topTitle:"唯一的對手"},
  {id:"break_enemy",n:"⛓️ 斷不了的鎖鏈",p:500,type:"breakthrough",rel:"enemy",topTitle:"不解之緣"}
];
const protoShop=[...standardShop,...affectionGiftShop,...specialShop,...breakthroughShop];

const places=[["park","🌳","公園"],["cafe","☕","咖啡店"],["bookstore","📚","書店"],["street","🛍️","商店街"],["cinema","🎬","電影院"],["river","🌙","河堤"]];
let achievementFilter="全部";
function todayKey(d=new Date()){return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function dayDiff(a,b){
  if(!a||!b)return 999;
  return Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);
}
function seededShuffle(arr,seedText){
  let seed=[...seedText].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,2166136261),out=[...arr];
  for(let i=out.length-1;i>0;i--){
    seed=(seed*1664525+1013904223)>>>0;
    let j=seed%(i+1);[out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}
function ensureDailySpecialState(c){
  if(!c)return {ids:[],forced:false,hadSoldOut:false,streak:0};
  c.specialShopState??={};
  let st=c.specialShopState,key=todayKey();
  if(st.date===key&&Array.isArray(st.ids))return st;

  let previousStreak=(st.date&&dayDiff(st.date,key)===1&&st.hadSoldOut)?Number(st.streak||0):0;
  let forceFresh=previousStreak>=3;
  let owned=id=>(c.inventory?.[id]||0)>0;
  let seed=`${key}|${c.id||c.name||"role"}|special-shop`;
  let selected=[];

  if(forceFresh){
    let fresh=seededShuffle(specialShop.filter(x=>!owned(x.id)),seed+"|pity");
    selected=fresh.slice(0,2);
    // If fewer than two unowned specials remain, fill the visible slots with sold-out items.
    if(selected.length<2){
      let used=new Set(selected.map(x=>x.id));
      selected.push(...seededShuffle(specialShop.filter(x=>!used.has(x.id)),seed+"|fill").slice(0,2-selected.length));
    }
  }else{
    selected=seededShuffle(specialShop,seed).slice(0,2);
  }

  let hadSoldOut=selected.some(x=>owned(x.id));
  let streak=forceFresh?0:(hadSoldOut?previousStreak+1:0);
  c.specialShopState={
    date:key,
    ids:selected.map(x=>x.id),
    hadSoldOut,
    priorStreak:previousStreak,
    streak,
    forced:forceFresh
  };
  saveLocal();
  return c.specialShopState;
}
function seededDailySpecials(){
  let c=cur();
  if(!c)return seededShuffle(specialShop,todayKey()).slice(0,2);
  let st=ensureDailySpecialState(c);
  return st.ids.map(id=>specialShop.find(x=>x.id===id)).filter(Boolean);
}
function shopItemsToday(){
 let arr=[...standardShop,...seededDailySpecials()];
 let rr=relationshipSummaries?.[activeRoomCode],b=bondCache?.[activeRoomCode];
 if(rr&&b?.max&&!b?.broken){
   let bi=breakthroughShop.find(x=>x.rel===rr.relation);
   if(bi)arr.push(bi);
 }
 return arr;
}
function isSpecialSoldOut(c,item){
  return item?.type==="special"&&(c?.inventory?.[item.id]||0)>0;
}

const protoAch=[["start","🌱 冒險的開始","開始角色生活","角色"],["week","🌙 七日物語","生活滿 7 天","生活"],["month","📅 一個月的生活","生活滿 30 天","生活"],["shop","🛍️ 購物初體驗","第一次購物","收藏"],["shop5","🎁 小小收藏家","累積購物 5 次","收藏"],["memory10","📖 回憶收藏冊","留下 10 段回憶","收藏"],["read","？？？","隱藏成就","隱藏"],["picnic","？？？","隱藏成就","隱藏"],["secret","？？？","隱藏成就","隱藏"],["solo","？？？","隱藏成就","隱藏"],["break","？？？","羈絆突破隱藏成就","隱藏"],["newyear","🧧 新年的第一頁","元旦期間可刷出","節日"],["qixi","🌌 今夜星河","七夕期間可刷出","節日"],["xmas","🎄 冬夜的禮物","聖誕期間可刷出","節日"],["relation","🤝","命運的相遇","第一次建立任意關係","關係"],["rel3types","🌈","關係多彩","同時擁有 3 種不同關係","關係"],["rel5types","🧩","各有位置","同時擁有 5 種不同關係","關係"],["rel6types","🌟","六種羈絆","六種關係類型全部建立","關係"],["lover","💕","心之所向","第一次建立戀人關係","關係"],["friend","🫂","摯友一生","第一次建立摯友關係","關係"],["family","🏠","家的方向","第一次建立家人關係","關係"],["partner","⚔️","並肩而行","第一次建立搭檔關係","關係"],["rival","🔥","命中宿敵","第一次建立宿敵關係","關係"],["enemy","💢","狹路相逢","第一次建立仇敵關係","關係"],["msg1","💬","第一句話","第一次傳送關係聊天訊息","關係"],["msg10","✉️","聊得來","累積傳送 10 則訊息","關係"],["msg50","💌","有好多話想說","累積傳送 50 則訊息","關係"],["interact1","💞","第一次靠近","第一次進行關係互動","關係"],["interact10","🌷","更加熟悉","累積關係互動 10 次","關係"],["interact50","🌹","已成習慣","累積關係互動 50 次","關係"],["outingTogether","🧋","一起出去吧","第一次完成共同外出","關係"],["outing5","🎡","好多共同足跡","累積完成 5 次共同外出","關係"],["game1","🎮","一起玩吧","第一次完成雙人小遊戲","關係"],["sync3","💫","心有靈犀","小遊戲連續 3 次默契成功","關係"],["gift1","🎁","一點心意","第一次送禮給關係角色","關係"],["gift10","🎀","總想送你東西","累積送禮 10 次","關係"],["bond5","💗","開始熟悉","任一關係羈絆達 Lv.5","關係"],["bond10","💖","更加靠近","任一關係羈絆達 Lv.10","關係"],["bond15","💓","默契漸深","任一關係羈絆達 Lv.15","關係"],["bond20","💞","彼此重要","任一關係羈絆達 Lv.20","關係"],["bond25","💘","無可忽視","任一關係羈絆達 Lv.25","關係"],["bond6","💎","一路走到這裡","任一關係抵達第六階","關係"],["bondmax","✨","滿溢的羈絆","任一關係羈絆達 Lv.30 MAX","關係"],["lover_stage3","🌸","習慣你的存在","戀人關係進入第三階段","關係"],["lover_stage6","💍","無可取代","戀人關係進入第六階段","關係"],["friend_stage3","🍬","聊不完的日常","摯友關係進入第三階段","關係"],["friend_stage6","🌟","靈魂摯友","摯友關係進入第六階段","關係"],["family_stage3","🍲","互相照顧","家人關係進入第三階段","關係"],["family_stage6","🏡","永遠的歸處","家人關係進入第六階段","關係"],["partner_stage3","🛡️","默契搭檔","搭檔關係進入第三階段","關係"],["partner_stage6","⚔️","最強搭檔","搭檔關係進入第六階段","關係"],["rival_stage3","🥊","真正的對手","宿敵關係進入第三階段","關係"],["rival_stage6","🔥","命定對手","宿敵關係進入第六階段","關係"],["enemy_stage3","⚡","水火不容","仇敵關係進入第三階段","關係"],["enemy_stage6","🩸","宿命之敵","仇敵關係進入第六階段","關係"],["daily1","☀️ 今日的小事","完成一次每日任務組","生活"],["daily10","✅ 日常達人","完成 10 次每日任務組","生活"],["work1","💼 第一天上班","完成第一次打工","生活"],["work10","🧾 熟練打工人","累積打工 10 次","生活"],["earn1000","💰 自己賺的錢","打工累積收入 1000 金幣","收藏"],
["gaylove","？？？","隱藏成就","隱藏"],["girllove","？？？","隱藏成就","隱藏"],
["rival_to_lover","？？？","隱藏成就","隱藏"],["lover_to_enemy","？？？","隱藏成就","隱藏"],["love_triangle","？？？","隱藏成就","隱藏"],
["game_sync3","🎯","一模一樣","心有靈犀累積成功 3 次","關係"],
["game_guess5","🧠","我就知道","猜猜我會選什麼累積猜中 5 次","關係"],
["game_quizperfect","💯","默契滿分","默契快問快答達成 5 / 5","關係"],
["game_lucky","🍀","天選組合","今日幸運籤抽到稀有組合","關係"],
["game_variety","🎮","什麼都玩","完成 6 種不同雙人小遊戲","關係"],
["enemy_to_lover","？？？","隱藏成就","隱藏"],
["friend_to_lover","？？？","隱藏成就","隱藏"],
["partner_to_friend","？？？","隱藏成就","隱藏"],
["rival_to_friend","？？？","隱藏成就","隱藏"],
["relation_three_forms","？？？","隱藏成就","隱藏"],
["relation_return","？？？","隱藏成就","隱藏"],
["relation_all_six","？？？","隱藏成就","隱藏"],
["triangle_master","？？？","隱藏成就","隱藏"],
["login3","🌤️","又見面了","連續登入 3 天","生活"],
["login7","🎁","一週的陪伴","連續登入 7 天","生活"],
["login14","🌟","生活成為習慣","連續登入 14 天","生活"],
["relation_chain3","？？？","隱藏成就","隱藏"],
["relation_full_shuffle","？？？","隱藏成就","隱藏"],
["relation_full_six","？？？","隱藏成就","隱藏"]];

function localDateKey(d=new Date()){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
const dailyTaskDefs={
  event1:{name:"處理 1 個角色事件",icon:"🎭",target:1,progress:(c,b)=>Math.max(0,(c.stats.events||0)-(b.events||0))},
  mood60:{name:"讓心情保持在 60 以上",icon:"🌸",target:1,progress:c=>c.mood>=60?1:0},
  shop1:{name:"在商店買 1 件東西",icon:"🛍️",target:1,progress:(c,b)=>Math.max(0,(c.stats.purchases||0)-(b.purchases||0))},
  chat1:{name:"傳送 1 則關係訊息",icon:"💬",target:1,progress:(c,b)=>Math.max(0,(c.stats.messages||0)-(b.messages||0))},
  rel2:{name:"完成 2 次關係劇情事件",icon:"💞",target:2,progress:(c,b)=>Math.max(0,(c.stats.relationshipEvents||0)-(b.relationshipEvents||0))},
  outing1:{name:"完成 1 次共同外出",icon:"🗺️",target:1,progress:(c,b)=>Math.max(0,(c.stats.outingTogether||0)-(b.outingTogether||0))},
  game1:{name:"完成 1 次互動小遊戲",icon:"🎮",target:1,progress:(c,b)=>Math.max(0,(c.stats.games||0)-(b.games||0))},
  work1:{name:"完成 1 次打工",icon:"💼",target:1,progress:(c,b)=>Math.max(0,(c.stats.workCount||0)-(b.workCount||0))}
};
function makeDailyBaseline(c){
  return {
    events:c.stats.events||0,purchases:c.stats.purchases||0,messages:c.stats.messages||0,
    relationshipEvents:c.stats.relationshipEvents||0,outingTogether:c.stats.outingTogether||0,games:c.stats.games||0,workCount:c.stats.workCount||0
  };
}
function chooseDailyTasks(c){
  let pool=["event1","mood60","shop1","work1"];
  if(c.roomCodes?.length)pool.push("chat1","rel2","outing1","game1");
  for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  return pool.slice(0,3);
}
function resetDailyIfNeeded(c,force=false){
  let key=localDateKey();
  if(force||c.dailyDate!==key||!Array.isArray(c.dailyTasks)||c.dailyTasks.length!==3){
    c.dailyDate=key;
    c.dailyTasks=chooseDailyTasks(c);
    c.dailyBaseline=makeDailyBaseline(c);
    c.dailyRewardClaimed=false;
    saveLocal();
  }
}
function dailyStatus(c){
  resetDailyIfNeeded(c);
  let b=c.dailyBaseline||{},items=c.dailyTasks.map(id=>{
    let d=dailyTaskDefs[id],p=Math.min(d.target,d.progress(c,b));
    return{id,d,p,done:p>=d.target};
  });
  return{items,all:items.every(x=>x.done)};
}
function checkDailyReward(c){
  let st=dailyStatus(c);
  if(st.all&&!c.dailyRewardClaimed){
    c.dailyRewardClaimed=true;
    c.money=(c.money||0)+80;c.exp=(c.exp||0)+25;
    processLevelUps(c);
    c.stats.dailyCompleted=(c.stats.dailyCompleted||0)+1;
    if(c.stats.dailyCompleted>=1)c.achievements.daily1=1;
    if(c.stats.dailyCompleted>=10)c.achievements.daily10=1;
    logJournal(c,"完成今日所有小任務，獲得 🪙80＋EXP 25","✅");
    saveLocal();
    if(document.getElementById("extraDaily")?.classList.contains("active")){
      infoTitle.textContent="✅ 今日任務完成";
      infoBody.innerHTML="三個今日小事都完成了！<br><br><b>獎勵：🪙80＋EXP 25</b>";
      infoModal.classList.remove("hidden");
    }
  }
  return st;
}
function renderDailyTasks(c){
  let dl=document.getElementById("dailyList");if(!dl)return;
  let st=checkDailyReward(c);
  dl.innerHTML=st.items.map(x=>{
    let pct=Math.min(100,x.p/x.d.target*100);
    return `<div class="dailyTask ${x.done?"done":""}"><div class="taskTop"><b>${x.done?"✅":x.d.icon} ${esc(x.d.name)}</b><span class="small">${x.p}/${x.d.target}</span></div><div class="dailyProgress"><div style="width:${pct}%"></div></div></div>`;
  }).join("")+`<div class="dailyReward"><b>${c.dailyRewardClaimed?"🎁 今日獎勵已領取":"🎁 全部完成獎勵"}</b><div class="small">${c.dailyRewardClaimed?"明天 00:00 會換新任務。":"🪙80＋EXP 25・每天 00:00 更新"}</div></div>`;
}
let midnightTimer=null;
function scheduleMidnightReset(){
  clearTimeout(midnightTimer);
  let now=new Date(),next=new Date(now);next.setHours(24,0,0,80);
  midnightTimer=setTimeout(()=>{
    local.characters.forEach(c=>{ensureRelations(c);resetDailyIfNeeded(c,true)});
    if(cur())renderGame();
    scheduleMidnightReset();
  },Math.max(1000,next-now));
}

const achievementHints={
 start:"建立角色並開始生活就會遇見它。",
 week:"陪角色一起生活幾天看看。",
 month:"長期陪伴角色生活。",
 shop:"去商店買下第一件東西。",
 shop5:"偶爾替角色添些生活用品。",
 memory10:"多經歷特殊事件，回憶會慢慢累積。",
 relation:"試著和另一名玩家建立一段關係。",
 three:"一個角色最多能擁有三段關係。",
 lover:"建立一段戀人關係。",
 friend:"建立一段摯友關係。",
 family:"建立一段家人關係。",
 partner:"建立一段搭檔關係。",
 rival:"建立一段宿敵關係。",
 enemy:"建立一段仇敵關係。",
 msg1:"試著從聊天室傳出第一句話。",
 msg10:"有空時多和關係角色聊聊。",
 msg50:"有些關係是聊著聊著變深的。",
 interact1:"點一次關係互動，完成出現的事件選擇。",
 interact10:"多觸發不同的兩人事件。",
 interact50:"讓共同事件成為你們的日常。",
 outingTogether:"邀請對方外出，等對方同意後完成外出事件。",
 outing5:"一起去不同地方走走。",
 game1:"和對方完成一次「心有靈犀」。",
 sync3:"在「心有靈犀」中連續 3 局選到相同答案。中間只要有一局不同，就會重新計算。",
 bond5:"多完成共同事件，羈絆會自然成長。",
 bond10:"繼續培養目前的一段關係。",
 bond15:"更深的劇情會在更高羈絆出現。",
 bond20:"讓一段關係維持更久。",
 bond25:"距離最高階已經很近了。",
 bond6:"關係階段會隨羈絆等級提升。",
 bondmax:"將任一段共同羈絆培養到目前極限。",
 lover_stage3:"和戀人累積更多共同經歷。",
 lover_stage6:"把戀人的羈絆一路培養到最深階段。",
 friend_stage3:"和摯友累積更多共同事件。",
 friend_stage6:"真正的知己需要長時間相處。",
 family_stage3:"日常的照顧會讓家人關係更深。",
 family_stage6:"讓這段家人羈絆成為不可取代的存在。",
 partner_stage3:"多合作、多經歷搭檔事件。",
 partner_stage6:"把默契培養到最高階。",
 rival_stage3:"多接受挑戰，讓競爭變得更深。",
 rival_stage6:"有些對手會陪你走很久。",
 enemy_stage3:"衝突也可能形成特殊羈絆。",
 enemy_stage6:"讓這段恩怨走到最高階。",
 rival:"已經建立宿敵關係，這項成就會直接解鎖。",
 rival_stage3:"繼續和宿敵互動、挑戰或共同經歷事件，讓宿敵關係進入第 3 階。",
 rival_stage6:"把宿敵的共同羈絆一路培養到第 6 階。",
 lover:"已經建立戀人關係，這項成就會直接解鎖。",
 lover_stage3:"讓戀人共同羈絆進入第 3 階。",
 lover_stage6:"把戀人共同羈絆培養到第 6 階。",
 friend:"已經建立摯友關係，這項成就會直接解鎖。",
 friend_stage3:"讓摯友共同羈絆進入第 3 階。",
 friend_stage6:"把摯友共同羈絆培養到第 6 階。",
 family:"已經建立家人關係，這項成就會直接解鎖。",
 family_stage3:"讓家人共同羈絆進入第 3 階。",
 family_stage6:"把家人共同羈絆培養到第 6 階。",
 partner:"已經建立搭檔關係，這項成就會直接解鎖。",
 partner_stage3:"讓搭檔共同羈絆進入第 3 階。",
 partner_stage6:"把搭檔共同羈絆培養到第 6 階。",
 enemy:"已經建立仇敵關係，這項成就會直接解鎖。",
 enemy_stage3:"讓仇敵共同羈絆進入第 3 階。",
 read:"有些普通商品放在一起，會形成很適合夜晚的組合。",
 picnic:"想想一場舒服的午後小旅行需要哪些東西。",
 secret:"幾件看起來有年代感的物品，也許屬於同一個故事。",
 solo:"即使沒有建立任何關係，也能把自己的生活過得很好。",
 break:"羈絆到達極限後，也許還有辦法繼續前進。",
 newyear:"某些成就只會在特定節日附近出現。",
 qixi:"在特別的日子裡，和重要的人做些特別的事。",
 xmas:"冬天的某一天，也許會有限定故事。",
 daily1:"完成今天列出的三個小任務。",
 daily10:"持續完成每日小任務。",
 work1:"去打工頁完成第一次工作。",
 work10:"穩定工作幾天，累積一些打工次數。",
 earn1000:"打工收入累積到一定程度。"
};


function toast(msg,ms=2600){let o=document.querySelector(".toastMsg");if(o)o.remove();let d=document.createElement("div");d.className="toastMsg";d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),ms)}
function achCategory(a){return a.length>=5?a[4]:a[3]}
function achCondition(a){return a.length>=5?a[3]:a[2]}

const hiddenAchievementReveal={
 read:{icon:"📖",name:"燈下的一頁",desc:"同時持有小夜燈與小說，觸發「夜讀時光」。"},
 picnic:{icon:"🌼",name:"午後的小旅行",desc:"準備好野餐籃、草莓蛋糕與小花束，觸發特殊劇情。"},
 secret:{icon:"🔐",name:"被遺忘的故事",desc:"集齊舊鑰匙、泛黃信紙與乾燥花，發現它們之間的故事。"},
 solo:{icon:"🌙",name:"自己的生活也很好",desc:"不依靠任何關係，也完成一段充實的角色生活。"},
 break:{icon:"✨",name:"超越界限之人",desc:"讓一段羈絆突破原本的最終極限。"},
 gaylove:{icon:"🏳️‍🌈",name:"我是給",desc:"兩名男性角色成為戀人。"},
 girllove:{icon:"🌷",name:"故鄉的百合花開了",desc:"兩名女性角色成為戀人。"},
 rival_to_lover:{icon:"🔥",name:"歡喜冤家",desc:"一段宿敵關係最終轉變成戀人。"},
 lover_to_enemy:{icon:"💔",name:"愛的盡頭",desc:"一段戀人關係最終轉變成仇敵。"},
 love_triangle:{icon:"⚡",name:"修羅場",desc:"在戀人位置已有人的情況下，觸發新的戀愛關係轉變事件。"}
};




const launchEventBadgeDefs={
  launch_newbie:{icon:"🌱",name:"初來乍到",desc:"參與《關係進行式》開服活動。",rarity:"開服限定"},
  launch_first_bond:{icon:"💞",name:"最初的羈絆",desc:"開服活動期間完成聊天、送禮、互動與小遊戲。",rarity:"開服限定"},
  launch_story_start:{icon:"📖",name:"故事從這裡開始",desc:"完成「初次相遇的七日」全部任務。",rarity:"開服限定"},
  launch_inviter:{icon:"💌",name:"把故事分享出去",desc:"開服活動期間成功邀請 3 位測試玩家。",rarity:"開服限定"},
  launch_first_companion:{icon:"🌠",name:"最初的同行者",desc:"完成七日任務、雙人挑戰與至少一次好友邀請。",rarity:"隱藏・開服限定"}
};

let gmBadgeDefs={};
async function refreshCustomBadgeDefs(){
  try{
    let rows=await api("/test_gm_custom_badges?active=eq.true&select=badge_id,name,icon,description,rarity");
    gmBadgeDefs={};
    for(const b of rows||[]){
      gmBadgeDefs[b.badge_id]={
        icon:b.icon||"🏅",
        name:b.name||"限定徽章",
        desc:b.description||"",
        rarity:b.rarity||"限定",
        custom:true
      };
    }
  }catch(e){console.warn("custom badges load",e)}
}
function allBadgeDefs(){
  return Object.assign({},badgeDefs,launchEventBadgeDefs,gmBadgeDefs);
}
const badgeDefs={
 badge_lover:{icon:"💍",name:"此生唯一",desc:"戀人頂級突破"},
 badge_friend:{icon:"🌟",name:"一生的知己",desc:"摯友頂級突破"},
 badge_family:{icon:"🏡",name:"家的方向",desc:"家人頂級突破"},
 badge_partner:{icon:"🛡️",name:"將背後交給你",desc:"搭檔頂級突破"},
 badge_rival:{icon:"⚡",name:"唯一的對手",desc:"宿敵頂級突破"},
 badge_enemy:{icon:"⛓️",name:"不解之緣",desc:"仇敵頂級突破"},
 badge_all:{icon:"🏆",name:"關係的盡頭",desc:"完成六種頂級關係"}
};
function ensureBadges(){
 local.sharedBadges??={};
 const map={top_lover:"badge_lover",top_friend:"badge_friend",top_family:"badge_family",top_partner:"badge_partner",top_rival:"badge_rival",top_enemy:"badge_enemy",top_all:"badge_all"};
 Object.entries(map).forEach(([a,b])=>{if(local.sharedAchievements?.[a])local.sharedBadges[b]=1});
}
function unlockBadge(id){ensureBadges();local.sharedBadges[id]=1}

function ensureProfileBadgeSlots(c){
  c.profileBadges??=[];
  if(!Array.isArray(c.profileBadges))c.profileBadges=[];
  c.profileBadges=c.profileBadges.filter(Boolean).slice(0,3);
}
function toggleProfileBadge(c,id){
  ensureProfileBadgeSlots(c);
  if(c.profileBadges.includes(id)){
    c.profileBadges=c.profileBadges.filter(x=>x!==id);
    toast("已從個人資料移除徽章");
  }else{
    if(c.profileBadges.length>=3)return toast("個人資料最多展示 3 枚徽章");
    c.profileBadges.push(id);
    toast("已加入個人資料展示");
  }
  saveBadgeShowcaseBackup(c);saveLocal();renderBadges(c);
  syncBadgeShowcaseToAllRelations(c).then(()=>refreshRelationships()).catch(e=>console.warn("徽章展示同步",e));
}

async function syncBadgeShowcaseToAllRelations(c){
  if(!c)return;
  const codes=[...new Set((c.roomCodes||[]).map(String))];
  for(const code of codes){
    try{
      let rr=relationshipSummaries?.[code];
      if(!rr){
        let rows=await api(`/test_rooms?code=eq.${encodeURIComponent(code)}&select=*`);
        rr=rows?.[0];
        if(rr)relationshipSummaries[code]=rr;
      }
      if(!rr)continue;
      let field=rr.host_char===c.id?"host_state":rr.guest_char===c.id?"guest_state":"";
      if(!field)continue;
      let body={};body[field]=publicState(c);
      await api(`/test_rooms?code=eq.${encodeURIComponent(code)}`,{
        method:"PATCH",
        headers:{"Prefer":"return=minimal"},
        body:JSON.stringify(body)
      });
    }catch(e){console.warn("徽章跨關係同步失敗",code,e)}
  }
}
function renderProfileBadgeSlots(c){
  ensureProfileBadgeSlots(c);
  let box=document.getElementById("profileBadgeSlots");if(!box)return;
  let defs=allBadgeDefs();
  let slots=[...c.profileBadges];
  while(slots.length<3)slots.push("");
  box.innerHTML=slots.map(id=>{
    if(!id)return '<div class="profileBadgeSlot empty">＋</div>';
    let b=defs[id];
    if(!b)return '<div class="profileBadgeSlot empty">？</div>';
    return `<div class="profileBadgeSlot"><div class="profileBadgeSlotIcon">${b.icon||"🏅"}</div><div class="profileBadgeSlotName">${esc(b.name||"徽章")}</div></div>`;
  }).join("");
}
function renderBadges(c){
 ensureBadges();
 ensureProfileBadgeSlots(c);
 let box=document.getElementById("badgeList");
 let defs=allBadgeDefs();
 let ownedIds=Object.keys(local.sharedBadges||{}).filter(id=>!!local.sharedBadges[id]);
 if(box){
   if(!ownedIds.length){
     box.innerHTML='<div class="badgeCabinetEmpty">目前還沒有取得任何徽章。</div>';
   }else{
     box.innerHTML=ownedIds.map(id=>{
       let b=defs[id]||{icon:"🏅",name:"限定徽章",desc:"徽章資料載入中",rarity:"限定"};
       let eq=c.equippedBadge===id;
       let inProfile=c.profileBadges?.includes(id);
       return `<div class="badgeCard owned">
         <div class="badgeIcon">${esc(b.icon||"🏅")}</div>
         <b>${esc(b.name||"徽章")}</b>
         ${b.rarity?`<span class="chip">${esc(b.rarity)}</span>`:""}
         <div class="small">${esc(b.desc||"")}</div>
         <button data-badge="${esc(id)}" ${eq?"disabled":""}>${eq?"主徽章":"設為主徽章"}</button>
         <button data-profile-badge="${esc(id)}">${inProfile?"移出個人展示":"加入個人展示"}</button>
       </div>`;
     }).join("");
   }
 } let disp=document.getElementById("equippedBadge"),b=allBadgeDefs()[c.equippedBadge];
 if(disp){if(b&&local.sharedBadges?.[c.equippedBadge]){disp.textContent=`${b.icon} ${b.name}`;disp.classList.remove("hidden")}else disp.classList.add("hidden")}
 let show=document.getElementById("profileBadgeShowcase");
 if(show){
   if(b&&local.sharedBadges?.[c.equippedBadge]){
     show.classList.remove("hidden");
     document.getElementById("profileBadgeIcon").textContent=b.icon||"🏅";
     document.getElementById("profileBadgeName").textContent=b.name||"徽章";
     document.getElementById("profileBadgeDesc").textContent=b.desc||"";
   }else show.classList.add("hidden");
 }
 renderProfileBadgeSlots(c);
 let owned=Object.keys(local.sharedBadges||{}).filter(id=>local.sharedBadges[id]).length;
 let cnt=document.getElementById("badgeCollectionCount");
 if(cnt)cnt.textContent=`已收藏 ${owned} 枚`;
 let status=document.getElementById("achievementBadgeDisplayStatus");
 if(status){
   let names=(c.profileBadges||[]).map(id=>defs[id]).filter(Boolean).map(b=>`${b.icon||"🏅"} ${b.name||"徽章"}`);
   status.textContent=names.length?`目前展示：${names.join("　")}`:"目前展示：尚未選擇徽章";
 }
}
function checkTopAll(c){
 let ids=["top_lover","top_friend","top_family","top_partner","top_rival","top_enemy"];
 if(ids.every(x=>c.achievements?.[x])){
   c.achievements.top_all=1;unlockBadge("badge_all");
 }
}
function ensureMeta(c){
 c.stats??={};c.seen??={};c.relationHistory??={};c.dailyLogin??={};c.equippedBadge??="";
 c.seen.relationAt??=0;c.seen.outingAt??=0;
}
function recordRelationHistory(c,code,from,to){
 ensureMeta(c);let h=c.relationHistory[code]??={first:from,types:[],changes:0};
 if(!h.types.includes(from))h.types.push(from);
 if(!h.types.includes(to))h.types.push(to);
 h.changes++;
 c.relationHistory[code]=h;
 if(from==="enemy"&&to==="lover")c.achievements.enemy_to_lover=1;
 if(from==="bestfriend"&&to==="lover")c.achievements.friend_to_lover=1;
 if(from==="partner"&&to==="bestfriend")c.achievements.partner_to_friend=1;
 if(from==="rival"&&to==="bestfriend")c.achievements.rival_to_friend=1;
 if(h.types.length>=3)c.achievements.relation_three_forms=1;
 if(h.changes>=2&&to===h.first)c.achievements.relation_return=1;
 if(h.types.length>=6)c.achievements.relation_all_six=1;
}
function handleDailyLogin(c){
 ensureMeta(c);let k=todayKey();if(c.dailyLogin.last===k)return;
 let now=new Date(),prev=c.dailyLogin.last?new Date(c.dailyLogin.last+"T00:00:00"):null;
 let diff=prev?Math.round((new Date(k+"T00:00:00")-prev)/86400000):99;
 c.dailyLogin.streak=diff===1?(c.dailyLogin.streak||0)+1:1;c.dailyLogin.last=k;
 if(c.dailyLogin.streak>=3)c.achievements.login3=1;if(c.dailyLogin.streak>=7)c.achievements.login7=1;if(c.dailyLogin.streak>=14)c.achievements.login14=1;
 c.money=(c.money||0)+(c.dailyLogin.streak%7===0?80:20);
 let events=[
  ["☀️","窗邊的好天氣","角色拉開窗簾，覺得今天似乎會有些好事發生。",5,0],
  ["🐦","意外的訪客","一隻小鳥停在窗邊看了很久。角色的心情變好了。",8,0],
  ["🪙","口袋裡的驚喜","整理衣服時找到幾枚忘記的硬幣。",0,35],
  ["🍞","剛好的早餐","今天的早餐特別合胃口。",3,0],
  ["🌿","慢下來的一刻","角色難得什麼都沒急著做，只是安靜休息了一會。",6,0]
 ];
 let seed=[...k+c.id].reduce((a,x)=>a+x.charCodeAt(0),0),ev=events[seed%events.length];
 c.mood=Math.min(100,(c.mood||80)+ev[3]);c.money=(c.money||0)+ev[4];
 c.dailyLogin.event={date:k,title:`${ev[0]} ${ev[1]}`,text:ev[2]};
 logJournal(c,`今日登入事件：${ev[1]}`,"✨");saveLocal();
 setTimeout(()=>{if(cur()?.id===c.id){infoTitle.textContent=ev[0]+" 今日的小事件";infoBody.innerHTML=`<b>${ev[1]}</b><p>${ev[2]}</p><div class="small">連續登入 ${c.dailyLogin.streak} 天・今日登入獎勵已領取。</div>`;infoModal.classList.remove("hidden")}},500);
}
function setNavDot(name,count){
 let el=document.querySelector(`[data-dot="${name}"]`);if(!el)return;
 if(count>0){el.textContent=count>99?"99+":String(count);el.classList.remove("hidden")}else el.classList.add("hidden");
}

function markRelationsSeen(){
 let c=cur();if(!c)return;ensureMeta(c);c.seen.relationAt=Date.now();saveLocal();setNavDot("relations",0);
}
function markOutingSeen(){
 let c=cur();if(!c)return;ensureMeta(c);c.seen.outingAt=Date.now();saveLocal();setNavDot("outing",0);
}
function markSectionSeen(name){
 let c=cur();if(!c)return;ensureMeta(c);c.seen[name]=Date.now();if(name==="shop")c.seen.shopDay=todayKey();if(name==="bag")c.seen.bagCount=Object.values(c.inventory||{}).reduce((a,b)=>a+b,0);if(name==="achievements")c.seen.achCount=Object.values(c.achievements||{}).filter(Boolean).length;saveLocal();refreshNavDots().catch(()=>{});
}
async function refreshNavDots(){
 let c=cur();if(!c)return;ensureMeta(c);
 try{
   let chatUnread=0,outingUnread=0;
   let relSince=Number(c.seen.relationAt||0),outSince=Number(c.seen.outingAt||0);
   for(let code of c.roomCodes||[]){
     // 外出紅點仍只計算新的外出邀請。
     let xs=await api(`/test_interactions?room_code=eq.${encodeURIComponent(code)}&to_char=eq.${encodeURIComponent(c.id)}&select=id,text,created_at&order=created_at.desc&limit=60`);
     xs.forEach(x=>{
       let t=String(x.text||""),ts=new Date(x.created_at).getTime();
       if(t.startsWith("OUTING_INVITE|")&&ts>outSince)outingUnread++;
     });

     // 關係紅點只看真正的聊天訊息。
     try{
       let ms=await api(`/test_messages?room_code=eq.${encodeURIComponent(code)}&select=from_char,created_at&order=created_at.desc&limit=60`);
       ms.forEach(msg=>{
         if(msg.from_char!==c.id&&new Date(msg.created_at).getTime()>relSince)chatUnread++;
       });
     }catch(e){}
   }
   setNavDot("relations",chatUnread);
   setNavDot("outing",outingUnread);
 }catch(e){console.warn("refreshNavDots",e)}
}
function revealedAchievementName(a){
  let r=hiddenAchievementReveal[a?.[0]];
  if(r)return `${r.icon} ${r.name}`;
  return achLabel(a);
}
function revealedAchievementDesc(a){
  let r=hiddenAchievementReveal[a?.[0]];
  if(r)return r.desc;
  return achCondition(a);
}
function achLabel(a){
  if(a.length>=5)return `${a[1]} ${a[2]}`;
  return a[1];
}
function achIsHidden(a){return achCategory(a)==="隱藏"}
function relationAchievementType(id){
  if(id==="lover"||id.startsWith("lover_"))return "lover";
  if(id==="friend"||id.startsWith("friend_"))return "bestfriend";
  if(id==="family"||id.startsWith("family_"))return "family";
  if(id==="partner"||id.startsWith("partner_"))return "partner";
  if(id==="rival"||id.startsWith("rival_"))return "rival";
  if(id==="enemy"||id.startsWith("enemy_"))return "enemy";
  return null;
}
function achievementHint(a,unlocked){
  if(unlocked)return achIsHidden(a)?revealedAchievementDesc(a):achCondition(a);
  if(achIsHidden(a))return achievementHints[a[0]]||"這是一個隱藏條件，多嘗試不同玩法吧。";
  return achievementHints[a[0]]||`提示：${achCondition(a)}`;
}


const DAILY_WORK_LIMIT=5;
const DAILY_OUTING_INVITE_LIMIT=10;

function ensureOutingInviteCounter(c){
  let k=localDateKey();
  if(!c.outingInviteDaily||c.outingInviteDaily.date!==k)c.outingInviteDaily={date:k,used:0};
  return c.outingInviteDaily;
}

const REST_COOLDOWN_MS=30*60*1000;
function restRemaining(c){
  let last=Number(c.lastRestAt||0);
  return Math.max(0,REST_COOLDOWN_MS-(Date.now()-last));
}
function restStatusText(c){
  let left=restRemaining(c);
  if(left<=0)return "可使用";
  let min=Math.ceil(left/60000);
  return `${min} 分後`;
}
function doQuickRest(){
  let c=cur();if(!c)return;
  let left=restRemaining(c);
  if(left>0)return toast(`🛋️ 還要 ${Math.ceil(left/60000)} 分鐘才能再次休息。`);
  let before=Math.floor(c.energy||0);
  c.energy=Math.min(100,(c.energy||0)+25);
  c.hunger=Math.max(0,(c.hunger||0)-4);
  c.lastRestAt=Date.now();
  let gained=Math.floor(c.energy)-before;
  logJournal(c,`休息了一下，體力恢復 ${gained}`,"🛋️");
  saveLocal();renderGame();
  infoTitle.textContent="🛋️ 休息了一下";
  infoBody.innerHTML=`稍微放空了一陣子，精神好多了。<br><br><b>⚡ 體力 +${gained}</b><br>🍙 飽食度 -4<br><span class="small">30 分鐘後可以再次休息。</span>`;
  infoModal.classList.remove("hidden");
}
function ensureWorkCounter(c){
  let k=localDateKey();
  if(!c.workDaily||c.workDaily.date!==k)c.workDaily={date:k,used:0};
  return c.workDaily;
}
function ensureRelationCounter(c,code){
  let k=localDateKey();
  c.relationDaily??={};
  let r=c.relationDaily[code];
  if(!r||r.date!==k)c.relationDaily[code]={date:k,used:0};
  return c.relationDaily[code];
}
const workDefs=[
  {id:"cafe",icon:"☕",name:"咖啡廳打工",min:55,max:85,energy:8,text:["今天客人很多，你一路忙到下班。","替客人端上甜點時，意外收到一句稱讚。","今天的拉花雖然有點歪，但總算平安下班。"]},
  {id:"store",icon:"🏪",name:"便利商店打工",min:45,max:75,energy:6,text:["補貨補到手有點痠，不過今天很順利。","遇到一位很客氣的常客，心情也跟著變好。","今天的收銀沒有出錯，平安結束一班。"]},
  {id:"street",icon:"🎤",name:"街頭表演",min:40,max:110,energy:12,text:["路人慢慢停下腳步，最後留下不少零錢。","今天觀眾不算多，但有個人聽完整場才離開。","表演到一半差點出錯，幸好最後救回來了。"]},
  {id:"temp",icon:"📦",name:"臨時工",min:60,max:100,energy:14,text:["搬了一下午東西，累得只想躺下。","工作比想像中提早結束，還多拿了一點工資。","雖然很累，但看到薪水時覺得值得了。"]},
  {id:"commission",icon:"🎨",name:"接小委託",min:50,max:120,energy:10,text:["今天的委託意外很合你的胃口。","改了幾次細節後，委託人終於滿意了。","這次接到一個有點奇怪、但報酬不錯的委託。"]}
];
function renderWork(c){
  let ctr=ensureWorkCounter(c),used=ctr.used||0,left=Math.max(0,DAILY_WORK_LIMIT-used);
  workLimit.innerHTML=`<b>今日剩餘次數：${left} / ${DAILY_WORK_LIMIT}</b><div class="small">打工次數每天 00:00 重置。每次會消耗少量體力。</div>`;
  workList.innerHTML=workDefs.map(w=>`<button class="workCard" data-work="${w.id}" ${left<=0||c.energy<w.energy?"disabled":""}><b>${w.icon} ${w.name}</b><span class="small">約 🪙${w.min}～${w.max}・體力 -${w.energy}</span></button>`).join("");
}
async function doWork(id){
  let c=cur(),w=workDefs.find(x=>x.id===id);if(!c||!w)return;
  resetDailyIfNeeded(c);
  let ctr=ensureWorkCounter(c);if((ctr.used||0)>=DAILY_WORK_LIMIT){
    infoTitle.textContent="💼 今天已經工作很多了";
    infoBody.innerHTML="每日最多打工 <b>5 次</b>，明天 00:00 會恢復。";
    infoModal.classList.remove("hidden");return;
  }
  if(c.energy<w.energy){
    infoTitle.textContent="⚡ 體力不足";
    infoBody.textContent="先讓角色休息一下再工作吧。";
    infoModal.classList.remove("hidden");return;
  }
  let earned=Math.floor(w.min+Math.random()*(w.max-w.min+1)),story=w.text[Math.floor(Math.random()*w.text.length)];
  // 10% 小幸運獎金
  let lucky=Math.random()<.1;
  if(lucky)earned+=30;
  ctr.used=(ctr.used||0)+1;
  c.money=(c.money||0)+earned;c.energy=Math.max(0,c.energy-w.energy);
  c.stats??={};c.stats.workCount=(c.stats.workCount||0)+1;c.stats.workEarned=(c.stats.workEarned||0)+earned;
  logJournal(c,`${w.name}，賺到 🪙${earned}`,"💼");
  saveLocal();renderGame();
  infoTitle.textContent=`${w.icon} ${w.name}`;
  infoBody.innerHTML=`${esc(story)}${lucky?"<br><br>🍀 今天運氣很好，多拿到了一點獎金！":""}<br><br><b>收入：🪙${earned}</b><br>⚡ 體力 -${w.energy}<br><span class="small">今日打工 ${ctr.used||0} / ${DAILY_WORK_LIMIT}</span>`;
  infoModal.classList.remove("hidden");
}
document.getElementById("workList").onclick=e=>{let b=e.target.closest("[data-work]");if(b&&!b.disabled)doWork(b.dataset.work)};


let achievementToastQueue=[],achievementToastBusy=false;
function achievementDisplayName(a){
  if(!a)return "未知成就";
  if(achIsHidden(a)&&hiddenAchievementReveal[a[0]])return revealedAchievementName(a);
  if(a.length>=5)return `${a[1]} ${a[2]}`;
  return a[1];
}
function enqueueAchievementToast(name){
  achievementToastQueue.push(name);runAchievementToastQueue();
}
function runAchievementToastQueue(){
  if(achievementToastBusy||!achievementToastQueue.length)return;
  achievementToastBusy=true;
  let name=achievementToastQueue.shift();
  let d=document.createElement("div");d.className="achievementToast";
  d.innerHTML=`<div class="achCup">🏆</div><div><b>成就解鎖！</b><div class="small">${esc(name)}</div></div>`;
  document.body.appendChild(d);
  setTimeout(()=>{d.remove();achievementToastBusy=false;runAchievementToastQueue()},3000);
}
function prepareAchievementNotifications(c){
  ensureSharedAchievements();
  if(!local.sharedAchievementNoticeReady){
    Object.keys(local.sharedAchievements||{}).forEach(k=>{if(local.sharedAchievements[k])local.sharedAchievementNotified[k]=1});
    local.sharedAchievementNoticeReady=true;
    saveLocal();
  }
}
function notifyNewAchievements(c){
  ensureSharedAchievements();
  let changed=false;
  Object.entries(local.sharedAchievements||{}).forEach(([id,done])=>{
    if(done&&!local.sharedAchievementNotified[id]){
      local.sharedAchievementNotified[id]=1;changed=true;
      enqueueAchievementToast(achievementDisplayName(protoAch.find(a=>a[0]===id)));
    }
  });
  if(changed)saveLocal();
}
function reconcileAchievements(c){
 ensureSharedAchievements();c.achievements=local.sharedAchievements;c.stats??={};c.achievements.start=1;
 if(day(c)>=7)c.achievements.week=1;if(day(c)>=30)c.achievements.month=1;
 let pc=Math.max(c.purchaseCount||0,c.stats.purchases||0);
 if(pc>=1)c.achievements.shop=1;if(pc>=5)c.achievements.shop5=1;
 if((c.memories?.length||0)>=10)c.achievements.memory10=1;
 [["msg1","messages",1],["msg10","messages",10],["msg50","messages",50],
  ["interact1","relationshipEvents",1],["interact10","relationshipEvents",10],["interact50","relationshipEvents",50],
  ["outingTogether","outingTogether",1],["outing5","outingTogether",5],
  ["work1","workCount",1],["work10","workCount",10],["earn1000","workEarned",1000]]
 .forEach(([a,k,n])=>{if((c.stats[k]||0)>=n)c.achievements[a]=1});
 let relTypes=(c.roomCodes||[]).map(code=>relationshipSummaries?.[code]?.relation).filter(Boolean);
 if(relTypes.length)c.achievements.relation=1;
 let uniqueRelTypes=new Set(relTypes);
 if(uniqueRelTypes.size>=3)c.achievements.rel3types=1;
 if(uniqueRelTypes.size>=5)c.achievements.rel5types=1;
 if(uniqueRelTypes.size>=6)c.achievements.rel6types=1;
 delete c.achievements.three;

 // Hidden romance achievements are checked from both linked character states.
 (c.roomCodes||[]).forEach(code=>{
   let rr=relationshipSummaries?.[code];if(!rr||rr.relation!=="lover")return;
   let a=rr.host_state,b=rr.guest_state;
   if(a?.gender==="male"&&b?.gender==="male")c.achievements.gaylove=1;
   if(a?.gender==="female"&&b?.gender==="female")c.achievements.girllove=1;
 });
 let mp={lover:"lover",bestfriend:"friend",family:"family",partner:"partner",rival:"rival",enemy:"enemy"};
 relTypes.forEach(t=>{if(mp[t])c.achievements[mp[t]]=1});
 let infos=(c.roomCodes||[]).map(code=>({rr:relationshipSummaries?.[code],b:bondCache?.[code]})).filter(x=>x.rr&&x.b);
 let mx=infos.reduce((m,x)=>Math.max(m,Number(x.b.lv||1)),1);
 [[5,"bond5"],[10,"bond10"],[15,"bond15"],[20,"bond20"],[25,"bond25"],[26,"bond6"],[30,"bondmax"]].forEach(([n,a])=>{if(mx>=n)c.achievements[a]=1});
 infos.forEach(x=>{let p=mp[x.rr.relation],st=Number(x.b.stage||0);if(p&&st>=2)c.achievements[p+"_stage3"]=1;if(p&&st>=5)c.achievements[p+"_stage6"]=1});
}


function renderJournal(c){
  let el=document.getElementById("journalList");if(!el||!c)return;
  c.journal??={};let arr=c.journal[todayKey()]||[];
  el.innerHTML=arr.length?arr.map(x=>`<div class="itemRow"><b>${esc(x.icon||"📝")} ${esc(x.text||"")}</b><div class="small">${esc(x.time||"")}</div></div>`).join(""):'<div class="muted">今天還沒有生活紀錄。</div>';
}
function renderShop(c){
  let sl=document.getElementById("shopList");
  if(!sl||!c)return;
  sl.innerHTML="";
  sl.className="itemGrid";
  sl.style.display="grid";

  let items=[];
  try{items=shopItemsToday()||[]}catch(e){
    console.warn("shopItemsToday failed",e);
    items=[...standardShop];
    toast("特殊商品載入失敗，已先顯示普通商品。",3200);
  }

  if(!items.length){
    let empty=document.createElement("div");
    empty.className="muted";
    empty.textContent="今天暫時沒有商品。";
    sl.appendChild(empty);
  }else{
    items.forEach(i=>{
      let sold=false;
      try{sold=isSpecialSoldOut(c,i)}catch(e){}
      let parts=String(i.n||"🎁 商品").split(" ");
      let ico=parts.shift()||"🎁",name=parts.join(" ")||String(i.n||"商品");

      let btn=document.createElement("button");
      btn.className="tile";
      btn.type="button";
      btn.dataset.shop=i.id;
      btn.disabled=!!sold;

      let icon=document.createElement("div");
      icon.className="ico";
      icon.textContent=ico;

      let title=document.createElement("b");
      title.textContent=name;

      let meta=document.createElement("div");
      meta.className="small";
      meta.textContent=sold
        ?"🚫 售罄"
        :`${i.type==="special"?"✨ 今日特別・":i.type==="breakthrough"?"🌟 頂級突破・":""}🪙${Number(i.p||0)}${i.desc?`・${i.desc}`:""}`;

      btn.append(icon,title,meta);
      sl.appendChild(btn);
    });
  }

  renderAffectionGiftShop(c);
  let st=document.getElementById("specialShopStatus");
  if(st){
    try{
      let ss=ensureDailySpecialState(c);
      st.textContent=ss.forced
        ?"✨ 今日新品保底：優先出現 2 件尚未購買的特殊收藏品。"
        :(ss.streak>0
          ?`📦 已連續 ${ss.streak} 天出現售罄商品；連續 3 天後，隔日觸發新品保底。`
          :"每日隨機 2 件特殊收藏品；已買過的會永久顯示售罄。");
    }catch(e){
      console.warn("special shop status failed",e);
      st.textContent="每日商品已更新。";
    }
  }
}

function renderAffectionGiftShop(c){
  let box=document.getElementById("affectionGiftList");if(!box||!c)return;
  box.innerHTML=affectionGiftShop.map(i=>{
    let parts=String(i.n).split(" "),ico=parts.shift(),name=parts.join(" ");
    return `<button class="tile affectionGiftTile" data-shop="${esc(i.id)}">
      <div class="ico">${esc(ico)}</div><b>${esc(name)}</b>
      <div class="small">💗 +${Number(i.affinity||1)}・🪙${Number(i.p||0)}</div>
    </button>`;
  }).join("");
}
function renderExtras(c){
 safeCall(()=>handleDailyLogin(c),"每日登入");
 // 3.26.6: nav dots are background work, not a render blocker.
 setTimeout(()=>refreshNavDots().catch(e=>console.warn("red dots",e)),0);
 safeCall(()=>renderRelationTransform(c),"關係轉變");
 safeCall(()=>prepareAchievementNotifications(c),"成就通知");
 safeCall(()=>reconcileAchievements(c),"成就同步");
 safeCall(()=>renderDailyTasks(c),"每日任務");
 safeCall(()=>renderWork(c),"打工");
 safeCall(()=>renderJournal(c),"生活日誌");
 safeCall(()=>renderShop(c),"商店");
 let bl=document.getElementById('bagList');if(bl){let a=Object.entries(c.inventory).filter(x=>x[1]>0);bl.className=a.length?"itemGrid":"";bl.innerHTML=a.length?a.map(([id,n])=>{let i=protoShop.find(x=>x.id===id);let ni=NPC_ITEM_EFFECTS?.[id];let nm=i?.n||ni?.name||id;return `<button class="tile" data-bag="${id}"><div class="ico">${nm.split(" ")[0]||"🎁"}</div><b>${nm.includes(" ")?nm.substring(nm.indexOf(" ")+1):nm}</b><div class="small">×${n}</div></button>`}).join(''):'<div class="muted">背包目前是空的。</div>'}
 let ml=document.getElementById('memoryList');if(ml)ml.innerHTML=c.memories.length?c.memories.map(x=>`<div class="itemRow"><b>${x.t}</b><div class="small">${x.d}</div></div>`).join(''):'<div class="muted">還沒有特殊回憶。</div>';
 if(day(c)>=7)c.achievements.week=1;if(day(c)>=30)c.achievements.month=1;c.achievements.start=1;if((c.stats?.workCount||0)>=1)c.achievements.work1=1;if((c.stats?.workCount||0)>=10)c.achievements.work10=1;if((c.stats?.workEarned||0)>=1000)c.achievements.earn1000=1;if(c.roomCodes.length)c.achievements.relation=1;if(c.roomCodes.length>=3)c.achievements.three=1;
 if((c.stats?.messages||0)>=1)c.achievements.msg1=1;if((c.stats?.messages||0)>=10)c.achievements.msg10=1;if((c.stats?.messages||0)>=50)c.achievements.msg50=1;
 if((c.stats?.giftsSent||0)>=1)c.achievements.gift1=1;if((c.stats?.giftsSent||0)>=10)c.achievements.gift10=1;
 if((c.stats?.syncBestStreak||0)>=3)c.achievements.sync3=1;
 if((c.stats?.interactions||0)>=1)c.achievements.interact1=1;if((c.stats?.interactions||0)>=10)c.achievements.interact10=1;if((c.stats?.interactions||0)>=50)c.achievements.interact50=1;
 let relTypes=(c.roomCodes||[]).map(code=>relationshipSummaries?.[code]?.relation).filter(Boolean);if(relTypes.includes("lover"))c.achievements.lover=1;if(relTypes.includes("bestfriend"))c.achievements.friend=1;if(relTypes.includes("family"))c.achievements.family=1;if(relTypes.includes("partner"))c.achievements.partner=1;if(relTypes.includes("rival"))c.achievements.rival=1;if(relTypes.includes("enemy"))c.achievements.enemy=1;
 let infos=(c.roomCodes||[]).map(code=>({code,rr:relationshipSummaries?.[code],b:bondCache?.[code]})).filter(x=>x.rr&&x.b);
 let maxBond=infos.reduce((m,x)=>Math.max(m,x.b.lv||1),1);
 if(maxBond>=5)c.achievements.bond5=1;if(maxBond>=10)c.achievements.bond10=1;if(maxBond>=15)c.achievements.bond15=1;if(maxBond>=20)c.achievements.bond20=1;if(maxBond>=25)c.achievements.bond25=1;if(maxBond>=26)c.achievements.bond6=1;if(maxBond>=30)c.achievements.bondmax=1;
 infos.forEach(x=>{let st=x.b.stage||0,t=x.rr.relation;if(t==="lover"&&st>=2)c.achievements.lover_stage3=1;if(t==="lover"&&st>=5)c.achievements.lover_stage6=1;if(t==="bestfriend"&&st>=2)c.achievements.friend_stage3=1;if(t==="bestfriend"&&st>=5)c.achievements.friend_stage6=1;if(t==="family"&&st>=2)c.achievements.family_stage3=1;if(t==="family"&&st>=5)c.achievements.family_stage6=1;if(t==="partner"&&st>=2)c.achievements.partner_stage3=1;if(t==="partner"&&st>=5)c.achievements.partner_stage6=1;if(t==="rival"&&st>=2)c.achievements.rival_stage3=1;if(t==="rival"&&st>=5)c.achievements.rival_stage6=1;if(t==="enemy"&&st>=2)c.achievements.enemy_stage3=1;if(t==="enemy"&&st>=5)c.achievements.enemy_stage6=1});
 if((c.stats?.relationshipEvents||0)>=1)c.achievements.interact1=1;if((c.stats?.relationshipEvents||0)>=10)c.achievements.interact10=1;if((c.stats?.relationshipEvents||0)>=50)c.achievements.interact50=1;if((c.stats?.outingTogether||0)>=1)c.achievements.outingTogether=1;if((c.stats?.outingTogether||0)>=5)c.achievements.outing5=1;if(c.memories.length>=10)c.achievements.memory10=1;if(!c.roomCodes.length&&c.mood>=90)c.achievements.solo=1;
 notifyNewAchievements(c);
 let f=document.getElementById("achievementFilters");if(f){
   let fs=["全部","角色","生活","關係","收藏","節日","活動","隱藏"];
   f.className="achievementCategoryTabs";
   f.innerHTML=fs.map(x=>`<button type="button" class="achievementCategoryTab ${achievementFilter===x?"active":""}" data-af="${x}">${x}</button>`).join("");
 }
 let al=document.getElementById('achievementList');if(al){
   let ownedTypes=new Set((c.roomCodes||[]).map(code=>relationshipSummaries?.[code]?.relation).filter(Boolean));
   let view=protoAch.filter(a=>{
     let cat=achCategory(a);
     if(achievementFilter!=="全部"&&cat!==achievementFilter)return false;
     if(cat==="關係"){
       let rt=relationAchievementType(a[0]);
       if(rt&&!ownedTypes.has(rt)&&!c.achievements[a[0]])return false;
     }
     return true;
   });
   al.innerHTML=view.map(a=>{
     let ok=!!c.achievements[a[0]],hidden=achIsHidden(a)&&!ok;
     let display=hidden?"？？？":(achIsHidden(a)&&ok?revealedAchievementName(a):achLabel(a));
     return `<div class="itemRow ${ok?"achDone":""}" data-ach="${a[0]}"><b>${ok?"🏆":"🔒"} ${display}</b><span class="chip">${achCategory(a)}</span><div class="achHint">${ok?("✅ "+esc(achievementHint(a,true))):("💡 "+esc(achievementHint(a,false)))}</div></div>`;
   }).join('');
 }
 renderJournal(c);renderOuting(c);
}


function openOutingBondEvent(placeId){
  let c=cur(),pl=places.find(x=>x[0]===placeId);
  let rr=relationshipSummaries?.[activeRoomCode]||room;
  let other=rr?(rr.host_char===c?.id?rr.guest_state:rr.host_state):partner;
  let name=other?.name||"對方";
  const pool={
    park:[
      ["🌿 並肩散步",`你和${name}沿著公園慢慢走了一圈。沒有特別趕著去哪裡，反而聊了不少平常沒說出口的小事。`,5],
      ["🪑 長椅休息",`你們在長椅坐了一會兒，偶爾說話、偶爾安靜。這種不需要刻意找話題的時間也很舒服。`,4]
    ],
    cafe:[
      ["☕ 同桌時光",`${name}坐在你對面，飲料慢慢見底，話題卻一直沒有停。`,5],
      ["🍰 分享甜點",`你們把桌上的甜點分著吃，意外發現彼此記住了對方不少小習慣。`,4]
    ],
    bookstore:[
      ["📚 書架之間",`你和${name}各自挑了幾本書，又忍不住交換彼此剛看到的有趣內容。`,4]
    ],
    street:[
      ["🛍️ 隨意逛逛",`你和${name}沒有特別要買什麼，只是一間店接著一間店地逛，時間一下就過去了。`,4]
    ],
    cinema:[
      ["🎬 散場之後",`電影結束後，你和${name}一路討論著剛才的劇情，連回去的路都顯得短了一點。`,5]
    ],
    river:[
      ["🌙 河堤晚風",`你和${name}沿著河堤走著。風有點涼，但兩個人都沒有急著回去。`,5]
    ]
  };
  let arr=pool[placeId]||[["🗺️ 共同外出",`你和${name}一起度過了一段不錯的外出時間。`,4]];
  let ev=arr[Math.floor(Math.random()*arr.length)];
  infoTitle.textContent=ev[0];
  infoBody.innerHTML=`${esc(ev[1])}<br><br><b>💗 共同羈絆 +${ev[2]}</b>`;
  infoModal.classList.remove("hidden");
  if(activeRoomCode){
    let base=bondCache[activeRoomCode]||bondInfoFromCount(activeRoomCode,0);
    base.count=(base.count||0)+ev[2];
    bondCache[activeRoomCode]=bondInfoFromCount(activeRoomCode,base.count);
  }
}
function renderOuting(c){
  let el=document.getElementById("placeList");
  if(el)el.innerHTML=places.map(x=>`<button data-place="${x[0]}">${x[1]} ${x[2]}</button>`).join("");
  let ctr=ensureOutingInviteCounter(c),left=Math.max(0,DAILY_OUTING_INVITE_LIMIT-(ctr.used||0));
  let lim=document.getElementById("outingInviteLimit");
  if(lim)lim.innerHTML=`<b>💌 今日可發出邀約：${left} / ${DAILY_OUTING_INVITE_LIMIT}</b><div class="small">只計算你主動發出的外出邀請；每天 00:00 重置。自己外出與接受別人的邀約不計次數。</div>`;
  renderInvites(c);
}
async function renderInvites(c){
  let el=document.getElementById("outingInvites");
  if(!el)return;
  let all=[];
  for(let code of c.roomCodes||[]){
    try{
      let xs=await api(`/test_interactions?room_code=eq.${encodeURIComponent(code)}&to_char=eq.${encodeURIComponent(c.id)}&select=*&order=created_at.desc&limit=20`);
      xs.filter(x=>String(x.text||"").startsWith("OUTING_INVITE|")).forEach(x=>all.push({...x,code:String(code)}));
    }catch(e){console.warn("outing invites",code,e)}
  }
  el.innerHTML=all.length?all.map(x=>{
    let q=String(x.text||"").split("|"),pl=places.find(p=>p[0]===q[1]);
    return `<div class="itemRow"><b>💌 ${pl?.[2]||"外出"}邀請</b><div class="small">對方已完成自己的選擇，接受後輪到你選。</div><button data-accept="${x.id}" data-code="${x.code}" data-place="${q[1]}">接受</button> <button data-decline="${x.id}">婉拒</button></div>`;
  }).join(""):'<div class="muted">目前沒有等待回覆的邀請。</div>';
}
function checkCombo(c){ensureSharedAchievements();c.achievements=local.sharedAchievements;let h=id=>(c.inventory[id]||0)>0,hit=null;if(h('lamp')&&h('novel')&&!c.achievements.read)hit=['read','📖 特殊劇情・夜讀時光','暖黃色的小夜燈亮起來後，房間突然變得很適合讀完那本小說。'];else if(h('picnic')&&h('cake')&&h('flowers')&&!c.achievements.picnic)hit=['picnic','🌼 特殊劇情・午後的小旅行','野餐籃、蛋糕和花束湊在一起。角色決定把今天變成一場小旅行。'];else if(h('oldkey')&&h('letter')&&h('dryflower')&&!c.achievements.secret)hit=['secret','🔐 ？？？特殊劇情','舊鑰匙壓在泛黃信紙上，乾燥花從紙頁間滑落——這三樣東西原來彼此有關。'];if(hit){c.achievements[hit[0]]=1;c.memories.unshift({t:hit[1],d:new Date().toLocaleDateString('zh-TW')});saveLocal();alert(hit[1]+'\n\n'+hit[2]);renderGame()}}
function openItem(i,mode){
 let c=cur(),owned=c.inventory[i.id]||0;
 itemTitle.textContent=i.n;
 let special=i.type==="special",breakthrough=i.type==="breakthrough";
 let affinityGift=i.type==="affectionGift";
 let effectText=i.effect==="energy"?`⚡ 使用後體力 +${Number(i.restore||18)}`
   :i.effect==="hunger"?`🍙 使用後飽食度 +${Number(i.restore||22)}`
   :i.effect==="mood"?`🌸 使用後心情 +${Number(i.restore||10)}`
   :"";
 itemBody.innerHTML=`<div class="small">持有：${owned}${mode==="shop"?`・價格 🪙${i.p}`:""}</div>
 ${effectText?`<p><b>${effectText}</b></p>`:""}
 ${affinityGift?`<p>🎁 好感禮物。成功送給關係人後，共同羈絆 <b>+${Number(i.affinity||1)}</b>。自己不能使用。</p>`:""}
 ${special?`<p>✨ 特殊收藏品。可能與「${i.story}」的劇情有關；不會被普通使用消耗。</p>`:""}
 ${breakthrough?`<p>🌟 頂級突破道具：用於「${relationLabel(i.rel)}」Lv.30 MAX，突破後成為「${i.topTitle}」。雙方只需其中一人使用。</p>`:""}`;
 let soldOut=mode==="shop"&&special&&owned>0;
 let label=soldOut?"售罄":mode==="shop"?"購買":special?"🔎 查看／研究":breakthrough?"🌟 使用突破道具":"使用";
 itemActions.innerHTML=`<button class="primary" id="itemDo" ${soldOut?"disabled":""}>${label}</button>`;
 itemModal.classList.remove("hidden");
 itemDo.onclick=()=>{
  let c=cur();ensureMeta(c);
  if(mode==="shop"){
   if(i.type==="special"&&(c.inventory?.[i.id]||0)>0){
     itemBody.innerHTML=`<div class="small">持有：1</div><p>🚫 這件特殊收藏品已經購買過，現在是售罄狀態。</p>`;
     itemActions.innerHTML=`<button disabled>售罄</button>`;
     return;
   }
   if(c.money<i.p)return alert("金幣不夠。");
   c.money=safeMoney((c.money||0)-(i.p));c.inventory??={};c.inventory[i.id]=(c.inventory[i.id]||0)+1;
   if(i.type==="special"&&c.specialShopState?.date===todayKey()&&c.specialShopState.ids?.includes(i.id)){
     c.specialShopState.hadSoldOut=true;
     // Buying today's item creates a sold-out situation for this same day's rotation.
     // Only count the day once; streak is finalized/stored on this date.
     c.specialShopState.streak=Math.max(1,Number(c.specialShopState.priorStreak||0)+1);
   }
   c.achievements.shop=1;c.purchaseCount=(c.purchaseCount||0)+1;c.stats??={};c.stats.purchases=(c.stats.purchases||0)+1;
   if(c.purchaseCount>=5)c.achievements.shop5=1;logJournal(c,`買了${i.n}`,"🛍️");
   saveLocal();itemModal.classList.add("hidden");safeRenderGame();checkCombo(c);refreshNavDots();return;
  }
  if(!(c.inventory[i.id]>0))return;
  if(i.type==="affectionGift")return toast("🎁 好感禮物要到「關係」頁送給關係人，不能自己使用。");
  if(special){itemBody.innerHTML+=`<div class="itemRow">你仔細研究了${i.n}。它似乎不是單獨使用的東西，也許要和其他特殊收藏品一起準備……</div>`;checkCombo(c);return}
  if(breakthrough){
    let rr=relationshipSummaries?.[activeRoomCode],b=bondCache?.[activeRoomCode];
    if(!rr||!room||rr.relation!==i.rel)return toast(`請先開啟一段「${relationLabel(i.rel)}」關係再使用這件道具。`);
    if(!b?.max)return toast("這段共同羈絆還沒有到 Lv.30 MAX。");
    if(b?.broken)return toast("這段關係已經完成頂級突破。");
    if(!confirm(`要消耗「${i.n}」讓這段關係突破成「${i.topTitle}」嗎？\n\n只需要其中一位玩家使用，雙方都會同步完成突破。`))return;
    (async()=>{
      try{
        await api("/test_interactions",{method:"POST",body:JSON.stringify({
          room_code:room.code,from_char:c.id,to_char:room.host_char===c.id?room.guest_char:room.host_char,
          text:`RELATION_BREAK|${i.rel}|${i.topTitle}`
        })});
        c.inventory[i.id]--;c.achievements.break=1;c.achievements[topRelations[i.rel].ach]=1;unlockBadge(topRelations[i.rel].badge);checkTopAll(c);
        addMemory(c,`🌟 頂級突破・${i.topTitle}`,`與${partner?.name||"對方"}的${relationLabel(i.rel)}關係抵達最終階段。`);
        logJournal(c,`與${partner?.name||"對方"}完成頂級突破「${i.topTitle}」`,"🌟");
        saveLocal();itemModal.classList.add("hidden");await refreshBond(room.code);safeRenderGame();
        infoTitle.textContent="🌟 頂級關係突破！";
        infoBody.innerHTML=`與 <b>${esc(partner?.name||"對方")}</b> 的關係突破為<br><h2>${esc(i.topTitle)}</h2><div class="small">雙方共享突破結果，並已解鎖頂級專屬互動。</div>`;
        infoModal.classList.remove("hidden");
      }catch(err){toast("頂級突破失敗："+(err?.message||"請稍後再試"))}
    })();
    return;
  }
  c.inventory[i.id]--;
  if(i.effect==="energy")c.energy=Math.min(100,(c.energy||0)+Number(i.restore||18));
  else if(i.effect==="hunger")c.hunger=Math.min(100,(c.hunger||0)+Number(i.restore||22));
  else if(i.effect==="mood")c.mood=Math.min(100,(c.mood||0)+Number(i.restore||10));
  logJournal(c,`使用了${i.n}`,"🎒");saveLocal();itemModal.classList.add("hidden");safeRenderGame();refreshNavDots();
 }
};




document.getElementById("achievementFilters")?.addEventListener("click",e=>{
  const b=e.target.closest("[data-af]");
  if(!b)return;
  e.preventDefault();
  e.stopPropagation();
  achievementFilter=b.dataset.af||"全部";
  const c=cur();
  if(c)renderGame();

  // Switching category always starts from the top of that category,
  // while the achievement sheet itself never moves horizontally.
  const list=document.getElementById("achievementList");
  if(list)list.scrollTop=0;
});

document.getElementById("closePersonalResult")?.addEventListener("click",()=>document.getElementById("personalResultModal")?.classList.add("hidden"));
document.getElementById("personalResultOk")?.addEventListener("click",()=>document.getElementById("personalResultModal")?.classList.add("hidden"));
document.getElementById("personalResultModal")?.addEventListener("click",e=>{if(e.target.id==="personalResultModal")e.currentTarget.classList.add("hidden")});

document.getElementById("closeItem").onclick=()=>document.getElementById("itemModal").classList.add("hidden");
document.getElementById("itemModal").onclick=e=>{
  if(e.target.id==="itemModal")document.getElementById("itemModal").classList.add("hidden");
};

document.getElementById("shopList")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-shop]");if(!b)return;
  let item=protoShop.find(x=>x.id===b.dataset.shop);
  if(!item)return toast("找不到這個商品，請重新整理商店。");
  try{openItem(item,"shop")}catch(err){console.error("shop open",err);toast("商店暫時無法開啟："+(err?.message||"未知錯誤"))}
});

document.getElementById("affectionGiftList")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-shop]");if(!b)return;
  let item=affectionGiftShop.find(x=>x.id===b.dataset.shop) || protoShop.find(x=>x.id===b.dataset.shop);
  if(!item)return toast("找不到這個好感禮物，請重新整理商店。");
  try{openItem(item,"shop")}catch(err){
    console.error("affection gift open",err);
    toast("好感禮物暫時無法購買："+(err?.message||"未知錯誤"));
  }
});
document.getElementById("bagList")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-bag]");if(!b)return;
  let id=b.dataset.bag;
  if(NPC_ITEM_EFFECTS?.[id]){useNpcShopItem(id);return;}
  let item=protoShop.find(x=>x.id===id);
  if(!item)return toast("找不到這個背包物品。");
  try{openItem(item,"bag")}catch(err){console.error("bag open",err);toast("背包物品暫時無法開啟："+(err?.message||"未知錯誤"))}
});

document.getElementById("chatRelationList")?.addEventListener("click",e=>{let b=e.target.closest("[data-chatroom]");if(b)loadRoom(b.dataset.chatroom)});
let pendingOutingPlace=null;
document.getElementById("placeList").onclick=e=>{
 let b=e.target.closest("[data-place]");if(!b)return;let c=cur(),pl=places.find(x=>x[0]===b.dataset.place);if(!pl)return toast("找不到這個外出地點");pendingOutingPlace=pl;
 let ctr=ensureOutingInviteCounter(c),left=Math.max(0,DAILY_OUTING_INVITE_LIMIT-(ctr.used||0));
 let ps=[];if(left>0){for(let code of c.roomCodes||[]){let rr=relationshipSummaries?.[code],o=rr?(rr.host_char===c.id?rr.guest_state:rr.host_state):null;if(o&&isOnlineState(o))ps.push({name:o.name,code})}}
 outingChoiceTitle.textContent=`${pl[1]} ${pl[2]}`;
 outingChoiceBody.innerHTML=`<div class="small">選擇外出方式・今日邀約剩餘 ${left}/${DAILY_OUTING_INVITE_LIMIT}</div><div class="outingChoiceList"><button data-selfout>🚶 自己去</button>${ps.map(x=>`<button data-invite="${x.code}">💌 邀請 ${esc(x.name)}</button>`).join("")}</div>${left<=0?'<div class="small" style="margin-top:10px">今天已經發出 10 次外出邀約，明天 00:00 恢復。</div>':(ps.length?"":'<div class="small" style="margin-top:10px">目前沒有在線的關係角色可以邀約。</div>')}`;
 outingChoiceModal.classList.remove("hidden");
};
closeOutingChoice.onclick=()=>outingChoiceModal.classList.add("hidden");
outingChoiceBody.onclick=async e=>{
 let c=cur(),pl=pendingOutingPlace;if(!c||!pl)return;
 if(e.target.closest("[data-selfout]")){outingChoiceModal.classList.add("hidden");c.mood=Math.min(100,c.mood+5);logJournal(c,`自己去了${pl[2]}`,pl[1]);c.memories.unshift({t:`去了${pl[2]}`,d:new Date().toLocaleDateString("zh-TW")});saveLocal();renderGame();toast(`去了${pl[2]}，心情 +5`);return}
 let ib=e.target.closest("[data-invite]");if(ib){
   let octr=ensureOutingInviteCounter(c);
   if((octr.used||0)>=DAILY_OUTING_INVITE_LIMIT)return toast("💌 今天已經發出 10 次外出邀約，明天 00:00 再來吧。");
   let code=ib.dataset.invite,rr=relationshipSummaries?.[code],to=rr?(rr.host_char===c.id?rr.guest_char:rr.host_char):null;if(!to)return toast("找不到邀約對象");
   outingChoiceBody.dataset.code=code;outingChoiceBody.dataset.to=to;
   outingChoiceBody.innerHTML=`<b>${pl[1]} ${pl[2]}・你的選擇</b><div class="small">你先選完，邀請才會送給對方。</div><div class="outingChoiceList"><button data-sendchoice="relax">🌿 悠閒走走</button><button data-sendchoice="talk">💬 想好好聊聊</button><button data-sendchoice="surprise">🎁 準備小驚喜</button></div>`;return}
 let sb=e.target.closest("[data-sendchoice]");if(sb){let code=outingChoiceBody.dataset.code,to=outingChoiceBody.dataset.to;if(!code||!to)return;
   let octr=ensureOutingInviteCounter(c);
   if((octr.used||0)>=DAILY_OUTING_INVITE_LIMIT)return toast("💌 今天已經發出 10 次外出邀約，明天 00:00 再來吧。");
   let rr=relationshipSummaries?.[code],other=rr?(rr.host_char===c.id?rr.guest_state:rr.host_state):null;
   if(!isOnlineState(other))return toast("對方目前已離線，這次邀約沒有送出。");
   try{
     await api("/test_interactions",{method:"POST",body:JSON.stringify({room_code:code,from_char:c.id,to_char:to,text:`OUTING_INVITE|${pl[0]}|${sb.dataset.sendchoice}|${Date.now()}`})});
     octr.used=(octr.used||0)+1;
     outingChoiceModal.classList.add("hidden");logJournal(c,`發出${pl[2]}邀請`,pl[1]);saveLocal();renderOuting(c);
     toast(`💌 邀約已送出・今日剩餘 ${Math.max(0,DAILY_OUTING_INVITE_LIMIT-octr.used)}/${DAILY_OUTING_INVITE_LIMIT}`);
     await renderInvites(c)
   }
   catch(err){toast("邀約送出失敗："+(err?.message||"請稍後再試"))}
 }
};
let pendingAcceptedOuting=null;
document.getElementById("outingInvites").onclick=async e=>{
 let c=cur();
 if(e.target.dataset.accept){let id=e.target.dataset.accept,code=e.target.dataset.code,pid=e.target.dataset.place,pl=places.find(x=>x[0]===pid);pendingAcceptedOuting={id,code,pid,pl};
   outingChoiceTitle.textContent=`💌 ${pl?.[2]||"外出"}邀請`;
   outingChoiceBody.innerHTML=`<div class="small">對方已經選完，現在輪到你。</div><div class="outingChoiceList"><button data-reply="relax">🌿 一起悠閒走走</button><button data-reply="talk">💬 趁機聊聊</button><button data-reply="surprise">✨ 配合驚喜</button></div>`;outingChoiceModal.classList.remove("hidden");return}
 if(e.target.dataset.decline){await api(`/test_interactions?id=eq.${e.target.dataset.decline}`,{method:"DELETE"});toast("已婉拒這次外出邀請");renderGame()}
};
outingChoiceBody.addEventListener("click",async e=>{
 let b=e.target.closest("[data-reply]");if(!b||!pendingAcceptedOuting)return;let c=cur(),p=pendingAcceptedOuting;
 try{
   activeRoomCode=p.code;
   await loadRoom(p.code);
   if(!room)throw new Error("關係房間不存在或已解除");
   c.stats??={};c.stats.outingTogether=(c.stats.outingTogether||0)+1;
   logJournal(c,`接受邀請，一起去了${p.pl?.[2]||"外出"}`,p.pl?.[1]||"🗺️");
   addMemory(c,`共同外出・${p.pl?.[2]||""}`,"雙方都完成選擇後一起外出。");
   reconcileAchievements(c);saveLocal();

   // 把「完成共同外出」留下來，讓雙方共同羈絆真正增加。
   try{
     let to=room.host_char===c.id?room.guest_char:room.host_char;
     await api("/test_interactions",{method:"POST",body:JSON.stringify({
       room_code:p.code,
       from_char:c.id,
       to_char:to,
       text:`OUTING_DONE|${p.pid}|${Date.now()}`
     })});
   }catch(bondErr){
     console.warn("共同外出羈絆寫入失敗",bondErr);
   }

   outingChoiceModal.classList.add("hidden");pendingAcceptedOuting=null;
   try{await api(`/test_interactions?id=eq.${encodeURIComponent(p.id)}`,{method:"DELETE"})}catch(delErr){console.warn("邀請清除失敗",delErr)}
   try{await refreshBond(p.code)}catch(e){console.warn("外出後羈絆刷新失敗",e)}
   renderGame();
   try{openOutingBondEvent(p.pid)}catch(showErr){console.warn("外出結果顯示失敗",showErr);toast("💞 已接受邀約並完成共同外出。")}
   await renderInvites(c);
 }catch(err){
   console.error("接受外出邀約失敗",err);
   toast("處理邀約失敗："+(err?.message||"請稍後再試"),5200);
 }
});


function occupiedRelationTypes(c){
 return new Set(Object.values(relationshipSummaries||{}).map(r=>r?.relation).filter(Boolean));
}
function allRelationSlotsFull(c){return relationTypes.every(t=>relationOccupant(c,t));}
function buildRelationCycle(c,sourceCode,targetType){
 // Moving source into an occupied target creates a cycle by repeatedly moving
 // the displaced room into the source room's newly-vacated slot.
 let source=relationshipSummaries?.[sourceCode];if(!source)return null;
 let moves=[],vacancy=source.relation,currentCode=sourceCode,target=targetType,seen=new Set();
 while(true){
   if(seen.has(target))return null;seen.add(target);
   let occ=relationOccupant(c,target,currentCode);
   moves.push({code:currentCode,from:relationshipSummaries?.[currentCode]?.relation||vacancy,to:target});
   if(!occ)break;
   currentCode=occ.code;
   target=vacancy;
   vacancy=relationshipSummaries?.[currentCode]?.relation||target;
   if(currentCode===sourceCode||moves.length>relationTypes.length)return null;
 }
 return moves;
}
async function applyRelationMoves(moves){
 for(let m of moves)await applyRelationChange(m.code,m.to);
}
function markRelationTypeTransformed(c,from){
  c.stats??={};
  c.stats.transformedFromTypes??={};
  c.stats.transformedFromTypes[from]=1;
  const all=["lover","bestfriend","family","partner","rival","enemy"];
  if(all.every(t=>c.stats.transformedFromTypes[t]))c.achievements.relation_full_six=1;
}
function recordRelationMoves(c,moves){
 moves.forEach(m=>{
   recordRelationHistory(c,m.code,m.from,m.to);
   markRelationTypeTransformed(c,m.from);
 });
 if(moves.length>=3)c.achievements.relation_chain3=1;
}
closeRelationTransform.onclick=()=>relationTransformModal.classList.add("hidden");
let pendingRelationBalance=null;
async function applyRelationChange(code,to){
 await api(`/test_rooms?code=eq.${encodeURIComponent(code)}`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({relation:to})});
}

async function sendRelationSlotConsentRequest(c,sourceCode,from,to,occ,stage){
  if(!c||!occ?.rr)return;
  const targetChar=occ.rr.host_char===c.id?occ.rr.guest_char:occ.rr.host_char;
  if(!targetChar)throw new Error("找不到目前佔用關係位置的對方角色");

  // Delete older unresolved slot requests for this same source attempt.
  try{
    let old=await api(`/test_interactions?room_code=eq.${encodeURIComponent(occ.code)}&to_char=eq.${encodeURIComponent(targetChar)}&select=id,text`);
    for(const x of old||[]){
      if(String(x.text||"").startsWith("RELATION_SLOT_REQUEST|")){
        try{await api(`/test_interactions?id=eq.${encodeURIComponent(x.id)}`,{method:"DELETE"})}catch(e){}
      }
    }
  }catch(e){}

  const payload=[
    "RELATION_SLOT_REQUEST",
    sourceCode,
    from,
    to,
    String(stage),
    c.id
  ].join("|");

  await api("/test_interactions",{
    method:"POST",
    body:JSON.stringify({
      room_code:occ.code,
      from_char:c.id,
      to_char:targetChar,
      text:payload
    })
  });

  ensureTransformState(c);
  let key=transformDecisionKey(sourceCode,stage);
  c.pendingRelationTransforms[key]={
    code:String(sourceCode),from,to,stage:Number(stage),
    waitingSlot:true,occupiedCode:String(occ.code),
    createdAt:new Date().toISOString()
  };
  saveLocal();
}
async function cancelRelationSlotRequest(req,reason="refused"){
  if(!req)return;
  try{await api(`/test_interactions?id=eq.${encodeURIComponent(req.row.id)}`,{method:"DELETE"})}catch(e){}
  let p=String(req.row.text||"").split("|");
  let sourceCode=p[1],from=p[2],to=p[3],stage=Number(p[4]||0),initiator=p[5];
  try{
    await api("/test_interactions",{
      method:"POST",
      body:JSON.stringify({
        room_code:req.code,
        from_char:cur()?.id||req.row.to_char,
        to_char:initiator,
        text:`RELATION_SLOT_RESULT|${sourceCode}|${from}|${to}|${stage}|${reason}`
      })
    });
  }catch(e){}
}
relationTransformBody.onclick=async e=>{
 let c=cur();if(!c)return;

 let laterAll=e.target.closest("[data-transform-later-all]");
 if(laterAll){
   let rr=relationshipSummaries?.[activeRoomCode];
   if(!rr)return;
   let stage=currentTransformStage(activeRoomCode);
   ensureTransformState(c);
   let key=transformDecisionKey(activeRoomCode,stage);
   c.pendingRelationTransforms[key]={
     code:String(activeRoomCode),
     from:rr.relation,
     to:null,
     chooseLater:true,
     stage:Number(stage),
     createdAt:new Date().toISOString()
   };
   saveLocal();
   relationTransformModal.classList.add("hidden");
   toast("⏳ 已放到未處理事件，之後可以再選擇要轉成哪一種關係。",4200);
   await renderPendingEvents(c);
   return;
 }

 let rejectAll=e.target.closest("[data-transform-reject-all]");
 if(rejectAll){
   let rr=relationshipSummaries?.[activeRoomCode];
   if(!rr)return;
   let stage=currentTransformStage(activeRoomCode);
   rejectTransformForStage(c,activeRoomCode,stage);
   relationTransformModal.classList.add("hidden");
   toast(`🚫 已拒絕第 ${stage+1} 階的所有關係轉換；進入下一階後才會再次詢問。`,4200);
   renderGame();
   await renderPendingEvents(c);
   return;
 }

 let choose=e.target.closest("[data-transform]");
 if(choose){
   let rr=relationshipSummaries?.[activeRoomCode],to=choose.dataset.transform;
   if(!rr)return;
   openTransformDecision(c,activeRoomCode,rr.relation,to,currentTransformStage(activeRoomCode));
   return;
 }

 let decision=e.target.closest("[data-transform-decision]");
 if(decision){
   let rr=relationshipSummaries?.[activeRoomCode],to=decision.dataset.transformTo;
   if(!rr||!to)return;
   let from=rr.relation,stage=currentTransformStage(activeRoomCode),kind=decision.dataset.transformDecision;

   if(kind==="later"){
     savePendingTransform(c,activeRoomCode,from,to,stage);
     relationTransformModal.classList.add("hidden");
     toast("⏳ 已放到未處理事件，可以之後再決定。",3500);
     await renderPendingEvents(c);
     return;
   }
   if(kind==="reject"){
     rejectTransformForStage(c,activeRoomCode,stage);
     relationTransformModal.classList.add("hidden");
     toast(`維持「${relationLabel(from)}」。進入下一階後會再次詢問。`,3800);
     renderGame();
     await renderPendingEvents(c);
     return;
   }

   // Agree: only now do we begin the actual transformation flow.
   let occ=relationOccupant(c,to,activeRoomCode);
   if(!occ){
     try{
       let retained=await applyBondDecay(activeRoomCode,from,to);
       await applyRelationChange(activeRoomCode,to);
       consumeTransformForStage(c,activeRoomCode,stage);
       if(from==="rival"&&to==="lover")c.achievements.rival_to_lover=1;
       if(from==="lover"&&to==="enemy")c.achievements.lover_to_enemy=1;
       recordRelationHistory(c,activeRoomCode,from,to);
       markRelationTypeTransformed(c,from);
       logJournal(c,`關係從「${relationLabel(from)}」轉變為「${relationLabel(to)}」，羈絆保留 ${retained}%`,"🔄");
       saveLocal();
       relationTransformModal.classList.add("hidden");
       toast(`🔄 關係已轉變：${relationLabel(to)}・羈絆保留 ${retained}%`,4300);
       await refreshRelationships();await loadRoom(activeRoomCode);renderGame();await renderPendingEvents(c);
     }catch(err){toast("關係轉變失敗："+(err?.message||"請稍後再試"))}
     return;
   }

   try{
     await sendRelationSlotConsentRequest(c,activeRoomCode,from,to,occ,stage);
     relationTransformModal.classList.add("hidden");
     toast(`⏳ 已詢問目前的「${relationLabel(to)}」本人，等待對方決定。`,4200);
     await renderPendingEvents(c);
   }catch(err){
     toast("送出關係位置請求失敗："+(err?.message||"請稍後再試"));
   }
   return;
 }



};



relationTransformModal.addEventListener("click",async e=>{
  let btn=e.target.closest("[data-slot-answer]");
  if(!btn)return;
  let idx=Number(btn.dataset.pidx),ev=pendingEventRows[idx],c=cur();
  if(!ev||ev.kind!=="slot_request"||!c)return;
  let q=String(ev.row.text||"").split("|"),sourceCode=q[1],from=q[2],to=q[3],stage=Number(q[4]||0);
  try{
    if(btn.dataset.slotAnswer==="keep"){
      await cancelRelationSlotRequest(ev,"refused");
      relationTransformModal.classList.add("hidden");
      toast("已維持目前關係。對方的轉換不會發生。",3800);
      await renderPendingEvents(c);
      return;
    }

    // Occupant voluntarily releases their current relationship room.
    // Only after the delete succeeds do we tell the initiator to complete the transformation.
    await api(`/test_rooms?code=eq.${encodeURIComponent(ev.code)}`,{method:"DELETE"});
    c.roomCodes=(c.roomCodes||[]).filter(x=>String(x)!==String(ev.code));
    saveLocal();
    await cancelRelationSlotRequest(ev,"accepted");
    relationTransformModal.classList.add("hidden");
    toast(`已同意解除目前的「${relationLabel(to)}」關係。`,4000);
    await refreshRelationships();await renderPendingEvents(c);renderGame();
  }catch(err){
    toast("處理關係位置請求失敗："+(err?.message||"請稍後再試"));
  }
});
document.addEventListener("click",e=>{
  let b=e.target.closest("[data-bgm-toggle]");if(!b)return;
  setBgmEnabled(!bgmEnabled);
});

function closeDrawer(){drawer.classList.add('hidden');drawerShade.classList.add('hidden')}menuBtn.onclick=()=>{drawer.classList.remove('hidden');drawerShade.classList.remove('hidden')};drawerShade.onclick=closeDrawer;
document.getElementById("quickRest")?.addEventListener("click",doQuickRest);
document.getElementById("quickWork").onclick=()=>{closeDrawer();document.querySelectorAll(".pageCard").forEach(x=>x.classList.remove("active"));rememberOpenSheet("extraWork");document.getElementById("extraWork").classList.add("active");pageTitle.textContent="打工";safeRenderGame()};
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=async(e)=>{
  e?.preventDefault?.();
  e?.stopPropagation?.();

  let n=b.dataset.nav;
  closeDrawer();

  if(n==='relations')markRelationsSeen();
  if(n==='outing')markOutingSeen();

  document.querySelectorAll('.pageCard').forEach(x=>x.classList.remove('active'));

  let map={
    daily:'extraDaily',
    work:'extraWork',
    journal:'extraJournal',
    routine:'extraRoutine',
    outing:'extraOuting',
    bag:'extraBag',
    shop:'extraShop',
    memory:'extraMemory',
    achievements:'extraAchievements',
    relations:'extraRelations',
    npcrelations:'extraNpcRelations',
    mailbox:'extraMailbox',
    gm:'extraGM'
  };

  if(n==='gm'&&!gmProfile){
    document.getElementById("gmLoginModal")?.classList.remove("hidden");
    return;
  }

  if(map[n]){
    let el=document.getElementById(map[n]);
    if(n==="achievements"){
      await refreshCustomBadgeDefs();
      let ac=cur();if(ac)renderBadges(ac);
    }
    if(el){
      rememberOpenSheet(map[n]);

      if(n==='shop')safeCall(()=>renderShop(cur()),"開啟商店");
      if(n==='routine')safeCall(()=>renderRoutineEditor(cur()),"開啟角色作息");
      if(n==='outing')safeCall(()=>renderOuting(cur()),"開啟外出");
      if(n==='npcrelations'){
        safeCall(()=>renderNpcRelationships(),"開啟 NPC 關係");
      }
      if(n==='relations'){
        let rc=cur();
        if(rc){
          // Open immediately with local/cached data.
          safeRenderGame();

          // Refresh everything in the background.
          Promise.allSettled([
            refreshRelationships(),
            refreshAllBondSummaries(rc),
            syncBadgeShowcaseToAllRelations(rc)
          ]).then(()=>{
            refreshRelationships().then(()=>safeRenderGame()).catch(()=>{});
          });
        }
      }
      if(n==='mailbox'){
        let c=cur();
        if(c)await loadMailbox(c);
      }
      if(n==='gm'){
        await loadGMLog();
        await loadGMCustomBadges();
        await loadGMSentGifts();
      }

      el.classList.add('active');
      safeRenderGame();

      if(n==='shop'){
        safeCall(()=>renderShop(cur()),"刷新商店");
        setTimeout(()=>safeCall(()=>renderShop(cur()),"延遲刷新商店"),30);
      }
      if(n==='outing')safeCall(()=>renderOuting(cur()),"刷新外出");
    }
  }else{
    rememberOpenSheet("");
    window.scrollTo({top:0,behavior:'smooth'});
  }

  pageTitle.textContent={
    life:'角色生活',
    daily:'今日小事',
    work:'打工',
    journal:'今日生活日誌',
    outing:'外出',
    relations:'關係',
    chat:'聊天',
    bag:'背包',
    shop:'商店',
    memory:'回憶',
    achievements:'成就',
    mailbox:'信箱',
    gm:'GM 操作台'
  }[n]||'角色生活';
});
document.getElementById('bars').onclick=e=>{let k=e.target.dataset.info;if(!k)return;let c=cur(),d={energy:['⚡ 體力',`目前 ${Math.floor(c.energy)}/100。<br>低體力會讓角色優先休息，並影響外出、約會與冒險。`],hunger:['🍙 飽食度',`目前 ${Math.floor(c.hunger)}/100。<br>會隨時間下降；太餓會影響體力與心情，也會提高吃飯類事件機率。`],mood:['🌸 心情',`目前 ${Math.floor(c.mood)}/100。<br>會改變角色行動傾向與隨機事件池。低落時更容易出現安慰、陪伴、散心事件。`],exp:['✨ 經驗',`角色自己的成長值。升級後會逐步解鎖更多生活與 TRPG 內容。`]}[k];infoTitle.textContent=d[0];infoBody.innerHTML=d[1];infoModal.classList.remove('hidden')};closeInfo.onclick=()=>infoModal.classList.add('hidden');

window.addEventListener("error",e=>fatal("程式錯誤："+e.message));
bgm.volume=Number(localStorage.getItem("roleLife_bgm_volume_fresh_v1")||.25);bgmVolume.value=bgm.volume;bgmToggle.onclick=async()=>{if(bgm.paused){try{await bgm.play();bgmToggle.textContent="⏸ 暫停"}catch{alert("請把 bgm.mp3 和 index.html 放在同一資料夾。")}}else{bgm.pause();bgmToggle.textContent="▶ 播放"}};bgmVolume.oninput=()=>{bgm.volume=Number(bgmVolume.value);localStorage.setItem("roleLife_bgm_volume_fresh_v1",bgm.volume)};

document.querySelectorAll(".pageCard").forEach(el=>{
  if(el.querySelector(".sheetHead")) return;
  let first=el.querySelector(".section");
  if(!first)return;
  let head=document.createElement("div");head.className="sheetHead";
  first.parentNode.insertBefore(head,first);head.appendChild(first);
  let close=document.createElement("button");close.className="sheetClose";close.type="button";close.textContent="×";
  close.onclick=()=>{el.classList.remove("active");if(lastOpenSheetId===el.id)rememberOpenSheet("");pageTitle.textContent="角色生活"};
  head.appendChild(close);
});
let savedBgmVol=Number(localStorage.getItem("role_life_bgm_volume_v1"));
if(Number.isFinite(savedBgmVol)&&savedBgmVol>=0&&savedBgmVol<=1){bgmAudio.volume=savedBgmVol;let v=document.getElementById("bgmVolume");if(v)v.value=String(savedBgmVol)}
let oldBgmBtn=document.getElementById("bgmToggle");if(oldBgmBtn)oldBgmBtn.onclick=()=>setBgmEnabled(!bgmEnabled);
let oldBgmVol=document.getElementById("bgmVolume");if(oldBgmVol)oldBgmVol.oninput=e=>{
  bgmAudio.volume=Number(e.target.value);
  localStorage.setItem("role_life_bgm_volume_v1",String(bgmAudio.volume));
  let hv=document.getElementById("homeBgmVolume");if(hv)hv.value=String(bgmAudio.volume);
  if(bgmEnabled)tryStartBgm();
  updateBgmButtons();
};
let homeBgmBtn=document.getElementById("homeBgmToggle");if(homeBgmBtn)homeBgmBtn.onclick=()=>setBgmEnabled(!bgmEnabled);
let homeBgmVol=document.getElementById("homeBgmVolume");if(homeBgmVol)homeBgmVol.oninput=e=>{
  bgmAudio.volume=Number(e.target.value);
  localStorage.setItem("role_life_bgm_volume_v1",String(bgmAudio.volume));
  let gv=document.getElementById("bgmVolume");if(gv)gv.value=String(bgmAudio.volume);
  if(bgmEnabled)tryStartBgm();
  updateBgmButtons();
};


document.getElementById("imageInput").onchange=async e=>{
 let f=e.target.files?.[0],c=cur();if(!f||!c)return;
 try{
   c.image=await resizeImageFile(f,420,.72);
   if(!saveLocal())return alert("圖片儲存失敗，請換一張較小的圖片。");
   renderGame();toast("🖼️ 頭像已更新");
 }catch(err){alert("圖片處理失敗，請換一張圖片。")}
 e.target.value="";
};


let testReferralInfo=null;

async function testReferralRpc(name,args={}){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),8000);
  try{
    let res=await fetch(`${API}/rpc/${encodeURIComponent(name)}`,{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(args||{}),
      signal:ctrl.signal
    });
    let text=await res.text(),data=null;
    if(text){try{data=JSON.parse(text)}catch(e){data=text}}
    if(!res.ok)throw new Error(data?.message||data?.hint||`邀請系統連線失敗 ${res.status}`);
    return data;
  }catch(e){
    if(e?.name==="AbortError")throw new Error("邀請系統連線逾時");
    throw e;
  }finally{clearTimeout(timer)}
}

async function loadTestReferralPanel(){
  let codeEl=document.getElementById("testMyReferralCode");
  if(!codeEl)return;

  // Character destination list for claiming referral rewards.
  let sel=document.getElementById("testReferralRewardChar");
  if(sel){
    sel.innerHTML=(local.characters||[]).length
      ?local.characters.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}・🪙${Number(c.money||0)}</option>`).join("")
      :'<option value="">請先建立角色</option>';
  }

  try{
    let info=await testReferralRpc("get_test_referral_info",{p_player_id:playerId});
    testReferralInfo=info||{};
    codeEl.textContent=String(info?.invite_code||"—");

    let bound=document.getElementById("testBoundInviterStatus");
    let bindBox=document.getElementById("testBindInviterBox");
    if(info?.bound_inviter_code){
      if(bound)bound.textContent=`✅ 已綁定邀請人：${info.bound_inviter_code}`;
      bindBox?.classList.add("hidden");
    }else{
      if(bound)bound.textContent="尚未綁定邀請人。";
      bindBox?.classList.remove("hidden");
    }

    let reward=document.getElementById("testReferralRewardStatus");
    let pending=Math.max(0,Number(info?.pending_coins||0));
    if(reward)reward.textContent=pending>0
      ?`目前有 🪙${pending} 可以領取。`
      :"目前沒有待領取的邀請獎勵。";
    let btn=document.getElementById("claimTestReferralReward");
    if(btn)btn.disabled=pending<=0||!(local.characters||[]).length;
  }catch(e){
    codeEl.textContent="讀取失敗";
    let reward=document.getElementById("testReferralRewardStatus");
    if(reward)reward.textContent="⚠️ 邀請系統尚未連線："+e.message;
  }
}

async function bindTestInviter(){
  let code=(document.getElementById("testInviterCodeInput")?.value||"").trim().toUpperCase();
  if(!code)return toast("請輸入邀請碼");
  try{
    let result=await testReferralRpc("bind_test_inviter",{
      p_invitee_player_id:playerId,
      p_inviter_code:code
    });
    if(result?.ok===false)throw new Error(result?.message||"綁定失敗");
    toast("🤝 已成功綁定邀請人！");
    await loadTestReferralPanel();
  }catch(e){
    toast("綁定邀請人失敗："+e.message,4500);
  }
}

async function claimTestReferralReward(){
  let charId=document.getElementById("testReferralRewardChar")?.value;
  let c=(local.characters||[]).find(x=>String(x.id)===String(charId));
  if(!c)return toast("請先選擇領取獎勵的角色");

  try{
    let preview=await testReferralRpc("get_test_referral_info",{p_player_id:playerId});
    let amount=Math.max(0,Number(preview?.pending_coins||0));
    if(amount<=0)return toast("目前沒有可以領取的邀請獎勵");

    // First request an atomic cloud claim token/amount.
    let claimed=await testReferralRpc("claim_test_referral_coins",{p_player_id:playerId});
    claimed=Math.max(0,Number(claimed||0));
    if(claimed<=0)return toast("這份邀請獎勵已經領取過了");

    c.money=safeMoney(Number(c.money||0)+claimed);
    c.journal??={};
    logJournal(c,`領取測試服邀請獎勵 🪙${claimed}`,"🤝");
    if(!saveLocal()){
      toast("⚠️ 雲端已標記領取，但本機存檔失敗，請立即聯絡 GM。",5500);
      return;
    }
    toast(`🎁 ${c.name} 已領取邀請獎勵 🪙${claimed}`,4500);
    renderHome();
    await loadTestReferralPanel();
  }catch(e){
    toast("邀請獎勵領取失敗："+e.message,4500);
  }
}

document.getElementById("copyTestReferralCode")?.addEventListener("click",()=>{
  let code=document.getElementById("testMyReferralCode")?.textContent.trim();
  if(code&&code!=="—"&&!code.includes("失敗"))copyTextValue(code);
});
document.getElementById("bindTestInviterBtn")?.addEventListener("click",bindTestInviter);
document.getElementById("testInviterCodeInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")bindTestInviter()});
document.getElementById("claimTestReferralReward")?.addEventListener("click",claimTestReferralReward);


const LAUNCH_EVENT_KEY="role_life_test_launch_event_2026_v1";
const LAUNCH_EVENT_START=Date.parse("2026-08-10T00:00:00+08:00");
const LAUNCH_EVENT_END=Date.parse("2026-08-24T23:59:59+08:00");
let launchActivityTab="seven";
let launchReferralCount=0;

function launchState(){
  try{
    let x=JSON.parse(localStorage.getItem(LAUNCH_EVENT_KEY)||"{}")||{};
    x.claimed??={};x.firstOpenedAt??=new Date().toISOString();
    return x;
  }catch(e){return {claimed:{},firstOpenedAt:new Date().toISOString()}}
}
function saveLaunchState(x){localStorage.setItem(LAUNCH_EVENT_KEY,JSON.stringify(x||{}))}
function launchTargetChar(){
  return cur?.() || (local.characters||[])[0] || null;
}
function launchGiveCoins(c,n){
  if(!c)return false;
  c.money=safeMoney(Number(c.money||0)+Number(n||0));
  return true;
}
function launchGiveItem(c,id,n=1){
  if(!c)return false;
  c.inventory??={};
  c.inventory[id]=(c.inventory[id]||0)+Math.max(1,Number(n)||1);
  return true;
}
function launchGiveBadge(id){
  ensureBadges();
  local.sharedBadges[id]=1;
  return true;
}
function launchRewardText(rewards){
  return rewards.map(r=>{
    if(r.type==="coins")return `🪙${r.amount}`;
    if(r.type==="item")return `${itemDisplayName(r.id)} ×${r.amount||1}`;
    if(r.type==="badge"){
      let b=launchEventBadgeDefs[r.id]||badgeDisplayInfo(r.id);
      return `${b.icon||"🏅"} ${b.name||r.id}`;
    }
    return r.label||"獎勵";
  }).join("・");
}
function applyLaunchReward(key,rewards,silent=false){
  let st=launchState();
  if(st.claimed[key])return false;
  let c=launchTargetChar();
  let needsChar=rewards.some(r=>r.type==="coins"||r.type==="item");
  if(needsChar&&!c)return false;

  for(const r of rewards){
    if(r.type==="coins")launchGiveCoins(c,r.amount);
    else if(r.type==="item")launchGiveItem(c,r.id,r.amount);
    else if(r.type==="badge")launchGiveBadge(r.id);
  }
  st.claimed[key]=new Date().toISOString();
  saveLaunchState(st);
  saveLocal();
  if(c)logJournal(c,`開服活動自動獲得：${launchRewardText(rewards)}`,"🎊");
  if(!silent)toast(`🎊 活動完成！已自動獲得：${launchRewardText(rewards)}`,5200);
  return true;
}

function launchAggregateStats(){
  let chars=local.characters||[];
  return {
    hasChar:chars.length>0,
    hasRelation:chars.some(c=>(c.roomCodes||[]).length>0),
    messages:Math.max(0,...chars.map(c=>Number(c.stats?.messages||0))),
    gifts:Math.max(0,...chars.map(c=>Number(c.stats?.giftsSent||0))),
    interactions:Math.max(0,...chars.map(c=>Number(c.stats?.interactions||0))),
    games:Math.max(0,...chars.map(c=>Object.keys(c.stats?.gameTypes||{}).length)),
  };
}

const launchSevenTasks=[
  {key:"day1",day:1,title:"🌱 新生活開始",desc:"建立任意一位角色。",check:s=>s.hasChar,
   reward:[{type:"coins",amount:300},{type:"badge",id:"launch_newbie"}]},
  {key:"day2",day:2,title:"🤝 初次相遇",desc:"建立任意一段關係。",check:s=>s.hasRelation,
   reward:[{type:"coins",amount:150},{type:"item",id:"gift_candy",amount:1},{type:"item",id:"gift_keychain",amount:1}]},
  {key:"day3",day:3,title:"💌 想對你說",desc:"累積傳送 3 則關係訊息。",check:s=>s.messages>=3,
   reward:[{type:"item",id:"gift_candy",amount:1},{type:"item",id:"gift_flower",amount:1},{type:"item",id:"gift_letter",amount:1}]},
  {key:"day4",day:4,title:"🎁 一點心意",desc:"成功送出 1 次好感禮物。",check:s=>s.gifts>=1,
   reward:[{type:"coins",amount:200}]},
  {key:"day5",day:5,title:"🎮 心有靈犀",desc:"和關係角色完成 1 次小遊戲。",check:s=>s.games>=1,
   reward:[{type:"item",id:"gift_plush",amount:1},{type:"item",id:"gift_music",amount:1}]},
  {key:"day6",day:6,title:"🌷 一起生活",desc:"累積完成 2 次關係互動。",check:s=>s.interactions>=2,
   reward:[{type:"coins",amount:250},{type:"item",id:"ribbon",amount:1}]},
  {key:"day7",day:7,title:"✨ 關係進行式",desc:"完成前六項開服任務。",check:(s,st)=>launchSevenTasks.slice(0,6).every(t=>!!st.claimed[t.key]),
   reward:[{type:"badge",id:"launch_story_start"},{type:"item",id:"musicbox",amount:1}]}
];

const launchStarterPack=[
  {type:"coins",amount:500},
  {type:"item",id:"gift_candy",amount:1},
  {type:"item",id:"gift_keychain",amount:1},
  {type:"item",id:"gift_flower",amount:1},
  {type:"item",id:"gift_letter",amount:1},
  {type:"item",id:"gift_plush",amount:1},
  {type:"item",id:"gift_music",amount:1}
];

function launchDuoDone(stats){
  return stats.hasRelation&&stats.messages>=1&&stats.gifts>=1&&stats.interactions>=1&&stats.games>=1;
}
const launchInviteMilestones=[
  {key:"invite1",n:1,title:"把邀請送出去",reward:[{type:"coins",amount:200},{type:"item",id:"gift_flower",amount:1}]},
  {key:"invite3",n:3,title:"故事開始熱鬧了",reward:[{type:"coins",amount:500},{type:"badge",id:"launch_inviter"}]},
  {key:"invite5",n:5,title:"一起來到故事裡",reward:[{type:"item",id:"gift_music",amount:2},{type:"coins",amount:800}]}
];

async function refreshLaunchReferralCount(){
  try{
    let info=await testReferralRpc("get_test_referral_info",{p_player_id:playerId});
    launchReferralCount=Math.max(0,Number(info?.invited_count||0));
  }catch(e){launchReferralCount=0}
}

async function evaluateLaunchActivity(silent=false){
  let now=Date.now();
  if(now<LAUNCH_EVENT_START||now>LAUNCH_EVENT_END)return;
  let stats=launchAggregateStats();
  let st=launchState();

  // 全服開服禮包：第一次有角色時直接送，不需要 GM 或領取按鈕。
  if(stats.hasChar)applyLaunchReward("starter_pack",launchStarterPack,silent);

  // 七日任務：完成當下直接發。
  for(const t of launchSevenTasks){
    st=launchState();
    if(!st.claimed[t.key]&&t.check(stats,st)){
      applyLaunchReward(t.key,t.reward,silent);
      stats=launchAggregateStats();
    }
  }

  // 雙人四項挑戰。
  st=launchState();
  if(!st.claimed.duo_complete&&launchDuoDone(stats)){
    applyLaunchReward("duo_complete",[
      {type:"coins",amount:300},
      {type:"badge",id:"launch_first_bond"}
    ],silent);
  }

  await refreshLaunchReferralCount();
  for(const m of launchInviteMilestones){
    st=launchState();
    if(!st.claimed[m.key]&&launchReferralCount>=m.n)applyLaunchReward(m.key,m.reward,silent);
  }

  // 隱藏總完成徽章。
  st=launchState();
  if(!st.claimed.hidden_companion
     &&!!st.claimed.day7
     &&!!st.claimed.duo_complete
     &&launchReferralCount>=1){
    applyLaunchReward("hidden_companion",[{type:"badge",id:"launch_first_companion"}],silent);
  }

  updateLaunchActivityFab();
}

function launchCompletionCounts(){
  let st=launchState();
  let seven=launchSevenTasks.filter(t=>!!st.claimed[t.key]).length;
  let duo=st.claimed.duo_complete?1:0;
  let invite=launchInviteMilestones.filter(m=>!!st.claimed[m.key]).length;
  return {seven,duo,invite,total:seven+duo+invite,max:7+1+3};
}

function updateLaunchActivityFab(){
  let fab=document.getElementById("launchActivityFab");
  if(!fab)return;
  let active=Date.now()>=LAUNCH_EVENT_START&&Date.now()<=LAUNCH_EVENT_END;
  fab.classList.toggle("hidden",!active);
  let st=launchState(),count=launchCompletionCounts();
  let dot=document.getElementById("launchActivityDot");
  if(dot)dot.classList.toggle("hidden",count.total<=0||st.lastSeenTotal===count.total);
}

function renderLaunchActivity(){
  let body=document.getElementById("launchActivityBody");if(!body)return;
  let st=launchState(),stats=launchAggregateStats();
  let counts=launchCompletionCounts();
  let pct=Math.round(counts.total/counts.max*100);
  let fill=document.getElementById("launchActivityProgressFill");
  if(fill)fill.style.width=pct+"%";
  let pt=document.getElementById("launchActivityProgressText");
  if(pt)pt.textContent=`活動總進度 ${counts.total}/${counts.max}（${pct}%）`;

  let remain=Math.max(0,LAUNCH_EVENT_END-Date.now());
  let days=Math.floor(remain/86400000),hours=Math.floor(remain%86400000/3600000);
  let cd=document.getElementById("launchActivityCountdown");
  if(cd)cd.textContent=Date.now()>LAUNCH_EVENT_END?"活動已結束":`剩餘 ${days} 天 ${hours} 小時`;

  if(launchActivityTab==="seven"){
    body.innerHTML=`
      <div class="launchTaskCard done">
        <div class="launchTaskTop"><div><b>🎁 開服全服禮包</b><div class="small">建立第一位角色後自動發送。</div></div><span class="launchAutoTag">${st.claimed.starter_pack?"✅ 已獲得":"自動領取"}</span></div>
        <div class="launchReward">${launchRewardText(launchStarterPack)}</div>
      </div>
      ${launchSevenTasks.map(t=>{
        let done=!!st.claimed[t.key],ready=t.check(stats,st);
        return `<div class="launchTaskCard ${done?"done":""}">
          <div class="launchTaskTop">
            <div><b>Day ${t.day}・${t.title}</b><div class="small">${esc(t.desc)}</div></div>
            <span class="launchAutoTag">${done?"✅ 已獲得":ready?"處理中":"進行中"}</span>
          </div>
          <div class="launchReward">🎁 ${esc(launchRewardText(t.reward))}</div>
        </div>`;
      }).join("")}`;
  }else if(launchActivityTab==="duo"){
    let parts=[
      ["💬 聊天",stats.messages>=1],
      ["🎁 送禮",stats.gifts>=1],
      ["💞 關係互動",stats.interactions>=1],
      ["🎮 小遊戲",stats.games>=1]
    ];
    body.innerHTML=`<div class="launchTaskCard ${st.claimed.duo_complete?"done":""}">
      <b>💞 有你真好</b>
      <div class="small">與關係角色體驗四種核心互動。測試版先以帳號活動進度判定。</div>
      ${parts.map(x=>`<div class="small" style="margin-top:7px">${x[1]?"✅":"⬜"} ${x[0]}</div>`).join("")}
      <div class="launchReward">全部完成自動獲得：🪙300・💞 最初的羈絆</div>
    </div>`;
  }else if(launchActivityTab==="invite"){
    body.innerHTML=`<div class="launchTaskCard">
      <b>🤝 邀請好友加碼</b>
      <div class="small">目前成功邀請：${launchReferralCount} 人。這是開服活動額外獎勵，原本每次邀請的 300/200 金幣獎勵照常保留。</div>
    </div>
    ${launchInviteMilestones.map(m=>`<div class="launchTaskCard ${st.claimed[m.key]?"done":""}">
      <div class="launchTaskTop"><div><b>${m.n} 人・${m.title}</b><div class="small">${launchReferralCount}/${m.n}</div></div><span class="launchAutoTag">${st.claimed[m.key]?"✅ 已獲得":"自動領取"}</span></div>
      <div class="launchReward">🎁 ${esc(launchRewardText(m.reward))}</div>
    </div>`).join("")}`;
  }else{
    let ids=["launch_newbie","launch_first_bond","launch_story_start","launch_inviter","launch_first_companion"];
    body.innerHTML=`<div class="launchCollectGrid">${ids.map(id=>{
      let b=launchEventBadgeDefs[id],owned=!!local.sharedBadges?.[id];
      return `<div class="launchCollectCard ${owned?"":"locked"}">
        <div class="launchCollectIcon">${owned?b.icon:"❔"}</div>
        <b>${owned?esc(b.name):"???"}</b>
        <div class="small">${owned?esc(b.desc):"完成特定開服活動條件後解鎖。"}</div>
        <div class="chip" style="margin-top:6px">${owned?"已收藏":b.rarity.includes("隱藏")?"隱藏":"未取得"}</div>
      </div>`;
    }).join("")}</div>`;
  }
}


function syncLaunchActivityVisibility(){
  const game=document.getElementById("game");
  const inGame=!!game && !game.classList.contains("hidden");
  document.body.classList.toggle("launch-game-open",inGame);
  if(!inGame)document.getElementById("launchActivityModal")?.classList.add("hidden");
}
async function openLaunchActivity(){
  await evaluateLaunchActivity(true);
  let st=launchState(),count=launchCompletionCounts();
  st.lastSeenTotal=count.total;saveLaunchState(st);
  document.getElementById("launchActivityDot")?.classList.add("hidden");
  document.getElementById("launchActivityModal")?.classList.remove("hidden");
  renderLaunchActivity();
}
document.getElementById("launchActivityFab")?.addEventListener("click",openLaunchActivity);
document.getElementById("closeLaunchActivity")?.addEventListener("click",()=>document.getElementById("launchActivityModal")?.classList.add("hidden"));
document.getElementById("launchActivityModal")?.addEventListener("click",e=>{if(e.target.id==="launchActivityModal")e.currentTarget.classList.add("hidden")});
document.querySelectorAll("[data-launch-tab]").forEach(b=>b.addEventListener("click",()=>{
  launchActivityTab=b.dataset.launchTab||"seven";
  document.querySelectorAll("[data-launch-tab]").forEach(x=>x.classList.toggle("active",x===b));
  renderLaunchActivity();
}));

try{
  // Home must appear even if a later optional system fails.
  renderHome();
loadTestReferralPanel().catch(()=>{});
evaluateLaunchActivity(true).catch(()=>{});
syncLaunchActivityVisibility();
verifyGM();
startPublicStats();
  try{ensureSharedAchievements();saveLocal()}catch(e){console.warn("achievement migration",e)}
  try{installBgmGestureUnlock();updateBgmButtons();tryStartBgm()}catch(e){console.warn("bgm init",e)}
  try{scheduleMidnightReset()}catch(e){console.warn("daily timer",e)}
}catch(e){
  console.error("初始化失敗",e);
  // Last-resort home render for old saves.
  try{show("home");renderHome()}catch(_){}
  fatal("初始化部分失敗："+e.message);
}

document.addEventListener("visibilitychange",()=>{if(!document.hidden&&bgmEnabled)tryStartBgm()});
const launchActivityAutoTimer=setInterval(()=>{
  if(!document.hidden)evaluateLaunchActivity(false).catch(()=>{});
},20000);

