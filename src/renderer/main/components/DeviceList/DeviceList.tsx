import { observer } from 'mobx-react-lite'
import isEmpty from 'licia/isEmpty'
import store from '../../store'
import Style from './DeviceList.module.scss'
import { t } from 'common/util'

export default observer(function DeviceList() {
  if (isEmpty(store.devices)) {
    return null
  }

  const disconnect = (deviceId: string) => {
    const [host, port] = deviceId.split(':')
    main.disconnectDevice(host, port ? parseInt(port, 10) : undefined)
  }

  return (
    <div className={Style.container}>
      {store.devices.map((device) => (
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
      ))}
    </div>
  )
})
