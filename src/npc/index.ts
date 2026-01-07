import death from './death'
import maya_tech from './maya'
import kane_leader from './kane'
import { NPCHandler } from './NPCHandler'

const npcHandlers: Record<string, NPCHandler> = {
  death,
  maya_tech,
  kane_leader,
}

export default npcHandlers