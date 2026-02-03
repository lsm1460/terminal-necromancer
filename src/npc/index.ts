import death from './death'
import dr_zed from './dr_zed'
import echo from './echo'
import elevator from './elevator'
import jax_seeker from './jax_seeker'
import kane_leader from './kane'
import maya_tech from './maya'
import { NPCHandler } from './NPCHandler'
import portal from './portal'
import ratty from './ratty'
import marco from './marco'
import apostle from './apostle'
import vending_machine from './vending_machine'

const npcHandlers: Record<string, NPCHandler> = {
  portal,
  elevator,
  death,
  echo,
  dr_zed,
  marco,

  vending_machine,

  // 레지스탕스
  kane_leader,
  maya_tech,
  jax_seeker,

  // b2
  ratty,

  // b3
  apostle
}

export default npcHandlers