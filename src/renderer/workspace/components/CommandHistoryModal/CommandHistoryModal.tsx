import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { workspaceStore, ICommandHistory } from '../../store'
import Style from './CommandHistoryModal.module.scss'
import className from 'licia/className'

interface Props {
  onClose: () => void
  onSelect: (command: string) => void
}

type Tab = 'history' | 'favorites'

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  return date.toLocaleDateString('zh-CN')
}

export default observer(function CommandHistoryModal({ onClose, onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('history')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingAlias, setEditingAlias] = useState('')

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleItemClick = (item: ICommandHistory) => {
    onSelect(item.command)
    onClose()
  }

  const handleFavoriteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    workspaceStore.toggleFavorite(id)
  }

  const handleEditClick = (e: React.MouseEvent, item: ICommandHistory) => {
    e.stopPropagation()
    setEditingId(item.id)
    setEditingAlias(item.alias || '')
  }

  const handleAliasSave = (id: string) => {
    workspaceStore.updateCommandAlias(id, editingAlias.trim())
    setEditingId(null)
    setEditingAlias('')
  }

  const handleAliasCancel = () => {
    setEditingId(null)
    setEditingAlias('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleAliasSave(id)
    } else if (e.key === 'Escape') {
      handleAliasCancel()
    }
  }

  const displayedHistory = activeTab === 'history'
    ? workspaceStore.commandHistory
    : workspaceStore.commandHistory.filter(item => item.isFavorite)

  return (
    <div className={Style.overlay} onClick={handleOverlayClick}>
      <div className={Style.content}>
        <div className={Style.header}>
          <div className={Style.tabs}>
            <button
              className={className(Style.tab, activeTab === 'history' ? Style.active : '')}
              onClick={() => setActiveTab('history')}
            >
              历史
            </button>
            <button
              className={className(Style.tab, activeTab === 'favorites' ? Style.active : '')}
              onClick={() => setActiveTab('favorites')}
            >
              收藏
            </button>
          </div>
          <button className={Style.closeBtn} onClick={onClose}>X</button>
        </div>
        <div className={Style.body}>
          {displayedHistory.length === 0 ? (
            <div className={Style.emptyState}>
              {activeTab === 'history' ? '暂无历史命令' : '暂无收藏命令'}
            </div>
          ) : (
            <div className={Style.list}>
              {displayedHistory.map(item => (
                <div
                  key={item.id}
                  className={Style.item}
                  onClick={() => handleItemClick(item)}
                >
                  <div className={Style.itemMain}>
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className={Style.aliasInput}
                        value={editingAlias}
                        onChange={e => setEditingAlias(e.target.value)}
                        onBlur={() => handleAliasSave(item.id)}
                        onKeyDown={e => handleKeyDown(e, item.id)}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className={Style.commandText}>
                        {item.alias || item.command}
                      </span>
                    )}
                    <span className={Style.timestamp}>
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <div className={Style.itemActions}>
                    <button
                      className={className(Style.actionBtn, Style.favoriteBtn, item.isFavorite ? Style.favorited : '')}
                      onClick={e => handleFavoriteClick(e, item.id)}
                      title={item.isFavorite ? '取消收藏' : '收藏'}
                    >
                      {item.isFavorite ? '★' : '☆'}
                    </button>
                    <button
                      className={className(Style.actionBtn, Style.editBtn)}
                      onClick={e => handleEditClick(e, item)}
                      title="设置别名"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
