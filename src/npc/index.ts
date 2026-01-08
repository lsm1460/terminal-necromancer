import death from './death'
import elevator from './elevator'
import kane_leader from './kane'
import maya_tech from './maya'
import { NPCHandler } from './NPCHandler'

const npcHandlers: Record<string, NPCHandler> = {
  elevator,
  death,
  maya_tech,
  kane_leader,
}

export default npcHandlers