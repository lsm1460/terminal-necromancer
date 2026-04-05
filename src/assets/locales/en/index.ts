import _knight from './_knight.json'
import adrian from './adrian.json'
import affix from './affix.json'
import apostle from './apostle.json'
import baron_valter from './baron_valter.json'
import battle from './battle.json'
import broadcast from './broadcast.json'
import caron from './caron.json'
import commands from './commands.json'
import death from './death.json'
import dr_zed from './dr_zed.json'
import echo from './echo.json'
import elevator from './elevator.json'
import events from './events.json'
import first_boss from './first_boss.json'
import flint from './flint.json'
import item from './item.json'
import jax_seeker from './jax_seeker.json'
import julian from './julian.json'
import kael from './kael.json'
import kane_leader from './kane_leader.json'
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
import third_boss from './third_boss.json'
import vending_machine from './vending_machine.json'

import aris_purifier from './aris_purifier.json'
import elias_survivor from './elias_survivor.json'
import dax_looter from './dax_looter.json'
import hansen_mechanic from './hansen_mechanic.json'
import mika_operator from './mika_operator.json'
import shadowed_agent from './shadowed_agent.json'
import silas_dissector from './silas_dissector.json'
import vora_observer from './vora_observer.json'

const en = {
  item,
  affix,
  broadcast,
  npc: {
    ...npc,
    ...monster,
    ...minion,
    echo,
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
    _knight,

    caron,
    subspace,

    //b5
    oliver,
    julian,
    kael,
    adrian,
    flint,
    baron_valter,
    third_boss,

    //b6
    aris_purifier,
    elias_survivor,
    dax_looter,
    hansen_mechanic,
    mika_operator,
    shadowed_agent,
    silas_dissector,
    vora_observer,
  },
  skill,
  events,
  battle,
  commands,
}

export default en
