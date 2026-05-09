import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import LunaModal from 'luna-modal'
import { t } from 'common/util'
import { workspaceStore } from '../../../store/workspace'
import mainStore from '../../../store'
import MiniPanel from '../MiniPanel/MiniPanel'
import Style from './FileExtraction.module.scss'
import className from 'licia/className'
import { notify } from 'share/renderer/lib/util'
import {
  colorBgContainerDark,
  colorTextDark,
  colorBgContainer,
  colorText,
  colorTextSecondaryDark,
  colorTextSecondary,
} from 'common/theme'

export default observer(function FileExtraction() {
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [pullPath, setPullPath] = useState('/sdcard/ast-os/files/databases/mytime.db')

  const devices = Array.from(workspaceStore.devices.values())
  const activeDevice = activeDeviceId
    ? workspaceStore.devices.get(activeDeviceId)
    : null

  const handleMiniPanelClick = (deviceId: string) => {
    setActiveDeviceId(deviceId)
  }

  const handleAddFavorite = async () => {
    const name = await LunaModal.prompt(t('enterPathName'), t('commonDatabase'))
    if (name && pullPath.trim()) {
      const newFavorites = [...mainStore.settings.commonFilePaths, { name, path: pullPath.trim() }]
      mainStore.settings.set('commonFilePaths', newFavorites)
    }
  }

  const handleRemoveFavorite = (index: number) => {
    const newFavorites = [...mainStore.settings.commonFilePaths]
    newFavorites.splice(index, 1)
    mainStore.settings.set('commonFilePaths', newFavorites)
  }

  const handlePullFile = async () => {
    if (!activeDevice || !pullPath.trim()) return

    try {
      // 1. 获取静默下载目录
      const downloadDir = await main.getDownloadsPath()
      const fileName = pullPath.split('/').pop() || `file_${Date.now()}.db`
      // 2. 构造本地完整路径 (使用 window.node.path 如果可用，或者简单的字符串拼接)
      // 由于我们已经在 main 中处理了下载目录，我们只需要拼接文件名
      // 这里假设是 Windows 环境 (根据 ADDITIONAL_METADATA)
      const localPath = `${downloadDir}\\${fileName}`

      await main.pullFile(activeDevice.id, pullPath.trim(), localPath)
      notify(`文件提取成功并存入下载目录: ${fileName}`, { icon: 'success' })
    } catch (err: any) {
      console.error('提取文件失败:', err)
      notify(`提取失败: ${err.message || err}`, { icon: 'error' })
    }
  }

  const isDark = mainStore.settings.theme === 'dark'
  const terminalBg = isDark ? colorBgContainerDark : colorBgContainer
  const sidebarBg = isDark ? colorBgContainerDark : colorBgContainer
  const sidebarText = isDark ? colorTextDark : colorText
  const sidebarTextSecondary = isDark
    ? colorTextSecondaryDark
    : colorTextSecondary

  return (
    <div className={Style.fileExtraction}>
      <div className={Style.contentArea}>
        <div className={Style.mainPanel}>
          <div
            className={Style.mainHeader}
            style={{ backgroundColor: terminalBg, color: sidebarText }}
          >
            {activeDevice ? (
              <>
                <span
                  className={className(
                    Style.statusDot,
                    activeDevice.isOnline ? Style.online : Style.offline,
                  )}
                />
                <span className={Style.deviceName}>{activeDevice.id} {activeDevice.name ? `(${activeDevice.name})` : ''}</span>
              </>
            ) : (
              <span className={Style.noDevice}>{t('noDeviceSelected')}</span>
            )}
          </div>
          
          <div className={Style.toolArea} style={{ backgroundColor: terminalBg }}>
            <div className={Style.pullFileSection}>
              <div className={Style.sectionTitle} style={{ color: sidebarText }}>{t('fileExtraction')}</div>
              <div className={Style.sectionDesc} style={{ color: sidebarTextSecondary }}>
                {t('fileExtractionDesc')}
              </div>
              
              {/* 常用路径区域 */}
              <div className={Style.favoritesSection}>
                <div className={Style.favoritesHeader}>
                  <span className={Style.favoritesTitle} style={{ color: sidebarTextSecondary }}>{t('commonPath')}</span>
                  <button className={Style.addFavoriteBtn} onClick={handleAddFavorite} title={t('addPathToCommon')}>
                    + {t('saveCurrentPath')}
                  </button>
                </div>
                <div className={Style.favoritesList}>
                  {mainStore.settings.commonFilePaths.map((item, index) => (
                    <div key={index} className={Style.favoriteItem} onClick={() => setPullPath(item.path)}>
                      <span className={Style.favoriteName}>{item.name}</span>
                      <span className={Style.favoriteDelete} onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(index);
                      }}>×</span>
                    </div>
                  ))}
                  {mainStore.settings.commonFilePaths.length === 0 && (
                    <span className={Style.emptyFavorites} style={{ color: sidebarTextSecondary }}>{t('noCommonPaths')}</span>
                  )}
                </div>
              </div>

              <div className={Style.inputRow}>
                <input
                  type="text"
                  className={Style.pathInput}
                  value={pullPath}
                  onChange={(e) => setPullPath(e.target.value)}
                  placeholder={t('enterPathPlaceholder')}
                />
                <button
                  type="button"
                  className={Style.pullBtn}
                  onClick={handlePullFile}
                  disabled={!activeDevice || !pullPath.trim()}
                >
                  {t('startExtraction')}
                </button>
                <button
                  type="button"
                  className={Style.openDirBtn}
                  onClick={() => main.openDownloadsFolder()}
                >
                  {t('openDownloadDir')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={Style.sidebar}
          style={{ backgroundColor: sidebarBg, color: sidebarText }}
        >
          <div className={Style.sidebarHeader}>
            <div className={Style.headerLeft}>
              <span>{t('deviceList')}</span>
              <span className={Style.deviceCount}>{devices.length}</span>
            </div>
          </div>
          <div className={Style.deviceList}>
            {devices.length > 0 ? (
              devices.map((device) => (
                <MiniPanel
                  key={device.id}
                  device={device}
                  output={[]}
                  selected={activeDeviceId === device.id}
                  onClick={handleMiniPanelClick}
                  onSelect={handleMiniPanelClick}
                />
              ))
            ) : (
              <div className={Style.emptyDeviceList}>{t('noDevices')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
