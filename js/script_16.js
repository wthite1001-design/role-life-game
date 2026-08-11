
(function(){
  const oldFinish=finishNpcRpgStory;
  window.finishNpcRpgStory=function(){
    document.body.classList.remove("npcStoryRunning");
    return oldFinish();
  };
})();
