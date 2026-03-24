import { useState, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import ScreenshotOverview from '../../../workspace/components/ScreenshotOverview/ScreenshotOverview'
import CommandLine from '../../../workspace/components/CommandLine/CommandLine'
import Style from './Workbench.module.scss'
import className from 'licia/className'
import { t } from 'common/util'
import { workspaceStore } from '../../../workspace/store'

type WorkbenchMode = 'screenshot' | 'cmd'

export default observer(function Workbench() {
  const [mode, setMode] = useState<WorkbenchMode>('screenshot')
  const [previewDeviceId, setPreviewDeviceId] = useState<string | null>(null)

  // 刷新设备列表
  const handleRefreshDevices = useCallback(() => {
    workspaceStore.syncDevices()
  }, [])

  const handleOpenPreview = (deviceId: string) => {
    setPreviewDeviceId(deviceId)
  }

  const handleClosePreview = () => {
    setPreviewDeviceId(null)
  }

  // 获取预览设备的截图
  const previewDevice = previewDeviceId ? workspaceStore.devices.get(previewDeviceId) : null

  return (
    <div className={Style.container}>
      <div className={Style.header}>
        <div className={Style.tabs}>
          <button
            className={className(Style.tab, mode === 'screenshot' ? Style.active : '')}
            onClick={() => setMode('screenshot')}
          >
            {t('screenshotOverview')}
          </button>
          <button
            className={className(Style.tab, mode === 'cmd' ? Style.active : '')}
            onClick={() => setMode('cmd')}
          >
            {t('commandLine')}
          </button>
        </div>
        <button
          className={Style.refreshBtn}
          onClick={handleRefreshDevices}
        >
          ↻ {t('refresh')}
        </button>
      </div>
      <div className={Style.content}>
        {mode === 'screenshot' ? (
          <ScreenshotOverview onOpenPreview={handleOpenPreview} />
        ) : (
          <CommandLine />
        )}
      </div>

      {/* 截图预览弹窗 */}
      {previewDeviceId && previewDevice && (
        <div className={Style.previewOverlay} onClick={handleClosePreview}>
          <div className={Style.previewModal} onClick={e => e.stopPropagation()}>
            <div className={Style.previewHeader}>
              <span>{previewDevice.name}</span>
              <button className={Style.closeBtn} onClick={handleClosePreview}>×</button>
            </div>
            <div className={Style.previewContent}>
              {previewDevice.screenshot ? (
                <img src={previewDevice.screenshot} alt="设备截图" />
              ) : (
                <div className={Style.noScreenshot}>暂无截图</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
