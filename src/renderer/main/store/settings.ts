import { action, makeObservable, observable, runInAction } from 'mobx'
import isUndef from 'licia/isUndef'

export class Settings {
  language = 'en-US'
  theme = 'light'
  adbPath = ''
  killAdbWhenExit = false
  useNativeTitlebar = false
  autoAddDbSuffix = false
  commonFilePaths: { name: string; path: string }[] = []
  
  // 常用设备数据结构定义，用于存放用户手动固定（Pin）的设备信息（包含设备ID和名称）。
  // 该列表通过主进程持久化存储至 settings.json 配置文件中。
  // 这样当常用设备处于离线状态时，前端仍能感知并渲染出灰色卡片以供用户一键重连。
  favoriteDevices: { id: string; name: string }[] = []
  constructor() {
    makeObservable(this, {
      language: observable,
      theme: observable,
      adbPath: observable,
      killAdbWhenExit: observable,
      useNativeTitlebar: observable,
      autoAddDbSuffix: observable,
      commonFilePaths: observable,
      favoriteDevices: observable,
      set: action,
    })

    this.init()
  }
  async init() {
    const names = [
      'language',
      'theme',
      'adbPath',
      'killAdbWhenExit',
      'useNativeTitlebar',
      'autoAddDbSuffix',
      'commonFilePaths',
      'favoriteDevices',
    ]
    for (let i = 0, len = names.length; i < len; i++) {
      const name = names[i]
      const val = await main.getSettingsStore(name)
      if (!isUndef(val)) {
        runInAction(() => (this[name] = val))
      }
    }
  }
  async set(name: string, val: any) {
    runInAction(() => {
      this[name] = val
    })
    await main.setSettingsStore(name, val)
  }
}
