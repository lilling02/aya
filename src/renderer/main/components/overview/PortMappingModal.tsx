import { t } from 'common/util'
import LunaModal from 'luna-modal/react'
import { observer } from 'mobx-react-lite'
import { createPortal } from 'react-dom'
import Style from './PortMappingModal.module.scss'
import LunaToolbar, {
  LunaToolbarButton,
  LunaToolbarInput,
  LunaToolbarSelect,
  LunaToolbarSpace,
} from 'luna-toolbar/react'
import LunaDataGrid from 'luna-data-grid/react'
import { useEffect, useRef, useState } from 'react'
import isStrBlank from 'licia/isStrBlank'
import store from '../../store'
import ToolbarIcon from 'share/renderer/components/ToolbarIcon'
import { IModalProps } from 'share/common/types'
import { notify } from 'share/renderer/lib/util'
import { normalizePort } from '../../lib/util'

// 端口映射历史记录
interface PortMappingHistory {
  local: string
  remote: string
}

const MAX_HISTORY = 10 // 最多保存 10 条历史

export default observer(function PortMappingModal(props: IModalProps) {
  const portForwarding = useRef(true)
  const [local, setLocal] = useState('')
  const [remote, setRemote] = useState('')
  const [data, setData] = useState<
    {
      local: string
      remote: string
    }[]
  >([])
  const [history, setHistory] = useState<PortMappingHistory[]>([])
  const [selectedRow, setSelectedRow] = useState<{
    local: string
    remote: string
  } | null>(null)

  // 加载历史记录
  async function loadHistory() {
    try {
      const saved = await main.getMainStore('portMappingHistory')
      if (Array.isArray(saved)) {
        setHistory(saved)
      }
    } catch {
      // ignore
    }
  }

  // 保存历史记录
  async function saveHistory(newHistory: PortMappingHistory[]) {
    const trimmed = newHistory.slice(0, MAX_HISTORY)
    await main.setMainStore('portMappingHistory', trimmed)
    setHistory(trimmed)
  }

  // 添加到历史记录
  async function addToHistory(localPort: string, remotePort: string) {
    const newEntry = { local: localPort, remote: remotePort }
    // 过滤掉重复项（相同的 local+remote）
    const filtered = history.filter(
      (h) => !(h.local === localPort && h.remote === remotePort),
    )
    await saveHistory([newEntry, ...filtered])
  }

  useEffect(() => {
    refresh()
    loadHistory()
  }, [])

  async function refresh() {
    setSelectedRow(null) // 清空选中
    if (!store.device) {
      setData([])
    } else if (portForwarding.current) {
      setData(await main.listForwards(store.device.id))
    } else {
      setData(await main.listReverses(store.device.id))
    }
  }

  // 断开选中的端口映射
  async function killSelected() {
    if (!store.device || !selectedRow) {
      return
    }
    try {
      if (portForwarding.current) {
        await main.killForward(store.device.id, selectedRow.local)
      } else {
        await main.killReverse(store.device.id, selectedRow.local)
      }
      refresh()
    } catch {
      notify(t('commonErr'), { icon: 'error' })
    }
  }

  return createPortal(
    <LunaModal
      title={t('portMapping')}
      visible={props.visible}
      onClose={props.onClose}
    >
      <div className={Style.container}>
        <LunaToolbar className={Style.toolbar}>
          <LunaToolbarSelect
            keyName="portForwarding"
            onChange={(val) => {
              portForwarding.current = val === 'forward'
              refresh()
            }}
            value={portForwarding.current ? 'forward' : 'reverse'}
            options={{
              [t('portForwarding')]: 'forward',
              [t('portReversing')]: 'reverse',
            }}
          />
          <LunaToolbarInput
            keyName="local"
            className={Style.local}
            value={local}
            placeholder={t('local')}
            onChange={(val) => setLocal(val)}
          />
          <LunaToolbarInput
            keyName="remote"
            className={Style.remote}
            value={remote}
            placeholder={t('remote')}
            onChange={(val) => setRemote(val)}
          />
          <LunaToolbarButton
            state="hover"
            disabled={isStrBlank(local) || isStrBlank(remote) || !store.device}
            onClick={async () => {
              if (!store.device) {
                return
              }
              const l = normalizePort(local)
              const r = normalizePort(remote)
              try {
                if (portForwarding.current) {
                  await main.forward(store.device.id, l, r)
                } else {
                  await main.reverse(store.device.id, r, l)
                }
                // 添加成功后保存到历史
                addToHistory(l, r)
              } catch {
                notify(t('commonErr'), { icon: 'error' })
                return
              }
              refresh()
            }}
          >
            {t('add')}
          </LunaToolbarButton>
          <LunaToolbarSpace />
          <ToolbarIcon
            icon="refresh"
            title={t('refresh')}
            onClick={refresh}
            disabled={!store.device}
          />
          <ToolbarIcon
            icon="delete"
            title={t('delete') || '断开'}
            onClick={killSelected}
            disabled={!store.device || !selectedRow}
          />
        </LunaToolbar>
        {/* 历史常用端口快速填充 */}
        {history.length > 0 && (
          <div className={Style.history}>
            <span className={Style.historyLabel}>{t('commonPorts')}:</span>
            {history.map((h, idx) => (
              <button
                key={idx}
                className={Style.historyChip}
                onClick={() => {
                  setLocal(h.local)
                  setRemote(h.remote)
                }}
              >
                {h.local} → {h.remote}
              </button>
            ))}
          </div>
        )}
        <LunaDataGrid
          className={Style.grid}
          data={data}
          minHeight={250}
          maxHeight={250}
          selectable={true}
          columns={columns}
          onSelect={(rows) => {
            setSelectedRow(rows.length > 0 ? rows[0] : null)
          }}
        />
      </div>
    </LunaModal>,
    document.body,
  )
})

const columns = [
  {
    id: 'local',
    title: t('local'),
    sortable: true,
  },
  {
    id: 'remote',
    title: t('remote'),
    sortable: true,
  },
]
