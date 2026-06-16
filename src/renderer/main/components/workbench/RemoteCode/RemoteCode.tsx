import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { workspaceStore } from '../../../store/workspace'
import Style from './RemoteCode.module.scss'
import { t } from 'common/util'
import ToolbarIcon from 'share/renderer/components/ToolbarIcon'
import LunaModal from 'luna-modal'

interface IRemoteCode {
  code: string
  remark: string
}

export default observer(function RemoteCode() {
  const [remoteCodes, setRemoteCodes] = useState<IRemoteCode[]>([])
  const [deviceCodes, setDeviceCodes] = useState<Map<string, string>>(new Map())
  const selectedDevices = Array.from(workspaceStore.selectedDeviceIds).map(id => workspaceStore.devices.get(id)).filter(Boolean)

  const fetchRemoteCodes = async () => {
    const codes = await main.getMainStore('remoteCodes')
    setRemoteCodes(codes ? codes : [])
  }

  const fetchDeviceCodes = async () => {
    const newDeviceCodes = new Map<string, string>()
    for (const deviceId of workspaceStore.selectedDeviceIds) {
      try {
        const code = await main.getDeviceCode(deviceId)
        newDeviceCodes.set(deviceId, code)
      } catch (e) {
        console.error(`Failed to get code for ${deviceId}`, e)
      }
    }
    setDeviceCodes(newDeviceCodes)
  }

  useEffect(() => {
    fetchRemoteCodes()
    fetchDeviceCodes()
  }, [workspaceStore.selectedDeviceIds.size])

  const handleSaveCurrent = async (deviceId: string, code: string) => {
    if (!code) return
    const remark = await LunaModal.prompt(t('remark'), '')
    if (remark !== null) {
      const newCodes = [...remoteCodes, { code, remark }]
      await main.setMainStore('remoteCodes', newCodes)
      setRemoteCodes(newCodes)
    }
  }

  const handleAddCode = async () => {
    const code = await LunaModal.prompt(t('remoteCodePlaceholder'), '')
    if (code) {
      const remark = await LunaModal.prompt(t('remarkPlaceholder'), '')
      const newCodes = [...remoteCodes, { code, remark: remark || '' }]
      await main.setMainStore('remoteCodes', newCodes)
      setRemoteCodes(newCodes)
    }
  }

  const handleSwitchCode = async (code: string) => {
    if (workspaceStore.selectedDeviceIds.size === 0) return
    
    for (const deviceId of workspaceStore.selectedDeviceIds) {
      try {
        await main.setDeviceCode(deviceId, code)
      } catch (e) {
        console.error(`Failed to set code for ${deviceId}`, e)
      }
    }
    fetchDeviceCodes()
    LunaModal.alert(t('remoteCodeSwitched'))
  }

  const handleDeleteCode = async (index: number) => {
    const newCodes = [...remoteCodes]
    newCodes.splice(index, 1)
    await main.setMainStore('remoteCodes', newCodes)
    setRemoteCodes(newCodes)
  }

  return (
    <div className={Style.remoteCode}>
      <div className={Style.header}>
        <div className={Style.title}>{t('remoteCode')}</div>
        <button className={Style.addBtn} onClick={handleAddCode}>
          + {t('addRemoteCode')}
        </button>
      </div>

      <div className={Style.content}>
        <div className={Style.section}>
          <div className={Style.sectionTitle}>{t('currentDeviceCode')} ({selectedDevices.length})</div>
          <div className={Style.deviceList}>
            {selectedDevices.length > 0 ? (
              selectedDevices.map(device => (
                <div key={device!.id} className={Style.deviceItem}>
                  <div className={Style.deviceInfo}>
                    <span className={Style.deviceName}>{device!.name || device!.id}</span>
                    <span className={Style.deviceSerial}>{device!.id}</span>
                  </div>
                  <div className={Style.codeInfo}>
                    <span className={Style.code}>{deviceCodes.get(device!.id) || t('unknown')}</span>
                    <div className={Style.actions}>
                      <ToolbarIcon icon="refresh" onClick={fetchDeviceCodes} />
                      <button 
                        className={Style.miniBtn} 
                        disabled={!deviceCodes.get(device!.id)}
                        onClick={() => handleSaveCurrent(device!.id, deviceCodes.get(device!.id)!)}
                      >
                        {t('save')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={Style.empty}>{t('deviceNotSelected')}</div>
            )}
          </div>
        </div>

        <div className={Style.section}>
          <div className={Style.sectionTitle}>{t('savedRemoteCodes')}</div>
          <div className={Style.codeList}>
            {remoteCodes.length > 0 ? (
              remoteCodes.map((item, index) => (
                <div key={index} className={Style.codeItem}>
                  <div className={Style.info}>
                    <div className={Style.code}>{item.code}</div>
                    <div className={Style.remark}>{item.remark}</div>
                  </div>
                  <div className={Style.actions}>
                    <button 
                      className={Style.switchBtn}
                      disabled={selectedDevices.length === 0}
                      onClick={() => handleSwitchCode(item.code)}
                    >
                      {t('switch')}
                    </button>
                    <ToolbarIcon icon="delete" onClick={() => handleDeleteCode(index)} />
                  </div>
                </div>
              ))
            ) : (
              <div className={Style.empty}>{t('noBookmarks')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
