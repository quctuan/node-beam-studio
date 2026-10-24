// M02 target attraction; M14 connector state precedence. See DEVELOPER-HANDOFF.md.
export function installConnectorFeedback(api){
 const ns='http://www.w3.org/2000/svg',overlay=document.createElementNS(ns,'svg');overlay.id='connector-feedback';overlay.setAttribute('aria-hidden','true');api.viewport.appendChild(overlay);
 let selected=null,targetKey=null,entered=0;
 const locked=new Set();
 const groupFor=id=>document.querySelector(`.node-group[data-node="${id}"],.inserted-node[data-node="${id}"]`);
 function syncSelection(){for(const g of document.querySelectorAll('.node-group[data-node],.inserted-node[data-node]')){const id=g.dataset.node;g.dataset.nodeState=locked.has(id)?'locked':selected===id?'selected':'default';}for(const p of ports())p.el.classList.toggle('is-selected',p.owner===selected&&!locked.has(p.owner));}
 let highlighted=null;
 function setDropTarget(id){const next=id?groupFor(id):null;if(next===highlighted)return;highlighted?.classList.remove('is-drop-target');next?.classList.add('is-drop-target');highlighted=next;}
 const lockButton=document.querySelector("#node-lock");
 lockButton.addEventListener("click",()=>{if(locked.has("generator"))locked.delete("generator");else locked.add("generator");selected="generator";syncSelection();lockButton.setAttribute("aria-pressed",String(locked.has("generator")));lockButton.setAttribute("aria-label",locked.has("generator")?"Unlock node":"Lock node");lockButton.title=locked.has("generator")?"Unlock node":"Lock node";document.querySelector("#node-lock-status").hidden=!locked.has("generator");});
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.addEventListener('pointerdown',e=>{const group=e.target.closest('.node-group[data-node],.inserted-node[data-node]');if(group){selected=group.dataset.node;syncSelection();return;}if(e.target.closest('.wire-menu,.node-picker,.canvas-toolbar,.product-nav,.product-rail,.lab,.transport,#annotations'))return;selected=null;syncSelection();},true);
 function ports(){const out=[];for(const kind of ['text','image']){out.push({owner:kind,kind,out:true,el:document.querySelector('#'+kind+'-out')});out.push({owner:'generator',kind,out:false,el:document.querySelector('#'+kind+'-in')});}out.push({owner:'generator',kind:'image',out:true,el:document.querySelector('#image-output')});out.push(...(api.graph()?.ports()||[]));return out;}
 function render(visible){const graph=api.graph(),edges=graph?.active?graph.snapshot().edges.filter(e=>!e.removing):['text','image'].filter(k=>visible[k]).map(k=>({from:k,to:'generator',kind:k}));const all=ports();for(const g of document.querySelectorAll('.node-group[data-node],.inserted-node[data-node]')){const id=g.dataset.node;g.dataset.nodeState=locked.has(id)?'locked':selected===id?'selected':'default';g.dataset.connected=String(edges.some(e=>e.from===id||e.to===id));}for(const p of all){const attached=edges.some(e=>e.kind===p.kind&&(p.out?e.from===p.owner:e.to===p.owner));p.el.classList.toggle('is-connected',attached);p.el.classList.toggle('is-selected',p.owner===selected&&!locked.has(p.owner));p.el.classList.remove('is-target');}
 const drag=api.drag()||graph?.cableState;if(!drag){setDropTarget(null);overlay.replaceChildren();targetKey=null;overlay.dataset.target='';return;}
 const host=api.viewport.getBoundingClientRect(),world=api.world.getBoundingClientRect(),scale=window.motionScale,pointer={x:world.left+drag.point.x*scale-host.left,y:world.top+drag.point.y*scale-host.top};
 const resolved=graph?.resolveTarget(drag.kind,drag.point,drag.source||drag.kind,58);
 const candidates=all.filter(p=>!p.out&&p.kind===drag.kind&&p.owner===resolved?.id).map(p=>{const r=p.el.getBoundingClientRect();return {...p,x:r.x+r.width/2-host.left,y:r.y+r.height/2-host.top,radius:r.width/2};}).map(p=>({...p,distance:Math.hypot(pointer.x-p.x,pointer.y-p.y)})).sort((a,b)=>a.distance-b.distance);
 const target=candidates[0];if(!target){setDropTarget(null);overlay.replaceChildren();targetKey=null;overlay.dataset.target='';return;}const key=target.owner+':'+target.kind;if(targetKey!==key){targetKey=key;entered=performance.now();api.clearParticles();}target.el.classList.add('is-target');setDropTarget(target.owner);overlay.dataset.target=key;
 overlay.setAttribute('viewBox',`0 0 ${host.width} ${host.height}`);const t=(performance.now()-entered)/1000;let rings=`<circle cx="${target.x}" cy="${target.y}" r="${target.radius+12}" fill="#1188FF" opacity=".025"/>`;
 if(reduce){rings+=`<circle cx="${target.x}" cy="${target.y}" r="${target.radius+4}" fill="none" stroke="#8FC7FF" stroke-width="1" opacity=".5"/>`;}else{for(let i=0;i<1;i++){const phase=(t/1.3)%1,eased=1-(1-phase)**2,r=target.radius+14*(1-eased),alpha=Math.sin(Math.PI*phase)*.28;rings+=`<circle cx="${target.x}" cy="${target.y}" r="${r}" fill="none" stroke="#1188FF" stroke-width="1" opacity="${alpha}"/>`;}
 const dots=api.particles({x:target.x,y:target.y},t,pointer).match(/<rect[^>]*\/>/g)||[];rings+='<g opacity=".65">'+dots.slice(0,8).join('').replaceAll('#198aff','#1188FF')+'</g>';}
 overlay.innerHTML=rings;}
 return {render,isLocked:id=>locked.has(id),get selected(){return selected;}};
}
