import { Renderer } from '../types'

export class Logger {
  private static renderer: Renderer | null = null

  public static setRenderer(renderer: Renderer): void {
    this.renderer = renderer
  }

  public static log(message: string): void {
    if (this.renderer) {
      this.renderer.print(message)
    } else {
      // 레더러가 설정되기 전에는 일단 console.log로 출력하거나 무시할 수 있습니다.
      Logger.log(message)
    }
  }

  public static clear(): void {
    if (this.renderer) {
      this.renderer.clear()
    } else {
      console.clear()
    }
  }
}
