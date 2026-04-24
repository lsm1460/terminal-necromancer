import achievementsData from './achievements.json'
import dropData from './drop.json'
import itemData from './item.json'
import levelData from './level.json'
import mapData from './map.json'
import monsterGroupData from './monster-group.json'
import monsterData from './monster.json'
import npcData from './npc.json'
import npcSkillData from './npcSkills.json'

import { IAssets } from '~/core'
import initState from './init_state.json'

export const assets = {
  map: mapData,
  monsterGroup: monsterGroupData,
  monster: monsterData,
  level: levelData,
  item: itemData,
  drop: dropData,
  npc: npcData,
  npcSkills: npcSkillData,
  achievements: achievementsData,
} as IAssets

export { initState }

export * from './locales'

