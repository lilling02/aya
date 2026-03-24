import { observer } from 'mobx-react-lite'
import LunaToolbar, { LunaToolbarSpace } from 'luna-toolbar/react'
import Term from './Term'
import LunaTab, { LunaTabItem } from 'luna-tab/react'
import { t } from 'common/util'
import ToolbarIcon from 'share/renderer/components/ToolbarIcon'
import store from '../../store'
import Style from './Shell.module.scss'
import className from 'licia/className'
import { useEffect, useRef, useState } from 'react'
import uuid from 'licia/uuid'
import map from 'licia/map'
import filter from 'licia/filter'
import LunaCommandPalette from 'luna-command-palette/react'
import find from 'licia/find'
import idxOf from 'licia/idxOf'
import truncate from 'licia/truncate'
import { Terminal } from '@xterm/xterm'

interface IShell {
  id: string
  name: string
  sessionId: string
  terminal?: Terminal
}

export default observer(function Shell() {
  const [shells, setShells] = useState<Array<IShell>>([])
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false)
  const [selectedShell, setSelectedShell] = useState<IShell>({
    id: '',
    name: '',
    sessionId: '',
  })
  const numRef = useRef(1)
  const { device } = store

  useEffect(() => add(), [])

  function add() {
    const id = uuid()
    const shell = {
      id,
      name: `${t('shell')} ${numRef.current++}`,
      sessionId: '',
    }
    setShells([...shells, shell])
    setSelectedShell(shell)
  }

  function close(id: string) {
    const closedShell = find(shells, (shell) => shell.id === id)
    let closedIdx = idxOf(shells, closedShell)
    const newShells = filter(shells, (shell) => shell.id !== id)
    setShells(newShells)

    if (closedShell === selectedShell) {
      if (closedIdx >= newShells.length) {
        closedIdx = newShells.length - 1
      }
      setSelectedShell(newShells[closedIdx])
    }
  }

  const tabItems = map(shells, (shell) => {
    return (
      <LunaTabItem
        key={shell.id}
        id={shell.id}
        title={shell.name}
        closable={true}
        selected={selectedShell.id === shell.id}
      />
    )
  })

  const terms = map(shells, (shell) => {
    return (
      <Term
        key={shell.id}
        onSessionIdChange={(id) => {
          shell.sessionId = id
        }}
        onCreate={(terminal) => {
          shell.terminal = terminal
        }}
        visible={selectedShell.id === shell.id && store.panel === 'shell'}
      />
    )
  })

  const commands = map(getCommands(), ([title, command]) => {
    return {
      title: `${title} (${truncate(command, 95 - title.length)})`,
      handler: () => {
        main.writeShell(selectedShell.sessionId, command)
        setTimeout(() => {
          if (selectedShell.terminal) {
            selectedShell.terminal.focus()
          }
        }, 500)
      },
    }
  })

  return (
    <div className="panel-with-toolbar">
      <div className={className('panel-toolbar', Style.toolbar)}>
        <LunaTab
          className={Style.tabs}
          height={31}
          onSelect={(id) => {
            const shell = find(shells, (shell) => shell.id === id)
            if (shell) {
              setSelectedShell(shell)
            }
          }}
          onClose={close}
        >
          {tabItems}
        </LunaTab>
        <LunaToolbar className={Style.control}>
          <ToolbarIcon
            icon="add"
            title={t('add')}
            onClick={add}
            disabled={!device}
          />
          <LunaToolbarSpace />
          <ToolbarIcon
            icon="list"
            title={t('shortcut')}
            onClick={() => setCommandPaletteVisible(true)}
            disabled={!device}
          />
        </LunaToolbar>
      </div>
      <div className="panel-body">
        {terms}
        <LunaCommandPalette
          placeholder={t('typeCmd')}
          visible={commandPaletteVisible}
          onClose={() => setCommandPaletteVisible(false)}
          commands={commands}
        />
      </div>
    </div>
  )
})

function getCommands() {
  const commands = [
    [
      '查看SDK版本',
      'cat /data/data/com.lkm.ad_cross/plugins/miniRun/version\necho ok\n',
    ],
    [
      '启动软件',
      'am start -n com.lkm.ad_cross/com.lkm.app_ados.LaunchActivity\necho ok\n',
    ],
    ['关闭软件', 'am force-stop com.lkm.ad_cross\necho ok\n'],
    [
      '调试数据库',
      'am broadcast -n  com.lkm.ad_cross/com.lkm.ast_main.MainConfigReceiver --es cmd debugDB --ei port 8082\necho ok\n',
    ],
    [
      '强制调试webview',
      'am start -n com.lkm.ad_cross/com.lkm.app_mini.ui.MiniLaunchActivity  --es   debugWeb "debugWeb"\necho ok\n',
    ],
    ['像素密度1080', 'wm density 240\necho ok\n'],
    ['卸载软件', 'pm uninstall com.lkm.ad_cross\necho\n'],
    [t('reboot'), 'reboot\n'],
    [t('rebootRecovery'), 'reboot recovery\n'],
    [t('rebootBootloader'), 'reboot bootloader\n'],
    [t('memInfo'), 'dumpsys meminfo\n'],
    [t('batteryInfo'), 'dumpsys battery\n'],
    [
      `${t('start')} shizuku`,
      'sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh\n',
    ],
  ]

  if (store.language === 'zh-CN') {
    commands.push([
      '授权 GKD',
      'pm grant li.songe.gkd android.permission.WRITE_SECURE_SETTINGS; appops set li.songe.gkd ACCESS_RESTRICTED_SETTINGS allow\n',
    ])
  }

  return commands
}
