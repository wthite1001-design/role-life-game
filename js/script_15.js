
/* === NPC system v2: random chat / route thresholds / story collection / GM reset === */
(function(){
  const NPC_CHAT_DAILY_LIMIT=10;
  const NPC_CAT_COOKIE_DAILY_BUY_LIMIT=2;
  const NPC_ROUTE_THRESHOLDS={
    lover:12,
    bestfriend:12,
    confidant:12,
    bickering:10,
    catfriend:10,
    secret:12
  };
  const NPC_REMOTE_RESET_ITEM="__npc_reset_shopkeeper_v2__";

  // ----- state helpers -----
  function enrichNpcState(st){
    st=st||{};
    st.flags??={};
    st.daily??={};
    st.relationScore??={};
    for(const k of ["romance","trust","tease","catChoice","secret"]){
      st.relationScore[k]=Number(st.relationScore[k]||0);
    }
    st.storyCollection??={};
    st.chatHistory??=[];
    st.purchasedIds??=[];
    st.dailyPurchases??={date:npcToday(),items:{}};
    if(st.dailyPurchases.date!==npcToday())st.dailyPurchases={date:npcToday(),items:{}};
    return st;
  }

  const _npcState=npcState;
  window.npcState=function(){
    return enrichNpcState(_npcState());
  };

  function saveState(st){ saveNpcState(enrichNpcState(st)); }

  // ----- explicit story collection -----
  window.npcCollectStory=function(id){
    let st=npcState();
    st.storyCollection[id]=new Date().toISOString();
    saveState(st);
  };
  window.npcHasStory=function(id){
    return !!npcState().storyCollection?.[id];
  };

  const _startNpcRpgStory=startNpcRpgStory;
  window.startNpcRpgStory=function(opts){
    opts=opts||{};
    const storyId=opts.storyId||"";
    const done=opts.onComplete;
    document.body.classList.add("npcStoryRunning");
    _startNpcRpgStory({
      ...opts,
      onComplete:()=>{
        if(storyId)npcCollectStory(storyId);
        document.body.classList.remove("npcStoryRunning");
        if(typeof done==="function")done();
      }
    });
  };
  const _cancelNpcRpgStory=cancelNpcRpgStory;
  window.cancelNpcRpgStory=function(){
    document.body.classList.remove("npcStoryRunning");
    return _cancelNpcRpgStory();
  };

  // Collected stories stay replayable even if current conditions later change.
  window.npcStoryCollection=function(npcId,c){
    let lib=NPC_STORY_LIBRARY[npcId]||{personal:[],event:[]},st=npcState();
    const map=list=>list.map(a=>({
      ...a,
      unlocked:!!st.storyCollection?.[a.id]
    }));
    return {personal:map(lib.personal||[]),event:map(lib.event||[])};
  };

  // ----- 30 random chat events -----
  const NPC_CHAT_EVENTS=[
    {id:"weather",speaker:"？？？",text:"「今天外面熱得有點誇張。你居然還跑來。」",choices:[
      {label:"「店裡比較舒服。」",after:"「……你是來吹冷氣的吧。」",a:0,s:{tease:1}},
      {label:"「因為想看看妳。」",after:"她停了一秒才低頭整理商品。「喔。」",a:1,s:{romance:1}}
    ]},
    {id:"tea",speaker:"？？？",text:"「我泡多了一杯茶。你喝嗎？」",choices:[
      {label:"接過來，順便幫她收桌面。",after:"「你其實滿會看場合的嘛。」",a:1,s:{trust:1}},
      {label:"先問她是不是下毒。",after:"「現在很想了。」",a:0,s:{tease:2}}
    ]},
    {id:"cat_sleep",speaker:"旁白",text:"店貓睡在你平常坐的位置。",choices:[
      {label:"蹲在旁邊陪牠。",after:"店長看了你一眼。「你到底是來找誰的？」",a:0,s:{catChoice:2}},
      {label:"換個位置坐，別吵牠。",after:"「……牠會感謝你的。」",a:1,s:{trust:1,catChoice:1}}
    ]},
    {id:"receipt",speaker:"？？？",text:"「你上次的收據還掉在這裡。」",choices:[
      {label:"「妳幫我留著？」",after:"「只是還沒丟而已，不要想太多。」",a:1,s:{romance:1}},
      {label:"「原來我花這麼多。」",after:"「現在才發現？」",a:0,s:{trust:1}}
    ]},
    {id:"closing",speaker:"？？？",text:"「我今天有點想提早關店。」",choices:[
      {label:"問她是不是累了。",after:"「……一點點吧。」",a:1,s:{trust:2}},
      {label:"「那我最後一個客人？」",after:"「你很會挑重點欸。」",a:1,s:{romance:1}}
    ]},
    {id:"flower",speaker:"旁白",text:"櫃檯上多了一小束不知道誰送的花。",choices:[
      {label:"稱讚花很適合她。",after:"她摸了摸花瓣。「是嗎？」",a:1,s:{romance:1}},
      {label:"幫她找瓶子插起來。",after:"「放那邊就好，謝啦。」",a:1,s:{trust:1}}
    ]},
    {id:"lost_coin",speaker:"旁白",text:"你在櫃檯旁發現一枚硬幣。",choices:[
      {label:"交給店長。",after:"「不是我的……先放失物招領吧。」",a:1,s:{trust:2}},
      {label:"問能不能當今天的折扣。",after:"「不、能。」",a:0,s:{tease:2}}
    ]},
    {id:"music",speaker:"？？？",text:"「你覺得店裡要不要放點音樂？」",choices:[
      {label:"挑一首安靜的歌。",after:"她真的把音量調小了一點。",a:1,s:{trust:1}},
      {label:"「妳唱啊。」",after:"「你出去。」",a:0,s:{tease:1,romance:1}}
    ]},
    {id:"dust",speaker:"旁白",text:"一束陽光照出空氣裡飄著的細小灰塵。",choices:[
      {label:"默默拿布幫忙擦架子。",after:"「……今天這麼勤勞？」",a:1,s:{trust:2}},
      {label:"在灰塵上畫一隻貓。",after:"她看了幾秒，沒有擦掉。",a:0,s:{tease:1,catChoice:1}}
    ]},
    {id:"blackbox_hint",speaker:"？？？",text:"她整理櫃檯下方時，很快地把某個東西往裡推。",choices:[
      {label:"假裝沒看到。",after:"她的動作慢了一點。「……謝了。」",a:1,s:{secret:2,trust:1}},
      {label:"直接問那是什麼。",after:"「現在還不能告訴你。」",a:0,s:{secret:1}}
    ]},
    {id:"lunch",speaker:"？？？",text:"「忙到現在，我好像還沒吃東西。」",choices:[
      {label:"提醒她先休息吃飯。",after:"「你怎麼比我還像店長。」",a:1,s:{trust:2}},
      {label:"「那我幫妳看店五分鐘。」",after:"「……不要趁機亂翻喔。」",a:1,s:{trust:1,secret:1}}
    ]},
    {id:"ribbon",speaker:"旁白",text:"她正在重新綁一個包裝緞帶，怎麼綁都不滿意。",choices:[
      {label:"幫她重新綁。",after:"「喔……比我剛才那個好看。」",a:1,s:{trust:1}},
      {label:"故意綁成超大的蝴蝶結。",after:"她盯著你。「你認真的？」",a:0,s:{tease:2}}
    ]},
    {id:"rain",speaker:"？？？",text:"「外面下雨了。你有帶傘嗎？」",choices:[
      {label:"「沒有。」",after:"她嘆氣，把店裡的備用傘放到你面前。",a:1,s:{romance:1,trust:1}},
      {label:"「有，妳沒有的話可以一起走。」",after:"她看向窗外。「……再說吧。」",a:1,s:{romance:2}}
    ]},
    {id:"name",speaker:"？？？",text:"「你每次來都待這麼久，真的很閒欸。」",choices:[
      {label:"「不然妳趕我走啊。」",after:"「……我現在就在趕。」",a:0,s:{tease:2}},
      {label:"「這裡待著很舒服。」",after:"她沒有接話，但表情柔和了一點。",a:1,s:{romance:1}}
    ]},
    {id:"customer",speaker:"旁白",text:"剛才有個難纏的客人離開後，她明顯鬆了一口氣。",choices:[
      {label:"問她要不要抱怨一下。",after:"「你真的要聽？那我可不客氣了。」",a:1,s:{trust:2}},
      {label:"模仿剛才那個客人的語氣。",after:"她忍了兩秒還是笑出來。",a:1,s:{tease:2}}
    ]},
    {id:"cat_name",speaker:"？？？",text:"「你是不是還不知道牠最討厭哪種人？」",choices:[
      {label:"「不給零食的人？」",after:"店貓尾巴甩了一下。",a:0,s:{catChoice:2}},
      {label:"「太吵的人？」",after:"「至少你有自知之明。」",a:0,s:{tease:1,catChoice:1}}
    ]},
    {id:"shelf",speaker:"旁白",text:"最上層有個盒子放得有點歪。",choices:[
      {label:"伸手幫她擺好。",after:"「謝啦，我剛才一直忘記。」",a:1,s:{trust:1}},
      {label:"問裡面是不是秘密。",after:"「你怎麼什麼都覺得是秘密。」",a:0,s:{secret:1}}
    ]},
    {id:"sleepy",speaker:"？？？",text:"她今天難得打了一個很明顯的哈欠。",choices:[
      {label:"「妳去休息，我幫妳顧一下。」",after:"「……你不要真的把自己當店員。」",a:1,s:{trust:2}},
      {label:"「被我看到囉。」",after:"「看到什麼？」她立刻裝沒事。",a:0,s:{tease:1}}
    ]},
    {id:"photo",speaker:"旁白",text:"你又看見那個放照片的抽屜，但她就在旁邊。",choices:[
      {label:"完全不碰。",after:"她像是注意到了你的視線，卻沒說什麼。",a:1,s:{secret:2,trust:1}},
      {label:"問她有一天會不會願意說。",after:"「……也許吧。」",a:1,s:{secret:2}}
    ]},
    {id:"bell",speaker:"？？？",text:"「你買的鈴鐺有好好收著嗎？」",choices:[
      {label:"拿出來給她看。",after:"「嗯。別弄丟了。」",a:1,s:{secret:1,trust:1}},
      {label:"故意搖得很大聲。",after:"店貓先跑了。她第二個想跑。",a:0,s:{tease:2}}
    ]},
    {id:"regular",speaker:"？？？",text:"「你常買的東西我差不多記住了。」",choices:[
      {label:"「那下次直接幫我留？」",after:"「你先確定你有錢。」",a:0,s:{tease:1,trust:1}},
      {label:"「妳居然真的記得。」",after:"「……很難不記得吧。」",a:1,s:{romance:1}}
    ]},
    {id:"streetcat",speaker:"旁白",text:"門口出現一隻陌生的流浪貓。",choices:[
      {label:"拿一點水給牠。",after:"「牠看起來滿喜歡你的。」",a:1,s:{catChoice:2,trust:1}},
      {label:"問店貓會不會吃醋。",after:"「牠？牠只會在意零食。」",a:0,s:{catChoice:1}}
    ]},
    {id:"inventory",speaker:"？？？",text:"「今天盤點差了一件商品，奇怪。」",choices:[
      {label:"留下來幫她重算。",after:"最後發現只是她自己記錯一格。",a:1,s:{trust:2}},
      {label:"「會不會是貓偷的？」",after:"她和店貓同時看你。",a:0,s:{tease:1,catChoice:1}}
    ]},
    {id:"secret_guest",speaker:"旁白",text:"剛才有個人只跟她說了一句話就離開了。",choices:[
      {label:"不追問。",after:"她過了一會主動說：「不是什麼壞事。」",a:1,s:{secret:2,trust:1}},
      {label:"問是不是可疑交易。",after:"「你腦袋到底在想什麼啦。」",a:0,s:{tease:1,secret:1}}
    ]},
    {id:"giftwrap",speaker:"？？？",text:"「如果是你收到禮物，會在意包裝嗎？」",choices:[
      {label:"「誰送的比較重要。」",after:"她手上的動作停了半秒。",a:1,s:{romance:2}},
      {label:"「拆得開就好。」",after:"「……非常實際。」",a:0,s:{trust:1}}
    ]},
    {id:"holiday",speaker:"？？？",text:"「如果店裡哪天休息，你會去哪？」",choices:[
      {label:"「看妳去哪。」",after:"「你沒有自己的行程喔？」",a:1,s:{romance:2}},
      {label:"「在家睡覺。」",after:"「這答案倒是很像你。」",a:0,s:{trust:1}}
    ]},
    {id:"book",speaker:"旁白",text:"櫃檯下放著一本看到一半的書。",choices:[
      {label:"問她好不好看。",after:"她難得講了很久那本書的內容。",a:1,s:{trust:2}},
      {label:"猜她看到一半就睡著。",after:"「你怎麼知道……不是，你閉嘴。」",a:0,s:{tease:2}}
    ]},
    {id:"key",speaker:"？？？",text:"她把一串店門鑰匙放到桌面，又很快收回去。",choices:[
      {label:"「怕我偷走？」",after:"「主要怕你真的會。」",a:0,s:{tease:2}},
      {label:"「妳很信任我才會放這吧。」",after:"「……你不要自己解讀。」",a:1,s:{trust:2}}
    ]},
    {id:"late",speaker:"？？？",text:"「你最近是不是都挑快打烊才來？」",choices:[
      {label:"「因為那時候人比較少。」",after:"「……喔。」她似乎明白你的意思。",a:1,s:{romance:1,secret:1}},
      {label:"「因為比較方便偷糖。」",after:"「你今天一顆都別想拿。」",a:0,s:{tease:2}}
    ]},
    {id:"tomorrow",speaker:"？？？",text:"「明天也會來？」",choices:[
      {label:"「妳希望我來嗎？」",after:"「我只是在確認而已。」",a:1,s:{romance:2}},
      {label:"「有空就來。」",after:"「嗯，那就隨你。」",a:0,s:{trust:1}}
    ]}
  ];
  window.NPC_CHAT_EVENTS=NPC_CHAT_EVENTS;

  function applyScores(st,scores){
    st.relationScore??={};
    for(const [k,v] of Object.entries(scores||{})){
      st.relationScore[k]=Number(st.relationScore[k]||0)+Number(v||0);
    }
  }

  function unusedChatEvents(st){
    const todaySeen=Array.isArray(st.daily?.chatEventIds)?st.daily.chatEventIds:[];
    let pool=NPC_CHAT_EVENTS.filter(x=>!todaySeen.includes(x.id));
    if(!pool.length)pool=[...NPC_CHAT_EVENTS];
    return pool;
  }

  window.npcTalk=function(){
    if(typeof npcEventIsActive==="function"&&!npcEventIsActive())return toast("🎊 限定 NPC 活動已結束。");
    let st=npcState();npcEnsureDaily(st);st=enrichNpcState(st);
    st.daily.chatEventIds??=[];
    if(Number(st.daily.talk||0)>=NPC_CHAT_DAILY_LIMIT){
      return toast(`💬 今天已經聊了 ${NPC_CHAT_DAILY_LIMIT} 次，讓店長休息一下吧。`,3500);
    }
    const pool=unusedChatEvents(st);
    const ev=pool[Math.floor(Math.random()*pool.length)];
    st.daily.talk=Number(st.daily.talk||0)+1;
    st.daily.chatEventIds.push(ev.id);
    st.chatCount=Number(st.chatCount||0)+1;
    saveState(st);

    startNpcRpgStory({
      title:"店內閒聊",
      lines:[
        {speaker:ev.speaker||"？？？",text:ev.text,choices:ev.choices.map((ch,idx)=>({
          label:ch.label,
          effect:()=>{
            let x=enrichNpcState(npcState());
            x.affection=Math.max(0,Math.min(100,Number(x.affection||0)+Number(ch.a||0)));
            applyScores(x,ch.s||{});
            saveState(x);
          }
        }))},
        // choice effect advances directly to next line; choose a generic after line by choice in custom choice handler below
      ]
    });

    // store current event so choice handler can append correct response
    window.__npcCurrentChatEvent=ev;
  };

  // Patch RPG choice behavior so chat choice gets its own reaction line.
  const choiceBox=document.getElementById("npcStoryChoices");
  if(choiceBox){
    choiceBox.addEventListener("click",e=>{
      let b=e.target.closest("[data-rpg-choice]");
      if(!b||!window.__npcCurrentChatEvent||!npcStoryPlayerState)return;
      const idx=Number(b.dataset.rpgChoice);
      const ch=window.__npcCurrentChatEvent.choices?.[idx];
      if(!ch)return;
      // The original handler executes effect and increments index; append reaction before it reaches the end.
      npcStoryPlayerState.lines.push({speaker:"？？？",text:ch.after||"她點了點頭。"});
      window.__npcCurrentChatEvent=null;
    },true);
  }

  // ----- render daily chat limit -----
  const _npcRenderTalk=npcRenderTalk;
  window.npcRenderTalk=function(st){
    st=enrichNpcState(st||npcState());npcEnsureDaily(st);
    const used=Number(st.daily.talk||0);
    return `<div class="npcChatLimitHint">💬 今日聊天 ${used}/${NPC_CHAT_DAILY_LIMIT}・每次會隨機遇到不同話題，選擇會影響隱藏關係走向。</div>`+_npcRenderTalk(st);
  };

  // ----- cat cookie purchase limit -----
  const _npcRenderShop=npcRenderShop;
  window.npcRenderShop=function(st){
    st=enrichNpcState(st||npcState());
    let html=_npcRenderShop(st);
    const used=Number(st.dailyPurchases?.items?.npc_cat_cookie||0);
    const left=Math.max(0,NPC_CAT_COOKIE_DAILY_BUY_LIMIT-used);
    html=html.replace(
      /(<b>🐾 貓掌餅乾[\s\S]*?<div class="small">)([\s\S]*?)(<\/div><\/div><button data-npc-buy="npc_cat_cookie">)/,
      `$1$2<br>今日可購買：${left}/${NPC_CAT_COOKIE_DAILY_BUY_LIMIT}$3`
    );
    return html;
  };

  const _npcBuy=npcBuy;
  window.npcBuy=function(item){
    let st=enrichNpcState(npcState());
    if(item?.id==="npc_cat_cookie"){
      const used=Number(st.dailyPurchases.items.npc_cat_cookie||0);
      if(used>=NPC_CAT_COOKIE_DAILY_BUY_LIMIT){
        return toast(`🐾 貓掌餅乾每天最多購買 ${NPC_CAT_COOKIE_DAILY_BUY_LIMIT} 個。`,3500);
      }
      const before=Number(cur()?.inventory?.npc_cat_cookie||0);
      _npcBuy(item);
      const after=Number(cur()?.inventory?.npc_cat_cookie||0);
      if(after>before){
        st=enrichNpcState(npcState());
        st.dailyPurchases.items.npc_cat_cookie=used+1;
        saveState(st);
        renderNpcShop();
      }
      return;
    }
    return _npcBuy(item);
  };

  // ----- relation route availability -----
  function routeAvailability(){
    let st=enrichNpcState(npcState()),sc=st.relationScore||{};
    const hasBlack=Number(cur()?.inventory?.npc_under_counter||0)>0||!!st.flags.blackBoxOwned;
    return {
      lover:Number(sc.romance||0)>=NPC_ROUTE_THRESHOLDS.lover,
      bestfriend:Number(sc.trust||0)>=NPC_ROUTE_THRESHOLDS.bestfriend,
      confidant:Number(sc.secret||0)>=NPC_ROUTE_THRESHOLDS.confidant,
      bickering:Number(sc.tease||0)>=NPC_ROUTE_THRESHOLDS.bickering,
      catfriend:Number(sc.catChoice||0)>=NPC_ROUTE_THRESHOLDS.catfriend && Number(st.cat||0)>=70,
      hiddenBlack:hasBlack && Number(sc.secret||0)>=NPC_ROUTE_THRESHOLDS.secret
    };
  }
  window.npcRouteAvailability=routeAvailability;

  if(typeof NPC_RELATION_LABELS!=="undefined"){
    NPC_RELATION_LABELS.blacksecret="🔐 秘密共犯";
  }
  if(typeof NPC_RELATION_NOTES!=="undefined"){
    NPC_RELATION_NOTES.blacksecret="你們共同知道一件沒有被寫進任何帳本裡的事。";
  }
  if(typeof NPC_RELATION_REGISTRY!=="undefined" && NPC_RELATION_REGISTRY.shopkeeper_cat){
    const arr=NPC_RELATION_REGISTRY.shopkeeper_cat.allowed||[];
    if(!arr.includes("blacksecret"))arr.push("blacksecret");
  }

  function commitNpcEnding(type){
    let c=cur();if(!c)return;
    const note=(typeof NPC_RELATION_NOTES!=="undefined"&&NPC_RELATION_NOTES[type])||"";
    if(setNpcRelationship(c,"shopkeeper_cat",type,note)){
      let st=enrichNpcState(npcState());
      st.flags.npcRelationFinalized=1;
      npcCollectStory("shop_story_05");
      saveState(st);
      c.achievements??={};c.achievements.npc_evt_relation=1;
      saveLocal();reconcileNpcEventAchievements();renderNpcRelationships();
      toast(`✨ NPC 關係收藏：${NPC_RELATION_LABELS[type]||type}`,5000);
    }
  }

  const ENDING_LINES={
    lover:[
      {speaker:"旁白",text:"你沒有起身，她也沒有催你離開。"},
      {speaker:"你",text:"「如果我以後不是來買東西，也可以來嗎？」"},
      {speaker:"？？？",text:"「……那你是來做什麼？」"},
      {speaker:"你",text:"「來見妳。」"},
      {speaker:"旁白",text:"她一下子安靜了，耳尖卻慢慢紅起來。"},
      {speaker:"？？？",text:"「那就……不要每次都待到打烊才說。」"},
      {speaker:"旁白",text:"她伸出手，輕輕勾住你的手指。"}
    ],
    bestfriend:[
      {speaker:"？？？",text:"「你現在比很多熟客還熟這間店。」"},
      {speaker:"你",text:"「所以可以升職了？」"},
      {speaker:"？？？",text:"她把備用鑰匙在你眼前晃了一下。「只能偶爾幫忙。」"},
      {speaker:"旁白",text:"你笑著接過，而她看起來也很放心。"}
    ],
    confidant:[
      {speaker:"旁白",text:"她把那張一直珍藏的照片放到你面前。"},
      {speaker:"？？？",text:"「這件事，我只想告訴我真的相信的人。」"},
      {speaker:"你",text:"「那我會好好記住。」"},
      {speaker:"？？？",text:"「……就是因為你會這麼說，我才告訴你。」"}
    ],
    bickering:[
      {speaker:"你",text:"你又順手拿走了一顆糖。"},
      {speaker:"？？？",text:"「我看到了。」"},
      {speaker:"你",text:"「那妳怎麼不阻止？」"},
      {speaker:"？？？",text:"她笑著把糖罐往你這邊推了一點。「懶得管你了。」"}
    ],
    catfriend:[
      {speaker:"旁白",text:"店貓一看到你就熟練地跳進你懷裡。"},
      {speaker:"？？？",text:"「我到底為什麼覺得你是來找我的。」"},
      {speaker:"你",text:"「我可以兩個都找。」"},
      {speaker:"？？？",text:"「……勉強接受。」"}
    ],
    blacksecret:[
      {speaker:"旁白",text:"你把黑盒放到她面前，沒有立刻開口。"},
      {speaker:"？？？",text:"她看著盒子，又看了看你。"},
      {speaker:"？？？",text:"「原來最後還是被你走到這裡了。」"},
      {speaker:"你",text:"「妳後悔讓我知道嗎？」"},
      {speaker:"？？？",text:"她輕輕搖頭。「如果是你的話，不會。」"},
      {speaker:"旁白",text:"那成了一個只屬於你們兩個人的秘密。"}
    ],
    regular:[
      {speaker:"？？？",text:"「你明天還會來吧？」"},
      {speaker:"你",text:"「妳都這樣問了。」"},
      {speaker:"？？？",text:"「那我幫你留一份你常買的。」"},
      {speaker:"旁白",text:"沒有特別說出口的關係，也悄悄成了每天的習慣。"}
    ]
  };

  // At affection 100, show only qualified routes, wording deliberately vague.
  window.finalizeShopkeeperRelation=function(){
    if(typeof npcEventIsActive==="function"&&!npcEventIsActive())return toast("🎊 限定 NPC 活動已結束，無法再取得新的 NPC 關係收藏。");
    let c=cur();if(!c)return toast("請先進入角色。");
    if(getNpcRelationship(c,"shopkeeper_cat"))return openNpcDetail("shopkeeper_cat");
    let st=enrichNpcState(npcState());
    if(st.affection<100)return toast("💗 還沒走到故事的最後。");

    const r=routeAvailability();
    const choices=[];
    if(r.lover)choices.push({label:"「今天……我還不想走。」",type:"lover"});
    if(r.bestfriend)choices.push({label:"把店門鑰匙推回去：「下次忙不過來就叫我。」",type:"bestfriend"});
    if(r.confidant)choices.push({label:"看向那個一直沒被打開的抽屜。",type:"confidant"});
    if(r.bickering)choices.push({label:"順手又拿走一顆櫃檯糖果。",type:"bickering"});
    if(r.catfriend)choices.push({label:"什麼都沒說，先蹲下抱起店貓。",type:"catfriend"});
    if(r.hiddenBlack)choices.push({label:"把那個黑盒安靜地放到她面前。",type:"blacksecret"});
    choices.push({label:"像往常一樣說：「那我明天再來。」",type:"regular"});

    const intro=[
      {speaker:"旁白",text:"打烊後，最後一盞水晶燈還亮著。"},
      {speaker:"？？？",text:"「你最近真的待得越來越晚了。」"},
      {speaker:"旁白",text:"一路以來累積的那些小事，好像終於走到了某個答案前。"},
      {speaker:"？？？",text:"「所以呢？今天還有什麼想說的？」",
       choices:choices.map(x=>({label:x.label,effect:()=>{window.__npcEndingType=x.type;}}))}
    ];

    startNpcRpgStory({
      title:"最終章",
      storyId:"shop_story_05",
      lines:intro,
      onComplete:()=>{
        const type=window.__npcEndingType||"regular";
        window.__npcEndingType=null;
        startNpcRpgStory({
          title:"最終章",
          lines:[
            ...(ENDING_LINES[type]||ENDING_LINES.regular),
            {speaker:"旁白",text:`【NPC 關係收藏】${NPC_RELATION_LABELS[type]||type}`}
          ],
          onComplete:()=>commitNpcEnding(type)
        });
      }
    });
  };

  // ----- story milestone: collected only after actual play -----
  window.maybePlayNpcMilestoneStory=function(){
    let st=enrichNpcState(npcState());
    const checks=[
      ["shop_story_01",20],
      ["shop_story_02",40],
      ["shop_story_03",60],
      ["shop_story_04",80]
    ];
    for(const [id,need] of checks){
      if(st.affection>=need&&!st.storyCollection[id]){
        const story=(NPC_STORY_LIBRARY.shopkeeper_cat.personal||[]).find(x=>x.id===id);
        startNpcRpgStory({
          title:story?.title||"故事",
          storyId:id,
          lines:NPC_RPG_STORIES[id]||[{speaker:"旁白",text:story?.text||""}]
        });
        return true;
      }
    }
    return false;
  };

  // First visit / special event collection
  const _openNpcShop=openNpcShop;
  window.openNpcShop=function(){
    let first=!npcHasStory("shop_event_first");
    _openNpcShop();
    if(first){
      setTimeout(()=>startNpcRpgStory({
        title:"初次相遇",storyId:"shop_event_first",
        lines:NPC_RPG_STORIES.shop_event_first||[]
      }),180);
    }
  };

  // ----- GM remote reset -----
  window.resetShopkeeperNpcForCurrentDevice=function(c,reason="GM 重置"){
    try{
      localStorage.removeItem(NPC_SHOP_KEY);
      if(c){
        c.npcRelationships??={};
        delete c.npcRelationships.shopkeeper_cat;
        if(c.achievements){
          Object.keys(c.achievements).forEach(id=>{
            if(id.startsWith("npc_evt_"))delete c.achievements[id];
          });
        }
        saveLocal();
      }
      toast(`♻️ ${reason}：NPC 測試資料已清除`,4500);
      renderNpcRelationships?.();
      renderNpcShop?.();
      return true;
    }catch(e){
      toast("NPC 重置失敗："+e.message,5000);return false;
    }
  };

  // Prevent reset command from showing as a normal item if it reaches direct gift box.

  // GM UI bindings

  // Improve GM debug with threshold readout.
  const _renderNpcDebug=typeof renderNpcDebug==="function"?renderNpcDebug:null;
  if(_renderNpcDebug){
    window.renderNpcDebug=function(){
      _renderNpcDebug();
      const box=document.getElementById("npcDebugBody");
      if(!box)return;
      let st=enrichNpcState(npcState()),sc=st.relationScore||{};
      let d=document.createElement("div");
      d.className="npcDebugStat npcRouteDebug";
      d.innerHTML=`關係達標值（玩家不會看到）<br>
      戀愛 ${sc.romance||0}/${NPC_ROUTE_THRESHOLDS.lover}　
      信任 ${sc.trust||0}/${NPC_ROUTE_THRESHOLDS.bestfriend}<br>
      秘密 ${sc.secret||0}/${NPC_ROUTE_THRESHOLDS.confidant}　
      惡作劇 ${sc.tease||0}/${NPC_ROUTE_THRESHOLDS.bickering}<br>
      貓線 ${sc.catChoice||0}/${NPC_ROUTE_THRESHOLDS.catfriend}（店貓需 70）<br>
      黑盒隱藏線：秘密 ${sc.secret||0}/${NPC_ROUTE_THRESHOLDS.secret}＋持有黑盒`;
      box.prepend(d);
    };
  }
})();
