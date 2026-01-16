import death from './death'
import elevator from './elevator'
import kane_leader from './kane'
import maya_tech from './maya'
import portal from './portal'
import jax_seeker from './jax_seeker'
import { NPCHandler } from './NPCHandler'

const npcHandlers: Record<string, NPCHandler> = {
  portal,
  elevator,
  death,

  // 레지스탕스
  kane_leader,
  maya_tech,
  jax_seeker,
}

export default npcHandlers