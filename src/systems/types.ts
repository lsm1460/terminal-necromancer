import { GameContext } from "~/core/types";
import { NPCManager } from "./NpcManager";
import { Necromancer } from "./job/necromancer/Necromancer";

export type AppContext = GameContext<{
  player: Necromancer
  npcs: NPCManager
}>;