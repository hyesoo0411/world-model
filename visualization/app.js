'use strict';
const D=window.FLOW_DATA||{tasks:[],conditions:[],rows:[],probes:[],selected_steps:[]};
const el=id=>document.getElementById(id);const colors=Array.from({length:16},(_,i)=>`hsl(${i*137.5%360},60%,42%)`);
D.tasks.forEach(t=>el('task').add(new Option(t,t)));D.conditions.forEach(c=>el('bg').add(new Option(`${c.id} ${c.name}`,c.id)));el('bg').value='BG8';
function plot(id,rows,key,ylabel,selected,labels={}){
 const host=el(id);const valid=rows.filter(r=>r[key]!=null&&Number.isFinite(r[key]));
 if(!valid.length){host.innerHTML='<p class="pending">Result pending · no measured data</p>';return;}
 const W=900,H=280,L=80,R=20,T=18,B=60,lo=Math.min(0,...valid.map(r=>r[key])),hi=Math.max(1e-9,...valid.map(r=>r[key]));
 const symlog=key==='macro_r2'&&lo < -5,F=x=>symlog?Math.sign(x)*Math.log1p(Math.abs(x)):x,Inv=x=>symlog?Math.sign(x)*Math.expm1(Math.abs(x)):x; if(symlog)ylabel+=' (symlog)';
 const X=x=>L+x*(W-L-R),Y=y=>H-B-(F(y)-F(lo))/(F(hi)-F(lo)||1)*(H-T-B);
 let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${ylabel}"><rect x="${L}" y="${T}" width="${(W-L-R)/3}" height="${H-T-B}" fill="#f3f6fb"/>`;
 for(let i=0;i<5;i++){let v=Inv(F(lo)+(F(hi)-F(lo))*i/4);s+=`<path d="M${L} ${Y(v)}H${W-R}" stroke="#e4eaf0"/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end" font-size="11">${v.toPrecision(3)}</text>`;}
 for(const bg of [...new Set(valid.map(r=>r.background))]){const r=valid.filter(x=>x.background===bg).sort((a,b)=>a.progress-b.progress),c=key==='macro_r2'&&bg==='BG0'?'black':colors[Number(bg.slice(2))];s+=`<path d="${r.map((v,i)=>`${i?'L':'M'}${X(v.progress)} ${Y(v[key])}`).join(' ')}" fill="none" stroke="${c}" opacity="${selected&&bg!==selected?.35:1}" stroke-width="${bg===selected?3:1.4}"><title>${labels[bg]||bg}</title></path>`;}
 if(key==='D_bg_robot'&&new Set(valid.map(r=>r.background)).size>2){const steps=[...new Set(valid.map(r=>r.progress))].sort((a,b)=>a-b);const mean=steps.map(p=>{const a=valid.filter(r=>r.progress===p&&r.background!=='BG0');return {p,y:a.reduce((s,r)=>s+r[key],0)/a.length};});s+=`<path d="${mean.map((v,i)=>`${i?'L':'M'}${X(v.p)} ${Y(v.y)}`).join(' ')}" stroke="black" fill="none" stroke-width="2" stroke-dasharray="6 3"><title>Mean over backgrounds</title></path>`;}
 s+=`<path d="M${X(D.selected_steps[Number(el('step').value)]/35)} ${T}V${H-B}" stroke="#657889" stroke-dasharray="3 3"/><text x="${W/2}" y="${H-8}" text-anchor="middle" font-size="12">Denoising progress · Early/high-noise → Middle → Late/low-noise</text><text x="15" y="${H/2}" transform="rotate(-90 15 ${H/2})" text-anchor="middle" font-size="12">${ylabel}</text>`;
 [0,.25,.5,.75,1].forEach(x=>s+=`<text x="${X(x)}" y="${H-B+20}" text-anchor="middle" font-size="11">${x}</text>`);host.innerHTML=s+'</svg><div class="plotLegend">'+[...new Set(valid.map(r=>r.background))].map(bg=>`<span style="color:${key==='macro_r2'&&bg==='BG0'?'black':colors[Number(bg.slice(2))]}">━ ${labels[bg]||bg}</span>`).join(' ')+(key==='D_bg_robot'&&new Set(valid.map(r=>r.background)).size>2?'<span>┄ Mean</span>':'')+'</div>';
}
function setimg(id,src){el(id).src=src;el(id).onerror=function(){this.style.visibility='hidden';};el(id).onload=function(){this.style.visibility='visible';};}
function temporalViews(rows,step){
 const selected=rows.filter(r=>r.step===step).sort((a,b)=>a.future_latent-b.future_latent);
 const fmt=x=>x==null?'undefined':x.toPrecision(5);
 el('temporal-values').innerHTML='<table><thead><tr><th>Future latent / RGB frames</th><th>Robot tokens</th><th>Background RMS</th><th>Action RMS</th><th>Ratio</th></tr></thead><tbody>'+selected.map(r=>`<tr><td>L${r.future_latent} · ${4*r.future_latent-3}–${4*r.future_latent}</td><td>${r.robot_tokens}</td><td>${fmt(r.D_bg_robot)}</td><td>${fmt(r.D_action_robot)}</td><td>${fmt(r.ratio)}</td></tr>`).join('')+'</tbody></table>';
 const W=900,H=245,L=140,T=28,cw=70,ch=30,max=Math.max(1e-12,...rows.map(r=>r.D_bg_robot));
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Future latent by denoising progress robot RMS heatmap">`;
 for(let t=1;t<=5;t++){
  svg+=`<text x="${L-10}" y="${T+(t-.35)*ch}" text-anchor="end" font-size="12">L${t} · frames ${4*t-3}–${4*t}</text>`;
  D.selected_steps.forEach((st,i)=>{
   const r=rows.find(r=>r.future_latent===t&&r.step===st),v=r?.D_bg_robot;
   const color=v==null?'#ddd':`hsl(210,65%,${97-65*v/max}%)`;
   svg+=`<rect x="${L+i*cw}" y="${T+(t-1)*ch}" width="${cw-2}" height="${ch-2}" fill="${color}" stroke="${st===step?'#101820':'none'}"><title>L${t} · τ ${r?.tau} · RMS ${v}</title></rect>`;
   svg+=`<text x="${L+(i+.5)*cw-1}" y="${T+(t-.35)*ch}" text-anchor="middle" fill="${v/max>.65?'white':'#102d40'}" font-size="10">${v==null?'N/A':v.toPrecision(2)}</text>`;
  });
 }
 D.selected_steps.forEach((st,i)=>svg+=`<text x="${L+(i+.5)*cw}" y="${T+5*ch+19}" text-anchor="middle" font-size="11">${(st/35).toFixed(2)}</text>`);
 svg+=`<text x="${W/2}" y="${H-15}" text-anchor="middle" font-size="12">Denoising progress · high noise → low noise | RMS scale: 0–${max.toPrecision(3)}</text></svg>`;
 el('temporal-map').innerHTML=svg;
}
function heatRow(src,label){
 return '<div class="heat-scroll"><div class="heat-row">'+Array.from({length:5},(_,i)=>`<figure><div class="heat-window"><img src="${src}" style="transform:translateX(-${i*20}%)" alt="${label} L${i+1}, frames ${4*i+1}–${4*i+4}"></div><figcaption><b>L${i+1}</b> · frames ${4*i+1}–${4*i+4}</figcaption></figure>`).join('')+'</div></div>';
}
function heatScale(id,max,kind){
 const gradient=kind==='difference'?'#000004,#51127c,#b73779,#fc8961,#fcfdbf':'#440154,#3b528b,#21918c,#5ec962,#fde725';
 el(id).innerHTML=`<span>0</span><span class="colorbar" style="background:linear-gradient(to right,${gradient})"></span><span>${max==null?'N/A':max.toPrecision(4)} · ${kind==='difference'?'flow difference RMS':'flow magnitude RMS'}</span>`;
}
function update(){
 const task=el('task').value,seed=+el('seed').value,bg=el('bg').value,step=D.selected_steps[+el('step').value],rows=D.rows.filter(r=>r.task===task&&r.seed===seed),point=rows.find(r=>r.background===bg&&r.step===step),tag=`${task}_seed${seed}`;
 el('tau').textContent=point?`τ ${point.tau.toFixed(5)} · σ ${point.sigma.toPrecision(4)} · progress ${point.progress.toFixed(3)}`:'Result pending';
 setimg('original',`assets/${task}_BG0_input.png`);setimg('variant',`assets/${task}_${bg}_input.png`);setimg('mask',`../figures/02_mask_mapping_${task}.png`);
 el('variantLabel').textContent=D.conditions.find(c=>c.id===bg)?.name||bg;el('value').textContent=point?`All L1–L5 RMS ${point.D_bg_robot.toPrecision(5)} · whole flow ${point.D_all.toPrecision(5)} (secondary)`:'Flow prediction pending';
 const temporal=(window.TEMPORAL_DATA||[]).filter(r=>r.task===task&&r.seed===seed),scope=el('future').value,flowRows=scope==='all'?rows:temporal.filter(r=>r.future_latent===+scope),scopeLabel=scope==='all'?'All L1–L5':`L${scope}`;
 temporalViews(temporal.filter(r=>r.background===bg),step);
 plot('flowcurve',flowRows,'D_bg_robot',`Robot RMS · ${scopeLabel}`,bg);plot('localcurve',flowRows.filter(r=>r.background===bg),'D_bg_robot',`Robot RMS · ${scopeLabel}`,bg);plot('num',flowRows,'D_bg_robot',`1 · Background RMS · ${scopeLabel}`,bg);plot('den',flowRows.filter(r=>r.background==='BG0'),'D_action_robot',`2 · Action RMS · ${scopeLabel}`,'BG0');plot('ratio',flowRows,'ratio',`3 · Ratio · ${scopeLabel}`,bg);
 const fullRows=(window.FULL_FLOW_DATA||[]).filter(r=>r.task===task&&r.seed===seed&&r.background===bg);
 const robotKey=scope==='all'?'robot':`robot_L${scope}`,agentKey=scope==='all'?'agent_future':`agent_L${scope}`;
 const comparisons=[['BG0',robotKey,`Robot · ${scopeLabel}`],['BG1',agentKey,`All space · ${scopeLabel}`],['BG2','full','Full raw tensor · 12 slots']];
 plot('full-comparison',fullRows.flatMap(r=>comparisons.map(([series,key])=>({...r,background:series,value:r[key]}))),'value','Instantaneous flow difference RMS',null,Object.fromEntries(comparisons.map(([series,,label])=>[series,label])));
 const fullPoint=fullRows.find(r=>r.step===step);
 el('full-values').innerHTML='<table><tr><th>Region</th><th>RMS at selected τ</th></tr>'+comparisons.map(([,key,label])=>`<tr><td>${label}</td><td>${fullPoint?.[key]?.toPrecision(5)||'N/A'}</td></tr>`).join('')+'</table>';
 const region=el('cumulative-region').value,regionKey=region==='robot'?robotKey:region==='agent_future'?agentKey:'full';
 const cumulative=(window.CUMULATIVE_DATA||[]).filter(r=>r.task===task&&r.seed===seed&&r.region===regionKey);
 el('cumulative-scope').textContent=region==='full'?'전체 12슬롯 고정 · RMS future scope 선택과 무관':`미래 구간: ${scopeLabel} · 상단 RMS future scope와 연동`;
 plot('cumulative-area',cumulative,'cumulative_rms_area','Cumulative RMS area · tau weighted',bg);
 plot('cumulative-vector',cumulative,'integrated_vector_rms','RMS of integrated flow difference',bg);
 const cp=cumulative.find(r=>r.background===bg&&r.step===step);
 el('cumulative-values').textContent=cp?`${bg} · ${cp.samples_used}/10 points · Δτ ${cp.tau_span.toFixed(4)} · C_mag ${cp.cumulative_rms_area.toPrecision(5)} · C_vec ${cp.integrated_vector_rms.toPrecision(5)}`:'N/A';
 const probe=D.probes.filter(r=>r.task===task&&r.seed===0&&r.probe===el('probe').value&&r.representation==='representation');plot('probeplot',probe,'macro_r2','Flow Action Recoverability R²',bg);
 setimg('dimensionHeatmap',`assets/${task}_seed0_${el('probe').value}_dimensions_step${String(step).padStart(2,'0')}.png`);
 const pp=probe.find(r=>r.step===step&&r.background===bg);el('drift').textContent=pp?`R² ${pp.macro_r2.toFixed(4)} · ΔR² ${pp.delta_r2.toFixed(4)} · paired action drift ${pp.predicted_action_drift.toFixed(4)}`:'Probe results pending';
 el('dimension').innerHTML=pp?'<table><tr>'+['x','y','z','rx','ry','rz','gripper'].map(x=>`<th>${x}</th>`).join('')+'</tr><tr>'+pp.per_action_dimension.map(x=>`<td style="background:${x==null?'#eee':x>0?'#dfeee7':'#f7e1df'}">${x==null?'N/A':x.toFixed(3)}</td>`).join('')+'</tr></table>':'';
 for(const [id,b] of [['exampleA','BG0'],['exampleB',bg],['exampleC','BG0']])setimg(id,`assets/${task}_${b}_input.png`);
 const heatKey=`${tag}_step${String(step).padStart(2,'0')}`,heatBase=`assets/temporal/${heatKey}`,heatMeta=(window.TEMPORAL_HEATMAPS||{})[heatKey];
 el('difference-heatmaps').innerHTML=heatRow(`${heatBase}_${bg}_difference.png`,`${bg} minus BG0 flow difference`);
 heatScale('difference-scale',heatMeta?.difference_max,'difference');
 el('full-heatmaps').innerHTML=heatRow(`assets/full_flow/${heatKey}_${bg}.png`,`${bg} unmasked flow difference`);
 heatScale('full-heatmap-scale',(window.FULL_HEATMAP_SCALES||{})[heatKey],'difference');
 el('triplet').innerHTML=[['A','BG0',`Original + A`],['B',bg,`${bg} + SAME A`],['C','C','Original + A_delta']].map(([label,suffix,title])=>`<p class="heat-output-label">OUTPUT ${label} · ${title}</p>`+heatRow(`${heatBase}_${suffix}_flow.png`,`Output ${label} robot flow`)).join('');
 heatScale('triplet-scale',heatMeta?.flow_max,'flow');
 const available=(D.decoded||[]).some(d=>d.task===task&&d.seed===seed);
 el('decoded').innerHTML=available?`<p><b>Secondary output</b> · Paired decoded rollout (B = BG8) · <button id="playRollouts">Play / pause together</button></p><div class="grid">${['A','B','C'].map(c=>`<figure><video preload="metadata" style="width:100%" muted playsinline controls src="../results/${task}/seed${seed}/decoded/${c}/agentview.mp4"></video><figcaption>${c} · ${c==='B'?'BG8 + SAME A':c==='C'?'BG0 + A_delta':'BG0 + A'}</figcaption></figure>`).join('')}</div>`:'';
 if(available){const videos=[...el('decoded').querySelectorAll('video')];el('playRollouts').onclick=()=>{const start=videos[0].paused;videos.forEach(v=>{v.currentTime=videos[0].currentTime;start?v.play():v.pause();});};videos[0].addEventListener('seeked',()=>videos.slice(1).forEach(v=>{if(Math.abs(v.currentTime-videos[0].currentTime)>.08)v.currentTime=videos[0].currentTime;}));}
 updateNormalized();
 el('sourceVideo').href='../share.html#rollout';el('sourceVideo').textContent='paired rollout example · Original / seed 0';
}
['task','seed','bg','step','probe','future','cumulative-region','normalized-mean'].forEach(id=>el(id).addEventListener('input',update));update();
