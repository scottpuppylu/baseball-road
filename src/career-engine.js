import {TRAINING,EVENTS,TACTICS} from './career-events.js';
export const ENGINE_VERSION='career-1.0.0';
export const SCHEMA_VERSION=1;
export const POSITIONS=['捕手','一壘手','二壘手','三壘手','游擊手','左外野手','中外野手','右外野手'];
export const GOALS=['穩定先發','長打核心','升學挑戰'];
export const PHASES=['start','training','event','challenge','summary','final'];
const limit=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
export function hashSeed(text){let h=2166136261;for(const c of text){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function random(state){state.rngState=(Math.imul(state.rngState,1664525)+1013904223)>>>0;return state.rngState/4294967296;}
export async function snapshotFromData(data,id){
 const profile=data.players.find(p=>p.id===id);if(!profile)throw Error('原型已不在來源名單，保留既有 baseline。');
 const bytes=new TextEncoder().encode(JSON.stringify(data.players));const digest=await crypto.subtle.digest('SHA-256',bytes);
 return {fingerprint:[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join(''),profile:structuredClone(profile),source:data.meta.source,fetchedAt:data.meta.fetchedAt,stale:data.stale};
}
export function createCareer(settings,snapshot){
 if(!settings.name?.trim()||settings.name.trim().length>24||!settings.seed?.trim()||settings.seed.length>80||!POSITIONS.includes(settings.position)||!['右打','左打','左右開弓'].includes(settings.side)||!GOALS.includes(settings.goal))throw Error('請完成有效的角色設定。');
 if(!validSnapshot(snapshot))throw Error('能力原型資料無效。');
 const character={name:settings.name.trim(),position:settings.position,side:settings.side,goal:settings.goal,seed:settings.seed.trim(),prototypeId:snapshot.profile.id,prototypeName:snapshot.profile.name,startYear:2026};
 return {schemaVersion:SCHEMA_VERSION,engineVersion:ENGINE_VERSION,character,rngState:hashSeed(JSON.stringify([character,snapshot.fingerprint,ENGINE_VERSION])),year:1,phase:'start',baseline:structuredClone(snapshot),growth:{power:0,contact:0,vision:0},temporary:{condition:82,confidence:55,trust:45},activeEvent:null,decisions:[],chronicle:[],records:[],baselineChanges:[],lastFeedback:'你的高中三年，從這一頁開始。',final:null};
}
export function abilities(state,bonus={}){
 const fatigue=Math.max(0,60-state.temporary.condition)*.16,confidence=(state.temporary.confidence-50)*.04;
 return Object.fromEntries(['power','contact','vision'].map(k=>[k,Math.round(limit(state.baseline.profile[k]+state.growth[k]+(bonus[k]||0)-fatigue+confidence))]));
}
function apply(state,growth={},effects={}){
 for(const [key,value] of Object.entries(growth))state.growth[key]=limit(state.growth[key]+value,0,40);
 for(const [key,value] of Object.entries(effects))state.temporary[key]=limit(state.temporary[key]+value);
}
function describeChange(before,after){
 return [...Object.keys(after.growth).map(k=>[({power:'Power',contact:'Contact',vision:'Vision'})[k],after.growth[k]-before.growth[k]]),...Object.keys(after.temporary).map(k=>[({condition:'體能',confidence:'信心',trust:'信任'})[k],after.temporary[k]-before.temporary[k]])].filter(([,n])=>n).map(([k,n])=>`${k} ${n>0?'+':''}${n}`).join(' · ')||'狀態維持';
}
function recordDecision(state,type,choice,before,detail=''){
 const change=describeChange(before,state);state.decisions.push({year:state.year,type,choice:choice.id});state.lastFeedback=`${choice.name} → ${change}${detail?'。'+detail:''}`;state.chronicle.push({year:state.year,title:choice.name,text:state.lastFeedback});
}
export function startSeason(input){if(input.phase!=='start')throw Error('目前不能開始球季。');const state=structuredClone(input);state.phase='training';return state;}
export function train(input,id){
 if(input.phase!=='training')throw Error('目前不是訓練階段。');const choice=TRAINING.find(c=>c.id===id);if(!choice)throw Error('未知訓練。');const state=structuredClone(input);apply(state,choice.growth,choice.effects);
 let detail='';if(choice.risk>0){const risk=choice.risk*(state.temporary.condition<55?1.8:.6);if(random(state)<risk){apply(state,{}, {condition:-12,confidence:-5});detail='訓練負荷超出恢復，體能額外下降。';}}
 const available=EVENTS.filter(e=>e.condition(state));state.activeEvent=available[Math.floor(random(state)*available.length)].id;state.phase='event';recordDecision(state,'training',choice,input,detail);return state;
}
export function chooseEvent(input,id){
 if(input.phase!=='event')throw Error('目前沒有事件選擇。');const event=EVENTS.find(e=>e.id===input.activeEvent),choice=event?.choices.find(c=>c.id===id);if(!choice)throw Error('未知事件選擇。');const state=structuredClone(input);apply(state,choice.growth,choice.effects);
 let detail='';if(choice.chance){const rating=choice.chance==='condition'?state.temporary.condition:abilities(state)[choice.chance];const success=random(state)<limit(.20+rating*.006,.2,.85);apply(state,{},success?choice.success:choice.failure);detail=success?'這次嘗試贏得回應。':'這次嘗試未達預期。';}
 state.phase='challenge';recordDecision(state,'event',choice,input,detail);return state;
}
export function simulateSeason(profile,temporary,year,character,rngState){
 const stream={rngState},r=()=>random(stream);const pa=Math.round(45+temporary.trust*.72+temporary.condition*.22+year*8);
 const walk=limit(.025+profile.vision*.0014, .025,.19),strikeout=limit(.29-profile.contact*.0022+(100-temporary.condition)*.0007,.04,.35);
 const hitRate=limit(.14+profile.contact*.0035+temporary.confidence*.0004+(character.side==='左打'?.008:0),.12,.58);
 const hrRate=limit(.01+profile.power*.0017,.01,.18),doubleRate=.10+profile.power*.0012;
 const stats={pa,ab:0,h:0,bb:0,k:0,h2:0,h3:0,hr:0};
 for(let i=0;i<pa;i++){
  if(r()<walk){stats.bb++;continue;}stats.ab++;
  if(r()<strikeout){stats.k++;continue;}
  if(r()<hitRate){stats.h++;const type=r();if(type<hrRate)stats.hr++;else if(type<hrRate+.025)stats.h3++;else if(type<hrRate+.025+doubleRate)stats.h2++;}
 }
 const tb=stats.h+stats.h2+2*stats.h3+3*stats.hr;stats.avg=stats.ab?stats.h/stats.ab:0;stats.obp=pa?(stats.h+stats.bb)/pa:0;stats.slg=stats.ab?tb/stats.ab:0;stats.ops=stats.obp+stats.slg;return {stats,rngState:stream.rngState};
}
export function playSeason(input,id){
 if(input.phase!=='challenge')throw Error('目前不是重要比賽階段。');const choice=TACTICS.find(c=>c.id===id);if(!choice)throw Error('未知比賽策略。');const state=structuredClone(input);apply(state,{},choice.effects);recordDecision(state,'challenge',choice,input);
 const profile=abilities(state,choice.bonus),before=state.rngState;
 const simulation=simulateSeason(profile,state.temporary,state.year,state.character,before);state.rngState=simulation.rngState;
 const won=simulation.stats.ops+.003*state.temporary.trust>1.03+state.year*.03;
 const highlight=won?'在關鍵系列賽站穩打席':'關鍵系列賽留下未竟的挑戰';
 state.records.push({year:state.year,engineVersion:state.engineVersion,baseline:structuredClone(state.baseline),growth:structuredClone(state.growth),temporary:structuredClone(state.temporary),effective:profile,tactic:id,rngBefore:before,rngAfter:state.rngState,stats:simulation.stats,highlight,won});
 apply(state,{},won?{trust:5,confidence:6}:{trust:-2,confidence:-4});state.chronicle.push({year:state.year,title:`高${['','一','二','三'][state.year]}球季結算`,text:highlight});state.phase='summary';return state;
}
export function advanceSeason(input,snapshot,status='已檢查來源'){
 if(input.phase!=='summary'||input.year>=3)throw Error('目前不能进入下一季。');const state=structuredClone(input),previous=state.baseline;
 if(snapshot){if(!validSnapshot(snapshot)||snapshot.profile.id!==state.character.prototypeId)throw Error('新球季原型不符。');state.baseline=structuredClone(snapshot);}
 const delta=Object.fromEntries(['power','contact','vision'].map(k=>[k,state.baseline.profile[k]-previous.profile[k]]));
 if(!snapshot)state.baseline.stale=true;
 state.year++;state.phase='start';state.activeEvent=null;apply(state,{}, {condition:18,confidence:3});
 const change={year:state.year,from:previous.fingerprint,to:state.baseline.fingerprint,delta,status};state.baselineChanges.push(change);state.lastFeedback=`新球季來源檢查：${status}。Power ${signed(delta.power)} / Contact ${signed(delta.contact)} / Vision ${signed(delta.vision)}；訓練成長保留。`;
 state.chronicle.push({year:state.year,title:'新的球季，新的起點',text:state.lastFeedback});return state;
}
function signed(n){return n>=0?'+'+n:String(n);}
export function finishCareer(input){
 if(input.phase!=='summary'||input.year!==3)throw Error('三個球季尚未完成。');const state=structuredClone(input);const total={pa:0,ab:0,h:0,bb:0,k:0,h2:0,h3:0,hr:0};for(const record of state.records)for(const key of Object.keys(total))total[key]+=record.stats[key];
 const tb=total.h+total.h2+total.h3*2+total.hr*3;Object.assign(total,{avg:total.ab?total.h/total.ab:0,obp:total.pa?(total.h+total.bb)/total.pa:0,slg:total.ab?tb/total.ab:0});total.ops=total.obp+total.slg;
 const goal=state.character.goal;const score=Math.round(limit(total.ops*50+state.temporary.trust*.35+(goal==='長打核心'?total.hr*.7:goal==='升學挑戰'?state.growth.vision*.6:state.temporary.condition*.1)));
 const awards=['完成高中三年'];if(total.hr>=12)awards.push('長打旗手');if(total.obp>=.40)awards.push('上壘之路');if(state.temporary.trust>=70)awards.push('教練的依靠');if(state.temporary.condition>=70)awards.push('懂得恢復');
 state.final={total,score,awards,opportunities:score>=75?['大學球隊試訓邀請','區域培訓營觀察名單']:score>=50?['大學社團球隊邀請','暑期提升營']:['社區球隊延續棒球生活','自主訓練計畫'],evaluation:score>=75?'被看見的潛力':score>=50?'穩定成長的三年':'仍在累積的起點'};state.phase='final';return state;
}
const bounded=n=>Number.isFinite(n)&&n>=0&&n<=100;
export function validSnapshot(snapshot){return !!snapshot&&typeof snapshot.fingerprint==='string'&&snapshot.fingerprint.length>0&&!!snapshot.profile&&typeof snapshot.profile.id==='string'&&typeof snapshot.profile.name==='string'&&['power','contact','vision'].every(k=>bounded(snapshot.profile[k]));}
export function validStats(s){return !!s&&['pa','ab','h','bb','k','h2','h3','hr'].every(k=>Number.isInteger(s[k])&&s[k]>=0)&&s.pa===s.ab+s.bb&&s.h<=s.ab&&s.k<=s.ab-s.h&&s.hr+s.h2+s.h3<=s.h&&['avg','obp','slg','ops'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&Math.abs(s.avg-(s.ab?s.h/s.ab:0))<1e-9&&Math.abs(s.obp-(s.pa?(s.h+s.bb)/s.pa:0))<1e-9&&Math.abs(s.slg-(s.ab?(s.h+s.h2+2*s.h3+3*s.hr)/s.ab:0))<1e-9&&Math.abs(s.ops-s.obp-s.slg)<1e-9;}
export function validateCareer(state){
 if(!state||state.schemaVersion!==SCHEMA_VERSION||state.engineVersion!==ENGINE_VERSION)throw Error('存檔版本不相容，原始存檔已保留。');
 const c=state.character;
 if(!c||typeof c.name!=='string'||!c.name.trim()||c.name.length>24||typeof c.seed!=='string'||!c.seed.trim()||c.seed.length>80||!POSITIONS.includes(c.position)||!GOALS.includes(c.goal)||!['右打','左打','左右開弓'].includes(c.side)||!validSnapshot(state.baseline)||c.prototypeId!==state.baseline.profile.id)throw Error('角色或原型存檔損壞，原始存檔已保留。');
 if(!Number.isInteger(state.year)||state.year<1||state.year>3||!PHASES.includes(state.phase)||!Number.isInteger(state.rngState)||state.rngState<0||state.rngState>4294967295||!['power','contact','vision'].every(k=>bounded(state.growth?.[k])&&state.growth[k]<=40)||!['condition','confidence','trust'].every(k=>bounded(state.temporary?.[k])))throw Error('生涯進度無效，原始存檔已保留。');
 if(!Array.isArray(state.records)||state.records.length!==(state.phase==='summary'||state.phase==='final'?state.year:state.year-1)||state.records.some((r,i)=>r.year!==i+1||r.engineVersion!==ENGINE_VERSION||!validStats(r.stats)||!validSnapshot(r.baseline)||r.baseline.profile.id!==c.prototypeId||!['power','contact','vision'].every(k=>bounded(r.effective?.[k])&&bounded(r.growth?.[k]))||!['condition','confidence','trust'].every(k=>bounded(r.temporary?.[k]))||!TACTICS.some(t=>t.id===r.tactic)||!Number.isInteger(r.rngBefore)||!Number.isInteger(r.rngAfter)||typeof r.highlight!=='string')||!Array.isArray(state.decisions)||state.decisions.some(d=>!Number.isInteger(d.year)||d.year<1||d.year>state.year||!['training','event','challenge'].includes(d.type)||typeof d.choice!=='string')||!Array.isArray(state.chronicle)||!Array.isArray(state.baselineChanges)||state.chronicle.some(e=>typeof e.title!=='string'||typeof e.text!=='string')||typeof state.lastFeedback!=='string'||(state.phase==='event'&&!EVENTS.some(e=>e.id===state.activeEvent))||(state.phase==='final'&&(state.year!==3||!validStats(state.final?.total)||!bounded(state.final?.score)||typeof state.final?.evaluation!=='string'||!Array.isArray(state.final?.awards)||state.final.awards.some(v=>typeof v!=='string')||!Array.isArray(state.final?.opportunities)||state.final.opportunities.some(v=>typeof v!=='string'))))throw Error('生涯紀錄無效，原始存檔已保留。');
 return state;
}
