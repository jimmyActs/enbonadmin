<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('workspace.materialApplication.title')"
    width="800px"
    :close-on-click-modal="false"
    class="material-application-dialog"
    @close="handleClose"
  >
    <!-- 自定义标题区 -->
    <div class="dialog-header">
      <div class="header-icon">📦</div>
      <div class="header-texts">
        <h3 class="title">{{ $t('workspace.materialApplication.title') }}</h3>
        <p class="subtitle">{{ $t('workspace.quickCards.materialDesc') }}</p>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <div class="form-grid">
        <el-form-item :label="$t('workspace.materialApplication.materialName')" prop="materialName">
          <el-input
            v-model="form.materialName"
            :placeholder="$t('workspace.materialApplication.materialNamePlaceholder')"
            maxlength="100"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.materialApplication.category')" prop="category">
          <el-select
            v-model="form.category"
            :placeholder="$t('workspace.materialApplication.selectCategory')"
            style="width: 100%"
          >
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.materialApplication.quantity')" prop="quantity" class="quantity-item">
          <div class="quantity-row">
            <el-input-number
              v-model="form.quantity"
              :min="1"
              :max="10000"
            />
            <el-select v-model="form.unit" class="unit-select">
              <el-option label="个" value="个" />
              <el-option label="支" value="支" />
              <el-option label="本" value="本" />
              <el-option label="包" value="包" />
              <el-option label="箱" value="箱" />
              <el-option label="套" value="套" />
              <el-option label="张" value="张" />
              <el-option label="卷" value="卷" />
            </el-select>
          </div>
        </el-form-item>

        <el-form-item :label="$t('workspace.materialApplication.urgency')" prop="urgency">
          <el-radio-group v-model="form.urgency" class="urgency-group">
            <el-radio-button value="normal">{{ $t('workspace.materialApplication.urgencyNormal') }}</el-radio-button>
            <el-radio-button value="urgent">{{ $t('workspace.materialApplication.urgencyUrgent') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('workspace.materialApplication.expectedDate')">
          <el-date-picker
            v-model="form.expectedDate"
            type="date"
            :placeholder="$t('workspace.materialApplication.selectDate')"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.materialApplication.reason')" prop="reason" class="full-row">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="4"
            :placeholder="$t('workspace.materialApplication.reasonPlaceholder')"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.materialApplication.remarks')" class="full-row">
          <el-input
            v-model="form.remarks"
            type="textarea"
            :rows="3"
            :placeholder="$t('workspace.materialApplication.remarksPlaceholder')"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button class="btn-plain" @click="handleClose">{{ $t('common.cancel') }}</el-button>
      <el-button class="btn-primary" type="primary" @click="handleSubmit" :loading="submitting">
        {{ $t('common.submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { createMaterialApplication } from '../../api/material-applications'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submitted': []
}>()

const { t } = useI18n()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const categories = [
  '办公用品',
  '电子设备',
  '耗材',
  '清洁用品',
  '其他'
]

const form = reactive({
  materialName: '',
  category: '',
  quantity: 1,
  unit: '个',
  urgency: 'normal' as 'normal' | 'urgent',
  reason: '',
  expectedDate: '',
  remarks: ''
})

const rules: FormRules = {
  materialName: [
    { required: true, message: t('workspace.materialApplication.materialNameRequired'), trigger: 'blur' }
  ],
  category: [
    { required: true, message: t('workspace.materialApplication.categoryRequired'), trigger: 'change' }
  ],
  quantity: [
    { required: true, message: t('workspace.materialApplication.quantityRequired'), trigger: 'blur' },
    { type: 'number', min: 1, message: t('workspace.materialApplication.quantityMin'), trigger: 'blur' }
  ],
  reason: [
    { required: true, message: t('workspace.materialApplication.reasonRequired'), trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    await createMaterialApplication({
      materialName: form.materialName,
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      urgency: form.urgency,
      reason: form.reason,
      expectedDate: form.expectedDate || undefined,
      remarks: form.remarks || undefined
    })

    ElMessage.success(t('workspace.materialApplication.submitSuccess'))
    emit('submitted')
    handleClose()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error?.response?.data?.message || error?.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  // 重置表单
  form.materialName = ''
  form.category = ''
  form.quantity = 1
  form.unit = '个'
  form.urgency = 'normal'
  form.reason = ''
  form.expectedDate = ''
  form.remarks = ''
}
</script>


<style scoped lang="scss">
.material-application-dialog {
  :deep(.el-dialog) {
    border-radius: 20px;
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 4px 16px 4px;
    .header-icon {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      flex-shrink: 0;
    }
    .title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.01em;
    }
    .subtitle {
      margin: 2px 0 0 0;
      color: #86868b;
      font-size: 12px;
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 24px;

    .full-row {
      grid-column: 1 / -1;
    }
    .quantity-item .quantity-row {
      display: flex;
      align-items: center;
      gap: 12px;
      .unit-select { width: 120px; }
    }
  }

  :deep(.el-form-item__label) {
    color: #1d1d1f;
    font-weight: 600;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    border-color: #e5e5e7;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  :deep(.el-textarea__inner) {
    border-radius: 12px;
    border-color: #e5e5e7;
  }
  :deep(.el-radio-button__inner) {
    border-radius: 10px !important;
    padding: 8px 16px;
  }

  .btn-plain {
    border-radius: 10px;
  }
  .btn-primary {
    border-radius: 10px;
    box-shadow: 0 6px 16px rgba(0,122,255,0.25);
  }
}
</style>

