import { BaseNPC } from '~/core/npc/BaseNPC'
import { KnightNPC } from './_knight/KnightNPC'
import { AdrianNPC } from './adrian/AdrianNPC'
import { ApostleNPC } from './apostle/ApostleNPC'
import { CaronNPC } from './caron/CaronNPC'
import { DaxNPC } from './dax_looter/DaxNPC'
import { DeathNPC } from './death/DeathNPC'
import { ZedNPC } from './dr_zed/DrZedNPC'
import { EchoNPC } from './echo/EchoNpc'
import { ElevatorNPC } from './elevator/ElevatorNPC'
import { EliasNPC } from './elias_survivor/EliasNPC'
import { FlintNPC } from './flint/FlintNPC'
import { HansenNPC } from './hansen_mechanic/HansenNPC'
import { JaxNPC } from './jax_seeker/JaxNPC'
import { JulianNPC } from './julian/JulianNPC'
import { KaelNPC } from './kael/KaelNPC'
import { KaneNPC } from './kane_leader/KaneNPC'
import { MarcoNPC } from './marco/MarcoNPC'
import { MayaNPC } from './maya/MayaNPC'
import { MikaNPC } from './mika_operator/MikaNPC'
import { OliverNPC } from './oliver/OliverNPC'
import { PortalNPC } from './portal/PortalNPC'
import { RattyNPC } from './ratty/RattyNPC'
import { ShadowedNPC } from './shadowed_agent/ShadowedNPC'
import { SilasNPC } from './silas_dissector/SilasNPC'
import { SubspaceNPC } from './subspace/SubspaceNPC'
import { VendingMachineNPC } from './vending_machine/VendingMachineNPC'
import { VesperNPC } from './vesper/VesperNPC'
import { VoraNPC } from './vora_observer/VoraNPC'

export const getNPCClass = (id: string): typeof BaseNPC => {
  const map: Record<string, typeof BaseNPC> = {
    _knight: KnightNPC,
    caron_alive: SubspaceNPC,
    caron_dead: SubspaceNPC,
    //
    portal: PortalNPC,
    vending_machine: VendingMachineNPC,
    elevator: ElevatorNPC,

    //b1
    death: DeathNPC,
    echo: EchoNPC,
    marco: MarcoNPC,
    dr_zed: ZedNPC,

    //b2
    ratty: RattyNPC,

    //b3
    apostle: ApostleNPC,
    jax_seeker: JaxNPC,

    //b3.5
    maya_tech: MayaNPC,
    kane_leader: KaneNPC,

    //b4
    caron: CaronNPC,

    //b5
    adrian: AdrianNPC,
    flint: FlintNPC,
    julian: JulianNPC,
    oliver: OliverNPC,

    kael: KaelNPC,
    vesper: VesperNPC,

    //b6
    dax_looter: DaxNPC,
    elias_survivor: EliasNPC,
    hansen_mechanic: HansenNPC,
    mika_operator: MikaNPC,
    vora_observer: VoraNPC,
    silas_dissector: SilasNPC,
    shadowed_agent: ShadowedNPC
  }

  return map[id] || BaseNPC
}

