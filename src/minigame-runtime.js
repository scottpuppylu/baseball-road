import {sequence,battingOutcome,fieldingOutcome,runningOutcome,travelTime,takeOutcome,moveFielder,completeResult} from './full-game-model.js';
import {GameRenderer} from './game-renderer.js';
import {visionLead} from './engine.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// One runtime for story-launched sessions. No separate save, career or independent menu.
export class MiniGameRuntime{
 constructor(context,view,onComplete){
  this.context=context;this.view=view;this.onComplete=onComplete;this.rounds=sequence(context);this.attempts=[];this.round=0;this.phase='ready';this.readyAt=performance.now()+1300;this.started=0;this.resultAt=0;this.playerX=480;this.desiredX=480;this.keys={left:false,right:false};this.sound=false;this.finished=false;this.previous=performance.now();this.cleanup=[];
  this.canvas=view.canvas;this.ctx=this.canvas.getContext('2d');this.renderer=new GameRenderer();this.renderer.lowFX=!!context.lowFX;this.samples=[];this.previousX=this.playerX;this.runLaunched=false;this.runnerProgress=0;
  this.listen(view.action,'pointerdown',e=>{e.preventDefault();this.action();});
  this.listen(document,'keydown',e=>{if(this.finished||e.target.closest('input,select,dialog'))return;if(['Space','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();if(e.code==='Space'&&!e.repeat)this.action();if(e.code==='ArrowLeft')this.keys.left=true;if(e.code==='ArrowRight')this.keys.right=true;}});
  this.listen(document,'keyup',e=>{if(e.code==='ArrowLeft')this.keys.left=false;if(e.code==='ArrowRight')this.keys.right=false;});
  for(const [key,button] of [['left',view.left],['right',view.right]]){this.listen(button,'pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);this.keys[key]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])this.listen(button,event,()=>{this.keys[key]=false;});}
  const position=e=>{if(context.type!=='fielding')return;const bounds=this.canvas.getBoundingClientRect();this.desiredX=clamp((e.clientX-bounds.left)/bounds.width*960,60,900);};
  this.listen(this.canvas,'pointerdown',e=>{if(context.type==='batting')this.action();else{this.canvas.setPointerCapture(e.pointerId);position(e);}});this.listen(this.canvas,'pointermove',e=>{if(e.buttons||e.pointerType==='touch')position(e);});
  this.listen(view.sound,'click',()=>{this.sound=!this.sound;view.sound.textContent=this.sound?'聲音：開':'聲音：關';});
  this.listen(document,'visibilitychange',()=>{this.keys.left=this.keys.right=false;if(document.hidden)this.hiddenAt=performance.now();else if(this.hiddenAt){const elapsed=performance.now()-this.hiddenAt;this.started+=elapsed;this.readyAt+=elapsed;this.resultAt+=elapsed;if(this.runnerStarted)this.runnerStarted+=elapsed;this.previous=performance.now();this.hiddenAt=null;}});
  this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 listen(target,type,handler){target.addEventListener(type,handler);this.cleanup.push(()=>target.removeEventListener(type,handler));}
 dispose(){cancelAnimationFrame(this.frame);clearTimeout(this.contactSound);this.cleanup.forEach(fn=>fn());this.audio?.close();}
 tone(hit){if(!this.sound)return;try{this.audio??=new AudioContext();this.audio.resume();const osc=this.audio.createOscillator(),gain=this.audio.createGain();osc.type=hit?'triangle':'sine';osc.frequency.setValueAtTime(hit?750:150,this.audio.currentTime);osc.frequency.exponentialRampToValueAtTime(hit?120:80,this.audio.currentTime+.09);gain.gain.setValueAtTime(.055,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+.11);osc.connect(gain).connect(this.audio.destination);osc.start();osc.stop(this.audio.currentTime+.12);}catch{}}
 action(){
  if(this.phase!=='flight'||this.finished||document.hidden)return;const pitch=this.rounds[this.round],delta=performance.now()-this.started-pitch.duration;
  if(this.context.type==='running'){
   if(!this.runLaunched){this.launchDelta=performance.now()-this.started-pitch.duration*pitch.cue;this.runLaunched=true;this.runnerStarted=performance.now();if(this.launchDelta< -65||this.launchDelta>(this.context.rules.launchWindow||300))this.resolve(runningOutcome(this.launchDelta,null,this.context));}
   else this.resolve(runningOutcome(this.launchDelta,performance.now()-this.runnerStarted-travelTime(this.context),this.context));return;
  }
  const outcome=this.context.type==='batting'?{...battingOutcome(delta,this.context,pitch),delta}: {...fieldingOutcome(delta,this.playerX,pitch.target*960,this.context),delta,playerX:this.playerX,targetX:pitch.target*960};this.resolve(outcome);
 }
 resolve(outcome){
  if(this.phase!=='flight')return;this.attempts.push(outcome);this.outcome=outcome;this.phase='feedback';this.resultAt=performance.now();this.readyAt=this.resultAt+1550;const hit=this.context.type==='batting'?(outcome.bases>0||outcome.success):outcome.success;
  if(this.context.type==='batting'&&outcome.bases>0)this.contactSound=setTimeout(()=>this.tone(true),125);else this.tone(hit);
  this.view.feedback.textContent=this.context.type==='batting'?(outcome.timing==='TAKE'?'放過壞球 · 成功上壘策略':hit?`${outcome.timing} · ${['','一壘安打','二壘安打','三壘安打','全壘打'][outcome.bases]}`:'揮空 · 再讀一次節奏'):this.context.type==='fielding'?(hit?'接進手套！':outcome.reason):outcome.reason;this.view.feedback.classList.toggle('miss',!hit);
 }
 tick(now){
  const dt=(now-this.previous)/1000;this.previous=now;this.previousX=this.playerX;if(!document.hidden&&dt>0&&dt<.2){this.samples.push(dt*1000);if(this.samples.length>240)this.samples.shift();}
  if(!document.hidden){
   if(this.context.type==='fielding'){
    if(this.keys.left||this.keys.right){this.playerX=clamp(this.playerX+(Number(this.keys.right)-Number(this.keys.left))*400*dt,60,900);this.desiredX=this.playerX;}
    else this.playerX=moveFielder(this.playerX,this.desiredX,dt);
   }
   if((this.phase==='ready'||this.phase==='feedback')&&now>=this.readyAt&&!this.finished){
    if(this.phase==='feedback')this.round++;
    if(this.round>=this.rounds.length){this.finished=true;this.phase='complete';this.view.action.disabled=true;this.view.back.hidden=false;this.view.back.disabled=true;this.view.feedback.textContent='完成練習，正在寫回系壘故事…';this.onComplete(completeResult(this.context,this.attempts));}
    else{this.phase='flight';this.started=now;this.view.feedback.textContent='';this.runLaunched=false;this.runnerProgress=0;this.launchDelta=null;}
   }
   if(this.phase==='flight'){
    const pitch=this.rounds[this.round],elapsed=now-this.started;
    if(this.context.type==='running'){this.runnerProgress=this.runLaunched?(now-this.runnerStarted)/travelTime(this.context):0;if((this.runLaunched&&this.runnerProgress>1.3)||(!this.runLaunched&&elapsed>pitch.duration+340))this.resolve(runningOutcome(this.launchDelta,null,this.context));}
    else if(elapsed>pitch.duration+340){this.resolve(this.context.type==='batting'?(this.context.rules?takeOutcome(this.context,pitch):{timing:'MISS',bases:0,score:0,delta:null}):{success:false,score:0,distance:Math.abs(this.playerX-pitch.target*960),timing:9999,delta:null,playerX:this.playerX,targetX:pitch.target*960,reason:this.context.rules?'球落地，沒能接住':'球落地了，還沒接球'});}
   }
  }
  this.updateHUD(now);this.draw(now);this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 updateHUD(now){
  const pitch=this.rounds[Math.min(this.round,this.rounds.length-1)],t=this.phase==='flight'?(now-this.started)/pitch.duration:0;
  this.view.status.dataset.phase=this.phase;this.view.status.dataset.stage=this.runLaunched?'slide':'launch';this.view.status.textContent=`${Math.min(this.round+1,this.rounds.length)} / ${this.rounds.length} · ${this.phase==='flight'?(pitch.ball?'觀察球路':'來球！'):this.phase==='complete'?'完成':this.phase==='ready'?'準備動作':'收整姿勢，下一球'}`;
  const progress=this.context.type==='running'?(this.runLaunched?this.runnerProgress:t/pitch.cue):t;this.view.progress.style.left=clamp(progress*50,0,100)+'%';this.view.action.disabled=this.phase!=='flight';
  if(this.context.type==='running')this.view.action.textContent=this.runLaunched?'滑壘 / SPACE':'起跑 / SPACE';
  if(this.context.type==='fielding'){this.view.target.style.left=pitch.target*100+'%';this.view.target.hidden=this.phase==='complete';this.view.fielder.textContent=Math.round(this.playerX/960*100)+'%';this.view.fielder.style.left=this.playerX/960*100+'%';}
  if(this.samples.length&&this.view.performance){const sorted=[...this.samples].sort((a,b)=>a-b),mean=this.samples.reduce((a,b)=>a+b,0)/this.samples.length;this.view.performance.textContent=JSON.stringify({fps:1000/mean,p95ms:sorted[Math.floor(sorted.length*.95)],frames:this.samples.length,lowFX:this.renderer.lowFX,assetReady:!!this.renderer.field.naturalWidth});if(mean>26)this.renderer.lowFX=true;}
 }
 draw(now){
  this.renderer.render(this,now);
 }
}

