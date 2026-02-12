import apostle from './apostle'
import caron from './caron'
import death from './death'
import dr_zed from './dr_zed'
import echo from './echo'
import elevator from './elevator'
import jax_seeker from './jax_seeker'
import kane_leader from './kane'
import marco from './marco'
import maya_tech from './maya'
import { NPCHandler } from './NPCHandler'
import portal from './portal'
import ratty from './ratty'
import subspace from './subspace'
import vending_machine from './vending_machine'

const npcHandlers: Record<string, NPCHandler> = {
  portal,
  elevator,
  death,
  echo,
  dr_zed,
  marco,
  caron_alive: subspace,
  caron_dead: subspace,

  vending_machine,

  // 레지스탕스
  kane_leader,
  maya_tech,
  jax_seeker,

  // b2
  ratty,

  // b3
  apostle,

  // b4
  caron,
}

export default npcHandlers
