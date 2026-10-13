import {validateCareer} from './career-engine.js';
export const SAVE_KEY='baseball-road:life:save:v1';
export class CareerSave{
 constructor(storage,{key=SAVE_KEY,validate=validateCareer}={}){this.storage=storage;this.key=key;this.validate=validate;}
 load(){try{const raw=this.storage.getItem(this.key);if(!raw)return {state:null};const envelope=JSON.parse(raw);this.validate(envelope.state);return {state:envelope.state,savedAt:envelope.savedAt};}catch(error){return {state:null,error:'無法讀取生涯存檔：'+error.message,preserved:true};}}
 save(state,{replaceConfirmed=false}={}){try{this.validate(state);const existing=this.storage.getItem(this.key);if(existing&&!replaceConfirmed){const envelope=JSON.parse(existing);this.validate(envelope.state);}const savedAt=new Date().toISOString();this.storage.setItem(this.key,JSON.stringify({state,savedAt}));return {savedAt};}catch(error){return {error:'自動存檔失敗；目前進度仍在此分頁，舊存檔未清除。'+error.message};}}
 clear(){this.storage.removeItem(this.key);}
 exportRaw(){return this.storage.getItem(this.key)||'';}
}
