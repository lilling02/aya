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
  constructor() {
    makeObservable(this, {
      language: observable,
      theme: observable,
      adbPath: observable,
      killAdbWhenExit: observable,
      useNativeTitlebar: observable,
      autoAddDbSuffix: observable,
      commonFilePaths: observable,
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
