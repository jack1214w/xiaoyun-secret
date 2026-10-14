const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const src=html.split('<script>\n')[1].split('</script>')[0];
const GAME=new Function(src+';return GAME')();
const G=GAME, TY=G.types, P=id=>G.people[id];
const L=[];
L.push('# 藏在小芸心中的秘密：完整劇本','','> 這份文件是從 `index.html` 的劇本設定區自動產生的，方便閱讀與討論。要修改內容，請改 `index.html` 裡的設定，再重新產生這份文件。','');
L.push('## 選項類型','','| 類型 | 意思 | 在小芸面前，心門的預設變化 |','|---|---|---|');
for(const k in TY)L.push(`| ${TY[k].n} | ${TY[k].why} | ${TY[k].d>0?'+':''}${TY[k].d} |`);
L.push('','心門從 '+G.startHeart+' 開始（0–100，玩家看不到）。選項後面標示的數字，是該選項自訂的變化。','');
L.push('## 線索','','| 線索 | 內容 | 在哪裡找 |','|---|---|---|');
const clueSrc={};
G.cards.forEach(c=>c.ops.forEach(o=>{const cs=[o.clue,o.v&&o.v.A.clue,o.v&&o.v.B.clue].filter(Boolean);cs.forEach(x=>{(clueSrc[x]=clueSrc[x]||new Set()).add(P(c.who).n)})}));
for(const id of G.clueOrder){const c=G.clues[id];L.push(`| ${c.n} | ${c.tx} | ${[...(clueSrc[id]||[])].join('、')} |`)}
L.push('');
const fmt=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const cardById={};G.cards.forEach(c=>cardById[c.id]=c);
function opt(o,card,tag){
  const t=TY[o.t]; const ex=[];
  const d=o.d!=null?o.d:(card.heart?t.d:null);
  if(d!=null&&d!==0)ex.push('心門 '+(d>0?'+':'')+d);
  if(o.clue)ex.push('得到線索「'+G.clues[o.clue].n+'」');
  if(o.cost)ex.push('花 '+o.cost+' 分鐘');
  let s=`  - ${tag?tag+'：':''}**${t.n}**${ex.length?'（'+ex.join('，')+'）':''}　${o.r}`;
  if(o.in)s+=`\n    - 小芸心裡想：「${o.in}」`;
  return s;
}
function card(c){
  L.push(`#### ${c.ti}（${P(c.who).n}）`,'');
  L.push(c.tx.replace('{v}','〔線索〕'),'');
  if(c.vars)L.push(`- 線索 A：${c.vars.A}`,`- 線索 B：${c.vars.B}`,'');
  if(c.kind==='guess'){c.ops.forEach((o,i)=>L.push(`${i+1}. ${o.l}${o.g===G.guessTruth?'（正確）':''}`));L.push('',c.after,'');return}
  c.ops.forEach((o,i)=>{
    L.push(`${i+1}. ${o.l}${o.req?`　*（要先找到線索「${G.clues[o.req].n}」才會出現）*`:''}`);
    if(o.v){const base=Object.assign({},o);delete base.v;L.push(opt(Object.assign({},base,o.v.A),c,'線索 A'));L.push(opt(Object.assign({},base,o.v.B),c,'線索 B'))}
    else L.push(opt(o,c));
  });
  if(c.late)L.push('',`倒數結束：${c.late}`);
  L.push('');
}
L.push('## 一天的流程','');
G.phases.forEach((ph,i)=>{
  L.push(`### ${i+1}. ${ph.n}　${fmt(ph.t)}${ph.free?'–'+fmt(ph.end):''}`,'',`目標：${ph.goal}`,'');
  if(ph.free){
    L.push('下課可以去找這些人（時間不夠全部找完）：','');
    ph.npcs.forEach(n=>L.push(`- ${P(n.who).n}${n.skip?'（上次下課沒找過才會出現）':''}`));L.push('');
    ph.npcs.filter(n=>!n.skip).forEach(n=>card(cardById[n.card]));
  }else ph.cards.forEach(id=>card(cardById[id]));
});
L.push('## 結局','','| 心門 | 結局 | 描述 |','|---|---|---|');
G.tiers.forEach(t=>L.push(`| ${t.min} 以上 | ${t.n} | ${t.d} |`));
L.push('',`最好的結局，如果玩家把講稿還給小芸，會多一段後記：${G.epilogue.script}`,'');
L.push('## 小芸的秘密（結算頁揭曉）','');G.truth.forEach(t=>L.push(t,''));
L.push('## 結算頁的補充','');G.endNotes.forEach(n=>L.push(`**${n.title}**　${n.text}`,''));
L.push('## 討論題','');G.questions.forEach((q,i)=>L.push(`${i+1}. ${q.replace('{self}','（開場自評的答案）')}`));
L.push('',`結語：${G.closing}`,'');
fs.writeFileSync(process.argv[3],L.join('\n'));
console.log('ok',L.length);
