import { Renderer } from '../types'

export class Logger {
  private static renderer: Renderer | null = null

  public static setRenderer(renderer: Renderer): void {
    this.renderer = renderer
  }

  public static log(message: string): void {
    this.renderer ? this.renderer.print(message) : console.log(message)
  }

  public static clear(): void {
    this.renderer ? this.renderer.clear() : console.clear()
  }

  public static async select(message: string, choices: { name: string; message: string }[]): Promise<string> {
    if (!this.renderer) throw new Error("Renderer not initialized");
    return await this.renderer.select(message, choices);
  }

  public static async confirm(message: string): Promise<boolean> {
    if (!this.renderer) throw new Error("Renderer not initialized");
    return await this.renderer.confirm(message);
  }

  public static async prompt(message: string): Promise<void> {
    if (!this.renderer) throw new Error("Renderer not initialized");
    await this.renderer.prompt(message);
  }
}