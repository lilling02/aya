/**
 * 基于设备 ID 生成稳定的颜色值
 * 使用 HSL 色彩空间，确保颜色鲜艳
 */
export function generateDeviceColor(deviceId: string): string {
  // 简单的哈希算法，将字符串转为数值
  let hash = 0
  for (let i = 0; i < deviceId.length; i++) {
    hash = ((hash << 5) - hash) + deviceId.charCodeAt(i)
    hash = hash & hash // 转为 32 位整数
  }

  // 基于哈希值生成 HSL 颜色
  // H: 0-360（基于哈希）
  // S: 70%（高饱和度）
  // L: 50%（中等亮度）
  const h = Math.abs(hash % 360)
  return `hsl(${h}, 70%, 50%)`
}
