import LunaToolbar, {
  LunaToolbarSelect,
  LunaToolbarSeparator,
} from 'luna-toolbar/react'
import types from 'licia/types'
import Style from './Device.module.scss'
import { observer } from 'mobx-react-lite'
import isEmpty from 'licia/isEmpty'
import store from '../../store'
import { t } from 'common/util'
import each from 'licia/each'
import ToolbarIcon from 'share/renderer/components/ToolbarIcon'
import ScrcpyV2SettingsModal from './ScrcpyV2SettingsModal'
import { useState } from 'react'

export default observer(function Device() {
  const [scrcpyV2ModalVisible, setScrcpyV2ModalVisible] = useState(false)

  let deviceOptions: types.PlainObj<string> = {}
  let deviceDisabled = false
  if (!isEmpty(store.devices)) {
    deviceOptions = {}
    each(store.devices, (device) => {
      deviceOptions[`${device.name} (${device.id})`] = device.id
    })
  } else {
    deviceOptions[t('deviceNotConnected')] = ''
    deviceDisabled = true
  }

  async function handleScrcpyV2Confirm(settings: { maxSize: number; maxFps: number; videoCodec: string }) {
    if (!store.device) return

    // 保存设置到 screencastStore
    const deviceSettings = await main.getScreencastStore('settings') || {}
    deviceSettings[store.device.id] = {
      ...deviceSettings[store.device.id],
      ...settings,
    }
    await main.setScreencastStore('settings', deviceSettings)

    // 启动投屏V2
    if (main.startScrcpyV2) {
      main.startScrcpyV2(store.device.id).catch((e: any) => {
        console.error('Failed to start scrcpy v2', e)
        alert(`启动失败: ${e.message}`)
      })
    }
  }

  return (
    <>
      <ScrcpyV2SettingsModal
        visible={scrcpyV2ModalVisible}
        deviceId={store.device?.id || ''}
        onClose={() => setScrcpyV2ModalVisible(false)}
        onConfirm={handleScrcpyV2Confirm}
      />
      <LunaToolbar
        className={Style.container}
        onChange={(key, val) => {
          if (key === 'device') {
            store.selectDevice(val)
          }
        }}
      >
        <LunaToolbarSelect
          keyName="device"
          disabled={deviceDisabled}
          value={store.device ? store.device.id : ''}
          options={deviceOptions}
        />
        <ToolbarIcon
          icon="manage"
          title={t('deviceManager')}
          onClick={() => main.showDevices()}
        />
        <LunaToolbarSeparator />
        <ToolbarIcon
          icon="screencast"
          disabled={!store.device}
          title={t('screencast')}
          onClick={() => main.showScreencast()}
        />
        <ToolbarIcon
          icon="external-link"
          disabled={!store.device}
          title="Screencast V2"
          onClick={() => {
            if (store.device) {
              console.log('Clicked Screencast V2', store.device.id)
              setScrcpyV2ModalVisible(true)
            }
          }}
        />
      </LunaToolbar>
    </>
  )
})
