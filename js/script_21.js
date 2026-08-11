
/* === 3.25 RPG 台詞情緒自動表情切換 === */
(function(){
  const FACE_PATHS={
    normal:"assets/npc/shopkeeper_cat/normal.png",
    happy:"assets/npc/shopkeeper_cat/happy.png",
    shy:"assets/npc/shopkeeper_cat/shy.png",
    annoyed:"assets/npc/shopkeeper_cat/annoyed.png",
    surprised:"assets/npc/shopkeeper_cat/surprised.png",
    soft:"assets/npc/shopkeeper_cat/soft.png"
  };

  function setStoryFace(face){
    if(!FACE_PATHS[face]) face="normal";
    const img=document.getElementById("npcStoryPortrait");
    if(img){
      const target=FACE_PATHS[face];
      if(!img.src.endsWith(target)) img.src=target;
      img.dataset.npcFace=face;
    }
    if(typeof window.setNpcExpression==="function"){
      try{ window.setNpcExpression(face); }catch(e){}
    }
  }
  window.setStoryFace=setStoryFace;

  function inferFace(line, prev="normal"){
    if(!line) return prev;
    if(line.face && FACE_PATHS[line.face]) return line.face;

    const speaker=String(line.speaker||"");
    const text=String(line.text||"");

    // 旁白不主動改表情，保留上一句店長情緒。
    if(speaker==="旁白") return prev;

    // 玩家說話時店長仍維持上一個反應，除非該句明確指定 face。
    if(speaker==="你") return prev;

    // 店長台詞的簡易情緒判定。
    if(/[！？!?]{1,}|咦|欸？|等等|什麼|真的嗎|怎麼會/.test(text))
      return "surprised";

    if(/笨蛋|出去|很煩|不要亂|閉嘴|不、能|不行|趕你|收你|你很閒|想得美|現在很想了/.test(text))
      return "annoyed";

    if(/別想太多|沒有特地|才不是|只是剛好|……喔|不要自己解讀|你很在意|想見|等你|明天也來|不是來買東西/.test(text))
      return "shy";

    if(/哈哈|笑|歡迎回來|很好|喜歡|謝啦|謝謝|很適合|開心|勉強接受|記得你|慢慢看/.test(text))
      return "happy";

    if(/累|難過|秘密|以前|過去|照片|相信|不會跟別人|晚一點再走|安靜|沒關係|願意/.test(text))
      return "soft";

    return "normal";
  }
  window.inferNpcStoryFace=inferFace;

  // 覆蓋 RPG 單句渲染：在文字出現前先換表情。
  const oldRender=window.renderNpcRpgLine;
  if(typeof oldRender==="function"){
    window.renderNpcRpgLine=function(){
      const st=window.npcStoryPlayerState;
      if(st && Array.isArray(st.lines)){
        const line=st.lines[st.index];
        const img=document.getElementById("npcStoryPortrait");
        const prev=img?.dataset?.npcFace || "normal";
        setStoryFace(inferFace(line,prev));
      }
      return oldRender();
    };
  }

  // 故事剛開始先套第一句表情，避免第一幀還是上一個畫面。
  const oldStart=window.startNpcRpgStory;
  if(typeof oldStart==="function"){
    window.startNpcRpgStory=function(opts){
      const first=opts?.lines?.[0];
      setStoryFace(inferFace(first,"normal"));
      return oldStart(opts);
    };
  }

  // 劇情資料可直接使用 face:"shy" 這類標記，優先級高於文字自動推測。
  // 對目前幾段重要劇情補明確表情，讓演出更穩定。
  try{
    const S=window.NPC_RPG_STORIES;
    if(S){
      const mark=(id,index,face)=>{
        if(S[id]?.[index]) S[id][index].face=face;
      };

      mark("shop_story_01",1,"happy");
      mark("shop_story_01",3,"shy");
      mark("shop_story_01",5,"shy");
      mark("shop_story_01",7,"shy");

      mark("shop_story_02",0,"normal");
      mark("shop_story_02",2,"annoyed");
      mark("shop_story_02",4,"soft");
      mark("shop_story_02",8,"shy");

      mark("shop_story_03",1,"normal");
      mark("shop_story_03",3,"shy");
      mark("shop_story_03",6,"soft");
      mark("shop_story_03",8,"annoyed");

      mark("shop_story_04",1,"surprised");
      mark("shop_story_04",4,"soft");
      mark("shop_story_04",6,"shy");

      mark("shop_event_first",1,"happy");
      mark("shop_event_first",3,"happy");
      mark("shop_event_first",5,"surprised");

      mark("shop_event_night",1,"soft");
      mark("shop_event_night",3,"shy");
      mark("shop_event_night",5,"shy");
    }
  }catch(e){console.warn("story face markers",e)}

  // 最終結局是在另一個 ENDING_LINES 裡，也補上情緒。
  try{
    if(typeof ENDING_LINES!=="undefined"){
      const markEnd=(type,index,face)=>{
        if(ENDING_LINES[type]?.[index]) ENDING_LINES[type][index].face=face;
      };
      markEnd("lover",2,"shy");
      markEnd("lover",4,"shy");
      markEnd("lover",5,"shy");

      markEnd("bestfriend",0,"happy");
      markEnd("bestfriend",2,"happy");

      markEnd("confidant",1,"soft");
      markEnd("confidant",3,"shy");

      markEnd("bickering",1,"annoyed");
      markEnd("bickering",3,"happy");

      markEnd("catfriend",1,"annoyed");
      markEnd("catfriend",3,"shy");

      markEnd("blacksecret",1,"soft");
      markEnd("blacksecret",3,"soft");
      markEnd("blacksecret",4,"shy");

      markEnd("regular",0,"soft");
      markEnd("regular",2,"happy");
    }
  }catch(e){console.warn("ending face markers",e)}
})();
