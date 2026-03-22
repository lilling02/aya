import { observer } from 'mobx-react-lite'
import LunaToolbar, {
  LunaToolbarText,
  LunaToolbarSpace,
  LunaToolbarButton,
} from 'luna-toolbar/react'
import ToolbarIcon from 'share/renderer/components/ToolbarIcon'
import { t } from 'common/util'
import { useEffect, useState, useRef } from 'react'
import store from '../../store'
import copy from 'licia/copy'
import { notify } from 'share/renderer/lib/util'
import CopyButton from 'share/renderer/components/CopyButton'

export default observer(function Remote() {
  const { device } = store
  const [code, setCode] = useState('')

  const webviewRef = useRef<any>(null)

  useEffect(() => {
    const webview = webviewRef.current
    if (webview) {
      const handleNewWindow = (e: any) => {
        webview.loadURL(e.url)
      }
      webview.addEventListener('new-window', handleNewWindow)
      return () => {
        webview.removeEventListener('new-window', handleNewWindow)
      }
    }
  }, [])

  useEffect(() => {
    if (device) {
      refresh()
    }
  }, [device])

  async function refresh() {
    if (webviewRef.current) {
      webviewRef.current.reload()
    }
    if (!device) return
    const c = await main.getDeviceCode(device.id)
    setCode(c)
  }

  return (
    <div className="panel-with-toolbar">
      <LunaToolbar className="panel-toolbar">
        <LunaToolbarText text={t('deviceCode') + ': ' + (code || '')} />
        <LunaToolbarButton
          onClick={() => {}}
          disabled={!code}
        >
          <CopyButton
            className="toolbar-icon"
            onClick={() => {
              copy(code)
              notify(t('copied'))
            }}
          />
        </LunaToolbarButton>
        <LunaToolbarSpace />
        <ToolbarIcon
          icon="refresh"
          title={t('refresh')}
          onClick={refresh}
          disabled={!device}
        />
      </LunaToolbar>
      <div className="panel-body">
        {/* @ts-ignore */}
        <webview
          ref={webviewRef}
          src={`http://ast.mark.satrace.cn/organization/manufacturers/device_remote_url.aspx?d=${encodeURIComponent(code)}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
})
