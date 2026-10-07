(()=>{'use strict';
const data=window.TRAJECTORY_DATA, $=id=>document.getElementById(id),fmt=(x,n=3)=>x==null?'—':Number(x).toFixed(n);
const palette=['#15798b','#c45770','#90702d','#6578b3','#5a9453','#af694c'];
function lines(id,series,xlabel,ylabel,xmax=1){
 const all=series.flatMap(s=>s.rows).filter(r=>Number.isFinite(r.y));if(!all.length){$(id).innerHTML='<p class="pending">유효한 수치 없음 · 측정 상태 확인</p>';return;}
 const W=860,H=285,L=74,R=22,T=27,B=62;let lo=Math.min(0,...all.map(r=>r.y)),hi=Math.max(1e-9,...all.map(r=>r.y));if(hi===lo)hi=lo+1;
 const X=x=>L+x/xmax*(W-L-R),Y=y=>H-B-(y-lo)/(hi-lo)*(H-T-B);let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${ylabel}">`;
 for(let i=0;i<=4;i++){let y=lo+(hi-lo)*i/4;s+=`<path d="M${L} ${Y(y)}H${W-R}" stroke="#e3e9ed"/><text x="${L-6}" y="${Y(y)+4}" text-anchor="end" font-size="11">${y.toPrecision(3)}</text>`;let x=xmax*i/4;s+=`<text x="${X(x)}" y="${H-B+20}" text-anchor="middle" font-size="11">${fmt(x,2)}</text>`;}
 [...series].sort((a,b)=>Number(!!a.highlight)-Number(!!b.highlight)).forEach((a,i)=>{let connected=false;let path=[...a.rows].sort((a,b)=>a.x-b.x).map(p=>{if(!Number.isFinite(p.y)){connected=false;return '';}const command=connected?'L':'M';connected=true;return `${command}${X(p.x)} ${Y(p.y)}`;}).join(' ');s+=`<path d="${path}" stroke="${a.color||palette[i%6]}" fill="none" stroke-width="${a.width??2}" opacity="${a.opacity??1}" ${a.dashed?'stroke-dasharray="5 3"':''}><title>${a.name}</title></path>`;});
 s+=`<text x="${W/2}" y="${H-10}" text-anchor="middle" font-size="12">${xlabel}</text><text x="16" y="${H/2}" transform="rotate(-90 16 ${H/2})" text-anchor="middle" font-size="12">${ylabel}</text></svg><div class="plotLegend">${series.map((a,i)=>`<span style="color:${a.color||palette[i%6]};font-weight:${a.highlight?700:400}">━ ${a.name}</span>`).join('')}</div>`;$(id).innerHTML=s;
}
function scatter(id,rows,key,label){let rs=rows.filter(r=>Number.isFinite(r[key]));const W=420,H=270,L=66,T=22,B=53,R=15;let mx=Math.max(1e-8,...rs.map(r=>r.D_norm)),my=Math.max(1e-8,...rs.map(r=>r[key]));let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Flow versus ${label}">`;
 for(let i=0;i<=3;i++){let x=L+i/3*(W-L-R),y=H-B-i/3*(H-T-B);s+=`<path d="M${L} ${y}H${W-R}" stroke="#e3e9ed"/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="10">${(my*i/3).toPrecision(2)}</text><text x="${x}" y="${H-B+18}" text-anchor="middle" font-size="10">${fmt(mx*i/3,2)}</text>`;}
 rs.forEach(r=>{let color=palette[data.tasks.indexOf(r.task)];s+=`<circle cx="${L+r.D_norm/mx*(W-L-R)}" cy="${H-B-r[key]/my*(H-T-B)}" r="3" fill="${color}" opacity=".7"><title>${r.task} seed${r.seed} ${r.background}: ${fmt(r[key],5)}</title></circle>`;});s+=`<text x="${W/2}" y="${H-7}" font-size="12" text-anchor="middle">Normalized flow difference</text><text x="15" y="${H/2}" transform="rotate(-90 15 ${H/2})" font-size="12" text-anchor="middle">${label}</text></svg>`;$(id).innerHTML=s+'<div class="plotLegend">'+[...new Set(rs.map(r=>r.task))].map(t=>`<span style="color:${palette[data.tasks.indexOf(t)]}">● ${t}</span>`).join('')+'</div>';}
function loboScatter(rows,centered,showLabels=false,options={}){
 const xkey=options.xkey||'D_norm',target=options.target||'ex9-lobo-scatter',xlabel=options.xlabel||'Mean normalized robot-flow drift';
 const W=860,H=335,L=85,R=25,T=25,B=66;
 const bounds=k=>{let lo=Math.min(...rows.map(r=>r[k])),hi=Math.max(...rows.map(r=>r[k])),pad=(hi-lo||1)*.08;return [lo-pad,hi+pad];};
 const [xmin,xmax]=bounds(xkey),[ymin,ymax]=bounds('lobo_R2'),X=x=>L+(x-xmin)/(xmax-xmin)*(W-L-R),Y=y=>H-B-(y-ymin)/(ymax-ymin)*(H-T-B);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${xlabel} versus LOBO Action R²">`;
 for(let i=0;i<=4;i++){let x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;svg+=`<path d="M${L} ${Y(y)}H${W-R}" stroke="#e3e9ed"/><text x="${L-7}" y="${Y(y)+4}" text-anchor="end" font-size="11">${fmt(y)}</text><text x="${X(x)}" y="${H-B+20}" text-anchor="middle" font-size="11">${fmt(x)}</text>`;}
 rows.forEach(r=>{svg+=`<circle cx="${X(r[xkey])}" cy="${Y(r.lobo_R2)}" r="${options.highlight?(r.background===options.highlight?5:3.5):4}" fill="${palette[data.tasks.indexOf(r.task)]}" opacity="${options.highlight?(r.background===options.highlight?1:.35):.8}"><title>${r.task} ${r.background} · drift ${fmt(r[xkey],5)} · LOBO R² ${fmt(r.lobo_R2,5)}</title></circle>`;});
 if(showLabels){
  const occupied=[],points=rows.map(r=>({x:X(r[xkey]),y:Y(r.lobo_R2)}));
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  rows.forEach((r,i)=>{
   const p=points[i],w=38,h=22,candidates=[];
   for(let dx=-140;dx<=140;dx+=14)for(let dy=-112;dy<=112;dy+=16){
    const box={x:p.x+dx,y:p.y+dy,w,h};
    if(box.x<L+4||box.x+w>W-R-4||box.y<T+4||box.y+h>H-B-4)continue;
    const collisions=occupied.filter(q=>overlap(box,q)).length+points.filter(q=>overlap(box,{x:q.x-6,y:q.y-6,w:12,h:12})).length;
    candidates.push({box,score:collisions*1e6+(dx+w/2)**2+(dy+h/2)**2});
   }
   candidates.sort((a,b)=>a.score-b.score);const box=candidates[0].box;occupied.push(box);
   svg+=`<path d="M${p.x} ${p.y}L${box.x+w/2} ${box.y+h/2}" stroke="#728692" stroke-width=".7" opacity=".6"/><text class="lobo-bg-label" x="${box.x+2}" y="${box.y+16}" font-size="11" fill="#173749" stroke="white" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${r.background}</text>`;
  });
 }
 const suffix=centered?' (task-centered)':'';
 svg+=`<text x="${W/2}" y="${H-12}" text-anchor="middle" font-size="12">${xlabel}${suffix}</text><text x="17" y="${H/2}" transform="rotate(-90 17 ${H/2})" text-anchor="middle" font-size="12">LOBO Action R²${suffix}</text></svg>`;
 $(target).innerHTML=svg+'<div class="plotLegend">'+[...new Set(rows.map(r=>r.task))].map(t=>`<span style="color:${palette[data.tasks.indexOf(t)]}">● ${t}</span>`).join('')+'</div>';
}
function renderLobo(task,probe,step){
 const selection=$('ex9-lobo-group').value,group=selection==='task'?task:selection;
 let rows=data.loboFlow.pairs.filter(r=>r.probe===probe&&r.step===step&&(selection!=='task'||r.task===task)).map(r=>({...r}));
 if(selection==='task_demeaned')for(const t of data.tasks){const rs=rows.filter(r=>r.task===t);for(const k of ['D_norm','lobo_R2']){const mean=rs.reduce((s,r)=>s+r[k],0)/rs.length;rs.forEach(r=>r[k]-=mean);}}
 loboScatter(rows,selection==='task_demeaned',selection==='task');
 const cs=data.loboFlow.rows.filter(r=>r.probe===probe&&r.grouping===group),r=cs.find(r=>r.step===step);
 $('ex9-lobo-result').textContent=`${probe} · τ=${fmt(r.tau,6)} · progress=${fmt(r.progress)} · seed 0 · n=${r.n} · Spearman ρ ${fmt(r.rho)}${r.rho_ci_low==null?' (task별 CI 미산출)':` [95% CI ${fmt(r.rho_ci_low)}, ${fmt(r.rho_ci_high)}]`} · Pearson r ${fmt(r.pearson)}`;
 lines('ex9-lobo-rho',[{name:'Spearman ρ',rows:cs.map(r=>({x:r.progress,y:r.rho}))},{name:'Pearson r',rows:cs.map(r=>({x:r.progress,y:r.pearson}))},...(group===task?[]:[{name:'Spearman 95% CI lower',color:'#94bfc5',dashed:true,rows:cs.map(r=>({x:r.progress,y:r.rho_ci_low}))},{name:'Spearman 95% CI upper',color:'#94bfc5',dashed:true,rows:cs.map(r=>({x:r.progress,y:r.rho_ci_high}))}])],'Denoising progress · Early/high-noise → Late/low-noise','Flow drift ↔ LOBO Action R² correlation');
}
function renderTrajectoryLobo(task,probe,step,bg){
 const data=window.LOBO_TRAJECTORY_DATA,selection=$('ex9-lobo-traj-group').value,group=selection==='task'?task:selection;
 let rows=data.pairs.filter(r=>r.probe===probe&&r.step===step&&(selection!=='task'||r.task===task)).map(r=>({...r}));
 if(selection==='task_demeaned')for(const t of window.TRAJECTORY_DATA.tasks){const rs=rows.filter(r=>r.task===t);for(const k of ['nD_traj_BG','lobo_R2']){const mean=rs.reduce((s,r)=>s+r[k],0)/rs.length;rs.forEach(r=>r[k]-=mean);}}
 rows.sort((a,b)=>Number(a.background===bg)-Number(b.background===bg));
 loboScatter(rows,selection==='task_demeaned',selection==='task',{xkey:'nD_traj_BG',target:'ex9-lobo-traj-scatter',xlabel:'Final BG trajectory drift / image diagonal',highlight:bg});
 const cs=data.rows.filter(r=>r.probe===probe&&r.grouping===group),r=cs.find(r=>r.step===step);
 $('ex9-lobo-traj-result').textContent=`${probe} · τ=${fmt(r.tau,6)} · progress=${fmt(r.progress)} · n=${r.n} task/background groups · Spearman ρ ${fmt(r.rho)}${r.rho_ci_low==null?' (task별 CI 미산출)':` [95% CI ${fmt(r.rho_ci_low)}, ${fmt(r.rho_ci_high)}]`} · Pearson r ${fmt(r.pearson)} · highlighted: ${bg}`;
 lines('ex9-lobo-traj-rho',[{name:'Spearman ρ',rows:cs.map(r=>({x:r.progress,y:r.rho}))},{name:'Pearson r',rows:cs.map(r=>({x:r.progress,y:r.pearson}))},...(selection==='task'?[]:[{name:'Spearman 95% CI lower',color:'#94bfc5',dashed:true,rows:cs.map(r=>({x:r.progress,y:r.rho_ci_low}))},{name:'Spearman 95% CI upper',color:'#94bfc5',dashed:true,rows:cs.map(r=>({x:r.progress,y:r.rho_ci_high}))}])],'Probe denoising progress · Early/high-noise → Late/low-noise','Final trajectory drift ↔ LOBO R² correlation');
}
function render(){
 const task=$('task').value,seed=+$('seed').value,bg=$('bg').value,step=data.steps[+$('step').value],dim=+$('ex9-dim').value,len=+$('ex9-length').value,probe=$('probe').value;
 renderLobo(task,probe,step);
 renderTrajectoryLobo(task,probe,step,bg);
 const scope=data.joint.filter(r=>r.task===task&&r.seed===seed),row=scope.find(r=>r.background===bg&&r.step===step),group=$('ex9-group').value==='task'?task:$('ex9-group').value;
 const cs=data.correlations.filter(r=>r.grouping===group&&r.feature==='D_norm');lines('ex9-rho',['nD_traj_BG','nADE_GT'].map(target=>({name:target,rows:cs.filter(r=>r.target===target).map(r=>({x:r.progress,y:r.rho}))})),'Denoising progress · Early/high-noise → Late/low-noise','Spearman rho');
 $('ex9-correlation-result').textContent=cs.filter(r=>r.step===step).map(r=>`${r.target}: ρ ${fmt(r.rho)} [${fmt(r.rho_ci_low)}, ${fmt(r.rho_ci_high)}], n=${r.n}`).join(' · ');
 const points=data.joint.filter(r=>r.step===step&&r.background!=='BG0'&&($('ex9-group').value!=='task'||r.task===task));scatter('ex9-scatter-drift',points,'nD_traj_BG','BG trajectory drift / diagonal');scatter('ex9-scatter-gt',points,'nADE_GT','GT ADE / diagonal');
 if(row){$('ex9-traj-result').textContent=`ADE ${fmt(row.ADE_GT)} px · FDE ${fmt(row.FDE_GT)} px · BG drift ${fmt(row.D_traj_BG)} px · confidence ${fmt(row.confidence_mean,4)}`;}
 let src=`trajectory_extension/videos/${task}/seed${seed}_${bg}.mp4`;if($('ex9-video').getAttribute('src')!==src)$('ex9-video').src=src;
 let track=data.tracks[`${task}_${seed}_${bg}`];if(track){let xs=track.GT.map(r=>r[0]).concat(track.BG0.map(r=>r[0]),track.BG.map(r=>r[0])),ys=track.GT.map(r=>r[1]).concat(track.BG0.map(r=>r[1]),track.BG.map(r=>r[1]));let xmin=Math.min(...xs)-2,xmax=Math.max(...xs)+2,ymin=Math.min(...ys)-2,ymax=Math.max(...ys)+2;let scale=Math.min(690/(xmax-xmin),190/(ymax-ymin)),X=x=>430+(x-(xmin+xmax)/2)*scale,Y=y=>125+(y-(ymin+ymax)/2)*scale;let svg='<svg viewBox="0 0 860 270" aria-label="Image-plane hand trajectories" role="img">';['GT','BG0','BG'].forEach((k,i)=>{svg+=`<path d="${track[k].map((p,j)=>`${j?'L':'M'}${X(p[0])} ${Y(p[1])}`).join(' ')}" stroke="${['black','#15798b','#c45770'][i]}" fill="none" stroke-width="2"><title>${k}</title></path>`;});svg+=`<text x="430" y="250" text-anchor="middle" font-size="12">Image coordinates · u ${fmt(xmin,1)}–${fmt(xmax,1)} px / v ${fmt(ymin,1)}–${fmt(ymax,1)} px (downward)</text></svg><div class="plotLegend">GT: black · BG0: blue · ${bg}: pink</div>`;$('ex9-tracks').innerHTML=svg;}
 // LOBO SIX TASKS START
 const loboPanelColor=i=>i===0?'#173749':`hsl(${i*137.5%360},65%,40%)`;
 $('ex9-lobo-all-curves').innerHTML=data.tasks.map(t=>{
  const lookup=new Map(data.probes.filter(r=>r.task===t&&r.probe===probe).map(r=>[`${r.background}/${r.step}/${r.regime}`,r]));
  const series=data.backgrounds.map((b,i)=>({b,color:loboPanelColor(i),points:data.steps.map(st=>{const l=lookup.get(`${b}/${st}/lobo`);return {step:st,x:l.progress,y:l.macro_r2,l:l.macro_r2};})}));
  const W=440,H=310,L=67,R=14,T=18,B=55,values=series.flatMap(s=>s.points.map(p=>p.y));let lo=Math.min(0,...values),hi=Math.max(0,...values),pad=(hi-lo||.1)*.06;lo-=pad;hi+=pad;
  const X=x=>L+x*(W-L-R),Y=y=>H-B-(y-lo)/(hi-lo)*(H-T-B);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" data-task="${t}" data-probe="${probe}" aria-label="${t}: LOBO R squared by background">`;
  for(let i=0;i<=4;i++){const y=lo+(hi-lo)*i/4,x=i/4;svg+=`<path d="M${L} ${Y(y)}H${W-R}" stroke="#e3e9ed"/><text x="${L-6}" y="${Y(y)+4}" text-anchor="end" font-size="12">${y.toPrecision(3)}</text><text x="${X(x)}" y="${H-B+21}" text-anchor="middle" font-size="12">${x.toFixed(2)}</text>`;}
  svg+=`<path d="M${L} ${Y(0)}H${W-R}" stroke="#596976" stroke-dasharray="4 3" stroke-width="1"/>`;
  series.sort((a,b)=>Number(a.b===bg)-Number(b.b===bg)).forEach(s=>{const selected=s.b===bg;svg+=`<path data-bg="${s.b}" data-values="${s.points.map(p=>p.y).join(',')}" d="${s.points.map((p,i)=>`${i?'L':'M'}${X(p.x)} ${Y(p.y)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="${selected?2.8:1.2}" opacity="${selected?1:.3}"><title>${s.b}</title></path>`;if(selected)s.points.forEach(p=>svg+=`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="2.2" fill="${s.color}"><title>${t} ${s.b} · step ${p.step} · LOBO R² ${fmt(p.l,4)}</title></circle>`);});
  svg+=`<text x="${(L+W-R)/2}" y="${H-10}" text-anchor="middle" font-size="13">Denoising progress</text><text x="17" y="${(T+H-B)/2}" transform="rotate(-90 17 ${(T+H-B)/2})" text-anchor="middle" font-size="13">LOBO Action R²</text></svg>`;
  return `<div><h4>${t}</h4>${svg}</div>`;
 }).join('');
 $('ex9-lobo-all-legend').innerHTML=data.backgrounds.map((b,i)=>`<span style="color:${loboPanelColor(i)};font-weight:${b===bg?700:400}">━ ${b}${b===bg?' (selected)':''}</span>`).join('');
 $('ex9-lobo-all-result').textContent=`All six tasks · ${probe} · seed 0 · BG0–BG15 · highlighted: ${bg} · first20 + last20 · 16 test windows per background`;
 // LOBO SIX TASKS END
 const ps=data.probes.filter(r=>r.task===task&&r.background===bg&&r.probe===probe&&['within','lobo'].includes(r.regime));lines('ex9-probe-curves',['within','lobo'].map((regime,i)=>({name:regime,color:palette[i+1],rows:ps.filter(r=>r.regime===regime).map(r=>({x:r.progress,y:r.macro_r2}))})),'Denoising progress · same temporal features','Held-out Action R²');
 $('ex9-probe-result').textContent=ps.filter(r=>r.step===step).map(r=>`${r.regime}: ${fmt(r.macro_r2)}`).join(' · ')+' · 평가 seed 0';
 // WITHIN LOBO MIXED START
 const pairedSeries=data.backgrounds.map((b,i)=>({name:b,color:i===0?'#173749':`hsl(${i*137.5%360},65%,40%)`,highlight:b===bg,width:b===bg?3:1.3,opacity:b===bg?1:.25,rows:data.steps.map(st=>{const lookup=regime=>data.probes.find(r=>r.task===task&&r.probe===probe&&r.background===b&&r.step===st&&r.regime===regime);const w=lookup('within'),l=lookup('lobo');return {x:w.progress,y:w.macro_r2-l.macro_r2};})}));
 lines('ex9-within-lobo-gap',pairedSeries,'Denoising progress · Early/high-noise → Late/low-noise','Within − LOBO Action R²');
 const selectedW=ps.find(r=>r.step===step&&r.regime==='within'),selectedL=ps.find(r=>r.step===step&&r.regime==='lobo');
 $('ex9-within-lobo-gap-result').textContent=`${task} · ${bg} · ${probe} · seed 0 · first20 + last20 · 16 test windows · step ${step} / progress ${fmt(selectedW.progress)} · Within ${fmt(selectedW.macro_r2)} · LOBO ${fmt(selectedL.macro_r2)} · Within − LOBO ${fmt(selectedW.macro_r2-selectedL.macro_r2)}`;
 $('ex13-within-lobo-overview').src=`probe_validity/within_lobo_first_last_${probe}.png`;
 const gapColor=i=>i===0?'#173749':`hsl(${i*137.5%360},65%,40%)`;
 $('ex13-within-lobo-task-grid').innerHTML=data.tasks.map(t=>{
  const lookup=new Map(data.probes.filter(r=>r.task===t&&r.probe===probe).map(r=>[`${r.background}/${r.step}/${r.regime}`,r]));
  const series=data.backgrounds.map((b,i)=>({b,color:gapColor(i),points:data.steps.map(st=>{const w=lookup.get(`${b}/${st}/within`),l=lookup.get(`${b}/${st}/lobo`);return {step:st,x:w.progress,y:w.macro_r2-l.macro_r2,w:w.macro_r2,l:l.macro_r2};})}));
  const W=440,H=310,L=67,R=14,T=18,B=55,values=series.flatMap(s=>s.points.map(p=>p.y));let lo=Math.min(0,...values),hi=Math.max(0,...values),pad=(hi-lo||.1)*.06;lo-=pad;hi+=pad;
  const X=x=>L+x*(W-L-R),Y=y=>H-B-(y-lo)/(hi-lo)*(H-T-B);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" data-task="${t}" data-probe="${probe}" aria-label="${t}: Within minus LOBO R squared by background">`;
  for(let i=0;i<=4;i++){const y=lo+(hi-lo)*i/4,x=i/4;svg+=`<path d="M${L} ${Y(y)}H${W-R}" stroke="#e3e9ed"/><text x="${L-6}" y="${Y(y)+4}" text-anchor="end" font-size="12">${y.toPrecision(3)}</text><text x="${X(x)}" y="${H-B+21}" text-anchor="middle" font-size="12">${x.toFixed(2)}</text>`;}
  svg+=`<path d="M${L} ${Y(0)}H${W-R}" stroke="#596976" stroke-dasharray="4 3" stroke-width="1"/>`;
  series.sort((a,b)=>Number(a.b===bg)-Number(b.b===bg)).forEach(s=>{const selected=s.b===bg;svg+=`<path data-bg="${s.b}" data-values="${s.points.map(p=>p.y).join(',')}" d="${s.points.map((p,i)=>`${i?'L':'M'}${X(p.x)} ${Y(p.y)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="${selected?2.8:1.2}" opacity="${selected?1:.3}"><title>${s.b}</title></path>`;if(selected)s.points.forEach(p=>svg+=`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="2.2" fill="${s.color}"><title>${t} ${s.b} · step ${p.step} · Within ${fmt(p.w,4)} · LOBO ${fmt(p.l,4)} · difference ${fmt(p.y,4)}</title></circle>`);});
  svg+=`<text x="${(L+W-R)/2}" y="${H-10}" text-anchor="middle" font-size="13">Denoising progress</text><text x="17" y="${(T+H-B)/2}" transform="rotate(-90 17 ${(T+H-B)/2})" text-anchor="middle" font-size="13">Within − LOBO R²</text></svg>`;
  return `<div><h4>${t}</h4>${svg}</div>`;
 }).join('');
 $('ex13-within-lobo-task-legend').innerHTML=data.backgrounds.map((b,i)=>`<span style="color:${gapColor(i)};font-weight:${b===bg?700:400}">━ ${b}${b===bg?' (selected)':''}</span>`).join('');
 // WITHIN LOBO MIXED END
 $('ex9-probe-heatmap').innerHTML='<div class="table-scroll"><table><tr><th>BG</th><th>BG0→BG</th><th>BG→BG</th><th>LOBO→BG</th></tr>'+data.backgrounds.map(b=>'<tr><td>'+b+'</td>'+['transfer','within','lobo'].map(regime=>{let r=data.probes.find(r=>r.task===task&&r.background===b&&r.probe===probe&&r.step===step&&r.regime===regime);let v=r?.macro_r2;return `<td style="background:${v==null?'#eee':v<0?'#f8e3e6':`hsl(190,45%,${97-Math.min(1,v)*38}%)`}">${fmt(v)}</td>`;}).join('')+'</tr>').join('')+'</table></div>';
 const ds=data.dose.filter(r=>r.task===task&&r.seed===seed&&r.step===step&&r.dimension===dim&&r.window_length===len),maxeps=Math.max(.5,...ds.map(r=>r.epsilon));lines('ex9-dose',[{name:'Measured action response',rows:ds.map(r=>({x:r.epsilon,y:r.D_norm}))},{name:'Isotonic diagnostic',color:'#9270b3',dashed:true,rows:ds.map(r=>({x:r.epsilon,y:r.D_norm_isotonic}))},{name:`${bg} background response`,color:'black',dashed:true,rows:row?[{x:0,y:row.D_norm},{x:maxeps,y:row.D_norm}]:[]}],'Action perturbation ε (dataset standard deviations)','Normalized robot flow difference',maxeps);
 const es=data.eap.filter(r=>r.task===task&&r.seed===seed&&r.dimension===dim&&r.window_length===len);let e=es.find(r=>r.background===bg&&r.step===step);const eapText=e=>!e?'측정 중':e.status==='above_tested_range'?`>${fmt(e.max_tested,2)} σ`:e.EAP==null?'undefined':`${fmt(e.EAP)} σ`;$('ex9-eap-result').textContent=`${bg}: ${eapText(e)} · coordinate ${['x','y','z','rx','ry','rz'][dim]}, sign ${e?(e.sign>0?'+':'−'):'—'}, L=${len}`;
 lines('ex9-eap',data.backgrounds.slice(1).map((b,i)=>({name:b,color:`hsl(${(i+1)*137.5%360},60%,42%)`,rows:es.filter(r=>r.background===b).map(r=>({x:r.progress,y:r.EAP}))})),'Denoising progress · out-of-range values omitted','Equivalent action perturbation (sigma)');
 $('ex9-joint-table').innerHTML='<table><tr><th>BG</th><th>Flow norm</th><th>nBG drift</th><th>nGT ADE</th><th>R² drop</th><th>EAP</th></tr>'+scope.filter(r=>r.step===step).map(r=>`<tr><td>${r.background}</td><td>${fmt(r.D_norm,4)}</td><td>${fmt(r.nD_traj_BG,4)}</td><td>${fmt(r.nADE_GT,4)}</td><td>${fmt(r.Delta_R2)}</td><td>${eapText(es.find(e=>e.background===r.background&&e.step===step))}</td></tr>`).join('')+'</table>';
}
['task','seed','bg','probe','ex9-group','ex9-lobo-group','ex9-lobo-traj-group','ex9-dim','ex9-length'].forEach(id=>$(id).addEventListener('change',render));$('step').addEventListener('input',render);render();window.renderTrajectoryExtension=render;
})();
