export const SOURCE='https://raw.githubusercontent.com/scottpuppylu/baseball-stats/data/data/';
const CACHE_KEY='baseball-road:data:v1';
const n=(value)=>{if(value===undefined||value===null)return 0;const v=Number(value);if(!Number.isFinite(v)||v<0||!Number.isInteger(v))throw new Error('Invalid statistic');return v;};
// Mirrors canonical aggregation: H from hit breakdown (legacy H fallback), AB=PA-BB-SF.
// Names are canonical grouping keys; jersey is metadata, not a stable identifier.
export function normalizeLogs(raw){
 if(!Array.isArray(raw)||!raw.length)throw new Error('Empty or invalid logs');
 const groups=new Map(),seen=new Set();
 for(const row of raw){
  if(!row||typeof row.name!=='string'||!row.name.trim()||typeof row.id!=='string')throw new Error('Invalid player record');
  if(seen.has(row.id))throw new Error('Duplicate log ID');seen.add(row.id);
  const name=row.name.trim(),pa=n(row.pa),bb=n(row.bb),sf=n(row.sf),k=n(row.k);
  let h1=n(row.h1),h2=n(row.h2),h3=n(row.h3),hr=n(row.hr);
  if(h1+h2+h3+hr===0)h1=n(row.h);
  const h=h1+h2+h3+hr,ab=pa-bb-sf;
  if(ab<0||h>ab||k>ab-h)throw new Error('Inconsistent counts');
  const p=groups.get(name)||{id:'name:'+name,name,jersey:row.jersey??null,pa:0,ab:0,h:0,tb:0,bb:0,sf:0,k:0};
  for(const [key,value] of Object.entries({pa,ab,h,tb:h1+2*h2+3*h3+4*hr,bb,sf,k}))p[key]+=value;
  groups.set(name,p);
 }
 return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant'));
}
export const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
const shrink=(count,total,prior,weight)=>(count+prior*weight)/(total+weight);
// All priors come from team totals; weights ISO40/K20/BB30 match source diagnostics.
export function profiles(players){
 const sum=(key)=>players.reduce((v,p)=>v+p[key],0),ab=sum('ab'),pa=sum('pa');
 const team={avg:ab?sum('h')/ab:0,iso:ab?(sum('tb')-sum('h'))/ab:0,k:pa?sum('k')/pa:0,bb:pa?sum('bb')/pa:0};
 return players.map(p=>{
  const avg=shrink(p.h,p.ab,team.avg,30),iso=shrink(p.tb-p.h,p.ab,team.iso,40),k=shrink(p.k,p.pa,team.k,20),bb=shrink(p.bb,p.pa,team.bb,30);
  // Absolute slowpitch-friendly scales, not a claim of measured athletic skill.
  return {...p,stats:{avg:p.ab?p.h/p.ab:null,iso:p.ab?(p.tb-p.h)/p.ab:null,bbRate:p.pa?p.bb/p.pa:null,kRate:p.pa?p.k/p.pa:null},
   power:Math.round(clamp(25+iso*90)),contact:Math.round(clamp(20+avg*90-k*25)),vision:Math.round(clamp(45+bb*100-k*70)),reliability:p.ab/(p.ab+40),noSample:p.pa===0};
 });
}
function safeAvatars(raw){
 const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
 for(const [name,url] of Object.entries(raw))if(typeof url==='string'&&(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(url)||/^https:\/\//.test(url)))out[name]=url;
 return out;
}
export class GameDataSource{
 constructor({fetcher=globalThis.fetch,storage=globalThis.localStorage,includeAvatars=true,cacheKey=CACHE_KEY}={}){this.fetcher=(...args)=>fetcher(...args);this.storage=storage;this.includeAvatars=includeAvatars;this.cacheKey=cacheKey;}
 async load(){
  try{
   const response=await this.fetcher(SOURCE+'logs.json?refresh='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const logs=await response.json(),players=profiles(normalizeLogs(logs));
   const meta={fetchedAt:new Date().toISOString(),etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified'),source:SOURCE+'logs.json'};
   let avatars={};if(this.includeAvatars)try{const r=await this.fetcher(SOURCE+'avatars.json?refresh='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(5000)});if(r.ok)avatars=safeAvatars(await r.json());}catch{}
   try{this.storage?.setItem(this.cacheKey,JSON.stringify({logs,meta,avatars}));}catch{}
   return {players,meta,avatars,logs,stale:false};
  }catch(error){
   try{const cached=JSON.parse(this.storage?.getItem(this.cacheKey)||(this.cacheKey!==CACHE_KEY?this.storage?.getItem(CACHE_KEY):null)||'null');if(cached)return {players:profiles(normalizeLogs(cached.logs)),meta:cached.meta,avatars:this.includeAvatars?safeAvatars(cached.avatars):{},logs:cached.logs,stale:true,error:String(error.message)};}catch{}
   throw new Error('無法取得有效球員資料，且沒有成功快取。請檢查網路後重試。');
  }
 }
}
