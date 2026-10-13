import {visionLead} from './engine.js';
import {clamp} from './full-game-model.js';
const sharedField=new Image();
fetch(new URL('./art/stadium.svg',import.meta.url)).then(r=>{if(!r.ok)throw Error('Field asset HTTP '+r.status);return r.text();}).then(svg=>{const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));document.documentElement.style.setProperty('--field-art',`url("${url}")`);window.addEventListener('pagehide',e=>{if(!e.persisted)URL.revokeObjectURL(url);},{once:true});sharedField.onerror=()=>URL.revokeObjectURL(url);sharedField.src=url;}).catch(()=>{});
export class GameRenderer{
 constructor(){this.lowFX=false;this.field=sharedField;}
 // Original vector rig: articulated jersey, tapered limbs, cap/face, boots/glove. No photos.
 actor(ctx,x,y,scale,{time=0,pose='idle',progress=0,direction=1,palette='#244d67',number='BR'}={}){
  ctx.save();ctx.translate(x,y);ctx.scale(scale*direction,scale);const run=pose==='run'?Math.sin(time*.018):0,bob=pose==='idle'?Math.sin(time*.003)*1.3:Math.abs(run)*3;ctx.translate(0,-bob);
  ctx.fillStyle='#0003';ctx.beginPath();ctx.ellipse(0,9+bob,22,5,0,0,Math.PI*2);ctx.fill();
  const limb=(sx,sy,ex,ey,color,width)=>{ctx.strokeStyle='#132e38';ctx.lineWidth=width+2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+ex)/2+run*3,(sy+ey)/2,ex,ey);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  for(const sign of [-1,1]){const footX=sign*9+run*sign*11,footY=6-Math.max(0,run*sign)*9;limb(sign*6,-15,footX,footY,'#e2dfc6',10);ctx.fillStyle='#172e37';ctx.beginPath();ctx.moveTo(footX-5,footY-3);ctx.quadraticCurveTo(footX+13,footY-2,footX+9,footY+4);ctx.lineTo(footX-6,footY+4);ctx.closePath();ctx.fill();}
  ctx.fillStyle=palette;ctx.strokeStyle='#152f39';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-12,-42);ctx.quadraticCurveTo(-22,-35,-16,-24);ctx.lineTo(-12,-14);ctx.quadraticCurveTo(0,-10,13,-14);ctx.lineTo(18,-31);ctx.quadraticCurveTo(17,-43,7,-44);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#eadab2';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-10,-36);ctx.lineTo(10,-36);ctx.moveTo(-11,-20);ctx.lineTo(13,-20);ctx.stroke();ctx.fillStyle='#f8e7ba';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(String(number).slice(0,2),1,-25);
  const arm=pose==='swing'?(-2.2+progress*3.0):pose==='throw'?(-.7+progress*2.1):pose==='catch'?(-1.4):pose==='miss'?.75:run*.6;
  limb(-12,-36,-20+run*5,-19-run*7,'#d0ae80',7);limb(12,-35,12+Math.sin(arm)*23,-35+Math.cos(arm)*23,'#d0ae80',7);
  const handX=12+Math.sin(arm)*23,handY=-35+Math.cos(arm)*23;
  if(pose==='swing'||pose==='bat-idle'){const angle=pose==='swing'?(-1.9+progress*2.5):-1.7;ctx.save();ctx.translate(handX,handY);ctx.rotate(angle);ctx.fillStyle='#b7864b';ctx.strokeStyle='#59412d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(50,-4);ctx.quadraticCurveTo(57,0,50,4);ctx.lineTo(0,2);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#473e34';ctx.fillRect(0,-2,14,4);ctx.restore();}
  if(['catch','miss','run','field-idle'].includes(pose)){ctx.fillStyle='#c7924d';ctx.strokeStyle='#664b32';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(handX-6,handY+3);ctx.bezierCurveTo(handX-15,handY-12,handX+5,handY-20,handX+11,handY-7);ctx.quadraticCurveTo(handX+16,handY+8,handX-6,handY+3);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(handX-6,handY-6);ctx.lineTo(handX+5,handY-2);ctx.stroke();}
  ctx.fillStyle='#d5b38a';ctx.beginPath();ctx.moveTo(-7,-49);ctx.quadraticCurveTo(-12,-59,0,-62);ctx.quadraticCurveTo(13,-61,10,-49);ctx.quadraticCurveTo(6,-42,-7,-49);ctx.fill();ctx.fillStyle='#223941';ctx.beginPath();ctx.moveTo(-10,-55);ctx.quadraticCurveTo(-10,-68,4,-66);ctx.quadraticCurveTo(13,-64,13,-57);ctx.lineTo(20,-55);ctx.quadraticCurveTo(6,-51,-10,-55);ctx.fill();ctx.fillStyle='#172e39';ctx.fillRect(6,-53,2,2);ctx.strokeStyle='#a17754';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(6,-47);ctx.lineTo(10,-48);ctx.stroke();ctx.restore();
 }
 ball(c,x,y,r){c.fillStyle='#fff5d6';c.strokeStyle='#735b46';c.lineWidth=1;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#b85841';c.lineWidth=Math.max(1,r*.1);for(const d of [-1,1]){c.beginPath();c.arc(x+d*r*.55,y,r*.6,d<0?-1:2,d<0?1:4);c.stroke();}}
 render(game,now){
  const c=game.ctx,type=game.context.type,pitch=game.rounds[Math.min(game.round,game.rounds.length-1)],t=game.phase==='flight'?(now-game.started)/pitch.duration:0;c.clearRect(0,0,960,540);if(this.field.complete&&this.field.naturalWidth)c.drawImage(this.field,0,0,960,540);else{c.fillStyle='#315746';c.fillRect(0,0,960,540);}
  const identity=game.context.jersey??'BR',palette=game.context.palette||'#244d67',feedback=game.phase==='feedback',elapsed=now-game.resultAt;
  if(type==='batting'){
   this.actor(c,480,315,1.05,{time:now,pose:game.phase==='ready'?'idle':'throw',progress:clamp(t*5,0,1),number:'P'});
   const swing=feedback&&game.outcome.delta!==null,pose=swing?'swing':'bat-idle';this.actor(c,355,487,1.8,{time:now,pose,progress:clamp(elapsed/190,0,1),palette,number:identity});
   const glow=t>1-visionLead(game.context.profile)/pitch.duration&&t<1.13;c.strokeStyle=glow?'#fff0a6':'#f3cc7b88';c.lineWidth=glow?4:2;c.beginPath();c.ellipse(480,450,36,44,0,0,Math.PI*2);c.stroke();
   if(game.phase==='flight'){const x=480+pitch.curve*Math.sin(t*Math.PI)+(pitch.ball?95*t:0),y=306+144*t-170*Math.sin(t*Math.PI);c.fillStyle='#0003';c.beginPath();c.ellipse(x,450,6+8*t,3+3*t,0,0,Math.PI*2);c.fill();this.ball(c,x,y,5+14*t*t);}
   if(feedback){const hit=game.outcome.bases>0,f=clamp((elapsed-(hit?125:0))/1250,0,1);if(hit){const dir=game.outcome.delta<0?-1:1,depth=clamp(450-(game.outcome.distance||150),140,310),path=u=>[480+dir*180*u,450-(450-depth)*u-105*Math.sin(u*Math.PI)];if(!this.lowFX){c.strokeStyle='#fff3';c.lineWidth=2;c.beginPath();for(let u=0;u<=f;u+=.035){const [x,y]=path(u);u===0?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();}const [x,y]=path(f);this.ball(c,x,y,Math.max(4,18-14*f));if(f>.94){c.fillStyle='#c8ad7855';c.beginPath();c.ellipse(x,y+8,18,5,0,0,Math.PI*2);c.fill();}}else if(game.outcome.timing!=='TAKE')this.ball(c,480,455+f*125,19);}
  }else if(type==='fielding'){
   const target=pitch.target*960; c.fillStyle='#1f533388';c.fillRect(0,250,960,290);c.strokeStyle='#ebcf89';c.lineWidth=2;c.setLineDash([7,9]);c.beginPath();c.ellipse(target,467,game.context.rules?.catchRadius||43,17,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
   const moving=Math.abs(game.playerX-game.previousX)>1,returning=feedback&&game.outcome.success&&elapsed>400;
   this.actor(c,game.playerX,463,1.45,{time:now,pose:feedback?(game.outcome.success?(returning?'throw':'catch'):'miss'):moving?'run':'field-idle',progress:clamp((elapsed-400)/260,0,1),palette,number:identity,direction:game.playerX<game.previousX?-1:1});
   if(game.phase==='flight'){const u=clamp(t,0,1.2),x=480+(target-480)*u,y=392-280*Math.sin(Math.PI*Math.min(u,1))+21*u;c.fillStyle='#0005';c.beginPath();c.ellipse(target,467,9+7*u,4,0,0,Math.PI*2);c.fill();this.ball(c,x,y,10+4*u);c.fillStyle='#f4e8bf';c.font='13px sans-serif';c.fillText(u<.5?'球正在上升':'球正在落下',x+22,y);}
   if(feedback){if(game.outcome.success){const u=clamp((elapsed-650)/650,0,1),x=game.playerX-15.5;this.ball(c,x+(480-x)*u,414+55*u-60*Math.sin(u*Math.PI),8);if(returning){c.fillStyle='#f4e8bf';c.font='bold 16px sans-serif';c.fillText('接住，回傳！',480,510);}}else this.ball(c,target+Math.sin(elapsed*.004)*10,469-Math.abs(Math.sin(elapsed*.005))*8,12);}
  }else{
   c.fillStyle='#c7a77d';c.beginPath();c.moveTo(130,460);c.lineTo(745,285);c.lineTo(805,350);c.lineTo(195,525);c.fill();c.strokeStyle='#f7eccb';c.lineWidth=3;c.beginPath();c.moveTo(150,480);c.lineTo(773,320);c.stroke();c.fillStyle='#f9efcf';c.save();c.translate(150,484);c.rotate(-.3);c.fillRect(-20,-9,40,18);c.restore();c.save();c.translate(777,320);c.rotate(-.3);c.fillRect(-20,-9,40,18);c.restore();
   const p=game.runnerProgress||0,x=150+627*clamp(p,0,1.1),y=484-164*clamp(p,0,1.1),sliding=feedback&&game.outcome.slideDelta!==null;
   c.save();c.translate(x,y);if(sliding){c.rotate(-.65);c.translate(-15,10);}this.actor(c,0,0,1.5-p*.3,{time:now,pose:p>0?'run':'idle',palette,number:identity});c.restore();this.actor(c,796,313,1.1,{time:now,pose:feedback?'catch':'field-idle',palette:'#803f45',number:'2'});
   const cue=t>=pitch.cue;this.actor(c,480,411,.95,{time:now,pose:cue?'throw':'idle',progress:clamp((t-pitch.cue)*7,0,1),palette:'#803f45',number:'P',direction:cue?1:-1});
   if(cue&&!game.runLaunched){c.strokeStyle='#ffe397';c.lineWidth=3;c.beginPath();c.ellipse(480,411,26,9,0,0,Math.PI*2);c.stroke();}
   const throwProgress=clamp((p-.35)/.65,0,1);this.ball(c,495+(770-495)*throwProgress,377-89*throwProgress-40*Math.sin(throwProgress*Math.PI),8);c.fillStyle='#f2d69c';c.font='bold 18px sans-serif';c.fillText(game.runLaunched?'衝向下一個壘包':cue?'投手轉身，現在起跑！':'守住壘包，讀投手動作',360,445);
  }
 }
}
