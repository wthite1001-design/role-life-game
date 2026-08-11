
const GUIDE_PAGES={
 newbie:`<h3>🌸 歡迎來到《關係進行式》</h3>
 <p>角色會隨時間生活，而你的選擇會慢慢留下屬於這個角色的人生紀錄。</p>
 <h3>🌱 第一天建議</h3>
 <p>① 完成每日任務：每天 00:00 刷新。<br>② 記得打工：每天次數有限，特殊商品很需要錢。<br>③ 處理個人生活事件：結果可能影響體力、飽食度、心情、EXP 或金錢。<br>④ 留意角色狀態，不是每件事都會有好結果。<br>⑤ 有朋友的話，可以開始建立第一段關係。</p>
 <div class="guideTip">💡 每天上線一下，比偶爾一次玩很久更容易碰到不同內容。</div>`,
 bond:`<h3>💞 關係與羈絆</h3>
 <p>💕戀人、🤝摯友、🏠家人、⚔️搭檔、🔥宿敵、💢仇敵，每一種類型只能綁定一名角色。</p>
 <p>聊天、互動、小遊戲與共同外出都能留下共同紀錄並培養羈絆。</p>
 <p><b>Lv.1–5</b> 🌱 初識<br><b>Lv.6–10</b> 🌿 熟悉<br><b>Lv.11–15</b> 🌸 親近<br><b>Lv.16–20</b> 💗 深厚<br><b>Lv.21–25</b> 💞 無可取代<br><b>Lv.26–30</b> ✨ 靈魂羈絆<br><b>Lv.30 MAX＋特殊條件</b> 👑 頂級關係</p>
 <div class="guideTip">🔄 關係不是永遠固定的。某些關係轉變本身也可能留下特殊成就。</div>`,
 shop:`<h3>🏪 商店與特殊收藏</h3>
 <p>普通商品較容易取得；今日特別商品每天隨機出現。特殊收藏品每件只能購買一次，取得後再次出現會顯示售罄。</p>
 <p>如果連續遇到已買過的特殊商品，系統會提高尚未取得收藏品出現的機會。</p>
 <div class="guideTip">🎒 不要只用數值判斷收藏品。有些物品放在一起，也許會發生平常看不到的小故事。</div>
 <p>有時候，一場完美的午後，需要的不只是食物。</p>`,
 ach:`<h3>🏆 成就與徽章</h3>
 <p>成就包含一般、角色、關係、節日與隱藏內容。看到 🔒？？？ 並不是故障，而是條件尚未揭曉。</p>
 <p>關係轉變、特殊組合、長期培養與頂級突破都值得嘗試。</p>
 <h3>🎖️ 徽章</h3><p>將一段關係培養到普通羈絆的盡頭並完成頂級突破，可以取得對應的關係徽章；取得後可選擇作為角色展示徽章。</p>
 <div class="guideTip">🌙 真正值得收集的，也許不是數值，而是只有這兩個角色才會發生的事情。</div>`
};
function openGuide(tab="newbie"){
 const m=document.getElementById("guideModal"),b=document.getElementById("guideBody");
 if(!m||!b)return;m.classList.remove("hidden");
 document.querySelectorAll(".guideTab").forEach(x=>x.classList.toggle("active",x.dataset.guide===tab));
 b.innerHTML=GUIDE_PAGES[tab]||GUIDE_PAGES.newbie;
}
document.addEventListener("click",e=>{
 const g=e.target.closest("#openGuideBtn");if(g){closeMenu?.();openGuide();return}
 const t=e.target.closest(".guideTab");if(t){openGuide(t.dataset.guide);return}
 if(e.target.closest("#closeGuideBtn"))document.getElementById("guideModal")?.classList.add("hidden");
});
