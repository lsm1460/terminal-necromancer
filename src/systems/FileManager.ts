import { writeTextFile, readTextFile, exists, mkdir } from '@tauri-apps/plugin-fs'
import { appDataDir, join } from '@tauri-apps/api/path'

export class FileManager {
  private async getFilePath(fileName: string) {
    const appDataPath = await appDataDir()
    if (!(await exists(appDataPath))) {
      await mkdir(appDataPath, { recursive: true })
    }
    return await join(appDataPath, fileName)
  }

  async save(fileName: string, data: any) {
    const path = await this.getFilePath(fileName)
    await writeTextFile(path, JSON.stringify(data, null, 2))
  }

  async load(fileName: string) {
    const path = await this.getFilePath(fileName)
    if (await exists(path)) {
      const contents = await readTextFile(path)
      return JSON.parse(contents)
    }
    return null
  }
}
