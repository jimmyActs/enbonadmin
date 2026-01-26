<template>
  <div class="daily-work-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Calendar /></el-icon>
            <span>{{ $t('workspace.dailyWork.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" text @click="openReportDialog">
              {{ $t('workspace.dailyWork.reportToLeader') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
              {{ $t('workspace.dailyWork.addTask') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 日期选择 -->
      <div class="date-selector">
        <el-button :icon="ArrowLeft" circle @click="previousDay" />
        <el-date-picker
          v-model="selectedDate"
          type="date"
          :placeholder="$t('workspace.dailyWork.selectDate')"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="loadDailyWork"
        />
        <el-button :icon="ArrowRight" circle @click="nextDay" />
        <el-button type="text" @click="goToToday">
          {{ $t('workspace.dailyWork.today') }}
        </el-button>
      </div>

      <!-- 工作卡片 -->
      <div class="work-cards">
        <div
          v-for="work in dailyWorks"
          :key="work.id"
          class="work-card"
          :class="`priority-${work.priority}`"
        >
          <div class="work-card-header">
            <div class="work-date">
              <span class="date-label">{{ formatDate(work.date) }}</span>
              <el-tag
                :type="getStatusType(work.status)"
                size="small"
                class="status-tag"
              >
                {{ getStatusText(work.status) }}
              </el-tag>
            </div>
            <div class="work-actions">
              <el-button
                type="text"
                size="small"
                :icon="Edit"
                @click="handleEdit(work)"
              />
              <el-button
                type="text"
                size="small"
                :icon="Delete"
                @click="handleDelete(work)"
              />
            </div>
          </div>

          <div class="work-content">
            <h3 class="work-title">{{ work.title }}</h3>
            <p class="work-description">{{ work.description }}</p>
          </div>

          <div class="work-progress">
            <div class="progress-info">
              <span class="progress-label">{{ $t('workspace.dailyWork.completion') }}:</span>
              <span class="progress-value">{{ work.completion }}%</span>
            </div>
            <el-progress
              :percentage="work.completion"
              :color="getProgressColor(work.completion)"
              :stroke-width="8"
            />
          </div>

          <div v-if="work.incompleteItems && work.incompleteItems.length > 0" class="incomplete-items">
            <div class="incomplete-title">{{ $t('workspace.dailyWork.incompleteItems') }}:</div>
            <ul class="incomplete-list">
              <li v-for="(item, index) in work.incompleteItems" :key="index">
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="work-footer">
            <el-tag
              :type="getPriorityType(work.priority)"
              size="small"
              class="priority-tag"
            >
              {{ getPriorityText(work.priority) }}
            </el-tag>
            <span class="work-time">{{ formatTime(work.createdAt) }}</span>
          </div>
        </div>

        <el-empty v-if="dailyWorks.length === 0" :description="$t('common.noData')" />
      </div>
    </el-card>

    <!-- 添加/编辑工作对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingWork ? $t('workspace.dailyWork.editTask') : $t('workspace.dailyWork.addTask')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="workFormRef"
        :model="workForm"
        :rules="workRules"
        label-width="100px"
      >
        <el-form-item :label="$t('workspace.dailyWork.date')" prop="date">
          <el-date-picker
            v-model="workForm.date"
            type="date"
            :placeholder="$t('workspace.dailyWork.selectDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.dailyWork.taskTitle')" prop="title">
          <el-input
            v-model="workForm.title"
            :placeholder="$t('workspace.dailyWork.titlePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.dailyWork.description')">
          <el-input
            v-model="workForm.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('workspace.dailyWork.descriptionPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.dailyWork.priority')" prop="priority">
          <el-select
            v-model="workForm.priority"
            :placeholder="$t('workspace.dailyWork.selectPriority')"
            style="width: 100%"
          >
            <el-option
              :label="$t('workspace.dailyWork.priorities.high')"
              value="high"
            />
            <el-option
              :label="$t('workspace.dailyWork.priorities.medium')"
              value="medium"
            />
            <el-option
              :label="$t('workspace.dailyWork.priorities.low')"
              value="low"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.dailyWork.status')" prop="status">
          <el-select
            v-model="workForm.status"
            :placeholder="$t('workspace.dailyWork.selectStatus')"
            style="width: 100%"
          >
            <el-option
              :label="$t('workspace.dailyWork.statuses.todo')"
              value="todo"
            />
            <el-option
              :label="$t('workspace.dailyWork.statuses.doing')"
              value="doing"
            />
            <el-option
              :label="$t('workspace.dailyWork.statuses.done')"
              value="done"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.dailyWork.completion')">
          <el-slider
            v-model="workForm.completion"
            :min="0"
            :max="100"
            show-input
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.dailyWork.incompleteItems')">
          <el-input
            v-model="workForm.incompleteItemsText"
            type="textarea"
            :rows="3"
            :placeholder="$t('workspace.dailyWork.incompleteItemsPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancel">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue' // 导入 ref 和 onMounted
import { useI18n } from 'vue-i18n' // 导入国际化钩子
import { ElMessage, ElMessageBox } from 'element-plus' // 导入消息与确认框
import type { FormInstance, FormRules } from 'element-plus' // 导入表单类型
import { Calendar, Plus, Edit, Delete, ArrowLeft, ArrowRight } from '@element-plus/icons-vue' // 导入图标
import { // 导入每日工作 API 与类型
  getMyDailyWorks, // 获取每日工作列表 API
  createDailyWork, // 创建每日工作 API
  updateDailyWork, // 更新每日工作 API
  deleteDailyWork, // 删除每日工作 API
  type DailyWork, // 每日工作类型
  type CreateOrUpdateDailyWorkDto, // 创建 / 更新 DTO 类型
} from '../../api/daily-work' // 从 daily-work.ts 引入

const { t } = useI18n() // 使用国际化

const getTodayDate = (): string => new Date().toISOString().split('T')[0] ?? '' // 获取今天日期字符串

interface DailyWorkForm { // 表单数据类型
  date: string // 日期
  title: string // 标题
  description: string // 描述
  priority: DailyWork['priority'] // 优先级
  status: DailyWork['status'] // 状态
  completion: number // 完成度
  incompleteItemsText: string // 未完成事项多行文本
} // 结束 DailyWorkForm 定义

const workFormRef = ref<FormInstance>() // 表单实例引用
const showAddDialog = ref(false) // 控制添加/编辑弹窗显示
const editingWork = ref<DailyWork | null>(null) // 当前正在编辑的记录
const saving = ref(false) // 保存中状态
const loading = ref(false) // 列表加载中状态
const selectedDate = ref<string>(getTodayDate()) // 当前选中的日期

// 每日工作列表
const dailyWorks = ref<DailyWork[]>([]) // 每日工作列表

const workForm = ref<DailyWorkForm>({ // 表单初始值
  date: selectedDate.value, // 默认使用当前选中日期
  title: '', // 标题
  description: '', // 描述
  priority: 'medium', // 默认优先级
  status: 'todo', // 默认状态
  completion: 0, // 默认完成度
  incompleteItemsText: '', // 默认未完成事项为空
})

const workRules: FormRules = { // 表单校验规则
  date: [{ required: true, message: t('workspace.dailyWork.dateRequired'), trigger: 'change' }], // 日期必填
  title: [{ required: true, message: t('workspace.dailyWork.titleRequired'), trigger: 'blur' }], // 标题必填
  priority: [{ required: true, message: t('workspace.dailyWork.priorityRequired'), trigger: 'change' }], // 优先级必选
  status: [{ required: true, message: t('workspace.dailyWork.statusRequired'), trigger: 'change' }], // 状态必选
} // 结束校验规则

// 从后端加载每日工作
const loadDailyWork = async () => { // 加载指定日期的工作
  loading.value = true // 标记为加载中
  try { // 捕获异常
    const dateKey = selectedDate.value || getTodayDate() // 确定查询日期
    const list = await getMyDailyWorks(dateKey) // 调用接口获取列表
    dailyWorks.value = list // 赋值到本地列表
  } catch (error: any) { // 捕获错误
    if (import.meta.env.DEV) { // 开发环境输出日志
      console.warn('加载每日工作失败:', error) // 打印错误
    } // 结束判断
    ElMessage.error(error?.message || t('common.error')) // 弹出错误提示
    dailyWorks.value = [] // 置空列表
  } finally { // 无论成功失败
    loading.value = false // 结束加载状态
  } // 结束 finally
} // 结束 loadDailyWork

// 保存工作（创建或更新）
const handleSave = async () => { // 处理保存
  if (!workFormRef.value) return // 若表单引用不存在直接返回

  try { // 捕获异常
    await workFormRef.value.validate() // 执行表单校验
    saving.value = true // 标记保存中

    const incompleteItems = workForm.value.incompleteItemsText // 取未完成事项文本
      ? workForm.value.incompleteItemsText.split('\n').filter(item => item.trim()) // 按行拆分并过滤空行
      : [] // 否则为空数组

    const workDate = workForm.value.date || selectedDate.value // 确保使用表单中的日期

    const payload: CreateOrUpdateDailyWorkDto = { // 组装提交数据
      date: workDate, // 日期
      title: workForm.value.title, // 标题
      description: workForm.value.description, // 描述
      priority: workForm.value.priority, // 优先级
      status: workForm.value.status, // 状态
      completion: workForm.value.completion, // 完成度
      incompleteItems: incompleteItems.length ? incompleteItems : undefined, // 未完成事项
    } // 结束 payload

    if (editingWork.value) { // 如果是编辑模式
      await updateDailyWork(editingWork.value.id, payload) // 调用更新接口
    } else { // 否则为新增
      await createDailyWork(payload) // 调用创建接口
    } // 结束判断

    ElMessage.success(t('common.success')) // 弹出成功提示
    handleCancel() // 重置表单并关闭弹窗
    selectedDate.value = workDate // 将选中日期同步为表单日期
    await loadDailyWork() // 重新加载当前日期数据
  } catch (error: any) { // 捕获错误
    if (error !== false) { // error === false 表示校验失败
      ElMessage.error(error?.message || t('common.error')) // 其他错误提示
    } // 结束判断
  } finally { // 无论成功失败
    saving.value = false // 重置保存状态
  } // 结束 finally
} // 结束 handleSave

// 编辑工作
const handleEdit = (work: DailyWork) => { // 处理编辑
  editingWork.value = work // 记录当前编辑的工作
  workForm.value = { // 填充表单数据
    date: work.date, // 日期
    title: work.title, // 标题
    description: work.description || '', // 描述
    priority: work.priority, // 优先级
    status: work.status, // 状态
    completion: work.completion, // 完成度
    incompleteItemsText: work.incompleteItems?.join('\n') || '', // 未完成事项文本
  } // 结束赋值
  showAddDialog.value = true // 打开弹窗
} // 结束 handleEdit

// 删除工作
const handleDelete = async (work: DailyWork) => { // 处理删除
  try { // 捕获异常
    await ElMessageBox.confirm( // 弹出确认框
      t('workspace.dailyWork.deleteConfirm', { title: work.title }), // 确认文案
      t('common.warning'), // 标题
      { type: 'warning' }, // 类型
    ) // 结束确认

    await deleteDailyWork(work.id) // 调用删除接口
    ElMessage.success(t('common.success')) // 提示成功
    await loadDailyWork() // 重新加载当前日期数据
  } catch (error: any) { // 捕获错误
    if (error !== 'cancel') { // 用户取消不提示错误
      ElMessage.error(error?.message || t('common.error')) // 显示错误
    } // 结束判断
  } // 结束 catch
} // 结束 handleDelete

// 取消
const handleCancel = () => { // 处理取消
  showAddDialog.value = false // 关闭弹窗
  editingWork.value = null // 清空编辑记录
  workFormRef.value?.resetFields() // 重置表单校验
  workForm.value = { // 重置表单值
    date: selectedDate.value, // 使用当前选中日期
    title: '', // 标题
    description: '', // 描述
    priority: 'medium', // 优先级
    status: 'todo', // 状态
    completion: 0, // 完成度
    incompleteItemsText: '', // 未完成事项
  } // 结束表单重置
} // 结束 handleCancel

// 格式化日期
const formatDate = (dateStr: string): string => { // 将日期格式化为友好文案
  const date = new Date(dateStr) // 创建日期对象
  const today = new Date() // 今天日期
  const yesterday = new Date(today) // 昨天日期复制自今天
  yesterday.setDate(yesterday.getDate() - 1) // 昨天 = 今天 - 1 天
  
  if (date.toDateString() === today.toDateString()) { // 如果是今天
    return t('workspace.dailyWork.today') // 返回“今天”
  } // 结束判断
  if (date.toDateString() === yesterday.toDateString()) { // 如果是昨天
    return t('workspace.dailyWork.yesterday') // 返回“昨天”
  } // 结束判断
  
  return date.toLocaleDateString('zh-CN', { // 否则按固定格式输出
    month: '2-digit', // 月份两位
    day: '2-digit', // 日期两位
    weekday: 'short', // 星期简写
  }) // 结束 toLocaleDateString
} // 结束 formatDate

// 格式化时间
const formatTime = (dateStr: string): string => { // 将时间格式化为 HH:mm
  return new Date(dateStr).toLocaleTimeString('zh-CN', { // 使用本地时间格式
    hour: '2-digit', // 小时两位
    minute: '2-digit', // 分钟两位
  }) // 结束 toLocaleTimeString
} // 结束 formatTime

// 获取状态类型
const getStatusType = (status: string): string => { // 将业务状态映射为标签类型
  const map: Record<string, string> = { // 映射表
    todo: 'info', // 待办
    doing: 'warning', // 进行中
    done: 'success', // 已完成
  } // 结束 map
  return map[status] || 'info' // 返回对应类型或默认 info
} // 结束 getStatusType

// 获取状态文本
const getStatusText = (status: string): string => { // 获取状态国际化文案
  return t(`workspace.dailyWork.statuses.${status}`) // 返回对应 i18n 文案
} // 结束 getStatusText

// 获取优先级类型
const getPriorityType = (priority: string): string => { // 将优先级映射为标签类型
  const map: Record<string, string> = { // 映射表
    high: 'danger', // 高优先级
    medium: 'warning', // 中优先级
    low: 'info', // 低优先级
  } // 结束 map
  return map[priority] || 'info' // 返回对应类型或默认 info
} // 结束 getPriorityType

// 获取优先级文本
const getPriorityText = (priority: string): string => { // 获取优先级国际化文案
  return t(`workspace.dailyWork.priorities.${priority}`) // 返回对应 i18n 文案
} // 结束 getPriorityText

// 获取进度条颜色
const getProgressColor = (percentage: number): string => { // 根据完成度返回不同颜色
  if (percentage >= 80) return '#67c23a' // 大于等于 80 为绿色
  if (percentage >= 50) return '#e6a23c' // 大于等于 50 为橙色
  return '#f56c6c' // 否则为红色
} // 结束 getProgressColor

// 汇报给领导（占位，后续接入实际汇报 + 抄送逻辑）
const openReportDialog = () => { // 打开汇报对话框（当前为占位实现）
  ElMessage.info(t('common.featureComingSoon') || '汇报功能开发中，稍后为你接入“汇报给领导 + 抄送同事”'); // 提示功能即将上线
} // 结束 openReportDialog

// 前一天
const previousDay = () => { // 切换到前一天
  if (!selectedDate.value) return // 若当前没有选中日期直接返回
  const date = new Date(selectedDate.value) // 创建日期对象
  date.setDate(date.getDate() - 1) // 日期减 1 天
  const newDate = date.toISOString().split('T')[0] // 转换为 YYYY-MM-DD
  if (newDate) { // 如果转换成功
    selectedDate.value = newDate // 更新选中日期
    loadDailyWork() // 重新加载数据
  } // 结束判断
} // 结束 previousDay

// 后一天
const nextDay = () => { // 切换到后一天
  if (!selectedDate.value) return // 若当前没有选中日期直接返回
  const date = new Date(selectedDate.value) // 创建日期对象
  date.setDate(date.getDate() + 1) // 日期加 1 天
  const newDate = date.toISOString().split('T')[0] // 转换为 YYYY-MM-DD
  if (newDate) { // 如果转换成功
    selectedDate.value = newDate // 更新选中日期
    loadDailyWork() // 重新加载数据
  } // 结束判断
} // 结束 nextDay

// 回到今天
const goToToday = () => { // 切换到今天
  selectedDate.value = getTodayDate() // 更新为今天
  loadDailyWork() // 重新加载数据
} // 结束 goToToday

onMounted(() => { // 组件挂载时
  loadDailyWork() // 加载当前日期的每日工作
}) // 结束 onMounted
</script>

<style scoped lang="scss">
.daily-work-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      color: #1d1d1f;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }

  .date-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f5f5f7;

    :deep(.el-date-editor) {
      width: 200px;

      .el-input__wrapper {
        border-radius: 10px;
        border-color: #e5e5e7;
      }
    }

    .el-button {
      &.is-circle {
        width: 32px;
        height: 32px;
        padding: 0;
      }
    }
  }

  .work-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;

    .work-card {
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e5e5e7;
      border-radius: 16px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      &.priority-high {
        border-left: 4px solid #ff3b30;
      }

      &.priority-medium {
        border-left: 4px solid #ff9500;
      }

      &.priority-low {
        border-left: 4px solid #007aff;
      }

      .work-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;

        .work-date {
          display: flex;
          align-items: center;
          gap: 12px;

          .date-label {
            font-size: 16px;
            font-weight: 600;
            color: #1d1d1f;
          }
        }

        .work-actions {
          display: flex;
          gap: 4px;
        }
      }

      .work-content {
        margin-bottom: 16px;

        .work-title {
          font-size: 18px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 8px 0;
          letter-spacing: -0.01em;
        }

        .work-description {
          font-size: 14px;
          color: #86868b;
          line-height: 1.6;
          margin: 0;
        }
      }

      .work-progress {
        margin-bottom: 16px;
        padding: 12px;
        background: #f5f5f7;
        border-radius: 12px;

        .progress-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;

          .progress-label {
            color: #86868b;
          }

          .progress-value {
            color: #1d1d1f;
            font-weight: 600;
          }
        }

        :deep(.el-progress-bar__outer) {
          border-radius: 8px;
          background: #e5e5e7;
        }
      }

      .incomplete-items {
        margin-bottom: 16px;
        padding: 12px;
        background: #fff5f5;
        border-radius: 12px;

        .incomplete-title {
          font-size: 13px;
          font-weight: 600;
          color: #ff3b30;
          margin-bottom: 8px;
        }

        .incomplete-list {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          color: #86868b;

          li {
            margin-bottom: 4px;
            line-height: 1.5;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }

      .work-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 1px solid #f5f5f7;

        .work-time {
          font-size: 12px;
          color: #86868b;
        }
      }
    }
  }
}
</style>
