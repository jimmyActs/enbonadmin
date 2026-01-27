import type { Employee } from '../api/employees'
import { useI18n } from 'vue-i18n'

/**
 * 获取员工在当前语言环境下的展示姓名
 * 规则：
 * - 如果填写了中英文名：
 *   - 中文界面显示 chineseName
 *   - 英文界面显示 englishName
 * - 如果只填了其中一个，则两个语言都用已填写的那个
 * - 如果都没填，则退回 nickname（账号真实姓名）
 */
export const useEmployeeDisplayName = () => {
  const { locale } = useI18n()

  const getDisplayName = (employee: Pick<Employee, 'nickname' | 'chineseName' | 'englishName'>): string => {
    const zh = (employee.chineseName || '').trim()
    const en = (employee.englishName || '').trim()
    const nickname = employee.nickname || ''

    if (locale.value.startsWith('zh')) {
      // 中文环境优先中文名，其次英文名，最后昵称
      return zh || en || nickname
    } else {
      // 非中文环境优先英文名，其次中文名，最后昵称
      return en || zh || nickname
    }
  }

  return {
    getEmployeeDisplayName: getDisplayName,
  }
}


