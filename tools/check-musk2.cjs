const fs=require('fs');
let test=fs.readFileSync(__dirname+'/check-musk1.cjs','utf8');
const extra=`
const host=$('#mm-stage'), originalChildren=[...$('#main').children];
Object.defineProperty(host,'clientWidth',{get:()=>width<=600?width-16:848});
Object.defineProperty(host,'clientHeight',{get:()=>width<=600?460:600});
const bar=$('.hive-navigation');Object.defineProperty(bar,'offsetHeight',{get:()=>width<=600?72:64});
const bounds=()=>{const W=host.clientWidth,H=host.clientHeight-bar.offsetHeight;const transform=host.querySelector('svg>g').getAttribute('transform');const [cx,cy]=transform.match(/translate\\(([^)]+)\\)/)[1].split(' ').map(Number);for(const cell of host.querySelectorAll('[role=button]')){if(cell.style.display==='none')continue;const x=+cell.dataset.x+cx,y=+cell.dataset.y+cy;for(const pair of cell.querySelector('polygon').getAttribute('points').split(' ')){const [dx,dy]=pair.split(',').map(Number);assert(x+dx>=0&&x+dx<=W,'horizontal polygon clipping');assert(y+dy>=0&&y+dy<=H,'vertical polygon clipping / nav overlap');}assert(+cell.querySelector('text').getAttribute('font-size')>=12);}};
w.eval('mapView.refresh()');let visibleKeys=new Set(),pages=0;
do{bounds();for(const n of host.querySelectorAll('[role=button]'))if(n.style.display!=='none')visibleKeys.add(n.dataset.key);const more=bar.lastChild;if(more.hidden)break;more.click();pages++;}while(pages<Math.ceil(host.querySelectorAll('[role=button]').length/19));
assert.equal(visibleKeys.size,host.querySelectorAll('[role=button]').length,'all overview pages reachable');
for(const n of host.querySelectorAll('[role=button]')){w.eval('mapView.select('+JSON.stringify(n.dataset.key)+')');bounds();assert(originalChildren.every(c=>c.parentNode===$('#main')),'live main preserved');}
$('#mm-fit').click();
console.log('PASS musk2',width,'all overview pages and all selected ring-2 polygons inside stage, nav excluded, live main retained');
`;
test=test.replace("let qs=[...d.querySelectorAll",extra+"let qs=[...d.querySelectorAll");
// Compile in the tools directory so relative checks retain their paths.
const Module=require('module'),m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(test,__filename);
