<template>
  <div class="workflow-container page-content-enter">
    <div class="page-header">
      <div class="title">
        <h1 class="page-title">{{ $t('workflow.title') }}</h1>
        <p class="subtitle">
          专属工作管家（AI）— 统计/做表/报价/建议（等待接入 DeepSeek 等 API）
        </p>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="MagicStick" @click="openConfig">
          配置 AI
        </el-button>
      </div>
    </div>

    <div class="grid">
      <el-card>
        <template #header>
          <div class="card-header">
            <el-icon><Cpu /></el-icon>
            <span>能力设想</span>
          </div>
        </template>
        <ul class="list">
          <li>客户来信/询盘：翻译 + 需求要点提炼</li>
          <li>报价：按产品/像素/尺寸/交期/运输方式生成报价表结构</li>
          <li>统计：按业务员/国家/产品线汇总本周询盘、报价、订单转化</li>
          <li>建议：跟进节奏、邮件模板、谈判要点、风险提示（回款/交期/条款）</li>
        </ul>
      </el-card>

      <el-card>
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>快捷任务（待接入）</span>
          </div>
        </template>
        <div class="task-grid">
          <el-button class="task" @click="comingSoon">生成报价单（Excel）</el-button>
          <el-button class="task" @click="comingSoon">生成报价邮件（中/英）</el-button>
          <el-button class="task" @click="comingSoon">翻译并总结客户来信</el-button>
          <el-button class="task" @click="comingSoon">本周销售统计一键汇总</el-button>
        </div>
        <el-alert
          title="当前仅为骨架页面：后续接入 DeepSeek / 内部知识库后即可启用以上能力。"
          type="info"
          show-icon
          :closable="false"
          class="hint"
        />
      </el-card>
    </div>

    <el-dialog v-model="showConfig" title="AI 配置（预留）" width="760px">
      <el-alert
        title="建议：后续将 API Key 存在服务端（加密/权限），前端只做开关与使用。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 12px;"
      />
      <el-form label-width="140px">
        <el-form-item label="提供商">
          <el-select v-model="provider" style="width: 100%">
            <el-option label="DeepSeek（计划）" value="deepseek" />
            <el-option label="其它（预留）" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Base URL">
          <el-input v-model="baseUrl" placeholder="例如：https://api.deepseek.com" />
        </el-form-item>
        <el-form-item label="API Key（建议服务端）">
          <el-input v-model="apiKey" placeholder="仅演示用，后续改为服务端托管" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConfig = false">关闭</el-button>
        <el-button type="primary" @click="saveConfig">保存（本地）</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Cpu, Document, MagicStick } from '@element-plus/icons-vue'

const showConfig = ref(false)
const provider = ref<'deepseek' | 'other'>('deepseek')
const baseUrl = ref('')
const apiKey = ref('')

const openConfig = () => {
  showConfig.value = true
  try {
    const saved = localStorage.getItem('aiConfig')
    if (saved) {
      const obj = JSON.parse(saved) as any
      provider.value = obj.provider || 'deepseek'
      baseUrl.value = obj.baseUrl || ''
      apiKey.value = obj.apiKey || ''
    }
  } catch {
    // ignore
  }
}

const saveConfig = () => {
  localStorage.setItem(
    'aiConfig',
    JSON.stringify({ provider: provider.value, baseUrl: baseUrl.value, apiKey: apiKey.value })
  )
  ElMessage.success('已保存（本地）')
  showConfig.value = false
}

const comingSoon = () => ElMessage.info('功能待接入 AI 后启用')
</script>

<style scoped lang="scss">
.workflow-container {
  padding: 24px;
  background: transparent;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.subtitle {
  margin-top: 8px;
  color: rgba(28, 28, 30, 0.62);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.list {
  padding-left: 18px;
  line-height: 1.8;
  color: rgba(28, 28, 30, 0.86);
}

.task-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.task {
  justify-content: flex-start;
}

.hint {
  border-radius: 14px;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>


