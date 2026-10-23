/* Local-only learning journey; all legal detail comes from the existing graph. */
(function(global){
'use strict';
const KEY='lawu-neuron-journey-v1',subjects=['民法總則','物權','刑法總則'];
function create(graph){
 let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{};}catch{}
 const state={done:saved.done===true,unlocked:subjects.filter((s,i)=>i===0||Array.isArray(saved.unlocked)&&saved.unlocked.includes(s)),seen:Array.isArray(saved.seen)?saved.seen.filter(k=>graph.nodes.some(n=>n.kind==='question'&&n.key===k)):[]};
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}};
 const subject=n=>subjects.find(s=>String(n.obj.category||n.obj.subject||'').includes(s));
 const neighbors=n=>graph.edges.flatMap(([a,b])=>a===n.key?[b]:b===n.key?[a]:[]).map(k=>graph.nodes.find(n=>n.key===k));
 const candidates=graph.nodes.filter(n=>n.kind==='question'&&subject(n)===subjects[0]).map(q=>{const ns=neighbors(q),issue=ns.find(n=>n.kind==='issue'),pack=ns.find(n=>n.kind==='pack');const article=ns.find(n=>n.kind==='article'&&neighbors(n).some(v=>v.kind==='question'&&v.key!==q.key&&subject(v)===subjects[0]));return {q,issue,pack,article,score:ns.length};}).filter(c=>c.issue&&c.pack&&c.article).sort((a,b)=>b.score-a.score);
 const sample=candidates[0];let step=0,passed=false,draw,detail,getView,setView;
 const $=s=>document.querySelector(s);
 function options(){const select=$('#mm-subject');if(!select)return;[...select.options].forEach((o,i)=>{o.disabled=!state.unlocked.includes(subjects[i]);o.textContent=(o.disabled?'🔒 ':'')+subjects[i];});if(select.selectedOptions[0]?.disabled)select.value=subjects[0];const count=graph.nodes.filter(n=>n.kind==='question'&&subject(n)===select.value&&state.seen.includes(n.key)).length;$('#mm-progression').textContent=state.unlocked.length===subjects.length?'所有科目已解鎖':select.value+'：已探索 '+Math.min(3,count)+'/3 題，點選不同藍點解鎖下一科。';}
 function visit(n){if(step||n.kind!=='question')return;const sub=subject(n);if(!state.unlocked.includes(sub))return;if(!state.seen.includes(n.key))state.seen.push(n.key);if(graph.nodes.filter(v=>v.kind==='question'&&subject(v)===sub&&state.seen.includes(v.key)).length>=3){const next=subjects[subjects.indexOf(sub)+1];if(next&&!state.unlocked.includes(next))state.unlocked.push(next);}persist();}
 function allowed(active){const seeds=graph.nodes.filter(n=>n.kind==='question'&&state.unlocked.includes(subject(n))),open=new Set(seeds.flatMap(n=>[n,...neighbors(n)]).filter(n=>n.kind!=='question'||state.unlocked.includes(subject(n))).map(n=>n.key));return new Set([...active].filter(k=>open.has(k)));}
 function finish(skipped){step=0;state.done=true;persist();$('#mm-tutorial').hidden=false;$('#mm-tutorial').innerHTML='<h3>'+(skipped?'已跳過教學':'教學完成')+'</h3><p>從民法總則開始探索；每科點選 3 個不同題目，解鎖下一科。</p>';controls(false);options();draw();}
 function controls(disabled){['#mm-subject','#mm-search','#mm-fit','#mm-in','#mm-out'].forEach(s=>$(s).disabled=disabled);$('#mm-guide').open=false;$('#mm-progression').hidden=disabled;$('#mm-stage').classList.toggle('mm-learning',disabled);}
 function show(){
  if(!sample)return;getView()?.destroy();controls(true);$('#mm-detail').hidden=true;
  const {q,issue,article,pack}=sample,other=neighbors(article).find(n=>n.kind==='question'&&n.key!==q.key&&subject(n)===subjects[0]);
  const nodes=[q,...(step>=2?[issue]:[]),...(step>=3?[article]:[]),...(step>=4?[other]:[]),...(step>=5?[pack]:[])],keys=new Set(nodes.map(n=>n.key));
  const titles=['認識一顆點','找出爭點','找到法條','發現連結','組合包'],messages=['這是一題考古題','這題在吵什麼？請點一下橘點。','請點一下綠點，閱讀條號與資料中的說明。','同一條法條會在不同題目重複出現，這就是要背熟的重點。','常一起考的法條打包成一組。'];
  passed=step!==2&&step!==3;const card=$('#mm-tutorial');card.hidden=false;card.innerHTML=`<p>新手教學 ${step}/5</p><progress max="5" value="${step}" aria-label="教學進度"></progress><h3>${titles[step-1]}</h3><p>${messages[step-1]}</p><button id="mm-next" ${passed?'':'disabled'}>${step===5?'完成教學':'下一步'}</button> <button id="mm-skip">跳過教學</button>`;
  $('#mm-count').textContent=`教學 ${step}/5 · ${nodes.length} 節點`;
  setView(global.LawMindmap.mount($('#mm-stage'),{tutorial:true,nodes,edges:graph.edges.filter(([a,b])=>keys.has(a)&&keys.has(b))},n=>{detail(n);if(step===2&&n.key===issue.key||step===3&&n.key===article.key){passed=true;$('#mm-next').disabled=false;}}));
  $('#mm-next').onclick=()=>{if(!passed)return;if(step===5)finish(false);else{step++;show();}};$('#mm-skip').onclick=()=>finish(true);
 }
 function bind(d,dt,g,s){draw=d;detail=dt;getView=g;setView=s;$('#mm-replay').onclick=()=>{step=1;show();};$('#mm-unlock').onclick=()=>{state.unlocked=[...subjects];persist();options();if(step)finish(true);else draw();};if(!state.done){step=1;show();}}
 return {visit,options,allowed,bind};
}
global.LawJourney={create};
})(window);
