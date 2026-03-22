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

export default observer(function Device() {
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

  return (
    <>
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
          onClick={async () => {
             if (store.device) {
               console.log('Clicked Screencast V2', store.device.id)
               
               // 先尝试选择路径（如果没有保存的路径或路径无效）
               if (main.selectScrcpyPath) {
                 const path = await main.selectScrcpyPath()
                 if (!path) {
                   // 用户取消了选择
                   return
                 }
               }
               
               if (main.startScrcpyV2) {
                 main.startScrcpyV2(store.device.id).catch((e: any) => {
                   console.error('Failed to start scrcpy v2', e)
                   alert(`启动失败: ${e.message}`)
                 })
               } else {
                 alert('Error: Function not found. Please restart the app completely.')
               }
             }
           }}
        />
      </LunaToolbar>
    </>
  )
})
