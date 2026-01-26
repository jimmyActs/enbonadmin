/**
 * 通用搜索工具函数
 * 用于各个模块的域内搜索功能
 */

/**
 * 通用搜索过滤函数
 * @param items 要搜索的数据数组
 * @param searchText 搜索文本
 * @param searchFields 要搜索的字段数组（支持嵌套字段，如 'user.name'）
 * @returns 过滤后的数据数组
 */
export function filterBySearch<T extends Record<string, any>>(
  items: T[],
  searchText: string,
  searchFields: string[]
): T[] {
  if (!searchText || !searchText.trim()) {
    return items
  }

  const search = searchText.toLowerCase().trim()
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = getNestedValue(item, field)
      if (value === null || value === undefined) {
        return false
      }
      return String(value).toLowerCase().includes(search)
    })
  })
}

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径，支持点号分隔的嵌套路径，如 'user.name'
 * @returns 值
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

/**
 * 通用筛选函数（精确匹配）
 * @param items 要筛选的数据数组
 * @param field 要筛选的字段
 * @param value 筛选值（为空或null时不过滤）
 * @returns 过滤后的数据数组
 */
export function filterByField<T extends Record<string, any>>(
  items: T[],
  field: string,
  value: any
): T[] {
  if (!value || value === '') {
    return items
  }

  return items.filter(item => {
    const itemValue = getNestedValue(item, field)
    return itemValue === value
  })
}

/**
 * 通用多条件筛选函数
 * @param items 要筛选的数据数组
 * @param filters 筛选条件对象，格式：{ field: value }
 * @returns 过滤后的数据数组
 */
export function filterByMultipleFields<T extends Record<string, any>>(
  items: T[],
  filters: Record<string, any>
): T[] {
  let result = [...items]

  Object.entries(filters).forEach(([field, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      result = filterByField(result, field, value)
    }
  })

  return result
}

/**
 * 组合搜索和筛选
 * @param items 要处理的数据数组
 * @param searchText 搜索文本
 * @param searchFields 要搜索的字段数组
 * @param filters 筛选条件对象
 * @returns 过滤后的数据数组
 */
export function filterData<T extends Record<string, any>>(
  items: T[],
  searchText: string,
  searchFields: string[],
  filters?: Record<string, any>
): T[] {
  let result = [...items]

  // 先应用搜索
  if (searchText && searchText.trim()) {
    result = filterBySearch(result, searchText, searchFields)
  }

  // 再应用筛选
  if (filters) {
    result = filterByMultipleFields(result, filters)
  }

  return result
}

