

document.getElementById("npcStoryDialogue")?.addEventListener("click",e=>{
  if(e.target.closest("[data-rpg-choice]"))return;
  advanceNpcRpgStory();
});
document.getElementById("npcStoryChoices")?.addEventListener("click",e=>{
  let b=e.target.closest("[data-rpg-choice]");if(!b||!npcStoryPlayerState)return;
  let line=npcStoryPlayerState.lines[npcStoryPlayerState.index];
  let choice=line?.choices?.[Number(b.dataset.rpgChoice)];
  if(choice?.effect)choice.effect();
  npcStoryPlayerState.index++;
  if(npcStoryPlayerState.index>=npcStoryPlayerState.lines.length)finishNpcRpgStory();
  else renderNpcRpgLine();
});
document.getElementById("closeNpcStoryPlayer")?.addEventListener("click",e=>{e.stopPropagation();cancelNpcRpgStory()});

