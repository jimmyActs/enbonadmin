<template>
  <div class="memo-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Notebook /></el-icon>
            <span>{{ $t('workspace.memo.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
            {{ $t('workspace.memo.addMemo') }}
          </el-button>
        </div>
      </template>

      <!-- 分类筛选 -->
      <div class="memo-filters">
        <el-radio-group v-model="activeCategory" size="small">
          <el-radio-button value="all">{{ $t('workspace.memo.categories.all') }}</el-radio-button>
          <el-radio-button value="work">{{ $t('workspace.memo.categories.work') }}</el-radio-button>
          <el-radio-button value="daily">{{ $t('workspace.memo.categories.daily') }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 备忘录列表 -->
      <div class="memo-list">
        <div
          v-for="memo in filteredMemos"
          :key="memo.id"
          class="memo-item"
          :class="{ 'has-reminder': memo.reminderTime }"
        >
          <div class="memo-item-header">
            <div class="memo-category-badge" :class="`category-${memo.category}`">
              {{ memo.category === 'work' ? $t('workspace.memo.categories.work') : $t('workspace.memo.categories.daily') }}
            </div>
            <div class="memo-actions">
              <el-button
                type="text"
                size="small"
                :icon="Edit"
                @click="handleEdit(memo)"
              />
              <el-button
                type="text"
                size="small"
                :icon="Delete"
                @click="handleDelete(memo)"
              />
            </div>
          </div>
          
          <div class="memo-content">
            <h3 class="memo-title">{{ memo.title }}</h3>
            <p class="memo-text">{{ memo.content }}</p>
          </div>

          <div v-if="memo.reminderTime" class="memo-reminder">
            <el-icon><Bell /></el-icon>
            <span>{{ formatReminderTime(memo.reminderTime, memo.reminderType) }}</span>
          </div>

          <div v-if="memo.tags && memo.tags.length > 0" class="memo-tags">
            <el-tag
              v-for="tag in memo.tags"
              :key="tag"
              size="small"
              class="memo-tag"
            >
              {{ tag }}
            </el-tag>
          </div>

          <div class="memo-footer">
            <span class="memo-time">{{ formatDate(memo.createdAt) }}</span>
          </div>
        </div>

        <el-empty v-if="filteredMemos.length === 0" :description="$t('common.noData')" />
      </div>
    </el-card>

    <!-- 添加/编辑备忘录对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingMemo ? $t('workspace.memo.editMemo') : $t('workspace.memo.addMemo')"
      width="600px"
      :close-on-click-modal="false"
      class="memo-dialog"
    >
      <el-form
        ref="memoFormRef"
        :model="memoForm"
        :rules="memoRules"
        label-width="100px"
      >
        <el-form-item :label="$t('workspace.memo.category')" prop="category">
          <el-radio-group v-model="memoForm.category">
            <el-radio value="work">{{ $t('workspace.memo.categories.work') }}</el-radio>
            <el-radio value="daily">{{ $t('workspace.memo.categories.daily') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('workspace.memo.memoTitle')" prop="title">
          <el-input
            v-model="memoForm.title"
            :placeholder="$t('workspace.memo.titlePlaceholder')"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.memo.memoContent')" prop="content">
          <el-input
            v-model="memoForm.content"
            type="textarea"
            :rows="5"
            :placeholder="$t('workspace.memo.contentPlaceholder')"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.memo.reminder')">
          <el-switch
            v-model="memoForm.hasReminder"
            :active-text="$t('workspace.memo.enableReminder')"
          />
        </el-form-item>

        <template v-if="memoForm.hasReminder">
          <el-form-item :label="$t('workspace.memo.reminderType')" prop="reminderType">
            <el-select
              v-model="memoForm.reminderType"
              :placeholder="$t('workspace.memo.selectReminderType')"
              style="width: 100%"
            >
              <el-option
                :label="$t('workspace.memo.reminderTypes.once')"
                value="once"
              />
              <el-option
                :label="$t('workspace.memo.reminderTypes.daily')"
                value="daily"
              />
              <el-option
                :label="$t('workspace.memo.reminderTypes.weekly')"
                value="weekly"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="$t('workspace.memo.reminderTime')" prop="reminderTime">
            <el-date-picker
              v-model="memoForm.reminderTime"
              type="datetime"
              :placeholder="$t('workspace.memo.reminderTimePlaceholder')"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </el-form-item>
        </template>

        <el-form-item :label="$t('workspace.memo.tags')">
          <el-select
            v-model="memoForm.tags"
            multiple
            filterable
            allow-create
            :placeholder="$t('workspace.memo.tagsPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
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
import { ref, computed, onMounted } from 'vue' // 导入 ref/computed/onMounted
import { useI18n } from 'vue-i18n' // 导入国际化钩子
import { ElMessage, ElMessageBox } from 'element-plus' // 导入消息与确认框
import type { FormInstance, FormRules } from 'element-plus' // 导入表单类型
import { Notebook, Plus, Edit, Delete, Bell } from '@element-plus/icons-vue' // 导入图标
import { getMyMemos, createMemo, updateMemo, deleteMemo, type Memo, type CreateOrUpdateMemoDto } from '../../api/memos' // 导入备忘录 API 与类型

const { t } = useI18n()

const memoFormRef = ref<FormInstance>()
const showAddDialog = ref(false)
const editingMemo = ref<Memo | null>(null)
const saving = ref(false)
const activeCategory = ref<'all' | 'work' | 'daily'>('all')

// 备忘录列表（暂时使用模拟数据，后续连接后端）
const memos = ref<Memo[]>([]) // 备忘录列表（从后端加载）
const loading = ref(false) // 列表加载中状态

const memoForm = ref({
  category: 'work' as 'work' | 'daily',
  title: '',
  content: '',
  hasReminder: false,
  reminderType: 'once' as 'once' | 'daily' | 'weekly',
  reminderTime: '',
  tags: [] as string[],
})

const memoRules: FormRules = {
  title: [{ required: true, message: t('workspace.memo.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('workspace.memo.contentRequired'), trigger: 'blur' }],
  reminderTime: [
    {
      validator: (_rule, value, callback) => {
        if (memoForm.value.hasReminder && !value) {
          callback(new Error(t('workspace.memo.reminderTimeRequired')))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

const commonTags = ref(['打卡', '会议', '汇报', '工作', '日常', '重要', '紧急'])

// 过滤备忘录
const filteredMemos = computed(() => {
  if (activeCategory.value === 'all') {
    return memos.value
  }
  return memos.value.filter(memo => memo.category === activeCategory.value)
})

// 格式化提醒时间
const formatReminderTime = (time: string, type?: string): string => {
  if (type === 'daily') {
    return t('workspace.memo.reminderTypes.daily') + ' ' + new Date(time).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  if (type === 'weekly') {
    return t('workspace.memo.reminderTypes.weekly')
  }
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 从后端加载当前用户的备忘录
const loadMemos = async () => {
  loading.value = true // 开始加载
  try {
    const list = await getMyMemos() // 调用接口获取数据
    // 后端 tags 为 JSON 字符串，这里统一解析为数组
    memos.value = list.map(m => ({
      ...m, // 展开原数据
      tags: Array.isArray(m.tags)
        ? m.tags // 已经是数组直接用
        : m.tags
        ? (JSON.parse(m.tags as unknown as string) as string[]) // 字符串则 JSON 解析
        : [], // 否则为空数组
    })) // 结束 map
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error')) // 显示错误
  } finally {
    loading.value = false // 结束加载
  }
}

// 保存备忘录（创建或更新）
const handleSave = async () => {
  if (!memoFormRef.value) return // 若表单引用不存在直接返回

  try {
    await memoFormRef.value.validate() // 先做表单校验
    saving.value = true // 标记为保存中

    const payload: CreateOrUpdateMemoDto = { // 组装提交数据
      title: memoForm.value.title, // 标题
      content: memoForm.value.content, // 内容
      category: memoForm.value.category, // 分类
      reminderTime: memoForm.value.hasReminder ? memoForm.value.reminderTime || undefined : undefined, // 提醒时间
      reminderType: memoForm.value.hasReminder ? memoForm.value.reminderType : undefined, // 提醒类型
      tags: memoForm.value.tags, // 标签数组
    } // 结束 payload

    if (editingMemo.value) { // 如果是编辑
      await updateMemo(editingMemo.value.id, payload) // 调用更新接口
    } else { // 否则为新增
      await createMemo(payload) // 调用创建接口
    }

    await loadMemos() // 重新加载列表
    ElMessage.success(t('common.success')) // 提示成功
    handleCancel() // 重置表单并关闭弹窗
  } catch (error: any) {
    if (error !== false) { // error === false 表示校验失败
      ElMessage.error(error.message || t('common.error')) // 其他错误提示
    }
  } finally {
    saving.value = false // 无论成功失败都重置 loading
  }
}

// 编辑备忘录
const handleEdit = (memo: Memo) => {
  editingMemo.value = memo
  memoForm.value = {
    category: memo.category,
    title: memo.title,
    content: memo.content,
    hasReminder: !!memo.reminderTime,
    reminderType: memo.reminderType || 'once',
    reminderTime: memo.reminderTime || '',
    tags: memo.tags || [],
  }
  showAddDialog.value = true
}

// 删除备忘录
const handleDelete = async (memo: Memo) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.memo.deleteConfirm', { title: memo.title }),
      t('common.warning'),
      { type: 'warning' }
    )

    await deleteMemo(memo.id) // 调用后端删除接口
    await loadMemos() // 重新加载列表

    ElMessage.success(t('common.success')) // 提示成功
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 取消
const handleCancel = () => {
  showAddDialog.value = false
  editingMemo.value = null
  memoFormRef.value?.resetFields()
  memoForm.value = {
    category: 'work',
    title: '',
    content: '',
    hasReminder: false,
    reminderType: 'once',
    reminderTime: '',
    tags: [],
  }
}

onMounted(() => {
  loadMemos() // 组件挂载完成后加载当前用户的备忘录
})
</script>

<style scoped lang="scss">
.memo-module {
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

  .memo-filters {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f5f5f7;

    :deep(.el-radio-group) {
      display: flex;
      gap: 8px;

      .el-radio-button {
        margin-right: 0;
      }

      .el-radio-button__inner {
        border-radius: 8px;
        border: 1px solid #e5e5e7;
        padding: 8px 16px;
        font-weight: 500;
      }

      .el-radio-button__original-radio:checked + .el-radio-button__inner {
        background: #007aff;
        border-color: #007aff;
        color: #ffffff;
      }
    }
  }

  .memo-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;

    .memo-item {
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e5e5e7;
      border-radius: 16px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      &.has-reminder {
        border-left: 4px solid #007aff;
      }

      .memo-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;

        .memo-category-badge {
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;

          &.category-work {
            background: #e8f4ff;
            color: #007aff;
          }

          &.category-daily {
            background: #fff4e6;
            color: #ff9500;
          }
        }

        .memo-actions {
          display: flex;
          gap: 4px;
        }
      }

      .memo-content {
        margin-bottom: 12px;

        .memo-title {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 8px 0;
          letter-spacing: -0.01em;
        }

        .memo-text {
          font-size: 14px;
          color: #86868b;
          line-height: 1.6;
          margin: 0;
          word-break: break-word;
        }
      }

      .memo-reminder {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: #f5f5f7;
        border-radius: 8px;
        font-size: 12px;
        color: #007aff;
        margin-bottom: 12px;

        .el-icon {
          font-size: 14px;
        }
      }

      .memo-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;

        .memo-tag {
          border-radius: 6px;
        }
      }

      .memo-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid #f5f5f7;

        .memo-time {
          font-size: 12px;
          color: #86868b;
        }
      }
    }
  }
}

:deep(.memo-dialog) {
  .el-dialog {
    border-radius: 20px;
  }

  .el-form-item__label {
    color: #1d1d1f;
    font-weight: 500;
  }

  .el-input__wrapper,
  .el-textarea__inner {
    border-radius: 10px;
    border-color: #e5e5e7;
  }
}
</style>
