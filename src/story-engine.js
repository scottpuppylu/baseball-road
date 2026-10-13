import {hashSeed,abilities,validSnapshot} from './career-engine.js';
import {SCENES,CHAPTERS} from './story-content.js';
import {GAME_VERSION,validResult} from './minigame-model.js';
export const STORY_VERSION='university-story-1.0.0',STORY_SAVE_KEY='baseball-road:story:save:v1';
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
export function createStory(settings,snapshot){
 if(typeof settings.name!=='string'||!settings.name.trim()||settings.name.trim().length>24||typeof settings.seed!=='string'||!settings.seed.trim()||settings.seed.length>80||!validSnapshot(snapshot))throw Error('請輸入有效的角色名稱、種子與真實能力原型。');
 return {schemaVersion:1,engineVersion:STORY_VERSION,chapter:CHAPTERS[0].id,scene:'arrival',phase:'story',identity:{name:settings.name.trim(),seed:settings.seed.trim(),prototypeId:snapshot.profile.id,prototypeName:snapshot.profile.name},baseline:structuredClone(snapshot),growth:{power:0,contact:0,vision:0},temporary:{condition:82,confidence:55,trust:45},relationships:40,academics:50,fieldingBonus:0,role:null,opportunity:null,decisions:[],results:[],history:[],contexts:[],currentGame:null,sourceChanges:[],lastFeedback:'從新生，開始你的系壘故事。'};
}
function effects(s,e={},g={}){for(const [k,v] of Object.entries(e)){if(k in s.temporary)s.temporary[k]=clamp(s.temporary[k]+v);else if(['relationships','academics'].includes(k))s[k]=clamp(s[k]+v);}for(const [k,v] of Object.entries(g))s.growth[k]=clamp(s.growth[k]+v,0,40);}
export function chooseStory(input,id){
 if(input.phase!=='story')throw Error('先完成目前的小遊戲。');const scene=SCENES[input.scene],choice=scene.choices.find(c=>c.id===id);if(!choice)throw Error('此選擇不屬於目前故事。');const s=structuredClone(input);effects(s,choice.effects,choice.growth);s.decisions.push({scene:input.scene,choice:id});
 if(choice.catchBonus!==undefined)s.fieldingBonus=choice.catchBonus;
 s.history.push({scene:input.scene,title:scene.title,choice:choice.name,fingerprint:input.baseline.fingerprint});
 if(scene.game){
  const context={id:`${s.chapter}:${input.scene}:${s.contexts.length}`,type:scene.game,eventId:input.scene,chapter:s.chapter,profile:abilities(s),difficulty:1,worldSeed:s.identity.seed,seed:hashSeed(JSON.stringify([s.identity.seed,s.identity.name,s.baseline.fingerprint,input.scene,choice.id,GAME_VERSION])),modifiers:{windowBonus:choice.windowBonus||0,powerBonus:choice.powerBonus||0,catchBonus:s.fieldingBonus,timingBonus:0},fingerprint:s.baseline.fingerprint};
  s.currentGame=context;s.contexts.push(structuredClone(context));s.phase='minigame';s.lastFeedback='故事裡的練習，現在交給你的雙手。';
 }else{s.scene=choice.next;if(s.scene==='final')s.phase='final';s.lastFeedback=choice.name+'：這個選擇已寫入生涯。';}
 return s;
}
export function applyGameResult(input,result){
 if(input.results.some(r=>r.id===result?.id))return input;
 if(input.phase!=='minigame'||!validResult(result,input.currentGame))throw Error('小遊戲結果不符合目前故事事件。');
 const s=structuredClone(input),excellent=result.grade==='excellent',ordinary=result.grade==='ordinary';s.results.push(structuredClone(result));
 if(result.type==='batting'){effects(s,{trust:excellent?10:ordinary?4:-3,confidence:excellent?8:ordinary?3:-4,condition:-10},{contact:excellent?3:ordinary?2:1,power:excellent?2:0});s.scene='battingResponse';}
 else {effects(s,{trust:excellent?10:ordinary?4:-2,confidence:excellent?6:ordinary?2:-3,condition:-8,relationships:excellent?7:ordinary?3:1});s.scene='positioning';const batting=s.results.find(r=>r.type==='batting').grade;
  if(batting==='excellent'&&excellent){s.role='練習賽先發候選';s.opportunity='下一次練習賽，爭取先發打序與外野實戰。';}
  else if(batting==='poor'&&result.grade==='poor'){s.role='基礎訓練搭檔';s.opportunity='和夥伴約一組小班練習，先把擊球與落點練穩。';}
  else if(s.relationships>=53){s.role='輪替與配合夥伴';s.opportunity='加入輪替小組，從支援隊友與實戰替補開始。';}
  else{s.role='專項培養球員';s.opportunity='教練安排一次專項練習，再決定下一次出賽機會。';}
 }
 s.history.push({scene:input.scene,title:result.type==='batting'?'實際打擊練習':'實際高飛球練習',resultId:result.id,grade:result.grade,fingerprint:input.currentGame.fingerprint});s.currentGame=null;s.phase='story';s.lastFeedback=`${result.type==='batting'?'打擊':'守備'} ${excellent?'表現優秀':ordinary?'逐步掌握':'仍需練習'} · 信任 ${s.temporary.trust} / 體能 ${s.temporary.condition}。不是只有分數，球隊對你的安排也會改變。`;return s;
}
export function storyPresentation(s){
 const scene=SCENES[s.scene];let text=scene.text,title=scene.title;
 if(s.scene==='battingResponse'){const grade=s.results.find(r=>r.type==='batting').grade;const responses={excellent:'球連續飛過內野。夥伴笑著把下一顆球遞給你：「這次練習賽，我們讓你多打幾次看看。」你的打擊開始被看見。',ordinary:'幾顆球找到了甜蜜點，幾顆還差一點。夥伴替你收球：「已經抓到節奏了。下一輪，我陪你把它練穩。」你的路從穩定開始。',poor:'揮空之後，夥伴沒有收起球袋：「沒關係，我們把節奏拆慢一點。守備也有機會讓你找到位置。」這次失誤，打開了另一條練習路。'};text=responses[grade];}
 if(s.scene==='positioning'){title=s.role;text=`${s.opportunity} ${s.relationships>=53?'你之前願意陪大家做事，夥伴也願意陪你走下一段。':'你可以從下一次練習，開始建立更多配合。'} 今天的練習結果已存入同一段生涯。`;}
 return {...scene,title,text};
}
export function adoptFutureSnapshot(input,snapshot,status){
 if(input.phase!=='story'||input.currentGame)throw Error('進行中的練習不能換能力快照。');if(!snapshot||!validSnapshot(snapshot)||snapshot.profile.id!==input.identity.prototypeId)throw Error('來源原型不符，保留原資料。');
 const s=structuredClone(input);const delta=Object.fromEntries(['power','contact','vision'].map(k=>[k,snapshot.profile[k]-s.baseline.profile[k]]));s.sourceChanges.push({scene:s.scene,from:s.baseline.fingerprint,to:snapshot.fingerprint,delta,status});s.baseline=structuredClone(snapshot);s.lastFeedback=`下一段故事資料：${status}。P ${delta.power>=0?'+':''}${delta.power} / C ${delta.contact>=0?'+':''}${delta.contact} / V ${delta.vision>=0?'+':''}${delta.vision}；既有紀事與操作結果保留。`;return s;
}
export function validateStory(s){
 if(!s||s.schemaVersion!==1||s.engineVersion!==STORY_VERSION)throw Error('存檔版本不相容，原文保留。');
 if(s.chapter!==CHAPTERS[0].id||!SCENES[s.scene]||!['story','minigame','final'].includes(s.phase)||!s.identity||typeof s.identity.name!=='string'||!s.identity.name.trim()||s.identity.name.length>24||typeof s.identity.seed!=='string'||!s.identity.seed.trim()||s.identity.seed.length>80||!validSnapshot(s.baseline)||s.identity.prototypeId!==s.baseline.profile.id)throw Error('故事角色或進度無效，原文保留。');
 for(const key of ['condition','confidence','trust'])if(!Number.isFinite(s.temporary?.[key])||s.temporary[key]<0||s.temporary[key]>100)throw Error('生涯狀態損壞。');
 for(const key of ['power','contact','vision'])if(!Number.isFinite(s.growth?.[key])||s.growth[key]<0||s.growth[key]>40)throw Error('能力成長損壞。');
 if(![s.relationships,s.academics,s.fieldingBonus].every(v=>Number.isFinite(v)&&v>=0&&v<=100)||!Array.isArray(s.decisions)||s.decisions.some(d=>!SCENES[d.scene]?.choices.some(c=>c.id===d.choice))||!Array.isArray(s.contexts)||s.contexts.some(c=>typeof c.id!=='string'||!['batting','fielding'].includes(c.type)||SCENES[c.eventId]?.game!==c.type||!Number.isInteger(c.seed)||!Number.isFinite(c.difficulty)||c.difficulty<.7||c.difficulty>2||!['power','contact','vision'].every(k=>Number.isFinite(c.profile?.[k])&&c.profile[k]>=0&&c.profile[k]<=100)||!['windowBonus','powerBonus','catchBonus','timingBonus'].every(k=>Number.isFinite(c.modifiers?.[k])&&c.modifiers[k]>=0&&c.modifiers[k]<=100)||typeof c.fingerprint!=='string')||!Array.isArray(s.results)||!Array.isArray(s.history)||s.history.some(h=>typeof h.title!=='string'||typeof h.scene!=='string')||!Array.isArray(s.sourceChanges)||typeof s.lastFeedback!=='string'||new Set(s.results.map(r=>r.id)).size!==s.results.length||s.results.some(r=>!s.contexts.some(c=>c.id===r.contextId&&validResult(r,c))))throw Error('操作結果或紀事損壞。');
 if(s.phase==='minigame'&&(!s.currentGame||s.currentGame.eventId!==s.scene||s.currentGame.type!==SCENES[s.scene].game||!s.contexts.some(c=>JSON.stringify(c)===JSON.stringify(s.currentGame))||s.results.some(r=>r.contextId===s.currentGame.id)))throw Error('小遊戲與故事進度不符。');
 if(s.phase!=='minigame'&&s.currentGame!==null)throw Error('故事與練習階段不符。');
 if(s.phase==='final'&&(s.scene!=='final'||s.results.length!==2||typeof s.role!=='string'||typeof s.opportunity!=='string'))throw Error('結算未完成。');
 if(['battingResponse','fieldingIntro','fielding','positioning','final'].includes(s.scene)&&!s.results.some(r=>r.type==='batting'))throw Error('缺少打擊結果。');
 if(['positioning','final'].includes(s.scene)&&!s.results.some(r=>r.type==='fielding'))throw Error('缺少守備結果。');return s;
}
