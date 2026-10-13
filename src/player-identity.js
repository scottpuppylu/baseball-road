import {PLAYER_REGISTRY} from './player-registry.js';
import {IDENTITY_EVENTS} from './identity-events.js';
import {validateStory} from './story-engine.js';
export function qualifiedRoster(data){
 const anchors=new Map(PLAYER_REGISTRY.flatMap(p=>p.sourceLogIds.map(id=>[id,p.playerId]))),byName=new Map(),excluded=[];
 for(const row of data.logs||[]){const id=anchors.get(row.id);if(id){const name=row.name.trim(),ids=byName.get(name)||new Set();ids.add(id);byName.set(name,ids);}}
 const players=[];for(const p of data.players){const ids=byName.get(p.name);if(!ids||ids.size!==1){excluded.push({name:p.name,reason:ids?.size>1?'同名來源對應多個人物anchor，不能可靠拆分':'沒有現有anchor或個人事件配置'});continue;}const id=[...ids][0];if(!IDENTITY_EVENTS[id]){excluded.push({name:p.name,reason:'個人事件配置缺漏'});continue;}players.push({...p,id,sourceNameId:p.id,identitySource:'canonical-log-anchors'});}
 return {players,excluded,meta:data.meta,stale:data.stale};
}
export function migrationPlan(old,roster){validateStory(old);const player=roster.players.find(p=>p.sourceNameId===old.identity.prototypeId);if(!player)throw Error('舊原型無法可靠對應現有log anchors；原存檔保留，不能猜測轉接。');const nodes={arrival:0,meet:1,batting:2,battingResponse:3,fieldingIntro:4,fielding:5,positioning:6,final:0};return {playerId:player.id,name:player.name,semester:old.phase==='final'?1:0,node:nodes[old.scene],legacyState:structuredClone(old),preserveKey:'baseball-road:story:save:v1'};}
