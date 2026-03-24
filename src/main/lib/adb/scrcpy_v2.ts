import fs from 'fs-extra'
import path from 'node:path'
import { dialog } from 'electron'
import { getScreencastStore, getSettingsStore } from '../store'
import log from 'share/common/log'
import { IpcStartScrcpyV2, IpcSelectScrcpyPath } from 'common/types'
import { handleEvent } from 'share/main/lib/util'
import { spawn } from 'node:child_process'
import { getAdbPath } from './base'

const logger = log('scrcpy_v2')
const settingsStore = getSettingsStore()
const screencastStore = getScreencastStore()

const SETTING_KEY = 'scrcpyPath'

// 导出函数，供外部调用重选路径
export async function selectScrcpyPath(): Promise<string | null> {
  return await getScrcpyPath(true)
}

// 获取当前保存的路径
export function getCurrentScrcpyPath(): string | null {
  return settingsStore.get(SETTING_KEY) || null
}

async function getScrcpyPath(forceSelect = false): Promise<string | null> {
  // 1. Check configuration (skip if forceSelect is true)
  if (!forceSelect) {
    const configPath = settingsStore.get(SETTING_KEY)
    if (configPath && (await fs.pathExists(configPath))) {
      return configPath
    }
  }

  // 2. Ask user to select
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select scrcpy.exe',
    filters: [{ name: 'Executables', extensions: ['exe'] }],
    properties: ['openFile'],
  })

  if (canceled || filePaths.length === 0) {
    return null
  }

  const selectedPath = filePaths[0]
  const fileName = path.basename(selectedPath).toLowerCase()

  // 3. Simple validation
  if (fileName !== 'scrcpy.exe') {
    dialog.showErrorBox(
      'Invalid File',
      'Please select the "scrcpy.exe" file.'
    )
    return null
  }

  // 4. Save configuration
  settingsStore.set(SETTING_KEY, selectedPath)
  return selectedPath
}

const startScrcpyV2: IpcStartScrcpyV2 = async function (deviceId) {
  try {
    const scrcpyPath = await getScrcpyPath()
    if (!scrcpyPath) {
      logger.warn('No scrcpy path selected')
      return
    }

    logger.info(`Starting scrcpy v2 for device: ${deviceId}`)
    logger.info(`Path: ${scrcpyPath}`)

    const screencastSettings = screencastStore.get('settings') || {}
    const deviceSettings = screencastSettings[deviceId] || {}

    const args = ['-s', deviceId]

    const maxSize = Number(deviceSettings.maxSize) || 0
    if (maxSize > 0) {
      args.push('--max-size', String(maxSize))
    }

    const maxFps = Number(deviceSettings.maxFps) || 0
    if (maxFps > 0) {
      args.push('--max-fps', String(maxFps))
    }

    const videoCodec = deviceSettings.videoCodec
    if (videoCodec === 'h264' || videoCodec === 'h265' || videoCodec === 'av1') {
      args.push('--video-codec', videoCodec)
    }

    logger.info(`Args: ${args.join(' ')}`)

    // Inherit environment variables and set ADB path if needed
    // LinkAndroid sets ADB env var, we might need to do the same if scrcpy is standalone
    // But usually scrcpy looks for adb in PATH or same dir. 
    // Let's try to be helpful and set ADB path if we know it.
    
    const env = { ...process.env }
    
    // Check if adb exists in the same directory as scrcpy
    const scrcpyDir = path.dirname(scrcpyPath)
    const bundledAdbPath = path.join(scrcpyDir, 'adb.exe')
    
    if (await fs.pathExists(bundledAdbPath)) {
      env.ADB = bundledAdbPath
      logger.info(`Using bundled ADB: ${bundledAdbPath}`)
    } else {
      // Fallback to system/aya ADB
      const adbPath = getAdbPath()
      if (adbPath && (await fs.pathExists(adbPath))) {
          env.ADB = adbPath
          logger.info(`Using Aya ADB: ${adbPath}`)
      } else {
         logger.warn(`ADB not found in scrcpy dir or Aya resources. Scrcpy might fail if adb is not in PATH.`)
         // Do NOT set env.ADB to a non-existent path, as that causes "CreateProcessW() error 2"
      }
    }

    const child = spawn(scrcpyPath, args, {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env
    })

    let output = ''
    
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const str = data.toString()
        output += str
        logger.info(`stdout: ${str}`)
      })
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const str = data.toString()
        output += str
        logger.error(`stderr: ${str}`)
      })
    }

    child.on('error', (err) => {
      logger.error('Failed to spawn scrcpy:', err)
      dialog.showErrorBox('Execution Error', `Failed to start scrcpy:\n${err.message}`)
    })

    child.on('close', async (code) => {
      logger.info(`scrcpy exited with code ${code}`)
      // 只记录错误，不再弹窗强制让用户重选路径
      if (code !== 0 && code !== null) {
        logger.error(`Scrcpy failed with code ${code}. Output: ${output || 'No output'}`)
        // 可以发送事件给 renderer 提示用户，但不再强制弹窗
      }
    })

  } catch (e: any) {
    logger.error('Error in startScrcpyV2:', e)
    dialog.showErrorBox('Error', `An unexpected error occurred:\n${e.message}`)
  }
}

export function init() {

  handleEvent('startScrcpyV2', startScrcpyV2)
  handleEvent('selectScrcpyPath', selectScrcpyPath)
}
