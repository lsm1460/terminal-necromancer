// 하위 컴포넌트들
import { GameEngine } from '~/gameEngine'
import { BattleStage } from './battle/BattleStage'
import { ButtonList } from './ButtonList'
import { GameInput } from './GameInput'
import { LogWindow } from './LogWindow'
import { MiniMap } from './MiniMap'
import { StatusBar } from './StatusBar'

export const GameScreen: React.FC<{
  isGameOn: boolean
}> = ({ isGameOn }) => {
  return (
    <div
      className="relative grid h-dvh w-full bg-grey-800 text-primary overflow-hidden
      grid-cols-1 
      grid-rows-[auto_1fr_auto_auto_auto] 
      xl:grid-cols-[1fr_300px] xl:grid-rows-[auto_1fr_auto]
      [grid-template-areas:'status''window''map''input''buttons'] 
      xl:[grid-template-areas:'status_side''window_side''input_side']"
    >
      <div className="[grid-area:status]">
        <StatusBar />
      </div>

      <div className="[grid-area:window] relative flex flex-col overflow-hidden">
        <BattleStage />
        <LogWindow />
      </div>

      <div className="[grid-area:map] xl:[grid-area:side] flex flex-col relative">
        <MiniMap />
      </div>

      <div className="[grid-area:input]">{isGameOn && <GameInput />}</div>

      <div className="[grid-area:buttons] xl:[grid-area:side] flex flex-col relative xl:border-l border-primary/30">
        {isGameOn && <ButtonList />}
      </div>
    </div>
  )
}
