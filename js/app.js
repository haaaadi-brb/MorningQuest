
/* ---------------- persistence (localStorage, per-viewer, synchronous) ---------------- */
const STORAGE_KEY = 'quest-state-v2';
const THEME_KEY = 'quest-theme';
const DEFAULT_STATE = {xp:0,streak:0,best:0,last:null,completedDate:null,completed:{},games:0,correct:0,typingBest:0,reactionBest:9999,reactionAvgBest:null,mathBest:0,puzzleBest:0,memoryBest:0,snakeBest:0,history:[],exploreCount:0,learnCount:0,sparkSeen:{}};
let S = structuredClone(DEFAULT_STATE);

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) S = Object.assign(structuredClone(DEFAULT_STATE), JSON.parse(raw));
  }catch(e){ /* private mode / no storage — continue with defaults for this session */ }
  try{
    const t = localStorage.getItem(THEME_KEY);
    if(t) document.documentElement.setAttribute('data-theme', t);
  }catch(e){}
  ensureToday();
  render();
  document.getElementById('loading').classList.add('hide');
}
function persist(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
  catch(e){ console.error('save failed', e); }
}
function save(){ persist(); render(); }

/* ---------------- content ---------------- */
const quests=[
 ['🧭','Brain warm-up','Solve a word puzzle or logic puzzle.',20,'https://www.nytimes.com/games/wordle/index.html','Try Wordle'],
 ['🗺️','Geography check','Play a geography game or explore a new place on the map.',20,'https://www.geoguessr.com/daily-challenges','GeoGuessr daily'],
 ['⛰️','Skill push','Do a chess, typing, coding, or math challenge.',20,'https://www.chess.com/puzzles','Chess puzzles'],
 ['🔭','Learn something','Read one article or discover a new fact.',15,'https://en.wikipedia.org/wiki/Special:Random','Random article'],
 ['🏕️','Camp time','Play one browser or old-school game, just for fun.',10,'https://www.crazygames.com','Browse games']
];
const drills=[
 ['🧩','Daily puzzle','Logic · 5 min','openPuzzle'],
 ['🚀','Reaction test','Reflex · 2 min','openReaction'],
 ['⌨️','Typing challenge','Speed · 3 min','openTyping'],
 ['➗','Math arena','Math · 5 min','openMath'],
 ['🧠','Memory match','Memory · 3 min','openMemory'],
 ['🐍','Snake','Arcade · 5 min','openSnake']
];
const achievements=[
 ['🌱','First steps','Complete your first daily trail', s=>s.streak>=1],
 ['🌍','Explorer','Play 3 wake-up drills', s=>s.games>=3],
 ['🧠','Quick thinker','Get 3 correct answers', s=>s.correct>=3],
 ['🔥','Streak master','Reach a 7-day streak', s=>s.best>=7],
 ['⭐','XP collector','Reach 1000 XP', s=>s.xp>=1000],
 ['⚡','Speed demon','React in under 400 ms', s=>s.reactionBest<400],
 ['⌨️','Fast fingers','Reach 45 WPM', s=>s.typingBest>=45],
 ['🏔️','Long haul','Reach a 14-day streak', s=>s.best>=14],
 ['🧮','Math whiz','Score 10 in one math session', s=>(s.mathBest||0)>=10],
 ['🧩','Puzzle streak','Solve 5 puzzles in one session', s=>(s.puzzleBest||0)>=5],
 ['📚','Curious mind','Log "Learn something" 5 times', s=>(s.learnCount||0)>=5],
 ['🧭','Wayfinder','Open 10 explore links', s=>(s.exploreCount||0)>=10]
];
const resources=[
 ['🎲','Random Wikipedia','A different article, every click','https://en.wikipedia.org/wiki/Special:Random'],
 ['🟩','Wordle','Today\'s five-letter puzzle','https://www.nytimes.com/games/wordle/index.html'],
 ['🔗','Connections','Group the words into four categories','https://www.nytimes.com/games/connections'],
 ['🌐','GeoGuessr daily','Guess the location from a street view','https://www.geoguessr.com/daily-challenges'],
 ['♟️','Chess.com puzzles','Daily tactics, all skill levels','https://www.chess.com/puzzles'],
 ['🎓','Khan Academy','Free lessons on almost anything','https://www.khanacademy.org'],
 ['🗣️','Duolingo','Five minutes of a new language','https://www.duolingo.com'],
 ['🎤','TED Talks','A short idea worth spreading','https://www.ted.com/talks'],
 ['🌎','National Geographic','A photo from somewhere far away','https://www.nationalgeographic.com'],
 ['🕹️','CrazyGames','Something quick and just for fun','https://www.crazygames.com']
];
const facts=[
 'Honey found in ancient Egyptian tombs is still edible thousands of years later — it simply never spoils.',
 'Octopuses have three hearts, and two of them stop beating when the animal swims.',
 'A day on Venus is longer than its year: it rotates so slowly that one spin takes longer than one orbit of the sun.',
 'Bananas are berries, but strawberries technically are not.',
 'The Great Wall of China is not, contrary to popular belief, visible to the naked eye from space.',
 'Wombat droppings are cube-shaped, which keeps them from rolling away and marks territory more effectively.',
 'Sharks existed before trees — sharks are roughly 400 million years old, trees about 350 million.',
 'A single cloud can weigh more than a million pounds, kept aloft by water droplets far lighter than raindrops.',
 'The inventor of the Pringles can was, per his wishes, partially buried in one.',
 'Sea otters hold hands while sleeping so they do not drift apart in the current.',
 'There are more possible chess games than atoms in the observable universe.',
 'The shortest war in recorded history, between Britain and Zanzibar in 1896, lasted under 40 minutes.',
 'Butterflies taste with their feet.',
 'Some turtles can breathe through their rear ends, which helps them survive long winters underwater.',
 'The Eiffel Tower grows about six inches taller in summer as the iron expands in the heat.',
 'A group of flamingos is called a "flamboyance."',
 'Human bones are, ounce for ounce, stronger than steel.',
 'The first computer "bug" was an actual moth found stuck in a relay in 1947.',
 'Antarctica is the largest desert on Earth, not the Sahara — deserts are defined by low precipitation, not heat.',
 'Cows have best friends and get measurably more stressed when separated from them.'
];
const quotes=[
 ['The secret of getting ahead is getting started.','Mark Twain'],
 ['Well begun is half done.','Aristotle'],
 ['Do the hard jobs first. The easy jobs will take care of themselves.','Dale Carnegie'],
 ['Small daily improvements are the key to staggering long-term results.','Robin Sharma'],
 ['You do not have to see the whole staircase, just take the first step.','Martin Luther King Jr.'],
 ['The way to get started is to quit talking and begin doing.','Walt Disney'],
 ['Discipline is choosing between what you want now and what you want most.','Abraham Lincoln'],
 ['A year from now you may wish you had started today.','Karen Lamb'],
 ['Amateurs sit and wait for inspiration; the rest of us just get up and go to work.','Stephen King'],
 ['What we do every day matters more than what we do once in a while.','Gretchen Rubin'],
 ['Morning is an important time of day, because how you spend your morning can often tell you what kind of day you are going to have.','Lemony Snicket'],
 ['The future depends on what you do today.','Mahatma Gandhi'],
 ['Success is the sum of small efforts, repeated day in and day out.','Robert Collier'],
 ['Either you run the day, or the day runs you.','Jim Rohn'],
 ['Every morning we are born again. What we do today is what matters most.','Buddha (attributed)']
];
const greetings=['Good morning, explorer.','Rise and chart the day.','The trailhead is open.','Another route to walk.','First light, time to move.'];

const today = () => new Date().toISOString().slice(0,10);
const dayOfYear = () => { const d=new Date(); const start=new Date(d.getFullYear(),0,0); return Math.floor((d-start)/864e5); };
const dayBefore = (isoDate) => { const d=new Date(isoDate+'T00:00:00'); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); };

function ensureToday(){
  const d = today();
  if(S.completedDate !== d){ S.completedDate = d; S.completed = {}; }
}

/* ---------------- render ---------------- */
let sparkMode = 'fact';
let sparkIndex = null;

function render(){
  document.getElementById('date').textContent = new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  document.getElementById('greetLine').textContent = greetings[new Date().getDate() % greetings.length];

  document.getElementById('quests').innerHTML = quests.map((q,i)=>{
    const done = !!S.completed[i];
    return `<div class="stop ${done?'done':''}">
      <div class="stopdot">${q[0]}</div>
      <div class="stopbody">
        <div class="name">${q[1]}</div>
        <div class="desc">${q[2]}</div>
        <a class="qlink" href="${q[4]}" target="_blank" rel="noopener" onclick="noteExplore(${i})">${q[5]} ↗</a>
      </div>
      <div class="stopright"><span class="xptag">+${q[3]} XP</span>
        <button class="stampbtn" ${done?'disabled':''} onclick="toggleQuest(${i})" aria-label="${done?'Completed for today':'Mark '+q[1]+' complete'}">${done?'✓':''}</button>
      </div></div>`;
  }).join('');

  document.getElementById('drills').innerHTML = drills.map(g=>`
    <div class="drill"><div class="dico">${g[0]}</div><h3>${g[1]}</h3><p>${g[2]}</p><button class="drillgo" onclick="${g[3]}()">Play</button></div>
  `).join('');

  document.getElementById('reslist').innerHTML = resources.map(r=>`
    <a class="resitem" href="${r[3]}" target="_blank" rel="noopener" onclick="noteExplore()">
      <span class="ico">${r[0]}</span>
      <span class="txt"><span class="t">${r[1]}</span><span class="d">${r[2]}</span></span>
      <span class="go">open ↗</span>
    </a>`).join('');
  document.getElementById('exploreCount').textContent = S.exploreCount || 0;

  const level = Math.floor(S.xp/250)+1, within = S.xp%250;
  document.getElementById('level').textContent = level;
  document.getElementById('xptext').textContent = `${within} / 250`;
  document.getElementById('levelbar').style.width = (within/250*100)+'%';
  document.getElementById('rank').textContent = ['Rookie','Wayfarer','Adventurer','Ranger','Legend','Mythic'][Math.min(5,Math.floor((level-1)/2))];

  document.getElementById('streak').textContent = S.streak;
  document.getElementById('best').textContent = S.best;
  document.getElementById('last').textContent = S.last || 'never';

  renderWeekDots();
  renderSpark();

  const earned = achievements.map(a=>({...a, ok:a[3](S)}));
  const patchHtml = (list)=> list.map(a=>`<div class="patch ${a.ok?'':'locked'}" title="${a[2]}">${a[0]}<span class="plabel">${a[1]}</span></div>`).join('');
  document.getElementById('patchesMini').innerHTML = patchHtml(earned.slice(0,4));
  document.getElementById('patchesBig').innerHTML = patchHtml(earned);

  document.getElementById('statgrid').innerHTML = [
    ['Total XP', S.xp],
    ['Level', level],
    ['Current streak', S.streak+' days'],
    ['Best streak', S.best+' days'],
    ['Drills played', S.games],
    ['Correct answers', S.correct],
    ['Best typing speed', (S.typingBest||0)+' WPM'],
    ['Best reaction', S.reactionBest===9999?'—':S.reactionBest+' ms'],
    ['Math arena best', (S.mathBest||0)+' in one run'],
    ['Puzzle best streak', (S.puzzleBest||0)+' in one run'],
    ['Memory rounds cleared', S.memoryBest||0],
    ['Snake best score', S.snakeBest||0],
    ['Explore links opened', S.exploreCount||0]
  ].map(([k,v])=>`<div class="statcard"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');

  document.getElementById('shareText').value =
`🌄 Morning Quest — ${new Date().toLocaleDateString()}
🔥 ${S.streak}-day streak (best ${S.best})
⭐ Level ${level} · ${S.xp} XP
🎖️ ${earned.filter(a=>a.ok).length}/${achievements.length} patches earned`;
}

function renderWeekDots(){
  const days=[]; const d=new Date();
  for(let i=6;i>=0;i--){ const x=new Date(d); x.setDate(d.getDate()-i); days.push(x.toISOString().slice(0,10)); }
  const labels=['S','M','T','W','T','F','S'];
  document.getElementById('weekdots').innerHTML = days.map(iso=>{
    const dow = new Date(iso+'T00:00:00').getDay();
    const on = S.history.includes(iso);
    const isToday = iso===today();
    return `<div class="wd"><div class="c ${on?'on':''} ${isToday?'today':''}"></div>${labels[dow]}</div>`;
  }).join('');
}

function renderSpark(){
  document.getElementById('tabFact').classList.toggle('active', sparkMode==='fact');
  document.getElementById('tabQuote').classList.toggle('active', sparkMode==='quote');
  const list = sparkMode==='fact' ? facts : quotes;
  if(sparkIndex===null || sparkIndex>=list.length) sparkIndex = dayOfYear() % list.length;
  const item = list[sparkIndex];
  document.getElementById('sparkText').innerHTML = sparkMode==='fact'
    ? item
    : `“${item[0]}”<span class="src">— ${item[1]}</span>`;
}
function setSparkMode(m){ sparkMode=m; sparkIndex=null; renderSpark(); }
function rollSpark(){
  const list = sparkMode==='fact' ? facts : quotes;
  let n; do{ n = Math.floor(Math.random()*list.length); }while(n===sparkIndex && list.length>1);
  sparkIndex = n; renderSpark();
}
function copySpark(){
  const list = sparkMode==='fact' ? facts : quotes;
  const item = list[sparkIndex];
  const text = sparkMode==='fact' ? item : `"${item[0]}" — ${item[1]}`;
  navigator.clipboard?.writeText(text).then(()=>toast('Copied to clipboard')).catch(()=>toast('Could not copy'));
}
function copyShare(){
  const t = document.getElementById('shareText').value;
  navigator.clipboard?.writeText(t).then(()=>toast('Summary copied')).catch(()=>toast('Could not copy'));
}

function noteExplore(questIndex){
  S.exploreCount = (S.exploreCount||0) + 1;
  if(questIndex===3) S.learnCount = (S.learnCount||0) + 1;
  save();
}

/* ---------------- quest logic ---------------- */
function toggleQuest(i){
  ensureToday();
  if(S.completed[i]) return;
  S.completed[i] = true;
  S.xp += quests[i][3];
  if(i===3) S.learnCount = (S.learnCount||0) + 1;
  burst(quests[i][0]);
  checkFullTrail();
  toast(quests[i][1]+' logged — +'+quests[i][3]+' XP');
  save();
}

function completeAllHandler(){
  ensureToday();
  let gained=0;
  quests.forEach((q,i)=>{ if(!S.completed[i]){ S.completed[i]=true; gained+=q[3]; if(i===3) S.learnCount=(S.learnCount||0)+1; } });
  S.xp += gained;
  const bonused = checkFullTrail(true);
  toast('Trail cleared — +'+(gained+(bonused?10:0))+' XP');
  burst('🏕️');
  save();
}

function checkFullTrail(silent){
  const completedCount = Object.keys(S.completed).length;
  const d = today();
  if(completedCount===5 && S.last!==d){
    S.xp += 10;
    S.streak = (S.last===dayBefore(d)) ? S.streak+1 : 1;
    S.best = Math.max(S.best, S.streak);
    S.last = d;
    if(!S.history.includes(d)) S.history.push(d);
    S.history = S.history.slice(-60);
    if(!silent) toast('Trail cleared! +10 bonus XP');
    return true;
  }
  return false;
}

/* ---------------- toast / burst ---------------- */
let toastTimer;
function toast(t){
  const e = document.getElementById('toast');
  e.textContent = t; e.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>e.classList.remove('show'), 2000);
}
function burst(emoji){
  const e = document.createElement('div');
  e.className='burst'; e.textContent=emoji;
  e.style.left = (window.innerWidth/2 + (Math.random()*80-40)) + 'px';
  e.style.top = '70%';
  document.body.appendChild(e);
  setTimeout(()=>e.remove(), 1000);
}

/* ---------------- navigation ---------------- */
document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.dataset.view;
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+id).classList.add('active');
    document.querySelectorAll('.railnav .railbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===id));
    render();
  });
});
document.getElementById('completeAllBtn').addEventListener('click', completeAllHandler);
document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(!confirm('Reset all Morning Quest progress? This cannot be undone.')) return;
  S = structuredClone(DEFAULT_STATE);
  ensureToday();
  persist();
  render();
  toast('Progress reset');
});
document.getElementById('themeBtn').addEventListener('click', ()=>{
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur==='light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  document.getElementById('themeBtn').textContent = next==='light' ? '🌙' : '☀️';
  try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
});
(function initThemeIcon(){
  const t = document.documentElement.getAttribute('data-theme');
  if(t==='light') document.getElementById('themeBtn') && (document.getElementById('themeBtn').textContent='🌙');
})();

/* ---------------- modal ---------------- */
let activeCleanup = null;
function modal(html, cleanup){
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modal').classList.add('show');
  activeCleanup = cleanup || null;
}
function closeModal(){
  document.getElementById('modal').classList.remove('show');
  if(activeCleanup){ activeCleanup(); activeCleanup=null; }
}
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });

/* ---------------- drills ---------------- */
const puzzles=[
 ['Which number comes next? 2, 6, 12, 20, 30, ?',['36','40','42','44'],'42'],
 ['If all Zips are Zaps and some Zaps are Zops, which must be true?',['All Zips are Zops','Some Zops are Zips','All Zips are Zaps','No Zops are Zips'],'All Zips are Zaps'],
 ['A clock shows 3:15. What is the smaller angle between the hands?',['0°','7.5°','15°','22.5°'],'7.5°']
];
function openPuzzle(){
  const p = puzzles[Math.floor(Math.random()*puzzles.length)];
  modal(`<h2>Daily puzzle</h2><p style="font-size:19px;margin-top:14px">${p[0]}</p>
    <div class="answer">${p[1].map(a=>`<button onclick="answerPuzzle(this,'${a.replace(/'/g,"\\'")}','${p[2].replace(/'/g,"\\'")}')">${a}</button>`).join('')}</div>
    <div class="result" id="res"></div>`);
}
function answerPuzzle(b,a,c){
  if(document.getElementById('res').textContent) return;
  const ok = a===c;
  document.getElementById('res').textContent = ok? '✅ Correct — +10 XP' : '❌ Not quite — the answer was '+c;
  if(ok){ S.xp+=10; S.correct++; }
  S.games++; save();
}

function openMath(){
  const a=Math.floor(Math.random()*30)+10, b=Math.floor(Math.random()*20)+5, c=a+b;
  const opts=[c,c+2,c-2,c+5].sort(()=>Math.random()-.5);
  modal(`<h2>Math arena</h2><p style="font-size:22px;margin-top:14px">${a} + ${b} = ?</p>
    <div class="answer">${opts.map(x=>`<button onclick="mathAnswer(this,${x},${c})">${x}</button>`).join('')}</div>
    <div class="result" id="res"></div>`);
}
function mathAnswer(b,x,c){
  if(document.getElementById('res').textContent) return;
  const ok = x===c;
  document.getElementById('res').textContent = ok? '✅ Correct — +10 XP' : '❌ The answer was '+c;
  if(ok){ S.xp+=10; S.correct++; }
  S.games++; save();
}

function openTyping(){
  const text = 'Small steps every morning create big progress over time.';
  modal(`<h2>Typing challenge</h2><p style="margin-top:14px">${text}</p>
    <textarea id="typebox" autofocus placeholder="Start typing to begin the timer…"></textarea>
    <button class="smallbtn" style="margin-top:10px" onclick="finishTyping('${text.replace(/'/g,"\\'")}')">Finish</button>
    <div class="result" id="res"></div>`);
  let started=null;
  document.getElementById('typebox').addEventListener('input', function handler(){
    if(started===null) started=performance.now();
    window._typingStart = started;
  });
}
function finishTyping(text){
  const box = document.getElementById('typebox');
  const v = box.value;
  if(!v || !window._typingStart){ document.getElementById('res').textContent='Start typing first.'; return; }
  const elapsedMin = Math.max((performance.now()-window._typingStart)/60000, 1/60000);
  const words = v.trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.max(1, Math.round(words/elapsedMin));
  const perfect = v.trim()===text;
  document.getElementById('res').textContent = `${perfect?'✅ Perfect':'👍 Nice try'} — ${wpm} WPM`;
  S.typingBest = Math.max(S.typingBest, wpm);
  S.xp += 5; S.games++; window._typingStart=null;
  save();
}

let reactTimeout=null;
function openReaction(){
  modal(`<h2>Reaction test</h2><p style="margin-top:10px">Wait for the panel to turn green, then click it as fast as you can.</p>
    <div class="reaction" id="react" onclick="reactClick()">wait…</div>`,
    ()=>{ if(reactTimeout) clearTimeout(reactTimeout); reactTimeout=null; });
  const delay = 1000 + Math.random()*3500;
  reactTimeout = setTimeout(()=>{
    const e = document.getElementById('react');
    if(!e) return;
    e.dataset.go = performance.now();
    e.style.background = '#3ee58a'; e.style.color = '#052014';
    e.textContent = 'click!';
  }, delay);
}
function reactClick(){
  const e = document.getElementById('react');
  if(!e.dataset.go || e.dataset.done) return;
  e.dataset.done = 1;
  const ms = Math.round(performance.now()-e.dataset.go);
  e.textContent = ms+' ms — '+(ms<400?'⚡ amazing':'good!');
  S.reactionBest = Math.min(S.reactionBest, ms);
  S.xp += 10; S.games++; save();
}

let memFirst=null, memLock=false, memPairs=0;
function openMemory(){
  memFirst=null; memLock=false; memPairs=0;
  const vals=['🍎','🚀','🐸','⭐'];
  const cards=[...vals,...vals].sort(()=>Math.random()-.5);
  modal(`<h2>Memory match</h2>
    <div id="mem" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:15px">
      ${cards.map((x,i)=>`<button data-v="${x}" data-i="${i}" onclick="flipMem(this)" style="height:62px;font-size:24px;background:color-mix(in srgb, var(--night) 92%, black 8%);color:var(--ink);border:1px solid var(--line);border-radius:9px">?</button>`).join('')}
    </div><div class="result" id="res"></div>`);
}
function flipMem(b){
  if(memLock || b.textContent!=='?') return;
  b.textContent = b.dataset.v;
  if(!memFirst){ memFirst=b; return; }
  if(memFirst.dataset.v===b.dataset.v){
    memPairs++; memFirst.disabled=b.disabled=true; memFirst=null;
    if(memPairs===4){ document.getElementById('res').textContent='🏆 Cleared! +20 XP'; S.xp+=20; S.memoryBest=Math.max(S.memoryBest||0,4); S.games++; save(); }
  }else{
    memLock=true;
    setTimeout(()=>{ memFirst.textContent='?'; b.textContent='?'; memFirst=null; memLock=false; }, 600);
  }
}

let snakeRunning=false, snakeKeyHandler=null;
function openSnake(){
  modal(`<h2>Snake</h2><canvas id="snake" width="340" height="340" style="width:100%;max-width:340px"></canvas><p style="font-size:12.5px;color:var(--mist)">Use arrow keys. Eat the ⭐.</p>`,
    ()=>{ snakeRunning=false; if(snakeKeyHandler) document.removeEventListener('keydown', snakeKeyHandler); });
  setTimeout(startSnake, 50);
}
function startSnake(){
  const c = document.getElementById('snake'); if(!c) return;
  const x = c.getContext('2d'), g=17;
  let snake=[{x:9,y:9}], dir={x:1,y:0}, next={x:1,y:0};
  let food={x:15,y:9}, score=0;
  snakeRunning = true;
  x.font = '18px sans-serif';
  snakeKeyHandler = e=>{
    if(e.key==='ArrowUp' && dir.y!==1) next={x:0,y:-1};
    if(e.key==='ArrowDown' && dir.y!==-1) next={x:0,y:1};
    if(e.key==='ArrowLeft' && dir.x!==1) next={x:-1,y:0};
    if(e.key==='ArrowRight' && dir.x!==-1) next={x:1,y:0};
  };
  document.addEventListener('keydown', snakeKeyHandler);
  function loop(){
    if(!snakeRunning) return;
    dir = next;
    const head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    if(head.x<0||head.y<0||head.x>=20||head.y>=20||snake.some(p=>p.x===head.x&&p.y===head.y)){
      snakeRunning=false; S.snakeBest=Math.max(S.snakeBest||0,score); save(); toast('Snake over — score '+score); return;
    }
    snake.unshift(head);
    if(head.x===food.x && head.y===food.y){
      score++; S.xp+=2;
      food = {x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*20)};
    } else snake.pop();
    x.clearRect(0,0,340,340);
    x.fillStyle = 'var(--dawn)'.includes('var') ? getComputedStyle(document.documentElement).getPropertyValue('--dawn').trim() : '#f3b95f';
    snake.forEach(p=>x.fillRect(p.x*g+1, p.y*g+1, g-2, g-2));
    x.fillText('⭐', food.x*g, food.y*g+16);
    setTimeout(loop, 110);
  }
  loop();
}

/* ---------------- boot ---------------- */
loadState();
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then(registration => {
          console.log(
            "Morning Quest service worker registered:",
            registration.scope
          );
        })
        .catch(error => {
          console.error(
            "Morning Quest service worker registration failed:",
            error
          );
        });
    });
  }