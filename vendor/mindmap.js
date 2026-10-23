/* Original local force-directed neuron network. No third-party code. */
(function(global){
'use strict';
function mount(host,graph,onSelect){
 const NS='http://www.w3.org/2000/svg',el=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;};
 const svg=el('svg',{width:'100%',height:'100%','aria-label':'可拖曳縮放的神經元網路'}),scene=el('g');svg.append(scene);host.replaceChildren(svg);
 const labels=el('g',{'pointer-events':'none'});svg.append(labels);
 const colors={question:'#63ccff',issue:'#ffc86a',article:'#65efb2',pack:'#c49aff'};
 const nodes=graph.nodes.map((n,i)=>({...n,x:Math.cos(i*2.39996)*Math.sqrt(i+1)*110,y:Math.sin(i*2.39996)*Math.sqrt(i+1)*110,vx:0,vy:0})),byId=new Map(nodes.map(n=>[n.key,n])),adj=new Map(nodes.map(n=>[n.key,new Set()]));
 const edges=graph.edges.map(([a,b])=>{adj.get(a).add(b);adj.get(b).add(a);const path=el('path',{fill:'none',stroke:'#78b8d3','stroke-width':1.2,'stroke-opacity':.27});scene.append(path);return {a:byId.get(a),b:byId.get(b),path};});
 let selected=null,second=false,scale=1,x=0,y=0,frame,steps=0,drag=null,moved=false,lastTap=null;const pointers=new Map();
 nodes.forEach(n=>{const g=el('g',{tabindex:0,role:'button','aria-label':n.label});n.g=g;g.style.cursor='grab';g.append(el('circle',{r:21,fill:colors[n.kind],opacity:.07}),el('circle',{r:13,fill:colors[n.kind],opacity:.18}),el('circle',{r:n.kind==='article'?6:8,fill:colors[n.kind],stroke:'#e7ffff','stroke-width':.7}));const t=el('text',{fill:colors[n.kind],'font-size':13,'font-family':'system-ui','paint-order':'stroke',stroke:'#091725','stroke-width':4});n.text=t;labels.append(t);const title=el('title');title.textContent=n.label;g.append(title);g.addEventListener('pointerdown',()=>{drag=n;});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n.key,e.shiftKey);}});scene.append(g);});
 function select(key,toggle=false){if(!byId.has(key))return;if(toggle)second=selected===key?!second:true;else if(selected!==key)second=false;selected=key;const active=new Set([key,...adj.get(key)]);if(second)[...active].forEach(k=>adj.get(k).forEach(v=>active.add(v)));nodes.forEach(n=>{n.g.style.opacity=active.has(n.key)?'1':'.025';n.text.style.fontWeight=n.key===key?'bold':'normal';});edges.forEach(e=>{const direct=e.a.key===key||e.b.key===key;e.path.setAttribute('stroke-opacity',direct?.85:second&&active.has(e.a.key)&&active.has(e.b.key)?.5:.035);e.path.setAttribute('stroke-width',direct?2.5:1.2);});const n=byId.get(key);scale=Math.max(scale,.8);x=host.clientWidth/2-n.x*scale;y=host.clientHeight/2-n.y*scale;transform();onSelect(n);}
 function transform(){scene.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);layoutLabels();}
 function layoutLabels(){
  const occupied=[],w=host.clientWidth,h=host.clientHeight;
  const ordered=[...nodes].sort((a,b)=>(a.key===selected?-2:adj.get(selected)?.has(a.key)?-1:0)-(b.key===selected?-2:adj.get(selected)?.has(b.key)?-1:0));
  ordered.forEach(n=>{const focus=selected&&(n.key===selected||adj.get(selected).has(n.key));
   const show=selected?focus:!graph.overview&&(['question','pack'].includes(n.kind)||scale>=1.6);
   n.text.style.display='none';if(!show)return;
   const full=focus?n.label:(Array.from(n.label).slice(0,9).join('')+(Array.from(n.label).length>9?'…':''));
   const lines=focus?(full.match(/.{1,18}/gu)||['']):[full];
   n.text.replaceChildren();lines.forEach((line,i)=>{const t=el('tspan',{x:0,dy:i?17:0});t.textContent=line;n.text.append(t);});
   const measured=typeof n.text.getBBox==='function'?n.text.getBBox():null;
   const bw=Math.max(measured?.width||0,...lines.map(l=>Array.from(l).reduce((v,c)=>v+(/[ -~]/.test(c)?8:14),0)))+10,bh=Math.max(measured?.height||0,lines.length*17)+8;
   const nx=n.x*scale+x,ny=n.y*scale+y;
   let box=null;for(let r=0;r<(focus?90:10)&&!box;r++){const gap=16+r*12;for(const [dx,dy] of [[gap,-bh/2],[-bw-gap,-bh/2],[-bw/2,-bh-gap],[-bw/2,gap]]){const b={x:nx+dx,y:ny+dy,w:bw,h:bh};if(b.x<4||b.y<4||b.x+b.w>w-4||b.y+b.h>h-4)continue;if(!occupied.some(a=>b.x<a.x+a.w+5&&b.x+b.w+5>a.x&&b.y<a.y+a.h+5&&b.y+b.h+5>a.y)){box=b;break;}}}
   if(box){occupied.push(box);n.text.setAttribute('transform',`translate(${box.x+4} ${box.y+15})`);n.text.style.display='';}
  });
 }
 function paint(){nodes.forEach(n=>n.g.setAttribute('transform',`translate(${n.x} ${n.y})`));edges.forEach(({a,b,path})=>{const dx=b.x-a.x,dy=b.y-a.y;path.setAttribute('d',`M${a.x},${a.y} Q${(a.x+b.x)/2-dy*.12},${(a.y+b.y)/2+dx*.12} ${b.x},${b.y}`);});layoutLabels();}
 function fit(){if(!nodes.length)return;const minX=Math.min(...nodes.map(n=>n.x))-30,maxX=Math.max(...nodes.map(n=>n.x))+145,minY=Math.min(...nodes.map(n=>n.y))-30,maxY=Math.max(...nodes.map(n=>n.y))+30;scale=Math.min(host.clientWidth/(maxX-minX),host.clientHeight/(maxY-minY),1.5)*.92;x=host.clientWidth/2-(minX+maxX)/2*scale;y=host.clientHeight/2-(minY+maxY)/2*scale;transform();}
 function tick(){const alpha=Math.max(.02,1-steps/260);for(let i=0;i<nodes.length;i++){const a=nodes[i];for(let j=i+1;j<nodes.length;j++){const b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy+25,f=Math.min(14,22000/d2)*alpha,dist=Math.sqrt(d2);a.vx-=dx/dist*f;a.vy-=dy/dist*f;b.vx+=dx/dist*f;b.vy+=dy/dist*f;}}edges.forEach(({a,b})=>{const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,f=(d-210)*.009*alpha;a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;});nodes.forEach(n=>{n.vx=(n.vx-n.x*.0006*alpha)*.82;n.vy=(n.vy-n.y*.0006*alpha)*.82;if(n!==drag){n.x+=n.vx;n.y+=n.vy;}});if(selected){const n=byId.get(selected);x=host.clientWidth/2-n.x*scale;y=host.clientHeight/2-n.y*scale;transform();}paint();if(steps%15===0&&!pointers.size&&steps<180&&!selected)fit();if(++steps<280)frame=requestAnimationFrame(tick);}
 function zoom(f,cx=host.clientWidth/2,cy=host.clientHeight/2){const next=Math.max(.12,Math.min(5,scale*f));x=cx-(cx-x)*next/scale;y=cy-(cy-y)*next/scale;scale=next;transform();}
 const point=e=>({x:e.clientX,y:e.clientY});let origin=null,previous=null;
 const gesture=()=>{const p=[...pointers.values()];return {x:p.reduce((s,v)=>s+v.x,0)/p.length,y:p.reduce((s,v)=>s+v.y,0)/p.length,d:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0};};
 svg.addEventListener('pointerdown',e=>{if(!pointers.size){moved=false;origin=point(e);}else drag=null;pointers.set(e.pointerId,point(e));previous=gesture();svg.setPointerCapture(e.pointerId);});
 svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,point(e));const g=gesture();if(Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>5)moved=true;if(moved){if(drag&&pointers.size===1){drag.x+=(g.x-previous.x)/scale;drag.y+=(g.y-previous.y)/scale;drag.vx=drag.vy=0;paint();}else{x+=g.x-previous.x;y+=g.y-previous.y;if(g.d&&previous.d){const r=svg.getBoundingClientRect();zoom(g.d/previous.d,g.x-r.left,g.y-r.top);}transform();}}previous=g;});
 function release(e){if(!pointers.has(e.pointerId))return;const n=drag;if(e.type==='pointerup'&&!moved&&pointers.size===1){if(n){const now=Date.now(),double=lastTap?.key===n.key&&now-lastTap.time<350;select(n.key,double);lastTap=double?null:{key:n.key,time:now};}else{selected=null;second=false;nodes.forEach(n=>n.g.style.opacity=1);edges.forEach(e=>{e.path.setAttribute('stroke-opacity',.27);e.path.setAttribute('stroke-width',1.2);});layoutLabels();}}pointers.delete(e.pointerId);drag=null;previous=pointers.size?gesture():null;}
 svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
 const observer=new ResizeObserver(fit);observer.observe(host);paint();fit();frame=requestAnimationFrame(tick);
 return {select,fit,zoom,reset:()=>{selected=null;second=false;nodes.forEach(n=>n.g.style.opacity=1);edges.forEach(e=>{e.path.setAttribute('stroke-opacity',.27);e.path.setAttribute('stroke-width',1.2);});fit();},destroy:()=>{cancelAnimationFrame(frame);observer.disconnect();}};
}
global.LawMindmap={mount};
})(window);
