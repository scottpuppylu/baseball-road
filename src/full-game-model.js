import * as legacy from './minigame-model.js';
import {rng,contactWindow,judgeSwing} from './engine.js';
export const FULL_GAME_VERSION='full-games-1.0.0';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function sequence(context){
 if(!context.rules)return legacy.sequence(context);const r=rng(context.seed),rules=context.rules;
 return Array.from({length:rules.rounds},(_,i)=>({index:i,duration:(context.type==='batting'?1850:context.type==='fielding'?2250:2050)/context.difficulty+r()*180,target:rules.wideTargets?(i%2?.78:.22):.25+r()*.5,curve:(r()-.5)*75,ball:!!rules.outsideEvery&&(i+1)%rules.outsideEvery===0,cue:.25+(rules.tagup?.1:0)}));
}
export function battingOutcome(delta,c,pitch={}){
 if(!c.rules)return legacy.battingOutcome(delta,c);const p={...c.profile,power:clamp(c.profile.power+(c.modifiers.powerBonus||0),0,100)};
 const bonus=(c.modifiers.windowBonus||0),window=contactWindow(p,{window:bonus})/c.difficulty;
 const scaled=delta*c.difficulty;const hit=judgeSwing(scaled,p,{window:bonus},!!pitch.ball);
 const success=hit.bases>0&&(!c.rules.targetDistance||hit.distance>=c.rules.targetDistance);
 return {...hit,success,window,reason:pitch.ball?'壞球不該出棒':hit.bases===0?(delta<0?'提早揮棒':'太晚揮棒'):success?'擊球目標達成':'有接觸，深度未達目標'};
}
export function takeOutcome(c,pitch){return {timing:pitch.ball?'TAKE':'MISS',bases:0,score:pitch.ball?90:0,success:!!pitch.ball,reason:pitch.ball?'成功放過壞球':'沒有揮棒',delta:null};}
export function fieldingOutcome(delta,x,target,c){
 if(!c.rules)return legacy.fieldingOutcome(delta,x,target,c);const spatial=(c.rules.catchRadius||43)+(c.modifiers.catchBonus||0),timing=175/c.difficulty+(c.modifiers.timingBonus||0),distance=Math.abs(x-target),success=distance<=spatial&&Math.abs(delta)<=timing;
 return {success,score:success?Math.round(110+40*(1-Math.abs(delta)/timing)):0,distance,timing:Math.abs(delta),reason:distance>spatial?'沒追到落點':Math.abs(delta)>timing?'手套伸得太早或太晚':'穩穩接進手套'};
}
export function runningOutcome(launchDelta,slideDelta,c){
 const launchWindow=c.rules.launchWindow||300,slideWindow=195/c.difficulty+(c.modifiers.timingBonus||0),success=launchDelta!==null&&slideDelta!==null&&launchDelta>=-65&&launchDelta<=launchWindow&&Math.abs(slideDelta)<=slideWindow;
 return {success,score:success?Math.round(130+40*(1-Math.abs(slideDelta)/slideWindow)):0,launchDelta,slideDelta,reason:launchDelta===null?'沒有離壘':launchDelta< -65?'離壘太早，被牽制':launchDelta>launchWindow?'起跑太晚，來不及進壘':slideDelta===null?'沒有滑壘':Math.abs(slideDelta)>slideWindow?'滑壘時機不對':'滑進壘包，安全上壘'};
}
export function travelTime(c){return 1200+Math.max(0,65-c.modifiers.condition)*2-(c.modifiers.runningGrowth||0)*6;}
export function moveFielder(x,target,seconds,speed=400){return x+clamp(target-x,-speed*seconds,speed*seconds);}
export function completeResult(c,attempts){
 if(!c.rules)return legacy.completeResult(c,attempts);const successes=attempts.filter(a=>a.success).length,ratio=successes/attempts.length,grade=ratio>=.8?'excellent':ratio>=.4?'ordinary':'poor';
 return {id:c.id+':result',contextId:c.id,eventId:c.eventId,type:c.type,playerId:c.playerId,score:attempts.reduce((s,a)=>s+a.score,0),grade,success:grade!=='poor',metrics:{attempts:attempts.length,successes,perfect:attempts.filter(a=>a.timing==='PERFECT').length,bases:attempts.reduce((s,a)=>s+(a.bases||0),0)},attempts:structuredClone(attempts),version:FULL_GAME_VERSION};
}
export function validResult(result,c){
 if(!c.rules)return legacy.validResult(result,c);if(!result||!Array.isArray(result.attempts)||result.attempts.length!==c.rules.rounds||result.version!==FULL_GAME_VERSION)return false;
 const rounds=sequence(c);for(let i=0;i<rounds.length;i++){
  const a=result.attempts[i];if(!a||!Number.isFinite(a.score)||a.score<0)return false;let expected;
  if(c.type==='batting'){if(a.delta===null)expected=takeOutcome(c,rounds[i]);else if(Number.isFinite(a.delta))expected={...battingOutcome(a.delta,c,rounds[i]),delta:a.delta};else return false;}
  else if(c.type==='fielding'){if(a.delta!==null&&!Number.isFinite(a.delta)||!Number.isFinite(a.playerX)||a.playerX<0||a.playerX>960||a.targetX!==rounds[i].target*960)return false;expected=a.delta===null?{success:false,score:0,reason:'球落地，沒能接住',distance:Math.abs(a.playerX-a.targetX),timing:9999}:fieldingOutcome(a.delta,a.playerX,a.targetX,c);}
  else {if(![a.launchDelta,a.slideDelta].every(d=>d===null||Number.isFinite(d)))return false;expected=runningOutcome(a.launchDelta,a.slideDelta,c);}
  for(const k of ['score','success','reason'])if(a[k]!==expected[k])return false;
 }
 return JSON.stringify(completeResult(c,result.attempts))===JSON.stringify(result);
}
