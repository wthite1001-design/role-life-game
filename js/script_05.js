
const TEST_DEVICE_KEY="role_life_test_access_device_v1";
const TEST_GRANTED_KEY="role_life_test_access_granted_v1";

function testDeviceId(){
  let id=localStorage.getItem(TEST_DEVICE_KEY);
  if(!id){
    id=(crypto.randomUUID?crypto.randomUUID():"TESTDEV-"+Date.now()+"-"+Math.random().toString(36).slice(2));
    localStorage.setItem(TEST_DEVICE_KEY,id);
  }
  return id;
}

async function publicRpc(name,args={}){
  let res=await fetch(`${API}/rpc/${encodeURIComponent(name)}`,{
    method:"POST",
    headers:{
      "apikey":SUPABASE_KEY,
      "Content-Type":"application/json"
    },
    body:JSON.stringify(args||{})
  });
  let text=await res.text(),data=null;
  if(text){try{data=JSON.parse(text)}catch(e){data=text}}
  if(!res.ok)throw new Error(data?.message||data?.hint||`驗證失敗 ${res.status}`);
  return data;
}

function openTestGame(reason="tester"){
  localStorage.setItem(TEST_GRANTED_KEY,new Date().toISOString());
  document.getElementById("testAccessGate")?.classList.add("hidden");
  document.getElementById("testServerRibbon")?.classList.remove("hidden");
  document.getElementById("returnProdBtn")?.classList.remove("hidden");
  let st=document.getElementById("testGateStatus");
  if(st)st.textContent=reason==="owner"?"✅ Owner 已驗證":"✅ 測試資格有效";
}

function closeTestGame(message="測試資格已失效。"){
  document.getElementById("testServerRibbon")?.classList.add("hidden");
  document.getElementById("returnProdBtn")?.classList.add("hidden");
  document.getElementById("testAccessGate")?.classList.remove("hidden");
  let st=document.getElementById("testGateStatus");
  if(st)st.textContent="⛔ "+message;
}

async function isOwnerForTest(){
  try{
    gmSession=loadGMSession();
    if(!gmSession?.access_token)return false;
    let res=await fetch(`${API}/rpc/is_test_owner_rpc`,{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":"Bearer "+gmSession.access_token,
        "Content-Type":"application/json"
      },
      body:"{}"
    });
    if(!res.ok)return false;
    return !!(await res.json());
  }catch(e){return false}
}

async function checkCurrentTestAccess(){
  // 3.26.3: GM session itself is enough to enter the TEST server.
  // Actual key is role_life_gm_session_v1 (via loadGMSession()).
  try{
    const savedGM=loadGMSession();
    if(savedGM?.access_token){
      gmSession=savedGM;
      openTestGame("owner");
      return true;
    }
  }catch(e){console.warn("GM test bypass",e)}

  // Keep the server-side owner RPC as a secondary check.
  if(await isOwnerForTest()){
    openTestGame("owner");
    return true;
  }

  // Ordinary testers still use the bound device whitelist.
  try{
    let ok=await publicRpc("check_test_invite_access",{p_device_id:testDeviceId()});
    if(ok){openTestGame("tester");return true}
  }catch(e){console.warn("test access check",e)}

  closeTestGame("請輸入 Owner 提供的一次性測試碼。");
  return false;
}

async function redeemTestInvite(){
  const savedGM=loadGMSession();
  if(savedGM?.access_token){
    gmSession=savedGM;
    openTestGame("owner");
    return;
  }
  let code=(document.getElementById("testInviteCodeInput")?.value||"").trim().toUpperCase();
  let deviceName=(document.getElementById("testDeviceNameInput")?.value||"").trim();
  let st=document.getElementById("testGateStatus");
  if(!code)return st.textContent="請先輸入測試碼。";
  if(!deviceName)deviceName="測試裝置";
  try{
    st.textContent="驗證中……";
    let ok=await publicRpc("redeem_test_invite",{
      p_code:code,
      p_device_id:testDeviceId(),
      p_device_name:deviceName
    });
    if(!ok){
      st.textContent="❌ 測試碼無效、已被其他裝置使用，或已停用。";
      return;
    }
    st.textContent="✅ 驗證成功";
    openTestGame("tester");
  }catch(e){
    st.textContent="❌ "+e.message;
  }
}


function renderTestOwnerGateStatus(){
  const el=document.getElementById("testGateOwnerStatus");
  if(!el)return;
  const saved=loadGMSession();
  el.textContent=saved?.access_token
    ?"👑 已偵測到 GM 登入，正在直接進入測試服……"
    :"一般測試員請輸入測試碼。";
}
renderTestOwnerGateStatus();

document.getElementById("testRedeemBtn")?.addEventListener("click",redeemTestInvite);
document.getElementById("testInviteCodeInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")redeemTestInvite()});
document.getElementById("testBackToFormal")?.addEventListener("click",()=>{window.location.href="./index.html"});

(function(){
  const back=document.getElementById("testBackToFormal");
  if(back){
    back.style.pointerEvents="auto";
    back.style.position="relative";
    back.style.zIndex="10002";
    back.addEventListener("pointerup",function(e){
      e.preventDefault();e.stopImmediatePropagation();
      window.location.replace("./index.html");
    },true);
    back.addEventListener("click",function(e){
      e.preventDefault();e.stopImmediatePropagation();
      window.location.replace("./index.html");
    },true);
  }
})();

document.getElementById("returnProdBtn")?.addEventListener("click",()=>{window.location.href="./index.html"});

// Access is checked at startup and again every minute.
// If Owner disables a bound invite, the tester is kicked back to this gate.
checkCurrentTestAccess();
setInterval(()=>checkCurrentTestAccess().catch(()=>{}),60000);
