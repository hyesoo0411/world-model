'use strict';
function normalizedPlot(id,rows,key,label,selected,meanIncludesReference){
 const host=el(id),valid=rows.filter(r=>r[key]!=null),isCos=key==='cosine_similarity';
 if(!valid.length){host.innerHTML='<p>No valid measurements</p>';return;}
 const W=900,H=285,L=78,R=22,T=32,B=58;
 const lo=isCos?Math.max(-1,Math.min(...valid.map(r=>r[key]))-.015):0;
 const hi=isCos?1.001:Math.max(1e-9,...valid.map(r=>r[key]))*1.04;
 const X=p=>L+p*(W-L-R),Y=v=>H-B-(v-lo)/(hi-lo)*(H-T-B);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">`;
 for(let i=0;i<=4;i++){
  const v=lo+(hi-lo)*i/4;
  svg+=`<path d="M${L} ${Y(v)}H${W-R}" stroke="#e4eaf0"/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end" font-size="11">${isCos?v.toFixed(3):v.toPrecision(3)}</text>`;
 }
 for(const bg of D.conditions.map(c=>c.id)){
  const r=valid.filter(r=>r.background===bg).sort((a,b)=>a.step-b.step);
  if(!r.length)continue;
  svg+=`<path d="${r.map((v,i)=>`${i?'L':'M'}${X(v.progress)} ${Y(v[key])}`).join(' ')}" stroke="${colors[Number(bg.slice(2))]}" fill="none" stroke-width="${bg===selected?2.8:1.2}" opacity="${bg===selected?1:.42}"><title>${bg}</title></path>`;
 }
 const means=D.selected_steps.map(step=>{
  const r=valid.filter(r=>r.step===step&&(meanIncludesReference||r.background!=='BG0'));
  return {progress:step/35,value:r.reduce((sum,r)=>sum+r[key],0)/r.length};
 });
 svg+=`<path data-mean="true" d="${means.map((v,i)=>`${i?'L':'M'}${X(v.progress)} ${Y(v.value)}`).join(' ')}" fill="none" stroke="black" stroke-width="2.5" stroke-dasharray="6 4"/>`;
 for(const st of [0,12,23,35]){
  const r=valid.find(r=>r.step===st);
  svg+=`<text x="${X(st/35)}" y="16" text-anchor="${st===0?'start':st===35?'end':'middle'}" font-size="11">τ ${r.tau.toFixed(3)}</text>`;
 }
 for(const p of [0,.25,.5,.75,1])svg+=`<text x="${X(p)}" y="${H-B+20}" text-anchor="middle" font-size="11">${p}</text>`;
 const step=D.selected_steps[+el('step').value];
 svg+=`<path d="M${X(step/35)} ${T}V${H-B}" stroke="#778892" stroke-dasharray="3 3"/><text x="16" y="${H/2}" transform="rotate(-90 16 ${H/2})" text-anchor="middle" font-size="12">${label}</text><text x="${W/2}" y="${H-8}" text-anchor="middle" font-size="12">Denoising progress · Early / high-noise stage → Late / low-noise stage</text></svg>`;
 host.innerHTML=svg;
}
function updateNormalized(){
 const task=el('task').value,seed=+el('seed').value,bg=el('bg').value,scope=el('future').value,step=D.selected_steps[+el('step').value];
 const rows=(window.NORMALIZED_FLOW_DATA||[]).filter(r=>r.task===task&&r.seed===seed&&r.scope===scope);
 const include=el('normalized-mean').value==='all';
 normalizedPlot('normalized-raw-plot',rows,'D_raw','Before · raw robot RMS',bg,include);
 normalizedPlot('normalized-relative-plot',rows,'D_norm','After · normalized robot difference',bg,include);
 normalizedPlot('normalized-cosine-plot',rows,'cosine_similarity','Cosine similarity (zoomed axis)',bg,include);
 el('normalized-legend').innerHTML=D.conditions.map(c=>`<span style="color:${colors[+c.id.slice(2)]}">━ ${c.id}</span>`).join('')+`<span>┄ Mean ${include?'BG0–BG15':'BG1–BG15'}</span>`;
 const point=rows.find(r=>r.background===bg&&r.step===step),fmt=x=>x==null?'undefined':x.toPrecision(5);
 el('normalized-output').textContent=point?`${bg} · ${scope==='all'?'L1–L5':`L${scope}`} · D_raw ${fmt(point.D_raw)} · M_ref ${fmt(point.M_ref)} · M_b ${fmt(point.M_b)} · D_norm ${fmt(point.D_norm)} · CosSim ${fmt(point.cosine_similarity)}`:'No measurements';
}
