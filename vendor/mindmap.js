/* Law Universe SVG mind map — original local implementation, MIT license. */
(function(global){
'use strict';
const NS='http://www.w3.org/2000/svg';
function mount(host,graph,onSelect){
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('aria-label','可拖曳縮放的心智圖');
 const scene=document.createElementNS(NS,'g');svg.append(scene);host.replaceChildren(svg);
 const positions=new Map(),levels=[];graph.nodes.forEach(n=>(levels[n.depth]??=[]).push(n));
 let maxHeight=0;levels.forEach((nodes,d)=>{let y=0;nodes.forEach(n=>{const chars=12,lines=Array.from(n.label);n.lines=[];while(lines.length)n.lines.push(lines.splice(0,chars).join(''));n.height=Math.max(64,34+n.lines.length*25);positions.set(n.key,{x:d*310,y,w:264,h:n.height});y+=n.height+24;});maxHeight=Math.max(maxHeight,y);});
 levels.forEach(nodes=>{const last=positions.get(nodes[nodes.length-1].key);const height=last.y+last.h;nodes.forEach(n=>positions.get(n.key).y+=(maxHeight-height)/2);});
 const el=(tag,attrs)=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;};
 graph.edges.forEach(([a,b])=>{const p=positions.get(a),q=positions.get(b);if(!p||!q)return;scene.append(el('path',{d:`M${p.x+p.w},${p.y+p.h/2} C${p.x+p.w+24},${p.y+p.h/2} ${q.x-24},${q.y+q.h/2} ${q.x},${q.y+q.h/2}`,fill:'none',stroke:'#7392aa','stroke-width':2}));});
 const colors={question:'#164c74',issue:'#66451a',article:'#24543e',pack:'#553d78'};
 graph.nodes.forEach(n=>{const p=positions.get(n.key),g=el('g',{transform:`translate(${p.x} ${p.y})`,tabindex:0,role:'button','aria-label':n.label+'，設為中心'});g.style.cursor='pointer';g.append(el('rect',{width:p.w,height:p.h,rx:12,fill:colors[n.kind],stroke:'#a6bed0','stroke-width':1.5}));n.lines.forEach((line,i)=>{const t=el('text',{x:14,y:28+i*25,fill:'#fff','font-size':19,'font-family':'system-ui,sans-serif'});t.textContent=line;g.append(t);});g.addEventListener('click',()=>{if(!moved)onSelect(n);});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(n);}});scene.append(g);});
 const rootPosition=positions.get(graph.nodes[0]?.key);const initialY=rootPosition?host.clientHeight/2-rootPosition.y-rootPosition.h/2:24;
 let x=24,y=initialY,scale=1,moved=false;const pointers=new Map();let previous=null;
 const paint=()=>scene.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);
 const gesture=()=>{const a=[...pointers.values()];return {x:a.reduce((s,p)=>s+p.x,0)/a.length,y:a.reduce((s,p)=>s+p.y,0)/a.length,d:a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0};};
 const zoom=(factor,cx,cy)=>{const next=Math.max(.15,Math.min(3,scale*factor));x=cx-(cx-x)*next/scale;y=cy-(cy-y)*next/scale;scale=next;paint();};
 svg.addEventListener('pointerdown',e=>{if(!pointers.size)moved=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});previous=gesture();});
 svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=gesture();if(Math.hypot(g.x-previous.x,g.y-previous.y)>3||g.d!==previous.d)moved=true;if(moved){svg.setPointerCapture?.(e.pointerId);const r=svg.getBoundingClientRect();x+=g.x-previous.x;y+=g.y-previous.y;if(g.d&&previous.d)zoom(g.d/previous.d,g.x-r.left,g.y-r.top);paint();previous=g;}});
 const release=e=>{pointers.delete(e.pointerId);previous=pointers.size?gesture():null;};window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
 svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
 const fit=()=>{scale=Math.min(1,Math.max(.15,(host.clientWidth-40)/(levels.length*310)),Math.max(.15,(host.clientHeight-40)/(maxHeight||100)));x=20;y=20;paint();};paint();
 return {fit,zoom:factor=>zoom(factor,host.clientWidth/2,host.clientHeight/2),reset:()=>{scale=1;x=24;y=initialY;paint();},destroy:()=>{window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);}};
}
global.LawMindmap={mount};
})(window);
