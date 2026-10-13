const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const STAGES=[
 {name:'初登打席',target:240,pitches:12,outs:3,speed:1600},
 {name:'追分時刻',target:380,pitches:13,outs:3,speed:1450},
 {name:'兩好球之後',target:480,pitches:14,outs:2,speed:1300},
 {name:'長打大道',target:620,pitches:15,outs:3,speed:1150},
 {name:'王牌決戰',target:820,pitches:18,outs:3,speed:1000}
];
export const BUFFS=[
 {id:'window',name:'甜蜜點',text:'擊球容錯窗 +22 毫秒',key:'window',amount:22,max:66},
 {id:'power',name:'重砲手',text:'Power +12（最高 100）',key:'power',amount:12,max:36},
 {id:'contact',name:'精準揮擊',text:'Contact +12（最高 100）',key:'contact',amount:12,max:36},
 {id:'vision',name:'鷹眼',text:'Vision +15，提早看出壞球',key:'vision',amount:15,max:45},
 {id:'perfect',name:'完美一擊',text:'PERFECT 額外 +65 分',key:'perfect',amount:65,max:195},
 {id:'two',name:'逆境打者',text:'兩好球時擊球 +45 分',key:'two',amount:45,max:135},
 {id:'combo',name:'火熱手感',text:'每次連續安打額外 +15 分',key:'combo',amount:15,max:45},
 {id:'hr',name:'全壘打英雄',text:'全壘打額外 +100 分',key:'hr',amount:100,max:300},
 {id:'shield',name:'再一次機會',text:'每關第一個揮空不計好球',key:'shield',amount:1,max:1},
 {id:'patient',name:'耐心獵人',text:'保送額外 +60 分',key:'walk',amount:60,max:180}
];
export function rng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export function effective(run){return {power:clamp(run.base.power+(run.buffs.power||0),0,100),contact:clamp(run.base.contact+(run.buffs.contact||0),0,100),vision:clamp(run.base.vision+(run.buffs.vision||0),0,100)};}
export function contactWindow(profile,buffs={}){return Math.min(240,90+profile.contact*1.1+(buffs.window||0));}
export function visionLead(profile){return 180+profile.vision*4;}
export function judgeSwing(delta,profile,buffs={},isBall=false){
 const window=contactWindow(profile,buffs),a=Math.abs(delta);
 if(isBall||a>window)return {timing:'MISS',bases:0,score:0};
 const timing=a<=32?'PERFECT':a<=window*.60?'GOOD':delta<0?'EARLY':'LATE';
 const quality=clamp(1-a/window,0,1),distance=40+profile.power*1.1+quality*100;
 const bases=distance>=205?4:distance>=165?3:distance>=120?2:1;
 return {timing,bases,distance,score:bases*70+(timing==='PERFECT'?40+(buffs.perfect||0):0)+(bases===4?(buffs.hr||0):0)};
}
export function createRun(base,seed=Date.now()){
 return {base:{...base},seed,random:rng(seed),stage:0,phase:'playing',buffs:{},chosen:[],offers:[],total:0,score:0,balls:0,strikes:0,outs:0,pitches:0,combo:0,shieldUsed:false,history:[],last:null};
}
export function makePitch(run){const random=run.random;return {duration:STAGES[run.stage].speed*(.88+random()*.24),ball:random()<.24,lane:random()};}
function checkStage(run){
 const stage=STAGES[run.stage];
 if(run.score>=stage.target){run.history.push({stage:run.stage+1,score:run.score,cleared:true});
  if(run.stage===4){run.phase='won';run.buffs={};}
  else {run.phase='buff';const pool=[...BUFFS];run.offers=[];for(let i=0;i<3;i++)run.offers.push(pool.splice(Math.floor(run.random()*pool.length),1)[0]);}
 }else if(run.outs>=stage.outs||run.pitches>=stage.pitches){run.phase='lost';run.history.push({stage:run.stage+1,score:run.score,cleared:false});run.buffs={};}
}
export function resolvePitch(run,pitch,delta=null){
 if(run.phase!=='playing')return null;
 run.pitches++;
 const profile=effective(run),result=delta===null?{timing:pitch.ball?'BALL':'STRIKE',bases:0,score:0}:judgeSwing(delta,profile,run.buffs,pitch.ball);
 if(result.bases){result.score+=(run.strikes===2?(run.buffs.two||0):0)+Math.min(run.combo,5)*(run.buffs.combo||0);run.combo++;run.strikes=0;run.balls=0;}
 else if(result.timing==='BALL'){
  run.balls++;if(run.balls===4){result.timing='WALK';result.score=100+(run.buffs.walk||0);run.balls=0;run.strikes=0;}
 }else{
  run.combo=0;
  if(result.timing==='MISS'&&run.buffs.shield&&!run.shieldUsed)run.shieldUsed=true;else run.strikes++;
  if(run.strikes===3){run.outs++;run.strikes=0;run.balls=0;result.out=true;}
 }
 run.score+=result.score;run.total+=result.score;run.last=result;checkStage(run);return result;
}
export function chooseBuff(run,id){
 if(run.phase!=='buff')return false;const buff=run.offers.find(b=>b.id===id);if(!buff)return false;
 run.buffs[buff.key]=Math.min(buff.max,(run.buffs[buff.key]||0)+buff.amount);run.chosen.push(buff.name);
 run.stage++;run.phase='playing';run.score=0;run.strikes=0;run.balls=0;run.outs=0;run.pitches=0;run.combo=0;run.shieldUsed=false;run.offers=[];return true;
}
