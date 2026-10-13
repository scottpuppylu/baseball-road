import {rng,judgeSwing,contactWindow} from './engine.js';
export const GAME_VERSION='integrated-games-1.0.0';
export function sequence(context){const random=rng(context.seed);return Array.from({length:context.type==='batting'?5:4},(_,i)=>({index:i,duration:(context.type==='batting'?1800:2400)/context.difficulty+random()*240,target:.22+random()*.56,curve:(random()-.5)*50}));}
export function battingOutcome(delta,context){const profile={...context.profile,power:Math.min(100,context.profile.power+(context.modifiers.powerBonus||0))};return judgeSwing(delta,profile,{window:context.modifiers.windowBonus||0});}
export const battingWindow=context=>contactWindow(context.profile,{window:context.modifiers.windowBonus||0});
export function fieldingOutcome(delta,playerX,targetX,context){const spatial=42+(context.modifiers.catchBonus||0),timing=170+(context.modifiers.timingBonus||0);const distance=Math.abs(playerX-targetX),success=distance<=spatial&&Math.abs(delta)<=timing;return {success,score:success?Math.round(100+50*(1-Math.abs(delta)/timing)):0,distance,timing:Math.abs(delta),reason:distance>spatial?'落點太遠':Math.abs(delta)>timing?'接球時機不對':'接進手套'};}
export function completeResult(context,attempts){
 const successes=attempts.filter(a=>context.type==='batting'?a.bases>0:a.success).length,ratio=successes/attempts.length;
 const grade=ratio>=.8?'excellent':ratio>=.4?'ordinary':'poor';
 return {id:context.id+':result',contextId:context.id,eventId:context.eventId,type:context.type,score:attempts.reduce((s,a)=>s+(a.score||0),0),grade,success:grade!=='poor',metrics:{attempts:attempts.length,successes,perfect:attempts.filter(a=>a.timing==='PERFECT').length,bases:attempts.reduce((s,a)=>s+(a.bases||0),0)},attempts:structuredClone(attempts),version:GAME_VERSION};
}
export function validResult(result,context){
 if(!result||result.id!==context.id+':result'||result.contextId!==context.id||result.eventId!==context.eventId||result.type!==context.type||result.version!==GAME_VERSION||!Array.isArray(result.attempts)||result.attempts.length!==(context.type==='batting'?5:4))return false;
 const expected=completeResult(context,result.attempts);return JSON.stringify(expected)===JSON.stringify(result)&&result.attempts.every(a=>Number.isFinite(a.score)&&a.score>=0&&(context.type==='batting'?Number.isInteger(a.bases)&&a.bases>=0&&a.bases<=4:['success','reason'].every(k=>typeof a[k]===(k==='success'?'boolean':'string'))));
}
