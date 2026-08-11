
(function(){
  if(typeof NPC_RPG_STORIES!=="undefined"){
    NPC_RPG_STORIES.shop_lover_date=[
      {speaker:"旁白",text:"今天不是來買東西的。"},
      {speaker:"？？？",text:"「所以你特地等我打烊？」"},
      {speaker:"你",text:"「不是說想見妳的時候就可以來嗎？」"},
      {speaker:"？？？",text:"「……你倒是記得很清楚。」"},
      {speaker:"旁白",text:"她關掉店裡最後一盞燈，走到你身旁。"},
      {speaker:"？？？",text:"「走吧。今天換我陪你出去。」"}
    ];
  }
  window.startShopkeeperDate=function(){
    const c=typeof cur==="function"?cur():null;
    const rel=c&&typeof getNpcRelationship==="function"?getNpcRelationship(c,"shopkeeper_cat"):null;
    if(!rel||rel.type!=="lover") return typeof toast==="function"&&toast("這是戀人關係解鎖的互動。");
    startNpcRpgStory({title:"戀人日常・打烊後的約會",lines:NPC_RPG_STORIES.shop_lover_date});
  };
})();
