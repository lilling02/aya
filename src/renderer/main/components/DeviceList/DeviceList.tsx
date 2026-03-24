import { observer } from 'mobx-react-lite'
import isEmpty from 'licia/isEmpty'
import store from '../../store'
import Style from './DeviceList.module.scss'

export default observer(function DeviceList() {
  if (isEmpty(store.devices)) {
    return null
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
          <span className={Style.name}>{device.name}</span>
          <span className={Style.id}>({device.id})</span>
        </div>
      ))}
    </div>
  )
})
