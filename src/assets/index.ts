// src/assets.ts
import achievementsData from './achievements.json'
import dropData from './drop.json'
import itemData from './item.json'
import levelData from './level.json'
import mapData from './map.json'
import monsterGroupData from './monster-group.json'
import monsterData from './monster.json'
import npcData from './npc.json'
import npcSkillData from './npcSkills.json'
import stateData from './state.json'

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
  npcSkills: npcSkillData,
  achievements: achievementsData,
}

export { initState }

export * from './locales'

// 타입 정의 (필요한 경우)
export type GameAssets = typeof assets
