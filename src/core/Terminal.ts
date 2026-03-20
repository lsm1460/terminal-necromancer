import { Renderer } from '../types'

export class Terminal {
  private static renderer: Renderer | null = null

  public static setRenderer(renderer: Renderer): void {
    this.renderer = renderer
  }

  public static log(message: string): void {
    this.renderer ? this.renderer.print(message) : console.log(message)
  }

  public static say(list: { name: string; hasQuest: boolean }[]): void {
    this.renderer ? this.renderer.say(list) : console.log(`${list.join(', ')}`)
  }

  public static update(message: string) {
    this.renderer ? this.renderer.update(message) : process.stdout.write(`\rmessage`)
  }

  public static clear(): void {
    this.renderer ? this.renderer.clear() : console.clear()
  }

  public static async select<T extends string>(
    message: string,
    choices: { name: string; message: string; disabled?: boolean }[],
    defaultValue?: string
  ): Promise<T> {
    if (!this.renderer) throw new Error('Renderer not initialized')
    return (await this.renderer.select(message, choices, defaultValue)) as T
  }

  public static async confirm(message: string): Promise<boolean> {
    if (!this.renderer) throw new Error('Renderer not initialized')
    return await this.renderer.confirm(message)
  }

  public static async prompt(message: string): Promise<void> {
    if (!this.renderer) throw new Error('Renderer not initialized')
    await this.renderer.prompt(message)
  }

  public static async multiselect(
    message: string,
    choices: { name: string; message: string }[],
    options?: { initial?: string[]; maxChoices?: number; validate?: (value: string[]) => string | true }
  ): Promise<string[]> {
    if (!this.renderer) throw new Error('Renderer not initialized')
    return await this.renderer.multiselect(message, choices, options)
  }
}
