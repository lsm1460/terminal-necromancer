// src/assets.ts
import mapData from './map.json'
import monsterGroupData from './monster-group.json'
import monsterData from './monster.json'
import stateData from './state.json'
import levelData from './level.json'
import itemData from './item.json'
import dropData from './drop.json'
import npcData from './npc.json'
import eventData from './events.json'
import npcSkillData from './npcSkills.json'

import initState from './init_state.json'

export const assets = {
  map: mapData,
  monsterGroup: monsterGroupData,
  monster: monsterData,
  state: stateData,
  level: levelData,
  item: itemData,
  drop: dropData,
  npc: npcData,
  events: eventData,
  npcSkills: npcSkillData,
}

export {
  initState
}

// 타입 정의 (필요한 경우)
export type GameAssets = typeof assets
