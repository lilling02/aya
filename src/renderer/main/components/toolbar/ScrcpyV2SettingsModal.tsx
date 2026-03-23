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
}

interface Props {
  visible: boolean
  deviceId: string
  onClose: () => void
  onConfirm: (settings: ScrcpyV2Settings) => void
}

export default function ScrcpyV2SettingsModal(props: Props) {
  const { visible, deviceId, onClose, onConfirm } = props
  const [scrcpyPath, setScrcpyPath] = useState('')
  const [settings, setSettings] = useState<ScrcpyV2Settings>({
    maxSize: 0,
    maxFps: 0,
    videoCodec: 'h264',
  })

  useEffect(() => {
    if (visible && deviceId) {
      // 加载当前保存的投屏参数设置
      main.getScreencastStore('settings').then((deviceSettings: any) => {
        if (deviceSettings && deviceSettings[deviceId]) {
          setSettings({
            maxSize: deviceSettings[deviceId].maxSize || 0,
            maxFps: deviceSettings[deviceId].maxFps || 0,
            videoCodec: deviceSettings[deviceId].videoCodec || 'h264',
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
    if (key === 'maxSize' || key === 'maxFps') {
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
