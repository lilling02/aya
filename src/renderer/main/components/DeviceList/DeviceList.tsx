import { observer } from 'mobx-react-lite'
import isEmpty from 'licia/isEmpty'
import store from '../../store'
import Style from './DeviceList.module.scss'
import { t } from 'common/util'
import { notify } from 'share/renderer/lib/util'

// 本文件实现了主窗口最顶部设备列表（常用/在线设备快捷栏）的交互与渲染逻辑。
// 为提升高频设备连接的便捷性，我们新增了“常用设备固定与一键重连”功能。
// 核心逻辑包括：用户可通过点击设备卡片上的 Pin（图钉）图标将当前在线设备加入“常用设备列表”中，持久化保存于 settings 配置内；
// 系统会比对“当前在线设备”与“常用设备”，将在常用列表中但当前未在线的设备渲染在快捷栏末尾，并以半透明虚线框（灰色）标识为离线状态；
// 用户直接点击这类离线卡片时，程序将自动解析其网络地址与端口，发起快捷连接尝试，并在连接过程中与结果产生对应的全局通知提醒；
// 同时也保留了点击取消 Pin 以及断开网络设备的原有交互，从而大大简化多设备场景下的重连操作。
export default observer(function DeviceList() {
  const favoriteDevices = store.settings.favoriteDevices || []
  
  // 找出所有已固定但当前处于离线状态的设备列表
  const offlineFavorites = favoriteDevices.filter(
    (fav) => !store.devices.some((d) => d.id === fav.id)
  )

  // 如果当前没有任何在线设备，且也没有固定任何常用设备，则隐藏此顶部工具条
  if (isEmpty(store.devices) && isEmpty(offlineFavorites)) {
    return null
  }

  // 断开指定网络设备的连接
  const disconnect = (deviceId: string) => {
    const [host, port] = deviceId.split(':')
    main.disconnectDevice(host, port ? parseInt(port, 10) : undefined)
  }

  // 切换常用设备的 Pin/固定状态
  const toggleFavorite = (id: string, name: string) => {
    const list = [...favoriteDevices]
    const idx = list.findIndex((d) => d.id === id)
    if (idx > -1) {
      list.splice(idx, 1)
    } else {
      list.push({ id, name })
    }
    store.settings.set('favoriteDevices', list)
  }

  // 针对离线常用设备触发一键连接逻辑
  const connect = async (id: string, name: string) => {
    // 若不是包含 ":" 的网络设备，说明是物理 USB 设备，提示用户手动插入
    if (!id.includes(':')) {
      notify('USB 设备请插入电脑进行连接', { icon: 'error' })
      return
    }
    notify(t('connectingDevice', { name }), { icon: 'info' })
    const [host, portStr] = id.split(':')
    const port = portStr ? parseInt(portStr, 10) : undefined
    try {
      if (port) {
        await main.connectDevice(host, port)
      } else {
        await main.connectDevice(host)
      }
      notify(t('connectDeviceSuccess', { name }), { icon: 'success' })
    } catch {
      notify(t('connectDeviceFailed', { name }), { icon: 'error' })
    }
  }

  return (
    <div className={Style.container}>
      {/* 渲染当前在线的所有设备 */}
      {store.devices.map((device) => {
        const isPinned = favoriteDevices.some((d) => d.id === device.id)
        return (
          <div
            key={device.id}
            className={`${Style.device} ${store.device?.id === device.id ? Style.active : ''}`}
            onClick={() => store.selectDevice(device.id)}
            title={`${device.name} (${device.id})`}
          >
            <span className={Style.dot} />
            <span className={Style.name} style={device.color ? { color: device.color } : undefined}>
              {device.name}
            </span>
            <span className={Style.id}>({device.id})</span>
            
            {/* 固定为常用设备的 Pin 按钮 */}
            <span
              className={`${Style.pin} ${isPinned ? Style.pinned : ''}`}
              title={isPinned ? t('unpinDevice') : t('pinDevice')}
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(device.id, device.name)
              }}
            >
              <i className="icon-pin" />
            </span>

            {device.id.includes(':') && (
              <span
                className={Style.close}
                title={t('disconnect')}
                onClick={(e) => {
                  e.stopPropagation()
                  disconnect(device.id)
                }}
              >
                <i className="icon-disconnect" />
              </span>
            )}
          </div>
        )
      })}

      {/* 渲染常用但处于离线状态的设备，以灰色和虚线边框等样式做区分 */}
      {offlineFavorites.map((device) => (
        <div
          key={device.id}
          className={`${Style.device} ${Style.offline}`}
          onClick={() => connect(device.id, device.name)}
          title={`点击连接: ${device.name} (${device.id})`}
        >
          <span className={Style.dot} />
          <span className={Style.name}>
            {device.name}
          </span>
          <span className={Style.id}>({device.id})</span>

          {/* 离线设备的取消固定 Pin 按钮 */}
          <span
            className={`${Style.pin} ${Style.pinned}`}
            title={t('unpinDevice')}
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(device.id, device.name)
            }}
          >
            <i className="icon-pin" />
          </span>
        </div>
      ))}
    </div>
  )
})

