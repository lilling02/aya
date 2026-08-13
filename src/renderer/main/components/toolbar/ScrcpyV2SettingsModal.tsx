import LunaModal from 'luna-modal/react'
import LunaSetting, {
  LunaSettingSelect,
  LunaSettingButton,
  LunaSettingTitle,
} from 'luna-setting/react'
import { t } from 'common/util'
import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import toStr from 'licia/toStr'
import toNum from 'licia/toNum'
import SettingPath from 'share/renderer/components/SettingPath'

interface ScrcpyV2Settings {
  maxSize: number
  maxFps: number
  videoCodec: string
  windowWidth?: number
  windowHeight?: number
}

interface Props {
  visible: boolean
  deviceId: string
  onClose: () => void
  onConfirm: (settings: ScrcpyV2Settings) => void
}

// 投屏 V2 参数设置弹窗组件，负责配置抓帧分辨率、帧率、编码格式以及投屏初始窗口宽高
export default function ScrcpyV2SettingsModal(props: Props) {
  const { visible, deviceId, onClose, onConfirm } = props
  const [scrcpyPath, setScrcpyPath] = useState('')
  const [settings, setSettings] = useState<ScrcpyV2Settings>({
    maxSize: 0,
    maxFps: 0,
    videoCodec: 'h264',
    windowWidth: 0,
    windowHeight: 0,
  })

  useEffect(() => {
    if (visible && deviceId) {
      // 加载当前设备已保存的投屏设置参数，包括帧率、捕获分辨率和窗口显示分辨率
      main.getScreencastStore('settings').then((deviceSettings: any) => {
        if (deviceSettings && deviceSettings[deviceId]) {
          setSettings({
            maxSize: deviceSettings[deviceId].maxSize || 0,
            maxFps: deviceSettings[deviceId].maxFps || 0,
            videoCodec: deviceSettings[deviceId].videoCodec || 'h264',
            windowWidth: deviceSettings[deviceId].windowWidth || 0,
            windowHeight: deviceSettings[deviceId].windowHeight || 0,
          })
        }
      })
    }
  }, [visible, deviceId])

  // 加载 scrcpy 路径（每次打开时从 mainStore 读取）
  useEffect(() => {
    if (visible) {
      main.getMainStore('scrcpyPath').then((path: string) => {
        setScrcpyPath(path || '')
      })
    }
  }, [visible])

  function handleChange(key: string, val: any) {
    if (
      key === 'maxSize' ||
      key === 'maxFps' ||
      key === 'windowWidth' ||
      key === 'windowHeight'
    ) {
      val = toNum(val)
    }
    setSettings((prev) => ({ ...prev, [key]: val }))
  }

  function handlePathChange(val: string) {
    setScrcpyPath(val)
    main.setMainStore('scrcpyPath', val)
  }

  function handleConfirm() {
    onConfirm(settings)
    onClose()
  }

  return createPortal(
    <LunaModal
      title="Screencast V2"
      width={400}
      visible={visible}
      onClose={onClose}
    >
      <LunaSetting onChange={handleChange}>
        <LunaSettingTitle title={t('scrcpyPath')} />
        <SettingPath
          title=""
          value={scrcpyPath}
          onChange={handlePathChange}
          options={{
            properties: ['openFile'],
            filters: [{ name: 'Executables', extensions: ['exe'] }],
          }}
        />
        <LunaSettingTitle title={t('screencastParam')} />
        <LunaSettingSelect
          keyName="maxSize"
          value={toStr(settings.maxSize)}
          title={t('maxSize')}
          options={{
            640: '640',
            720: '720',
            1080: '1080',
            1280: '1280',
            1920: '1920',
            [t('actualSize')]: '0',
          }}
        />
        <LunaSettingSelect
          keyName="windowWidth"
          value={toStr(settings.windowWidth || 0)}
          title={t('windowWidth')}
          options={{
            [t('unlimited')]: '0',
            640: '640',
            800: '800',
            1080: '1080',
            1280: '1280',
            1600: '1600',
            1920: '1920',
          }}
        />
        <LunaSettingSelect
          keyName="windowHeight"
          value={toStr(settings.windowHeight || 0)}
          title={t('windowHeight')}
          options={{
            [t('unlimited')]: '0',
            600: '600',
            800: '800',
            900: '900',
            1080: '1080',
            1200: '1200',
            1440: '1440',
          }}
        />
        <LunaSettingSelect
          keyName="maxFps"
          value={toStr(settings.maxFps)}
          title={t('maxFps')}
          options={{
            [t('unlimited')]: '0',
            30: '30',
            60: '60',
            90: '90',
            120: '120',
          }}
        />
        <LunaSettingSelect
          keyName="videoCodec"
          value={settings.videoCodec}
          title={t('videoCodec')}
          options={{
            h264: 'h264',
            h265: 'h265',
            av1: 'av1',
          }}
        />
        <LunaSettingButton
          title={t('confirm')}
          description={t('startScreencast')}
          onClick={handleConfirm}
        />
      </LunaSetting>
    </LunaModal>,
    document.body
  )
}
