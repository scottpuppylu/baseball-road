import {CareerSave} from './career-save.js';
import {SAVE_PREFIX,ACTIVE_KEY,validateFullCareer} from './full-career-engine.js';
import {PLAYER_REGISTRY} from './player-registry.js';
export class FullSaveManager{
 constructor(storage){this.storage=storage;}
 slot(id){if(!PLAYER_REGISTRY.some(p=>p.playerId===id))throw Error('未知球員存檔槽。');return new CareerSave(this.storage,{key:SAVE_PREFIX+id,validate:s=>{validateFullCareer(s);if(s.identity.playerId!==id)throw Error('存檔身份與槽位不符，原文保留。');}});}
 load(id){try{const result=this.slot(id).load();if(result.state?.phase==='milestone'&&result.state.semester===4){result.state=structuredClone(result.state);result.state.phase='story';result.state.lastFeedback='D1 的四學期紀錄完整保留，現在接續大三；原存檔在新的選擇保存前保持原文。';validateFullCareer(result.state);result.migrated='D1-to-full-career';}return result;}catch(e){return {state:null,error:e.message};}}
 active(){try{const id=this.storage.getItem(ACTIVE_KEY);return id?{id,...this.load(id)}:{state:null};}catch(e){return {state:null,error:e.message};}}
 list(){return PLAYER_REGISTRY.map(p=>{const saved=this.load(p.playerId);return {...saved,id:p.playerId};}).filter(s=>s.state||s.error);}
 save(s,options){const result=this.slot(s.identity.playerId).save(s,options);if(!result.error)try{this.storage.setItem(ACTIVE_KEY,s.identity.playerId);}catch{result.warning='角色槽已保存，首頁索引未更新；可從存檔選單找回。';}return result;}
 raw(id){return this.slot(id).exportRaw();}
 hasRaw(id){return !!this.raw(id);}
}
