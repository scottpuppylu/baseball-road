import {hashSeed} from './career-engine.js';
export const ROLE_NAMES={starter:'主力',defender:'守備支援',rotation:'輪替',bench:'準備與替補'};
export const SHARED_EVENTS={
 'team-year2-pressure':{title:'第七局，還差兩分',facts:{inning:7,deficit:2,outs:1,runner:'一壘有人',opponent:'河岸系隊',location:'校園球場'},intro:'大二下的重要比賽進入第七局。記分板上仍差兩分，所有人面對的是同一個局面。'},
 'team-year3-cup':{title:'盃賽最後的守備半局',facts:{inning:7,lead:1,outs:1,runner:'二壘有人',opponent:'山城系隊',location:'校際球場'},intro:'大三下，球隊在盃賽領先一分。剩下的出局數要由這個學期累積的配合一起守住。'}
};
export function roleFor(state){if(state.temporary.trust>=70||state.baseline.profile.contact>=75&&state.playingOpportunities>=3)return 'starter';if(state.fieldTraining>=7)return 'defender';if(state.playingOpportunities>=2)return 'rotation';return 'bench';}
export function sharedView(state,eventId){
 const event=SHARED_EVENTS[eventId];if(!event)throw Error('共同事件不存在');const role=roleFor(state),views={starter:{text:'你站在打序的下一格。這次的責任是讀球與打擊，不是隻在板凳等待結果。',task:'batting',choice:'承擔關鍵打席'},defender:{text:'你在外野看見壘上的跑者。你的遊戲守備成長讓這一次接球與回傳成為重點。',task:'fielding',choice:'守住關鍵飛球'},rotation:{text:'你在替補區被叫起。輪替的位置不是旁觀，你需要讀懂離壘時機，把隊友的擊球變成推進。',task:'running',choice:'準備代跑與推進'},bench:{text:'你先從板凳協助觀察投手。教練安排臨時代跑，你要用準備和起跑時機爭取下一個角色。',task:'running',choice:'把臨時機會準備好'}};
 return {sharedEventId:eventId,eventVersion:'facts-1',worldFacts:structuredClone(event.facts),playerId:state.identity.playerId,playerRole:role,povVariant:role,title:event.title,text:event.intro+' '+views[role].text,gameType:views[role].task,choiceName:views[role].choice};
}
export function worldOutcome(state,eventId,result){const view=sharedView(state,eventId);const branchVersion='branch-'+hashSeed(JSON.stringify([state.identity.seed,state.decisions,result.attempts,state.worldEvents.length])).toString(16);return {...view,branchVersion,outcome:result.grade==='poor'?'這個分支的關鍵片段未達目標':result.grade==='excellent'?'這個分支完成關鍵片段':'這個分支保住部分機會',resultId:result.id};}
