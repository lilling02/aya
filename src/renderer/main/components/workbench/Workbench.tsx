import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import ScreenshotOverview from '../../../workspace/components/ScreenshotOverview/ScreenshotOverview'
import CommandLine from '../../../workspace/components/CommandLine/CommandLine'
import Style from './Workbench.module.scss'
import className from 'licia/className'

type WorkbenchMode = 'screenshot' | 'cmd'

export default observer(function Workbench() {
  const [mode, setMode] = useState<WorkbenchMode>('screenshot')

  const handleOpenPreview = (deviceId: string) => {
    console.log('Open preview for device:', deviceId)
  }

  return (
    <div className={Style.container}>
      <div className={Style.header}>
        <div className={Style.tabs}>
          <button
            className={className(Style.tab, mode === 'screenshot' ? Style.active : '')}
            onClick={() => setMode('screenshot')}
          >
            截图总览
          </button>
          <button
            className={className(Style.tab, mode === 'cmd' ? Style.active : '')}
            onClick={() => setMode('cmd')}
          >
            命令行
          </button>
        </div>
      </div>
      <div className={Style.content}>
        {mode === 'screenshot' ? (
          <ScreenshotOverview onOpenPreview={handleOpenPreview} />
        ) : (
          <CommandLine />
        )}
      </div>
    </div>
  )
})
