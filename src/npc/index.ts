import death from './death'
import elevator from './elevator'
import kane_leader from './kane'
import maya_tech from './maya'
import portal from './portal'
import jax_seeker from './jax_seeker'
import echo from './echo'
import dr_zed from './dr_zed'
import ratty from './ratty'
import { NPCHandler } from './NPCHandler'

const npcHandlers: Record<string, NPCHandler> = {
  portal,
  elevator,
  death,
  echo,
  dr_zed,

  // 레지스탕스
  kane_leader,
  maya_tech,
  jax_seeker,

  // b2
  ratty,
}

export default npcHandlers