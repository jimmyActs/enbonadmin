// 中文语言包 - 主入口
import common from './common'
import login from './login'
import layout from './layout'
import home from './home'
import files from './files'
import crm from './crm'
import finance from './finance'
import hr from './hr'
import sales from './sales'
import workflow from './workflow'
import workspace from './workspace'
import workgroup from './workgroup'
import employees from './employees'
import profile from './profile'

export default {
  common,
  login,
  layout,
  index: home, // 首页使用index作为key
  files,
  crm,
  finance,
  hr,
  sales,
  workflow,
  workspace,
  workgroup,
  employees,
  profile,
}
