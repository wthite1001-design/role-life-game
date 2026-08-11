



const NPC_EVENT_ACHIEVEMENTS={
  npc_evt_first_visit:{name:"🏪 初次見面",desc:"第一次拜訪神秘 NPC。",category:"活動",hidden:false},
  npc_evt_talk10:{name:"💬 話匣子",desc:"與神秘 NPC 累積聊天 10 次。",category:"活動",hidden:false},
  npc_evt_aff20:{name:"💗 漸漸熟悉",desc:"NPC 好感達到 20。",category:"活動",hidden:false},
  npc_evt_aff60:{name:"💕 我們很熟了吧？",desc:"NPC 好感達到 60。",category:"活動",hidden:false},
  npc_evt_aff100:{name:"🌸 她記得你",desc:"NPC 好感達到 100。",category:"活動",hidden:false},
  npc_evt_buy10:{name:"🛍️ 常客",desc:"在神秘商店累積購買 10 件商品。",category:"活動",hidden:false},
  npc_evt_buy30:{name:"💸 老闆，我又來了",desc:"在神秘商店累積購買 30 件商品。",category:"活動",hidden:false},
  npc_evt_cat10:{name:"🐈 貓派",desc:"摸店貓累積 10 次。",category:"活動",hidden:false},
  npc_evt_cat70:{name:"🐾 比店長還熟",desc:"店貓親密度達到 70。",category:"活動",hidden:true},
  npc_evt_candy1:{name:"🍬 手癢",desc:"第一次偷拿櫃檯糖果。",category:"活動",hidden:true},
  npc_evt_candy5:{name:"🍭 慣犯",desc:"偷拿櫃檯糖果累積 5 次。",category:"活動",hidden:true},
  npc_evt_caught:{name:"👀 被抓到了",desc:"偷糖果時被店長當場抓包。",category:"活動",hidden:true},
  npc_evt_help1:{name:"💼 今天我上班？",desc:"第一次幫忙顧店。",category:"活動",hidden:false},
  npc_evt_help10:{name:"🧹 半個店員",desc:"幫忙顧店累積 10 次。",category:"活動",hidden:false},
  npc_evt_night:{name:"🌙 閉店之後",desc:"觸發打烊後特殊互動。",category:"活動",hidden:true},
  npc_evt_paperstar:{name:"⭐ 消失的紙星星",desc:"取得紙星星的神秘傳聞。",category:"活動",hidden:false},
  npc_evt_blackbox:{name:"🔐 不該買的東西",desc:"買下櫃檯下的黑盒。",category:"活動",hidden:true},
  npc_evt_allgoods:{name:"📦 收藏家",desc:"買過神秘商店目前所有商品。",category:"活動",hidden:false},
  npc_evt_relation:{name:"✨ 我們是什麼關係？",desc:"完成第一位 NPC 的最終關係劇情。",category:"活動",hidden:false},
  npc_evt_weird_relation:{name:"❓ 這也算一種關係",desc:"取得特殊或搞笑 NPC 關係結局。",category:"活動",hidden:true},
  npc_evt_master:{name:"🏆 店裡的老面孔",desc:"完成本次 NPC 登場活動指定成就。",category:"活動",hidden:false}
};

function ensureNpcActivityAchievements(){
  if(typeof achievementDefs!=="undefined"){
    for(const [id,d] of Object.entries(NPC_EVENT_ACHIEVEMENTS)){
      if(!achievementDefs[id]){
        achievementDefs[id]={
          name:d.name,
          desc:d.desc,
          category:d.category,
          hidden:!!d.hidden
        };
      }
    }
  }
}



const NPC_RPG_STORIES={
  shop_story_01:[
    {speaker:"旁白",text:"午後的陽光落進櫥窗，整間店像灑了一層淡紫色的糖霜。"},
    {speaker:"？？？",text:"「歡迎光臨～……啊，又是你。」"},
    {speaker:"你",text:"「妳已經記得我了？」"},
    {speaker:"？？？",text:"她低頭整理緞帶，小聲說：「因為你最近真的很常來。」"},
    {speaker:"旁白",text:"店貓從櫃檯探出頭，像是在替她作證。"},
    {speaker:"？？？",text:"「今天也是……只是來看看？」"},
    {speaker:"你",text:"「嗯，順便看看妳。」"},
    {speaker:"？？？",text:"她手上的緞帶突然打了個結。"}
  ],
  shop_story_02:[
    {speaker:"？？？",text:"「我問你一件很奇怪的事喔。」"},
    {speaker:"你",text:"「妳這間店本來就很多奇怪的事。」"},
    {speaker:"？？？",text:"「……那你不要聽。」"},
    {speaker:"你",text:"「好啦，我聽。」"},
    {speaker:"？？？",text:"她從抽屜拿出一顆小小的紙星星。"},
    {speaker:"？？？",text:"「最近每天早上，門口都會出現一顆這個。」"},
    {speaker:"？？？",text:"「我收起來，晚上它又會不見。」"},
    {speaker:"你",text:"「聽起來像有人在偷偷送妳東西。」"},
    {speaker:"？？？",text:"她看你一眼。「……你很在意喔？」"},
    {speaker:"旁白",text:"店貓在旁邊甩了甩尾巴，像是知道答案。"}
  ],
  shop_story_03:[
    {speaker:"旁白",text:"營業牌已經翻到「休息中」，你卻還坐在櫃檯前。"},
    {speaker:"？？？",text:"「你今天真的不打算走？」"},
    {speaker:"你",text:"「等妳收完。」"},
    {speaker:"？？？",text:"「我收店很慢喔。」"},
    {speaker:"你",text:"「那就慢慢來。」"},
    {speaker:"旁白",text:"她安靜了一會，把剛泡好的熱飲推到你面前。"},
    {speaker:"？？？",text:"「……那至少幫我把這杯喝掉。」"},
    {speaker:"你",text:"「這算員工福利？」"},
    {speaker:"？？？",text:"「你又不是員工。」"},
    {speaker:"旁白",text:"話是這麼說，她卻在你旁邊坐了下來。"}
  ],
  shop_story_04:[
    {speaker:"旁白",text:"店貓突然鑽到櫃檯後方，叼出一張拍立得。"},
    {speaker:"？？？",text:"「等等，那個不行——」"},
    {speaker:"旁白",text:"照片裡的她比現在青澀一些，懷裡抱著同一隻貓。"},
    {speaker:"你",text:"「牠以前就陪著妳了？」"},
    {speaker:"？？？",text:"她把照片接回去，沒有立刻收起來。"},
    {speaker:"？？？",text:"「嗯。那時候……這間店還沒有名字。」"},
    {speaker:"你",text:"「妳願意跟我說？」"},
    {speaker:"？？？",text:"「因為是你啊。」"},
    {speaker:"旁白",text:"說完這句，她自己先愣住了。"}
  ],
  shop_event_first:[
    {speaker:"旁白",text:"你推開一扇以前沒注意過的門，風鈴發出清脆的聲音。"},
    {speaker:"？？？",text:"「歡迎光臨～第一次來嗎？」"},
    {speaker:"旁白",text:"櫃檯後的女孩抬起頭，身旁的貓也跟著看向你。"},
    {speaker:"？？？",text:"「不用緊張，這裡沒有什麼奇怪規矩。」"},
    {speaker:"旁白",text:"店貓伸出爪子，直接把一顆糖推到你面前。"},
    {speaker:"？？？",text:"「……牠倒是先招待你了。」"}
  ],
  shop_event_candy:[
    {speaker:"旁白",text:"櫃檯旁放著一小罐糖果。"},
    {speaker:"旁白",text:"你偷偷伸出手。"},
    {speaker:"？？？",text:"「……」"},
    {speaker:"旁白",text:"你總覺得她明明看到了。"},
    {speaker:"？？？",text:"「拿了就記得下次買東西。」"},
    {speaker:"旁白",text:"果然被發現了。"}
  ],
  shop_event_cat:[
    {speaker:"旁白",text:"店貓今天沒有像平常那樣待在櫃檯。"},
    {speaker:"旁白",text:"牠走到後門，又回頭看了你一眼。"},
    {speaker:"你",text:"「……要我跟上去？」"},
    {speaker:"？？？",text:"「牠平常不會帶客人亂跑喔。」"},
    {speaker:"旁白",text:"她的語氣聽起來也有些意外。"}
  ],
  shop_event_blackbox:[
    {speaker:"旁白",text:"黑色盒子放在你的手心裡，意外地沉。"},
    {speaker:"你",text:"「這到底是什麼？」"},
    {speaker:"？？？",text:"「……你真的買了喔。」"},
    {speaker:"旁白",text:"她第一次露出像是不知道該說什麼的表情。"},
    {speaker:"？？？",text:"「先收好。現在不要打開。」"},
    {speaker:"你",text:"「為什麼？」"},
    {speaker:"？？？",text:"「因為現在還不是時候。」"}
  ],
  shop_event_night:[
    {speaker:"旁白",text:"打烊後，店裡只剩水晶燈的淡光。"},
    {speaker:"？？？",text:"「白天一直有人，我其實很少能像現在這樣坐著。」"},
    {speaker:"你",text:"「那我是不是打擾妳休息？」"},
    {speaker:"？？？",text:"她托著臉看你。「如果是打擾，我早就把你趕走了。」"},
    {speaker:"旁白",text:"你們之間安靜了一會，卻一點也不尷尬。"},
    {speaker:"？？？",text:"「……明天也來嗎？」"}
  ]
};

function shopkeeperEndingStory(type,note){
  const base=[
    {speaker:"旁白",text:"夜已經很深了。最後一盞水晶燈還亮著。"},
    {speaker:"？？？",text:"「你今天又待到這麼晚。」"},
    {speaker:"你",text:"「因為總覺得……還不想走。」"},
    {speaker:"旁白",text:"她沒有立刻回答，只是輕輕摸了摸趴在櫃檯上的貓。"}
  ];
  const endings={
    lover:[
      {speaker:"？？？",text:"「那以後，也可以不用找理由來。」"},
      {speaker:"你",text:"「什麼意思？」"},
      {speaker:"？？？",text:"「就是……想見我的時候就來。」"},
      {speaker:"旁白",text:"她終於抬眼看你，神情比平常柔和得多。"},
      {speaker:"？？？",text:"「反正我也會等你。」"}
    ],
    bestfriend:[
      {speaker:"？？？",text:"「真奇怪，明明只是個客人。」"},
      {speaker:"？？？",text:"「結果現在連最麻煩的事情都會想找你幫忙。」"},
      {speaker:"你",text:"「那我算半個店員？」"},
      {speaker:"？？？",text:"「想得美。最多算我最信得過的人。」"}
    ],
    confidant:[
      {speaker:"？？？",text:"「有些事情，我本來以為永遠不會跟別人說。」"},
      {speaker:"旁白",text:"她慢慢拉開櫃檯下方的抽屜。"},
      {speaker:"？？？",text:"「可是如果是你的話……好像沒關係。」"}
    ],
    bickering:[
      {speaker:"？？？",text:"「你真的很煩。」"},
      {speaker:"你",text:"「可是妳每次還是讓我進來。」"},
      {speaker:"？？？",text:"「……那是因為趕你出去更麻煩。」"},
      {speaker:"旁白",text:"她翻了個白眼，卻把你的杯子又添滿了。"}
    ],
    catfriend:[
      {speaker:"旁白",text:"店貓熟練地跳到你腿上趴好。"},
      {speaker:"？？？",text:"「牠是不是比我還喜歡你？」"},
      {speaker:"你",text:"「我今天主要也是來看牠。」"},
      {speaker:"？？？",text:"「……出去。」"},
      {speaker:"旁白",text:"她說得很兇，卻忍不住笑了。"}
    ],
    regular:[
      {speaker:"？？？",text:"「我已經不用問你要什麼了。」"},
      {speaker:"旁白",text:"你常買的東西早就被她放到了櫃檯旁。"},
      {speaker:"？？？",text:"「你哪天突然不來，我大概反而會覺得很奇怪。」"},
      {speaker:"旁白",text:"有些關係沒有特別的名字，卻已經成了每天的一部分。"}
    ]
  };
  return [...base,...(endings[type]||endings.regular),{speaker:"旁白",text:`【NPC 關係收藏】${NPC_RELATION_LABELS[type]}\n${note||NPC_RELATION_NOTES[type]||""}`}];
}

let npcStoryPlayerState=null;
function startNpcRpgStory({title="",lines=[],onComplete=null}){
  if(!Array.isArray(lines)||!lines.length)return;
  npcStoryPlayerState={title,lines,index:0,onComplete,finished:false};
  document.getElementById("npcStoryPlayer")?.classList.remove("hidden");
  renderNpcRpgLine();
}
function renderNpcRpgLine(){
  let st=npcStoryPlayerState;if(!st)return;
  let line=st.lines[st.index];if(!line)return;
  let speaker=String(line.speaker||"旁白");
  document.getElementById("npcStorySpeaker").textContent=speaker;
  document.getElementById("npcStoryText").textContent=line.text||"";
  document.querySelector(".npcStoryStage")?.classList.toggle("narration",speaker==="旁白");
  let choiceBox=document.getElementById("npcStoryChoices");
  let hint=document.getElementById("npcStoryTapHint");
  if(Array.isArray(line.choices)&&line.choices.length){
    choiceBox.classList.remove("hidden");
    choiceBox.innerHTML=line.choices.map((c,i)=>`<button data-rpg-choice="${i}">${esc(c.label)}</button>`).join("");
    choiceBox._choices=line.choices;
    hint.classList.add("hidden");
  }else{
    choiceBox.classList.add("hidden");
    choiceBox.innerHTML="";
    hint.classList.remove("hidden");
  }
}
function advanceNpcRpgStory(){
  let st=npcStoryPlayerState;if(!st)return;
  let line=st.lines[st.index];
  if(Array.isArray(line?.choices)&&line.choices.length)return;
  if(st.index<st.lines.length-1){
    st.index++;
    renderNpcRpgLine();
    return;
  }
  finishNpcRpgStory();
}
function finishNpcRpgStory(){
  let st=npcStoryPlayerState;if(!st||st.finished)return;
  st.finished=true;
  document.getElementById("npcStoryPlayer")?.classList.add("hidden");
  let done=st.onComplete;
  npcStoryPlayerState=null;
  if(typeof done==="function")done();
}
function cancelNpcRpgStory(){
  document.getElementById("npcStoryPlayer")?.classList.add("hidden");
  npcStoryPlayerState=null;
}

const NPC_STORY_LIBRARY={
  shopkeeper_cat:{
    personal:[
      {id:"shop_story_01",title:"第一章・常來的客人",unlock:st=>st.affection>=20,text:"她已經能在你進門前認出你的腳步聲。"},
      {id:"shop_story_02",title:"第二章・河堤的傳聞",unlock:st=>st.affection>=40,text:"她第一次主動告訴你城鎮裡的秘密。"},
      {id:"shop_story_03",title:"第三章・打烊之後",unlock:st=>st.affection>=60||!!st.flags?.nightEvent,text:"有些話，只有店門關起來後，她才願意說。"},
      {id:"shop_story_04",title:"第四章・店長的秘密",unlock:st=>st.affection>=80,text:"櫃檯後那張從沒被翻過去的照片，似乎與她的過去有關。"},
      {id:"shop_story_05",title:"終章・不只是客人",unlock:(st,c)=>!!getNpcRelationship(c,"shopkeeper_cat"),text:"一路以來的選擇，最後成為了只屬於你們的關係。"}
    ],
    event:[
      {id:"shop_event_first",title:"🎊 初次相遇",unlock:st=>!!st.flags?.visited,text:"你第一次走進這間店，與她打了照面。"},
      {id:"shop_event_candy",title:"🎊 櫃檯糖果事件",unlock:st=>(st.candyCount||0)>=1,text:"你曾經對櫃檯上的糖果伸出手。至於有沒有被發現……只有你們知道。"},
      {id:"shop_event_cat",title:"🎊 店貓的小秘密",unlock:st=>(st.cat||0)>=70,text:"那隻總待在店裡的貓，似乎比想像中知道更多事情。"},
      {id:"shop_event_blackbox",title:"🎊 黑盒",unlock:(st,c)=>Number(c?.inventory?.npc_under_counter||0)>0||!!st.flags?.blackBoxOwned,text:"你買下了那個本來不該出現在商品架上的黑盒。"},
      {id:"shop_event_night",title:"🎊 閉店之後",unlock:st=>!!st.flags?.nightEvent,text:"打烊後的店裡，比白天安靜得多。她也比平時更願意說真話。"}
    ]
  }
};

function npcStoryCollection(npcId,c){
  let lib=NPC_STORY_LIBRARY[npcId]||{personal:[],event:[]},st=npcState();
  const map=x=>x.map(a=>({...a,unlocked:!!a.unlock(st,c)}));
  return {personal:map(lib.personal),event:map(lib.event)};
}
function openNpcStory(npcId,kind,id){
  let c=cur();if(!c)return;
  let groups=npcStoryCollection(npcId,c);
  let story=(groups[kind]||[]).find(x=>x.id===id);
  if(!story||!story.unlocked)return toast("🔒 這段故事尚未收藏。");
  let lines=NPC_RPG_STORIES[id]||[{speaker:"旁白",text:story.text||"這段回憶仍然很清晰。"}];
  startNpcRpgStory({title:story.title,lines});
}
function openNpcDetail(npcId){
  let c=cur(),def=NPC_RELATION_REGISTRY[npcId];if(!c||!def)return;
  let st=npcState(),rel=getNpcRelationship(c,npcId);
  let stories=npcStoryCollection(npcId,c);
  let pc=stories.personal.filter(x=>x.unlocked).length,ec=stories.event.filter(x=>x.unlocked).length;
  document.getElementById("npcDetailName").textContent=def.name;
  document.getElementById("npcDetailBody").innerHTML=`
    <div class="npcDetailHero">
      <img src="${esc(def.image)}" alt="">
      <div>
        <b style="font-size:18px">${esc(def.name)}</b>
        <div class="small">NPC 關係收藏</div>
        <div class="npcRelationStatus ${npcRelationClass(rel?.type)}" style="margin-top:7px">
          ${esc(rel?NPC_RELATION_LABELS[rel.type]:"尚未取得最終關係")}
        </div>
        ${rel?.note?`<div class="small" style="margin-top:8px"><b>備註：</b>${esc(rel.note)}</div>`:""}
      </div>
    </div>
    <div class="npcDetailSection">
      <h3>📊 特殊資料</h3>
      <div class="small">💗 好感：${st.affection}/100</div>
      <div class="small">🤝 目前關係：${typeof npcRelationStage==="function"?npcRelationStage(st):"初識"}</div>
      <div class="small">💭 ${st.affection>=80?"她似乎已經開始期待你來店裡了。":st.affection>=60?"她和你說話時比以前自然多了。":st.affection>=30?"她已經記得你是常來的客人。":"你們還在慢慢認識彼此。"}</div>
      <div class="small">🛍️ 熟客度：${st.loyalty}</div>
      <div class="small">🐈 店貓親密：${st.cat}/100</div>
      <div class="small">💬 聊天：${st.chatCount||0} 次・💼 顧店：${st.helpCount||0} 次・🛒 購買：${st.purchaseCount||0} 件</div>
    </div>
    <div class="npcDetailSection">
      <h3>📖 個人故事 ${pc}/${stories.personal.length}</h3>
      <div class="npcStoryCollect">
        ${stories.personal.map(x=>`<button class="${x.unlocked?"":"locked"}" data-npc-story="personal|${x.id}">${x.unlocked?esc(x.title):"🔒 ???"}</button>`).join("")}
      </div>
    </div>
    <div class="npcDetailSection">
      <h3>🎊 活動故事 ${ec}/${stories.event.length}</h3>
      <div class="npcStoryCollect">
        ${stories.event.map(x=>`<button class="${x.unlocked?"":"locked"}" data-npc-story="event|${x.id}">${x.unlocked?esc(x.title):"🔒 ???"}</button>`).join("")}
      </div>
      <div class="small" style="margin-top:7px">已收藏的活動故事會留在這裡，之後可以重新觀看。</div>
    </div>`;
  document.getElementById("npcDetailModal").classList.remove("hidden");
}

function npcIsGM(){
  try{
    return !!(window.gmSession || localStorage.getItem("role_life_gm_session") || document.getElementById("gmLogoutBtn")?.classList.contains("hidden")===false);
  }catch(e){return false}
}
function syncNpcDebugVisibility(){
  document.getElementById("npcDebugBtn")?.classList.toggle("hidden",!npcIsGM());
}
function renderNpcDebug(){
  let st=npcState(),c=cur();
  document.getElementById("npcDebugBody").innerHTML=`
    <div class="npcDebugStat">
      💗 ${st.affection}/100　🛍️ ${st.loyalty}　🐈 ${st.cat}/100<br>
      💬 ${st.chatCount||0}　💼 ${st.helpCount||0}　🛒 ${st.purchaseCount||0}<br>
      戀愛 ${st.relationScore?.romance||0}・信任 ${st.relationScore?.trust||0}・惡作劇 ${st.relationScore?.tease||0}・貓線 ${st.relationScore?.catChoice||0}<br>
      最終關係：${c&&getNpcRelationship(c,"shopkeeper_cat")?NPC_RELATION_LABELS[getNpcRelationship(c,"shopkeeper_cat").type]:"未判定"}
    </div>
    <div class="npcDebugGrid">
      <button data-npc-debug="aff20">好感 20</button>
      <button data-npc-debug="aff40">好感 40</button>
      <button data-npc-debug="aff60">好感 60</button>
      <button data-npc-debug="aff80">好感 80</button>
      <button data-npc-debug="aff100">好感 100</button>
      <button data-npc-debug="loyal30">熟客 30</button>
      <button data-npc-debug="cat100">店貓 100</button>
      <button data-npc-debug="talk10">聊天 10</button>
      <button data-npc-debug="help10">顧店 10</button>
      <button data-npc-debug="buy30">購買 30</button>
      <button data-npc-debug="romance" class="npcDebugFull">💗 戀愛傾向 +10</button>
      <button data-npc-debug="trust" class="npcDebugFull">🌸 信任傾向 +10</button>
      <button data-npc-debug="tease" class="npcDebugFull">💢 惡作劇傾向 +10</button>
      <button data-npc-debug="catroute" class="npcDebugFull">🐈 貓線傾向 +10</button>
      <button data-npc-debug="final" class="primary npcDebugFull">✨ 直接測最終關係判定</button>
      <button data-npc-debug="unlockstories" class="npcDebugFull">📖 解鎖大部分故事條件</button>
      <button data-npc-debug="reset" class="danger npcDebugFull">♻️ 重置這位 NPC 測試資料</button>
    </div>`;
}
function openNpcDebug(){
  if(!npcIsGM())return toast("只有 GM 可以使用 NPC 快速測試。");
  renderNpcDebug();
  document.getElementById("npcDebugModal").classList.remove("hidden");
}
function runNpcDebug(action){
  if(!npcIsGM())return;
  let st=npcState(),c=cur();if(!c)return toast("請先進入角色。");
  st.relationScore??={romance:0,trust:0,tease:0,catChoice:0};
  if(action==="aff20")st.affection=20;
  if(action==="aff40")st.affection=40;
  if(action==="aff60")st.affection=60;
  if(action==="aff80")st.affection=80;
  if(action==="aff100")st.affection=100;
  if(action==="loyal30")st.loyalty=30;
  if(action==="cat100")st.cat=100;
  if(action==="talk10")st.chatCount=10;
  if(action==="help10")st.helpCount=10;
  if(action==="buy30")st.purchaseCount=30;
  if(action==="romance")st.relationScore.romance=Number(st.relationScore.romance||0)+10;
  if(action==="trust")st.relationScore.trust=Number(st.relationScore.trust||0)+10;
  if(action==="tease")st.relationScore.tease=Number(st.relationScore.tease||0)+10;
  if(action==="catroute"){st.cat=100;st.relationScore.catChoice=Number(st.relationScore.catChoice||0)+10}
  if(action==="unlockstories"){st.affection=100;st.flags.visited=1;st.flags.nightEvent=1;st.flags.paperStarRumor=1;st.cat=80}
  if(action==="reset"){
    if(!confirm("確定重置目前裝置的 NPC 測試資料與目前角色的 NPC 關係收藏？"))return;
    localStorage.removeItem(NPC_SHOP_KEY);
    ensureNpcRelationships(c);delete c.npcRelationships.shopkeeper_cat;saveLocal();
    renderNpcDebug();renderNpcRelationships();toast("♻️ NPC 測試資料已重置",3000);return;
  }
  saveNpcState(st);reconcileNpcEventAchievements();saveLocal();
  if(action==="final"){document.getElementById("npcDebugModal").classList.add("hidden");finalizeShopkeeperRelation();return}
  renderNpcDebug();renderNpcRelationships();toast("🧪 測試數值已更新",2200);
}

const NPC_RELATION_REGISTRY={
  shopkeeper_cat:{
    id:"shopkeeper_cat",
    name:"神秘店長",
    image:"assets/npc/shopkeeper_cat/normal.png",
    source:"貓貓商店",
    allowed:["lover","bestfriend","confidant","bickering","catfriend","regular"]
  }
};
const NPC_RELATION_LABELS={
  none:"尚未建立",
  lover:"💗 戀人",
  bestfriend:"🌟 摯友",
  confidant:"🌸 知己",
  bickering:"💢 歡喜冤家",
  catfriend:"🐈 貓友",
  regular:"🛍️ 特別的常客"
};
const NPC_RELATION_NOTES={
  lover:"從常來光顧的客人，成為了她最期待推門而入的人。",
  bestfriend:"你們之間已經不需要客套，連沉默都很自在。",
  confidant:"她願意把從不對別人提起的事情告訴你。",
  bickering:"總是互相吐槽，但彼此似乎比誰都熟悉。",
  catfriend:"你究竟是來找她，還是來找她的貓，至今仍是個謎。",
  regular:"你是她一眼就能認出的熟客，也是這間店裡不可或缺的日常。"
};

function ensureNpcRelationships(c){
  if(!c)return {};
  c.npcRelationships??={};
  return c.npcRelationships;
}
function getNpcRelationship(c,npcId){
  let map=ensureNpcRelationships(c);
  return map[npcId]||null;
}
function setNpcRelationship(c,npcId,type,note=""){
  if(!c||!NPC_RELATION_REGISTRY[npcId])return false;
  let def=NPC_RELATION_REGISTRY[npcId];
  if(!def.allowed.includes(type))return false;
  let map=ensureNpcRelationships(c);
  if(map[npcId])return false; // permanent collection: once decided, never changes
  map[npcId]={
    npcId,
    type,
    note:note||NPC_RELATION_NOTES[type]||"",
    since:new Date().toISOString(),
    locked:true
  };
  saveLocal();
  return true;
}
function npcRelationClass(type){
  return type==="lover"?"lover":type==="bestfriend"?"bestfriend":type==="confidant"?"confidant":"";
}
function renderNpcRelationships(){
  syncNpcDebugVisibility();
  refreshNpcEventPeriodHint?.();
  let box=document.getElementById("npcRelationshipList"),c=cur();
  if(!box||!c)return;
  ensureNpcRelationships(c);
  let st=npcState();
  let defs=Object.values(NPC_RELATION_REGISTRY);
  box.innerHTML=defs.map(def=>{
    let rel=getNpcRelationship(c,def.id);
    let unlocked=def.id!=="shopkeeper_cat"||st.affection>=100;
    let status=rel?NPC_RELATION_LABELS[rel.type]:"尚未建立特殊關係";
    let since=rel?.since?new Date(rel.since).toLocaleDateString("zh-TW"):"";
    return `<div class="npcRelationCard ${unlocked?"":"npcRelationLocked"}" data-npc-detail="${def.id}" style="cursor:pointer">
      <div class="npcRelationPic"><img src="${esc(def.image)}" alt=""></div>
      <div class="npcRelationMeta">
        <b>${esc(def.name)}</b>
        <div class="small">單人 NPC 關係・不占真人關係名額</div>
        <span class="npcRelationStatus ${npcRelationClass(rel?.type)}">${esc(status)}</span>
        ${since?`<div class="small">建立於 ${esc(since)}</div>`:""}
        ${rel?.note?`<div class="small" style="margin-top:6px"><b>備註：</b>${esc(rel.note)}</div>`:""}
        <div class="small" style="margin-top:6px">${
          rel
            ?"這段關係已成為永久收藏，不會再轉變；其他 NPC 仍可擁有自己的結局收藏。"
            :unlocked
              ?"最終劇情將依你一路上的選擇自動判定關係。"
              :"與這位 NPC 的故事還沒有走到最終章。"
        }</div>
        <div class="npcRelationActions">
          ${rel?`<button data-npc-rel-view="${def.id}">📖 關係資訊</button>`:""}
        </div>
      </div>
    </div>`;
  }).join("");
}

function judgeShopkeeperRelation(){
  let st=npcState();
  let score=st.relationScore||{};
  const romance=Number(score.romance||0);
  const trust=Number(score.trust||0);
  const tease=Number(score.tease||0);
  const cat=Number(st.cat||0);
  const buys=Number(st.purchaseCount||0);
  const chats=Number(st.chatCount||0);

  // Strong cat-focused route.
  if(cat>=80 && cat>=st.affection-5 && (score.catChoice||0)>=3){
    return {type:"catfriend",note:NPC_RELATION_NOTES.catfriend};
  }
  // Playful / troublemaker route.
  if(tease>=8 && tease>=romance+2){
    return {type:"bickering",note:NPC_RELATION_NOTES.bickering};
  }
  // Romance route.
  if(romance>=8 && romance>=trust && st.affection>=100){
    return {type:"lover",note:NPC_RELATION_NOTES.lover};
  }
  // Deep trust route.
  if(trust>=9 && chats>=10){
    return {type:"confidant",note:NPC_RELATION_NOTES.confidant};
  }
  // Friendship route.
  if((st.helpCount||0)>=5 || trust>=6){
    return {type:"bestfriend",note:NPC_RELATION_NOTES.bestfriend};
  }
  // Default long-term customer route.
  return {type:"regular",note:NPC_RELATION_NOTES.regular};
}
function finalizeShopkeeperRelation(){
  let c=cur();if(!c)return toast("請先進入角色。");
  let old=getNpcRelationship(c,"shopkeeper_cat");
  if(old)return openNpcDetail("shopkeeper_cat");
  let st=npcState();
  if(st.affection<100)return toast("💗 好感尚未達到最終劇情條件。");

  let result=judgeShopkeeperRelation();
  let lines=shopkeeperEndingStory(result.type,result.note);

  startNpcRpgStory({
    title:"最終章",
    lines,
    onComplete:()=>{
      if(setNpcRelationship(c,"shopkeeper_cat",result.type,result.note)){
        let x=npcState();x.flags.npcRelationFinalized=1;saveNpcState(x);
        ensureNpcActivityAchievements();
        c.achievements??={};
        c.achievements.npc_evt_relation=1;
        if(["bickering","catfriend","regular"].includes(result.type))c.achievements.npc_evt_weird_relation=1;
        saveLocal();
        reconcileNpcEventAchievements();
        renderNpcRelationships();
        toast(`✨ NPC 關係收藏：${NPC_RELATION_LABELS[result.type]}`,5000);
      }
    }
  });
}
function viewNpcRelationship(npcId){
  let c=cur(),def=NPC_RELATION_REGISTRY[npcId],rel=getNpcRelationship(c,npcId);
  if(!c||!def||!rel)return;
  let extra=rel.type==="lover"
    ?"已解鎖：戀人後續互動架構（之後可加入約會、紀念日、戀愛後日談）。"
    :rel.type==="bestfriend"
      ?"已解鎖：摯友後續互動架構（之後可加入秘密、求助、友情事件）。"
      :"已解鎖：知己後續互動架構（之後可加入深夜談心、特殊情報、專屬故事）。";
  npcChoice("✨ NPC 關係資訊",
    `<b>${esc(def.name)}</b><br><br>
     目前關係：<b>${esc(NPC_RELATION_LABELS[rel.type])}</b><br>
     建立日期：${esc(new Date(rel.since).toLocaleDateString("zh-TW"))}<br>
     備註：${esc(rel.note||NPC_RELATION_NOTES[rel.type]||"")}<br><br>
     ${esc(extra)}<br><br>
     <span class="small">NPC 關係與真人玩家關係完全獨立；其他 NPC 可以另外建立自己的關係。</span>`,
    [{label:"知道了",fn:()=>{}}]
  );
}
document.getElementById("npcRelationshipList")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-npc-rel-view]");
  if(b){e.stopPropagation();return openNpcDetail(b.dataset.npcRelView);}
  let card=e.target.closest("[data-npc-detail]");
  if(card)return openNpcDetail(card.dataset.npcDetail);
});


const NPC_ITEM_EFFECTS={
  npc_crystal_chip:{
    name:"💎 紫晶碎片",
    use:"特殊探索材料。部分 NPC／城鎮事件會出現額外選項，特定隱藏劇情會消耗。"
  },
  npc_cat_cookie:{
    name:"🐾 貓掌餅乾",
    use:"可餵店貓。使用 1 個增加店貓親密度 +8，並可能觸發店貓小事件。"
  },
  npc_lucky_bell:{
    name:"🔔 小幸運鈴",
    use:"持有型道具，不消耗。未來城鎮『四處走走』遇到稀有事件機率提高，並可解鎖鈴鐺專屬事件。"
  },
  npc_regular_box:{
    name:"🎁 熟客小盒",
    use:"可開啟。隨機獲得金幣、一般道具、好感禮物，低機率特殊收藏品。"
  },
  npc_under_counter:{
    name:"🔐 櫃檯下的黑盒",
    use:"一次性隱藏收藏。不能丟棄、不能轉送，符合條件後會觸發秘密劇情。"
  }
};
function useNpcShopItem(itemId){
  let c=cur();if(!c)return toast("請先進入角色。");
  c.inventory??={};
  let n=Number(c.inventory[itemId]||0);
  if(n<=0)return toast("背包裡沒有這個道具。");

  if(itemId==="npc_cat_cookie"){
    c.inventory[itemId]=n-1;
    let st=npcState();st.cat=Math.min(100,Number(st.cat||0)+8);st.relationScore??={};st.relationScore.catChoice=Number(st.relationScore.catChoice||0)+2;saveNpcState(st);
    saveLocal();renderGame?.();renderNpcShop();
    if(Math.random()<0.25)npcChoice("🐈 店貓小事件","你把貓掌餅乾遞過去，店貓吃完後居然把一個不知道從哪撿來的小東西推到你腳邊。",[{label:"收下",fn:()=>toast("🐾 店貓似乎更信任你了。",3000)}]);
    else toast("🐾 店貓親密度 +8",3000);
    return;
  }

  if(itemId==="npc_regular_box"){
    c.inventory[itemId]=n-1;
    const roll=Math.random();
    if(roll<0.35){
      let gain=80+Math.floor(Math.random()*121);
      c.money=safeMoney(Number(c.money||0)+gain);
      toast(`🎁 熟客小盒：🪙 +${gain}`,3500);
    }else if(roll<0.7){
      const ids=["snack","coffee","tea","lunch","drink","cake"];
      let id=ids[Math.floor(Math.random()*ids.length)];
      c.inventory[id]=(c.inventory[id]||0)+1;
      toast(`🎁 熟客小盒：獲得 ${itemDisplayName(id)}`,3500);
    }else if(roll<0.93){
      const ids=["gift_candy","gift_keychain","gift_flower","gift_letter","gift_plush","gift_music"];
      let id=ids[Math.floor(Math.random()*ids.length)];
      c.inventory[id]=(c.inventory[id]||0)+1;
      toast(`🎁 熟客小盒：獲得 ${itemDisplayName(id)}`,3500);
    }else{
      const ids=["oldkey","letter","dryflower","musicbox","ticket","ribbon","picnic","flowers"];
      let id=ids[Math.floor(Math.random()*ids.length)];
      c.inventory[id]=(c.inventory[id]||0)+1;
      toast(`✨ 熟客小盒：獲得特殊收藏 ${itemDisplayName(id)}`,4500);
    }
    if(Math.random()<0.08){
      let st=npcState();st.affection=Math.min(100,Number(st.affection||0)+3);saveNpcState(st);
      npcChoice("🎁 熟客小盒","盒子裡只有一張紙。<br><br>「不要一直買這個，笨蛋。」",[{label:"……",fn:()=>{}}]);
    }
    saveLocal();renderGame?.();renderNpcShop();
    return;
  }

  if(itemId==="npc_under_counter"){
    let st=npcState();
    st.flags.blackBoxOwned=1;
    saveNpcState(st);
    npcChoice("🔐 櫃檯下的黑盒","盒子沒有鎖孔，也沒有任何接縫。<br><br>不管怎麼看，都不像能用普通方式打開。<br><br><span class='small'>也許某個時間、某個地點，才會知道它真正的用途。</span>",[{label:"收好",fn:()=>{}}]);
    return;
  }

  if(itemId==="npc_lucky_bell"){
    toast("🔔 小幸運鈴是持有型道具。只要放在背包裡，未來探索效果就會生效。",4000);
    return;
  }

  if(itemId==="npc_crystal_chip"){
    toast("💎 紫晶碎片是特殊探索材料，目前請先保留；之後的 NPC／城鎮隱藏劇情會消耗。",4000);
    return;
  }
}

const NPC_SHOP_KEY="role_life_test_npc_shopkeeper_cat_v1";
let npcActiveTab="talk";

function npcState(){
  try{
    let x=JSON.parse(localStorage.getItem(NPC_SHOP_KEY)||"{}")||{};
    x.affection=Math.max(0,Math.min(100,Number(x.affection||0)));
    x.loyalty=Math.max(0,Number(x.loyalty||0));
    x.cat=Math.max(0,Math.min(100,Number(x.cat||0)));
    x.flags??={};x.daily??={};x.relationScore??={romance:0,trust:0,tease:0,catChoice:0};
    x.chatCount=Math.max(0,Number(x.chatCount||0));
    x.gifts=Math.max(0,Number(x.gifts||0));
    x.helpCount=Math.max(0,Number(x.helpCount||0));
    x.purchaseCount=Math.max(0,Number(x.purchaseCount||0));
    return x;
  }catch(e){return{affection:0,loyalty:0,cat:0,flags:{},daily:{},chatCount:0,gifts:0,helpCount:0,purchaseCount:0}}
}
function saveNpcState(x){localStorage.setItem(NPC_SHOP_KEY,JSON.stringify(x||{}))}
function npcToday(){return new Date().toISOString().slice(0,10)}
function npcEnsureDaily(st){
  if(st.daily?.date!==npcToday())st.daily={date:npcToday(),talk:0,gift:0,cat:0,help:0,candy:0};
}

function npcRelationScore(kind,n=1){
  let st=npcState();st.relationScore??={romance:0,trust:0,tease:0,catChoice:0};
  st.relationScore[kind]=Number(st.relationScore[kind]||0)+n;
  saveNpcState(st);
  setTimeout(()=>{try{maybePlayNpcMilestoneStory()}catch(e){}},50);
}

function npcGain(kind,n,reason){
  let st=npcState();npcEnsureDaily(st);
  if(kind==="affection")st.affection=Math.max(0,Math.min(100,st.affection+n));
  if(kind==="loyalty")st.loyalty=Math.max(0,st.loyalty+n);
  if(kind==="cat")st.cat=Math.max(0,Math.min(100,st.cat+n));
  saveNpcState(st);
  if(reason)toast(`${n>=0?"✨":"💧"} ${reason}${n?`（${n>0?"+":""}${n}）`:""}`,3200);
  npcCheckUnlocks(st);
  renderNpcShop();
}

function maybePlayNpcMilestoneStory(){
  let st=npcState();
  const checks=[
    ["shop_story_01",20],
    ["shop_story_02",40],
    ["shop_story_03",60],
    ["shop_story_04",80]
  ];
  st.flags??={};
  for(const [id,need] of checks){
    const flag="played_"+id;
    if(st.affection>=need&&!st.flags[flag]){
      st.flags[flag]=1;saveNpcState(st);
      const story=(NPC_STORY_LIBRARY.shopkeeper_cat.personal||[]).find(x=>x.id===id);
      startNpcRpgStory({title:story?.title||"故事",lines:NPC_RPG_STORIES[id]||[]});
      return true;
    }
  }
  return false;
}

function npcCheckUnlocks(st=npcState()){
  const unlock=(key,msg)=>{
    if(!st.flags[key]){st.flags[key]=1;toast(`🔓 ${msg}`,4800);document.getElementById("npcTownDot")?.classList.remove("hidden")}
  };
  if(st.affection>=20)unlock("aff20","貓貓開始記得你了");
  if(st.affection>=40)unlock("aff40","解鎖「會消失的紙星星」傳聞");
  if(st.affection>=60)unlock("aff60","解鎖打烊後的特別對話");
  if(st.affection>=80)unlock("aff80","解鎖店長個人故事・第四章");
  if(st.affection>=100)unlock("aff100","解鎖「表達心意」");
  if(st.loyalty>=10)unlock("loyal10","熟客限定商品已開放");
  if(st.loyalty>=30)unlock("loyal30","櫃檯下面似乎多了一個秘密欄位");
  if(st.cat>=30)unlock("cat30","店貓已經會主動靠近你");
  if(st.cat>=70)unlock("cat70","店貓似乎想帶你去看什麼");
  saveNpcState(st);
}

function reconcileNpcEventAchievements(){
  ensureNpcActivityAchievements();
  let c=cur();if(!c)return;
  c.achievements??={};
  let st=npcState();

  const set=id=>{if(!c.achievements[id])c.achievements[id]=1};

  if(st.flags?.visited)set("npc_evt_first_visit");
  if((st.chatCount||0)>=10)set("npc_evt_talk10");
  if((st.affection||0)>=20)set("npc_evt_aff20");
  if((st.affection||0)>=60)set("npc_evt_aff60");
  if((st.affection||0)>=100)set("npc_evt_aff100");
  if((st.purchaseCount||0)>=10)set("npc_evt_buy10");
  if((st.purchaseCount||0)>=30)set("npc_evt_buy30");
  if((st.catTouchCount||0)>=10)set("npc_evt_cat10");
  if((st.cat||0)>=70)set("npc_evt_cat70");
  if((st.candyCount||0)>=1)set("npc_evt_candy1");
  if((st.candyCount||0)>=5)set("npc_evt_candy5");
  if(st.flags?.caughtCandy)set("npc_evt_caught");
  if((st.helpCount||0)>=1)set("npc_evt_help1");
  if((st.helpCount||0)>=10)set("npc_evt_help10");
  if(st.flags?.nightEvent)set("npc_evt_night");
  if(st.flags?.paperStarRumor)set("npc_evt_paperstar");
  if((c.inventory?.npc_under_counter||0)>0)set("npc_evt_blackbox");
  const shopIds=["npc_crystal_chip","npc_cat_cookie","npc_lucky_bell","npc_regular_box","npc_under_counter"];
  if(shopIds.every(id=>(st.purchasedIds||[]).includes(id)))set("npc_evt_allgoods");
  if(getNpcRelationship(c,"shopkeeper_cat"))set("npc_evt_relation");
  let rel=getNpcRelationship(c,"shopkeeper_cat");
  if(rel&&["bickering","catfriend","regular"].includes(rel.type))set("npc_evt_weird_relation");

  const core=[
    "npc_evt_first_visit","npc_evt_talk10","npc_evt_aff20","npc_evt_aff60","npc_evt_aff100",
    "npc_evt_buy10","npc_evt_cat10","npc_evt_help1","npc_evt_paperstar","npc_evt_relation"
  ];
  if(core.every(id=>c.achievements[id]))set("npc_evt_master");
}

function npcMoodLine(st=npcState()){
  const hour=new Date().getHours();
  if(hour>=22||hour<5){
    if(st.affection>=60)return "「這麼晚還來？……算了，門我幫你留著。」";
    return "「已經打烊了喔……你怎麼還在門口？」";
  }
  if(st.affection>=100)return "「你來啦。今天……不是只為了買東西吧？」";
  if(st.affection>=80)return "「我剛才還在想你今天會不會過來。」";
  if(st.affection>=40)return "「又來啦？今天想聊天，還是想摸貓？」";
  if(st.affection>=20)return "「啊，是你。最近很常看到你呢。」";
  return "「歡迎光臨～今天想買點什麼？」";
}
function updateNpcStats(){
  let st=npcState();npcEnsureDaily(st);npcCheckUnlocks(st);
  document.getElementById("npcAffectionText").textContent=`${st.affection} / 100`;
  document.getElementById("npcLoyaltyText").textContent=st.loyalty;
  document.getElementById("npcCatText").textContent=st.cat;
  document.getElementById("npcAffectionFill").style.width=st.affection+"%";
  document.getElementById("npcLoyaltyFill").style.width=Math.min(100,st.loyalty/30*100)+"%";
  document.getElementById("npcCatFill").style.width=st.cat+"%";
  document.getElementById("npcShopMood").textContent=npcMoodLine(st);
  let hints=[];
  if(st.affection<20)hints.push(`再提升 ${20-st.affection} 好感：貓貓會開始記得你`);
  else if(st.affection<40)hints.push(`再提升 ${40-st.affection} 好感：解鎖城鎮傳聞`);
  else if(st.affection<60)hints.push(`再提升 ${60-st.affection} 好感：解鎖打烊後對話`);
  else if(st.affection<100)hints.push(`再提升 ${100-st.affection} 好感：開啟特殊關係選項`);
  if(st.loyalty<10)hints.push(`再消費 ${10-st.loyalty} 次：熟客商品`);
  document.getElementById("npcUnlockNotice").textContent=hints.join("・")||"✨ 你似乎已經把這間店探索得很熟了。";
}
function npcChoice(title,text,choices){
  document.getElementById("npcChoiceTitle").textContent=title;
  document.getElementById("npcChoiceText").innerHTML=text;
  document.getElementById("npcChoiceButtons").innerHTML=choices.map((c,i)=>`<button data-npc-choice="${i}">${c.label}</button>`).join("");
  document.getElementById("npcChoiceButtons")._choices=choices;
  document.getElementById("npcChoiceModal").classList.remove("hidden");
}
function npcCloseChoice(){document.getElementById("npcChoiceModal")?.classList.add("hidden")}
function npcTalk(){
  let st=npcState();npcEnsureDaily(st);
  const options=[
    {label:"「只是來看看妳。」",fn:()=>{
      st=npcState();npcEnsureDaily(st);st.chatCount++;st.daily.talk++;st.affection=Math.min(100,st.affection+(st.affection>=50?3:2));saveNpcState(st);
      npcRelationScore("romance",2);
      npcChoice("店長・貓貓",st.affection>=50?"貓貓怔了一下，別開視線。<br><br>「……那你看夠了嗎？」":"「看我？」她歪了歪頭。<br><br>「你這客人有點奇怪欸。」",[{label:"好像沒有。",fn:()=>{npcRelationScore("romance",1);npcGain("affection",1,"貓貓好感")}}]);
    }},
    {label:"「今天有什麼推薦？」",fn:()=>{
      st=npcState();npcEnsureDaily(st);st.chatCount++;st.daily.talk++;st.affection=Math.min(100,st.affection+1);saveNpcState(st);
      npcChoice("今日推薦","「今天的話……星辰之淚吧。雖然我也不知道你拿去要幹嘛。」<br><br>她偷偷把一個紫色小盒子往你這邊推。",[{label:"記住了。",fn:()=>{}}]);
    }},
    {label:"「最近城鎮有什麼怪事嗎？」",locked:st.affection<40,fn:()=>{
      st.flags.paperStarRumor=1;saveNpcState(st);
      npcChoice("會消失的紙星星","「最近每天早上，門口都會多一顆紙星星。」<br><br>「我明明收進抽屜了，晚上它又會不見。」<br><br>「如果你哪天比我早到……幫我看看是誰放的？」",[{label:"記下這個傳聞",fn:()=>{toast("🗺️ 已記錄：會消失的紙星星",3500)}}]);
    }},
    {label:"「妳下班後都做什麼？」",locked:st.affection<60,fn:()=>{
      npcChoice("打烊後的貓貓","她沉默幾秒，摸了摸店貓的頭。<br><br>「整理帳本、補貨……偶爾就坐在這裡發呆。」<br><br>「……你要陪我？」",[
        {label:"陪妳一下。",fn:()=>{npcRelationScore("romance",2);npcRelationScore("trust",1);npcGain("affection",4,"貓貓好感")}},
        {label:"我只是問問。",fn:()=>{npcRelationScore("tease",1);npcGain("affection",-1,"貓貓有點失望")}}
      ]);
    }}
  ];
  npcChoice("💬 跟貓貓聊天","今天想跟她聊什麼？",options.filter(x=>!x.locked).map(x=>({label:x.label,fn:x.fn})));
}
function npcPetCat(){
  let st=npcState();npcEnsureDaily(st);
  if(st.daily.cat>=3)return toast("🐈 店貓今天已經被你摸到開始懷疑人生了。",3500);
  st.daily.cat++;st.catTouchCount=Number(st.catTouchCount||0)+1;
  const roll=Math.random();
  if(roll<0.15){
    st.cat=Math.max(0,st.cat-1);saveNpcState(st);
    npcChoice("🐈 摸店貓","你伸手過去。<br><br>店貓：「哈——！」<br><br>牠毫不客氣地給了你一記貓掌。",[{label:"……對不起。",fn:()=>{}}]);
  }else if(roll<0.30 && st.cat>=20){
    st.cat=Math.min(100,st.cat+4);st.affection=Math.min(100,st.affection+1);saveNpcState(st);
    npcChoice("🐈 店貓今天心情很好","店貓主動用頭蹭了蹭你的手。<br><br>貓貓在旁邊笑了一聲：「牠平常沒這麼親人的。」",[{label:"再摸一下",fn:()=>{}}]);
  }else{
    st.cat=Math.min(100,st.cat+2);st.relationScore??={};st.relationScore.catChoice=Number(st.relationScore.catChoice||0)+1;saveNpcState(st);
    npcChoice("🐈 摸店貓","店貓瞇著眼讓你摸了幾下，看起來勉強接受你。",[{label:"好乖。",fn:()=>{}}]);
  }
  npcCheckUnlocks(st);renderNpcShop();
}
function npcStealCandy(){
  let st=npcState();npcEnsureDaily(st);
  if(st.daily.candy>=1)return toast("🍬 今天已經偷過一次了，再偷真的太明顯。",3500);
  st.daily.candy=1;st.candyCount=Number(st.candyCount||0)+1;
  const roll=Math.random();
  if(roll<0.45){
    st.affection=Math.max(0,st.affection-2);st.relationScore??={};st.relationScore.tease=Number(st.relationScore.tease||0)+2;st.flags.caughtCandy=1;saveNpcState(st);
    npcChoice("🍬 偷拿櫃檯糖果","你的手才剛伸過去——<br><br>「我有看到喔。」<br><br>貓貓笑得很溫柔，但你覺得背後有點涼。",[{label:"默默把糖放回去",fn:()=>{}}]);
  }else if(roll<0.75 && st.affection>=40){
    st.affection=Math.min(100,st.affection+1);saveNpcState(st);
    npcChoice("🍬 她真的沒看到嗎？","你成功拿走一顆糖。<br><br>轉身前，你似乎看見貓貓嘴角偷偷翹了一下。",[{label:"……她是故意的吧？",fn:()=>{}}]);
  }else{
    saveNpcState(st);
    npcChoice("🍬 成功！","你趁她低頭整理帳本時拿走了一顆糖。<br><br>至少目前沒被發現。",[{label:"迅速收好",fn:()=>{}}]);
  }
  renderNpcShop();
}
function npcHelpShop(){
  let st=npcState();npcEnsureDaily(st);
  if(st.daily.help>=1)return toast("💼 今天已經幫過忙了，明天再來。",3200);
  st.daily.help=1;st.helpCount++;
  saveNpcState(st);
  const events=[
    {
      text:"一名客人拿著商品不停殺價，最後還說「隔壁比較便宜」。貓貓默默看向你。",
      choices:[
        {label:"禮貌說明本店價格固定",a:3,l:1},
        {label:"直接叫他去隔壁買",a:1,l:1},
        {label:"幫客人一起殺價",a:-3,l:0}
      ]
    },
    {
      text:"店貓突然跳上架子，把一排小盒子全掃到地上。",
      choices:[
        {label:"先接住店貓",a:2,l:1,cat:3},
        {label:"先救商品",a:2,l:2,cat:0},
        {label:"站在旁邊笑",a:-1,l:0,cat:1}
      ]
    },
    {
      text:"補貨時你發現有一個沒有標價、也沒有商品編號的黑色小盒子。",
      choices:[
        {label:"交給貓貓",a:4,l:1,flag:"blackBox"},
        {label:"偷偷打開",a:-2,l:0,flag:"openedBlackBox"},
        {label:"當作沒看到",a:0,l:1}
      ]
    }
  ];
  const ev=events[Math.floor(Math.random()*events.length)];
  npcChoice("💼 幫忙顧店",ev.text,ev.choices.map(c=>({label:c.label,fn:()=>{
    let x=npcState();x.affection=Math.max(0,Math.min(100,x.affection+(c.a||0)));x.loyalty+=c.l||0;x.cat=Math.max(0,Math.min(100,x.cat+(c.cat||0)));x.relationScore??={};x.relationScore.trust=Number(x.relationScore.trust||0)+(c.a>=2?1:0);if(c.flag)x.flags[c.flag]=1;saveNpcState(x);npcCheckUnlocks(x);renderNpcShop();toast("💼 顧店事件完成",3000)
  }})));
}
function npcGiveGift(){
  let st=npcState();npcEnsureDaily(st);
  if(st.daily.gift>=2)return toast("🎁 今天已經送過兩次禮物了。",3200);
  const gifts=[
    {name:"🍬 手工糖果",a:2},
    {name:"🌷 一枝小花",a:4},
    {name:"📮 手寫卡片",a:5},
    {name:"🎵 音樂小盒",a:8},
    {name:"🐟 貓罐頭（其實是送店貓）",a:2,cat:8}
  ];
  npcChoice("🎁 送禮物","你想送什麼？<br><span class='small'>NPC 測試版目前不扣玩家背包，先測好感與劇情流程。</span>",gifts.map(g=>({label:g.name,fn:()=>{
    let x=npcState();npcEnsureDaily(x);x.daily.gift++;x.gifts++;x.affection=Math.min(100,x.affection+g.a);x.cat=Math.min(100,x.cat+(g.cat||0));saveNpcState(x);npcCheckUnlocks(x);renderNpcShop();
    toast(`🎁 貓貓好感 +${g.a}${g.cat?`・店貓 +${g.cat}`:""}`,3500)
  }})));
}
function npcConfess(){
  let st=npcState(),c=cur();
  if(st.affection<100)return toast("💗 還沒走到故事的最後。");
  if(!c)return toast("請先進入角色。");
  let rel=getNpcRelationship(c,"shopkeeper_cat");
  if(rel)return openNpcDetail("shopkeeper_cat");
  finalizeShopkeeperRelation();
}
function npcBuy(item){
  let c=typeof cur==="function"?cur():null;
  if(!c)return toast("請先進入角色再購買。");
  let price=item.price||0;
  if(Number(c.money||0)<price)return toast("🪙 金幣不夠。");
  c.inventory??={};
  if(item.id==="npc_under_counter" && Number(c.inventory[item.id]||0)>0)return toast("🔐 黑盒只能購買一次。");
  c.money=safeMoney(Number(c.money||0)-price);
  c.inventory[item.id]=(c.inventory[item.id]||0)+1;
  let st=npcState();st.purchaseCount++;st.loyalty++;st.purchasedIds??=[];if(!st.purchasedIds.includes(item.id))st.purchasedIds.push(item.id);if(st.purchaseCount%5===0)st.affection=Math.min(100,st.affection+1);saveNpcState(st);
  saveLocal();renderGame?.();npcCheckUnlocks(st);renderNpcShop();
  toast(`🛍️ 買下 ${item.name}・熟客度 +1`,3200);
}
function npcRenderTalk(st){
  const hour=new Date().getHours();
  let cards=[
    {icon:"💬",name:"跟貓貓聊天",desc:"每天可以一直聊，但同一句話不一定每次都有新反應。",fn:"talk"},
    {icon:"🎁",name:"送禮物",desc:`今天 ${st.daily.gift||0}/2 次`,fn:"gift"},
    {icon:"🐈",name:"摸店貓",desc:`今天 ${st.daily.cat||0}/3 次`,fn:"cat"},
    {icon:"🍬",name:"偷拿櫃檯糖果",desc:"你真的要這樣做嗎？",fn:"candy"},
    {icon:"💼",name:"幫忙顧店",desc:`今天 ${st.daily.help||0}/1 次・隨機事件`,fn:"help"}
  ];
  if((hour>=22||hour<5)&&st.affection>=60)cards.push({icon:"🌙",name:"打烊後留下",desc:"只有深夜與高好感時出現。",fn:"night"});
  if(st.affection>=100){
    let c=cur(),rel=c?getNpcRelationship(c,"shopkeeper_cat"):null;
    cards.push({
      icon:"💗",
      name:rel?"特殊關係":"表達心意",
      desc:rel?`目前：${NPC_RELATION_LABELS[rel.type]}`:"進入單人 NPC 特殊關係選擇。",
      fn:"confess"
    });
  }
  return `<div class="npcActionGrid">${cards.map(x=>`<button class="npcActionCard" data-npc-action="${x.fn}"><b>${x.icon} ${x.name}</b><span class="small">${x.desc}</span></button>`).join("")}</div>`;
}
function npcRenderShop(st){
  const items=[
    {id:"npc_crystal_chip",name:"💎 紫晶碎片",desc:"特殊探索材料・部分隱藏事件會消耗。",price:90},
    {id:"npc_cat_cookie",name:"🐾 貓掌餅乾",desc:"可餵店貓・店貓親密度 +8。",price:60},
    {id:"npc_lucky_bell",name:"🔔 小幸運鈴",desc:"持有型幸運道具・提升未來稀有探索事件機率。",price:140}
  ];
  if(st.loyalty>=10)items.push({id:"npc_regular_box",name:"🎁 熟客小盒",desc:"可開啟・隨機金幣、道具、好感禮物或特殊收藏。",price:220,secret:true});
  if(st.loyalty>=30)items.push({id:"npc_under_counter",name:"🔐 櫃檯下的黑盒",desc:"一次性隱藏收藏・用途？？？",price:666,secret:true});
  return `<div class="small" style="margin-bottom:8px">每買 1 件商品熟客度 +1；每累積購買 5 件，貓貓好感額外 +1。</div>`+
    items.map(x=>`<div class="npcShopItem"><div><b>${x.name} ${x.secret?'<span class="npcSecretTag">隱藏</span>':""}</b><div class="small">${x.desc}</div></div><button data-npc-buy="${x.id}">🪙${x.price}</button></div>`).join("");
}
function npcRenderRumor(st){
  const rumors=[
    {name:"⭐ 會消失的紙星星",ok:!!st.flags.paperStarRumor||st.affection>=40,text:"最近店門口每天早上都會出現一顆摺好的小紙星星，但到了晚上又會不見。沒有人知道是誰放的。"},
    {name:"📦 沒有編號的黑盒",ok:!!st.flags.blackBox||!!st.flags.openedBlackBox||st.loyalty>=30,text:st.flags.openedBlackBox?"你曾偷偷打開過它。裡面只有一張寫著日期的舊紙條。":"補貨時偶爾會出現沒有商品編號的黑色盒子。"},
    {name:"🐈 店貓知道的路",ok:st.cat>=70,text:"店貓最近總是在打烊前往後門走，似乎想帶你去某個地方。"}
  ];
  return rumors.map(r=>`<div class="npcDialogue ${r.ok?"":"locked"}"><b>${r.ok?r.name:"❔ ???"}</b><div class="small">${r.ok?r.text:"尚未取得這則傳聞。"}</div></div>`).join("");
}

function npcRenderItems(){
  let c=cur();if(!c)return `<div class="muted">請先進入角色。</div>`;
  c.inventory??={};
  const ids=Object.keys(NPC_ITEM_EFFECTS);
  let owned=ids.filter(id=>Number(c.inventory[id]||0)>0);
  if(!owned.length)return `<div class="npcDialogue"><b>🎒 NPC 專屬道具</b><div class="small">目前沒有持有任何神秘商店專屬道具。</div></div>`;
  return owned.map(id=>{
    let d=NPC_ITEM_EFFECTS[id],n=Number(c.inventory[id]||0);
    return `<div class="npcShopItem">
      <div><b>${d.name}</b><div class="small">${d.use}<br>持有：×${n}</div></div>
      <button data-npc-use="${id}">${id==="npc_lucky_bell"||id==="npc_crystal_chip"||id==="npc_under_counter"?"查看":"使用"}</button>
    </div>`;
  }).join("");
}

function npcRenderStory(st){
  const nodes=[
    {n:"第一章・常來的客人",ok:st.affection>=20,text:"她已經能在你進門前認出你的腳步聲。"},
    {n:"第二章・河堤的傳聞",ok:st.affection>=40,text:"貓貓第一次主動告訴你城鎮裡的秘密。"},
    {n:"第三章・打烊之後",ok:st.affection>=60,text:"有些話只有店門關起來後，她才願意說。"},
    {n:"第四章・店長的秘密",ok:st.affection>=80,text:"櫃檯後那張從沒被翻過去的照片，似乎與她的過去有關。"},
    {n:"終章・不只是客人",ok:st.affection>=100,text:(()=>{let c=cur(),r=c?getNpcRelationship(c,"shopkeeper_cat"):null;return r?`你們已建立「${NPC_RELATION_LABELS[r.type]}」關係。`:"你似乎已經站在某條關係的門口。"})()}
  ];
  return nodes.map(x=>`<div class="npcStoryNode ${x.ok?"":"locked"}"><b>${x.ok?x.n:"🔒 ???"}</b><div class="small">${x.ok?x.text:"好感尚未達到。"}</div></div>`).join("");
}
function renderNpcShop(){
  let st=npcState();npcEnsureDaily(st);saveNpcState(st);reconcileNpcEventAchievements();updateNpcStats();
  const body=document.getElementById("npcShopBody");if(!body)return;
  if(npcActiveTab==="talk")body.innerHTML=npcRenderTalk(st);
  else if(npcActiveTab==="shop")body.innerHTML=npcRenderShop(st);
  else if(npcActiveTab==="rumor")body.innerHTML=npcRenderRumor(st);
  else if(npcActiveTab==="story")body.innerHTML=npcRenderStory(st);
  else body.innerHTML=npcRenderItems();
}
function openNpcShop(){
  let vst=npcState();vst.flags.visited=1;saveNpcState(vst);reconcileNpcEventAchievements();
  document.getElementById("npcTownDot")?.classList.add("hidden");
  document.getElementById("npcShopModal")?.classList.remove("hidden");
  renderNpcShop();
}
function syncNpcFab(){
  const game=document.getElementById("game");
  const inGame=!!game&&!game.classList.contains("hidden");
  document.getElementById("npcTownFab")?.classList.toggle("hidden",!inGame);
}
document.getElementById("npcTownFab")?.addEventListener("click",openNpcShop);
document.getElementById("closeNpcShop")?.addEventListener("click",()=>document.getElementById("npcShopModal")?.classList.add("hidden"));
document.getElementById("npcShopModal")?.addEventListener("click",e=>{if(e.target.id==="npcShopModal")e.currentTarget.classList.add("hidden")});
document.getElementById("closeNpcChoice")?.addEventListener("click",npcCloseChoice);
document.getElementById("npcChoiceModal")?.addEventListener("click",e=>{if(e.target.id==="npcChoiceModal")npcCloseChoice()});
document.querySelectorAll("[data-npc-tab]").forEach(b=>b.addEventListener("click",()=>{
  npcActiveTab=b.dataset.npcTab||"talk";
  document.querySelectorAll("[data-npc-tab]").forEach(x=>x.classList.toggle("active",x===b));
  renderNpcShop();
}));
document.getElementById("npcChoiceButtons")?.addEventListener("click",e=>{
  const b=e.target.closest("[data-npc-choice]");if(!b)return;
  const list=e.currentTarget._choices||[];const c=list[Number(b.dataset.npcChoice)];
  npcCloseChoice();if(c?.fn)c.fn();
});
document.getElementById("npcShopBody")?.addEventListener("click",e=>{
  const a=e.target.closest("[data-npc-action]");
  if(a){
    const k=a.dataset.npcAction;
    if(k==="talk")npcTalk();
    if(k==="gift")npcGiveGift();
    if(k==="cat")npcPetCat();
    if(k==="candy")npcStealCandy();
    if(k==="help")npcHelpShop();
    if(k==="night"){let x=npcState();x.flags.nightEvent=1;saveNpcState(x);npcRelationScore("romance",1);npcRelationScore("trust",1);reconcileNpcEventAchievements();npcChoice("🌙 打烊後","店裡只剩你、貓貓和趴在櫃檯上的店貓。<br><br>「今天……可以晚一點再走。」",[{label:"留下陪她",fn:()=>npcGain("affection",3,"貓貓好感")}]);}
    if(k==="confess")npcConfess();
    return;
  }
  const use=e.target.closest("[data-npc-use]");
  if(use){useNpcShopItem(use.dataset.npcUse);return;}
  const b=e.target.closest("[data-npc-buy]");
  if(b){
    const st=npcState();
    const all=[
      {id:"npc_crystal_chip",name:"紫晶碎片",price:90},
      {id:"npc_cat_cookie",name:"貓掌餅乾",price:60},
      {id:"npc_lucky_bell",name:"小幸運鈴",price:140},
      {id:"npc_regular_box",name:"熟客小盒",price:220},
      {id:"npc_under_counter",name:"櫃檯下的黑盒",price:666}
    ];
    const item=all.find(x=>x.id===b.dataset.npcBuy);if(item)npcBuy(item);
  }
});
setInterval(()=>{if(!document.hidden)syncNpcFab()},1500);
setTimeout(()=>{ensureNpcActivityAchievements();syncNpcFab();npcCheckUnlocks();reconcileNpcEventAchievements();syncNpcDebugVisibility()},300);

