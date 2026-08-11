
/* === v3.22 badge manager late-binding fix === */
(function(){
  const modal=document.getElementById("badgeManagerModal");
  const closeBtn=document.getElementById("closeBadgeManager");
  const list=document.getElementById("badgeManagerList");

  if(closeBtn){
    closeBtn.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      modal?.classList.add("hidden");
    };
  }

  // Tapping outside the white card also closes the manager.
  if(modal){
    modal.addEventListener("click",function(e){
      if(e.target===modal)modal.classList.add("hidden");
    });
  }

  if(list){
    list.onclick=async function(e){
      const c=cur();
      if(!c)return;

      const mainBtn=e.target.closest("[data-bm-main]");
      if(mainBtn){
        e.preventDefault();
        e.stopPropagation();
        const id=mainBtn.dataset.bmMain;
        ensureBadges();
        if(!local.sharedBadges?.[id])return toast("這枚徽章尚未取得");
        c.equippedBadge=id;
        saveLocal();
        await refreshCustomBadgeDefs().catch(()=>{});
        renderBadges(c);
        renderBadgeManager();
        await syncBadgeShowcaseToAllRelations(c).catch(err=>console.warn("主徽章同步",err));
        toast("🏅 已設為主徽章");
        return;
      }

      const profileBtn=e.target.closest("[data-bm-profile]");
      if(profileBtn){
        e.preventDefault();
        e.stopPropagation();
        const id=profileBtn.dataset.bmProfile;
        ensureBadges();
        if(!local.sharedBadges?.[id])return toast("這枚徽章尚未取得");

        ensureProfileBadgeSlots(c);
        if(c.profileBadges.includes(id)){
          c.profileBadges=c.profileBadges.filter(x=>x!==id);
          toast("🏅 已從展示移除");
        }else{
          if(c.profileBadges.length>=3)return toast("個人資料最多展示 3 枚徽章");
          c.profileBadges.push(id);
          toast("🏅 已加入展示");
        }

        saveLocal();
        await refreshCustomBadgeDefs().catch(()=>{});
        renderBadges(c);
        renderBadgeManager();
        await syncBadgeShowcaseToAllRelations(c).catch(err=>console.warn("徽章展示同步",err));
        return;
      }
    };
  }

  // Rebind every page sheet X with event delegation as a safety net.
  document.addEventListener("click",function(e){
    const x=e.target.closest(".sheetClose");
    if(!x)return;
    e.preventDefault();
    e.stopPropagation();
    const page=x.closest(".pageCard");
    if(page){
      page.classList.remove("active");
      if(typeof lastOpenSheetId!=="undefined" && lastOpenSheetId===page.id){
        rememberOpenSheet("");
      }
      if(typeof pageTitle!=="undefined" && pageTitle){
        pageTitle.textContent="角色生活";
      }
    }
  },true);
})();

document.querySelectorAll("[data-routine-preset]").forEach(btn=>btn.addEventListener("click",()=>{
  let c=cur();if(!c)return;
  c.customRoutine=cloneRoutinePreset(btn.dataset.routinePreset);
  saveLocal();renderRoutineEditor(c);renderGame();
  toast("🕒 已套用作息範本，記得按儲存作息。");
}));
document.getElementById("saveRoutineBtn")?.addEventListener("click",async()=>{
  let c=cur();if(!c)return;
  try{
    c.customRoutine=readRoutineEditor();
    saveLocal();renderRoutineEditor(c);renderGame();
    await syncBadgeShowcaseToAllRelations(c).catch(()=>{});
    // Update all relation rooms with latest activity too.
    for(const code of c.roomCodes||[]){
      try{
        let rr=relationshipSummaries?.[String(code)];
        if(!rr)continue;
        let field=rr.host_char===c.id?"host_state":rr.guest_char===c.id?"guest_state":"";
        if(!field)continue;
        let body={};body[field]=publicState(c);
        await api(`/test_rooms?code=eq.${encodeURIComponent(code)}`,{method:"PATCH",body:JSON.stringify(body)});
      }catch(e){}
    }
    toast("💾 角色作息已儲存");
  }catch(e){toast("作息無法儲存："+e.message,4500)}
});
document.getElementById("resetRoutineBtn")?.addEventListener("click",()=>{
  let c=cur();if(!c)return;
  c.customRoutine=cloneRoutinePreset("default");
  saveLocal();renderRoutineEditor(c);renderGame();toast("↩️ 已恢復一般作息");
});

let currentShopTab="normal";
document.querySelectorAll("[data-shop-tab]").forEach(btn=>btn.addEventListener("click",()=>{
  currentShopTab=btn.dataset.shopTab||"normal";
  document.querySelectorAll("[data-shop-tab]").forEach(x=>x.classList.toggle("active",x===btn));
  document.getElementById("shopNormalPanel")?.classList.toggle("hidden",currentShopTab!=="normal");
  document.getElementById("shopGiftPanel")?.classList.toggle("hidden",currentShopTab!=="gift");
  let c=cur();if(c){renderShop(c);renderAffectionGiftShop(c)}
}));
