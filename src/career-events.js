// Original fictional events. Effects describe simulation mechanics, never real-player biography.
export const TRAINING=[
 {id:'power',name:'長打訓練',description:'Power +6；體能 −18、信心 +3。疲勞時冒進可能拉傷。',growth:{power:6},effects:{condition:-18,confidence:3},risk:.24},
 {id:'contact',name:'打擊技巧',description:'Contact +5；體能 −11、教練信任 +3。犧牲長打成長。',growth:{contact:5},effects:{condition:-11,trust:3},risk:.10},
 {id:'vision',name:'選球訓練',description:'Vision +5；體能 −7、信心 +2。不增加揮擊力量。',growth:{vision:5},effects:{condition:-7,confidence:2},risk:.04},
 {id:'rest',name:'休息恢復',description:'體能 +24、信心 +4、教練信任 −3；這次沒有技術成長。',growth:{},effects:{condition:24,confidence:4,trust:-3},risk:0}
];
export const EVENTS=[
 {id:'lineup',title:'先發名單上的空格',story:'教練把空白的打序交到你手裡：「給我一個把你放上去的理由。」你準備怎麼回應？',condition:()=>true,choices:[
  {id:'show',name:'多留一小時，展示長打',description:'Power +3、體能 −12。成功提高信任；失手可能失去信心。',growth:{power:3},effects:{condition:-12},chance:'power',success:{trust:9,confidence:5},failure:{trust:-3,confidence:-5}},
  {id:'steady',name:'把每次上壘當成承諾',description:'Vision +2、Contact +2、信任 +5；體能 −6。',growth:{vision:2,contact:2},effects:{trust:5,condition:-6}},
  {id:'honest',name:'坦白疲勞，爭取輪替',description:'體能 +16、信心 +3；信任 −4。保護自己，暫讓出舞台。',effects:{condition:16,confidence:3,trust:-4}}
 ]},
 {id:'fatigue',title:'肩膀發出的訊號',story:'熱身時肩膀一陣緊繃。這不是退出的理由，但也不是可以忽略的聲音。下一步由你決定。',condition:s=>s.temporary.condition<62,choices:[
  {id:'adjust',name:'降低強度，調整動作',description:'Contact +2、體能 +12；信任 −2。',growth:{contact:2},effects:{condition:12,trust:-2}},
  {id:'push',name:'硬撐最後一組',description:'Power +4、體能 −17。表現成功獲得信任；失敗體能再降。',growth:{power:4},effects:{condition:-17},chance:'condition',success:{trust:8,confidence:5},failure:{condition:-12,confidence:-8}},
  {id:'recover',name:'去找防護員',description:'體能 +25、信心 +2；這次沒有技術成長。',effects:{condition:25,confidence:2}}
 ]},
 {id:'partner',title:'接住隊友的低潮',story:'練習結束，隊友仍在籠子裡反覆揮空。晚餐時間快到了，你有三種方式回應。',condition:()=>true,choices:[
  {id:'teach',name:'一起拆解擊球動作',description:'Contact +3、信任 +4；體能 −9。',growth:{contact:3},effects:{trust:4,condition:-9}},
  {id:'listen',name:'坐下來聽他說',description:'信心 +10、信任 +3、體能 +4。',effects:{confidence:10,trust:3,condition:4}},
  {id:'solo',name:'回到自己的長打課表',description:'Power +4、信心 +2；信任 −3、體能 −12。',growth:{power:4},effects:{confidence:2,trust:-3,condition:-12}}
 ]},
 {id:'study',title:'燈光下的兩份功課',story:'隔天的報告還沒寫完，球隊又寄來對手的打擊影片。你今晚能專注完成哪一件事？',condition:()=>true,choices:[
  {id:'video',name:'研究對手的投球節奏',description:'Vision +4、信任 +3；體能 −10、信心 −2。',growth:{vision:4},effects:{trust:3,condition:-10,confidence:-2}},
  {id:'school',name:'先完成報告，早點睡',description:'體能 +18、信心 +5；沒有技術成長。',effects:{condition:18,confidence:5}},
  {id:'both',name:'兩份功課都不放下',description:'Vision +2、信任 +6；體能 −18。',growth:{vision:2},effects:{trust:6,condition:-18}}
 ]},
 {id:'captain',title:'你開始被看見',story:'學弟把訓練問題帶來，而教練站在遠處觀察。你已經不只是需要答案的那個新人。',condition:s=>s.year>=2||s.temporary.trust>=65,choices:[
  {id:'lead',name:'帶著學弟完成基本功',description:'Contact +2、信任 +10；體能 −10。',growth:{contact:2},effects:{trust:10,condition:-10}},
  {id:'example',name:'用自己的表現回答',description:'Power +3、信心 +5；體能 −10。',growth:{power:3},effects:{confidence:5,condition:-10}},
  {id:'share',name:'分享選球筆記',description:'Vision +3、信任 +5；體能 −4。',growth:{vision:3},effects:{trust:5,condition:-4}}
 ]}
];
export const TACTICS=[
 {id:'attack',name:'全力攻擊',description:'本季 Power +8；體能 −12、信心 +3。長打提升，也承擔疲勞。',bonus:{power:8},effects:{condition:-12,confidence:3}},
 {id:'patient',name:'耐心推進',description:'本季 Vision +8、Contact +3；體能 −5、信任 +3。優先上壘。',bonus:{vision:8,contact:3},effects:{condition:-5,trust:3}},
 {id:'balanced',name:'守住自己的節奏',description:'體能 +10、信心 +4；沒有臨時技術加成。',bonus:{},effects:{condition:10,confidence:4}}
];
