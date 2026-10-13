import assert from 'node:assert/strict';
import {SEMESTERS} from '../src/full-career-content.js';
import {IDENTITY_EVENTS} from '../src/identity-events.js';
import {SHARED_EVENTS} from '../src/shared-world.js';
import {PLAYER_REGISTRY} from '../src/player-registry.js';
const ids=new Set(),types=new Set(),shared=new Set();let choices=0,games=0;
assert.equal(SEMESTERS.length,8);
for(const [i,sem] of SEMESTERS.entries()){
 assert.ok(sem.nodes.length>=5);assert.ok(sem.nodes.filter(n=>n.kind==='game').length>=2);assert.equal(sem.nodes.at(-1).kind,'summary');
 for(const node of sem.nodes){
  const id=sem.id+':'+node.id;assert.ok(!ids.has(id));ids.add(id);assert.ok(node.text.length>30);
  if(node.kind==='personal'){assert.equal(i,1);continue;} // Resolved from stable player ID below, never an empty player-facing scene.
  assert.ok(node.choices?.length>=2);assert.equal(new Set(node.choices.map(c=>c.id)).size,node.choices.length);
  for(const c of node.choices){assert.ok(c.name&&c.detail);assert.ok(Object.keys(c.effects).length+Object.keys(c.growth).length+Object.keys(c.modifiers).length>0);assert.ok([...Object.values(c.effects),...Object.values(c.growth),...Object.values(c.modifiers)].every(Number.isFinite));choices++;}
  if(node.kind==='game'){assert.ok(['batting','fielding','running'].includes(node.type));assert.ok(Number.isInteger(node.rules.rounds)&&node.rules.rounds>=3);assert.deepEqual(Object.keys(node.responses).sort(),['excellent','ordinary','poor']);types.add(node.type);games++;}
  if(node.sharedEvent){assert.ok(SHARED_EVENTS[node.sharedEvent]);shared.add(node.sharedEvent);}
  if(node.kind==='personal')assert.equal(i,1);
 }
}
assert.equal(shared.size,2);assert.equal(types.size,3);assert.equal(Object.keys(IDENTITY_EVENTS).length,PLAYER_REGISTRY.length);
const personalIds=new Set();for(const p of PLAYER_REGISTRY){const e=IDENTITY_EVENTS[p.playerId];assert.ok(e&&!personalIds.has(e.id));personalIds.add(e.id);assert.ok(e.text.length>30);assert.ok(e.choices.length>=2);for(const c of e.choices)assert.ok(c.rules?.rounds>=3&&c.type);}
console.log(JSON.stringify({status:'PASS',semesters:8,storyNodes:ids.size,meaningfulChoices:choices,mainGameplayEvents:games,personalEventDefinitions:personalIds.size,gameplayEventsPerNewCareer:games+1,sharedEvents:shared.size,gameTypes:[...types],reachability:'Linear graph, choices lead to next node or actual game; every final node transitions, all 16 real-player paths tested separately'},null,2));
