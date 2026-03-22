import LunaModal from 'luna-modal/react'
import { createPortal } from 'react-dom'
import { t } from 'common/util'
import Style from './PackageInfoModal.module.scss'
import defaultIcon from '../../../assets/default-icon.png'
import fileSize from 'licia/fileSize'
import md5 from 'licia/md5'
import convertBin from 'licia/convertBin'
import dateFormat from 'licia/dateFormat'
import { IModalProps } from 'share/common/types'
import { Copyable } from '../common/Copyable'
import { IPackageInfo } from 'common/types'
import { useEffect, useState } from 'react'
import store from '../../store'

interface IProps extends IModalProps {
  packageInfo: IPackageInfo
}

export default function PackageInfoModal(props: IProps) {
  const { packageInfo } = props
  const [icon, setIcon] = useState(defaultIcon)
  const [appSize, setAppSize] = useState(packageInfo.appSize)
  const [dataSize, setDataSize] = useState(packageInfo.dataSize)
  const [cacheSize, setCacheSize] = useState(packageInfo.cacheSize)
  
  useEffect(() => {
    setIcon(defaultIcon)
    setAppSize(packageInfo.appSize)
    setDataSize(packageInfo.dataSize)
    setCacheSize(packageInfo.cacheSize)
    
    if (props.visible) {
      main.getPackageDetail(store.device!.id, packageInfo.packageName).then((info: IPackageInfo) => {
        if (info.icon) {
          setIcon(info.icon)
        }
        setAppSize(info.appSize)
        setDataSize(info.dataSize)
        setCacheSize(info.cacheSize)
      })
    }
  }, [props.visible, packageInfo])

  const signature = packageInfo.signatures[0]

  return createPortal(
    <LunaModal
      title={t('packageInfo')}
      visible={props.visible}
      width={400}
      onClose={props.onClose}
    >
      <div className={Style.header}>
        <div className={Style.icon}>
          <img src={icon} />
        </div>
        <div className={Style.basic}>
          <div className={Style.label}>{packageInfo.label}</div>
          <Copyable className={Style.packageName}>
            {packageInfo.packageName}
          </Copyable>
          <Copyable className={Style.versionName}>
            {packageInfo.versionName}
          </Copyable>
        </div>
      </div>
      {item(t('sysPackage'), packageInfo.system ? t('yes') : t('no'))}
      {packageInfo.minSdkVersion &&
        item(t('minSdkVersion'), packageInfo.minSdkVersion)}
      {packageInfo.targetSdkVersion &&
        item(t('targetSdkVersion'), packageInfo.targetSdkVersion)}
      {item(
        t('firstInstallTime'),
        dateFormat(
          new Date(packageInfo.firstInstallTime),
          'yyyy-mm-dd HH:MM:ss'
        )
      )}
      {item(
        t('lastUpdateTime'),
        dateFormat(new Date(packageInfo.lastUpdateTime), 'yyyy-mm-dd HH:MM:ss')
      )}
      {item(t('apkSize'), fileSize(packageInfo.apkSize))}
      {item(t('appSize'), fileSize(appSize))}
      {item(t('dataSize'), fileSize(dataSize))}
      {item(t('cacheSize'), fileSize(cacheSize))}
      {signature &&
        item(t('signature') + ' MD5', md5(convertBin(signature, 'Unit8Array')))}
    </LunaModal>,
    document.body
  )
}

function item(title: string, value: string | number) {
  return (
    <div className={Style.item}>
      <span>{title}</span>
      <Copyable className={Style.value}>{value}</Copyable>
    </div>
  )
}
