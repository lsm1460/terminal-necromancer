import adrian from './adrian.json'
import affix from './affix.json'
import apostle from './apostle.json'
import battle from './battle.json'
import broadcast from './broadcast.json'
import caron from './caron.json'
import commands from './commands.json'
import death from './death.json'
import dr_zed from './dr_zed.json'
import elevator from './elevator.json'
import events from './events.json'
import first_boss from './first_boss.json'
import flint from './flint.json'
import init from './init.json'
import item from './item.json'
import jax_seeker from './jax_seeker.json'
import julian from './julian.json'
import kael from './kael.json'
import kane_leader from './kane_leader.json'
import map from './map.json'
import marco from './marco.json'
import maya_tech from './maya_tech.json'
import minion from './minion.json'
import monster from './monster.json'
import npc from './npc.json'
import oliver from './oliver.json'
import portal from './portal.json'
import ratty from './ratty.json'
import second_boss from './second_boss.json'
import skill from './skill.json'
import subspace from './subspace.json'
import vending_machine from './vending_machine.json'
import web from './web.json'
import baron_valter from './baron_valter.json'

const ko = {
  ...init,
  ...map,
  item,
  affix,
  web,
  broadcast,
  npc: {
    ...npc,
    ...monster,
    ...minion,
    death,
    dr_zed,
    jax_seeker,
    ratty,
    elevator,
    portal,
    marco,
    kane_leader,
    maya_tech,
    vending_machine,
    first_boss,
    second_boss,
    apostle,

    caron,
    subspace,

    //b5
    oliver,
    julian,
    kael,
    adrian,
    flint,
    baron_valter,
  },
  skill,
  events,
  battle,
  commands,
}

export default ko
