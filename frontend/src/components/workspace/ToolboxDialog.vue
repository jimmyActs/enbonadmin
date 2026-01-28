<template>
  <el-dialog
    v-model="visible"
    :title="$t('workspace.tools.title')"
    width="960px"
    :close-on-click-modal="true"
    class="toolbox-dialog"
  >
    <div class="toolbox-layout">
      <!-- 左侧：小工具图标区 -->
      <div class="tool-list">
        <div
          v-for="tool in tools"
          :key="tool.key"
          class="tool-card"
          :class="{ active: activeTab === tool.key }"
          @click="activeTab = tool.key"
        >
          <div class="tool-card-icon">
            <el-icon><component :is="tool.icon" /></el-icon>
          </div>
          <div class="tool-card-text">
            <div class="tool-card-title">{{ tool.title }}</div>
            <div class="tool-card-desc">{{ tool.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：当前工具内容 -->
      <div class="tool-content">
        <!-- 计算器 -->
        <div v-if="activeTab === 'calc'" class="tool-panel calc-layout">
          <div class="calc-left">
            <div class="calc-display">
              <div class="display-expr" :title="expr">{{ expr || $t('workspace.tools.calcPlaceholder') }}</div>
              <div class="display-result">{{ resultText }}</div>
            </div>

            <div class="calc-keypad" @click="handleKeypadClick">
              <button class="key key-fn" data-key="C" type="button">C</button>
              <button class="key key-fn" data-key="CE" type="button">CE</button>
              <button class="key key-fn" data-key="Backspace" type="button" :title="$t('workspace.tools.backspace')">
                <el-icon><Back /></el-icon>
              </button>
              <button class="key key-op" data-key="/" type="button">÷</button>

              <button class="key key-fn" data-key="(" type="button">(</button>
              <button class="key key-fn" data-key=")" type="button">)</button>
              <button class="key key-fn" data-key="%" type="button">%</button>
              <button class="key key-op" data-key="*" type="button">×</button>

              <button class="key" data-key="7" type="button">7</button>
              <button class="key" data-key="8" type="button">8</button>
              <button class="key" data-key="9" type="button">9</button>
              <button class="key key-op" data-key="-" type="button">−</button>

              <button class="key" data-key="4" type="button">4</button>
              <button class="key" data-key="5" type="button">5</button>
              <button class="key" data-key="6" type="button">6</button>
              <button class="key key-op" data-key="+" type="button">+</button>

              <button class="key" data-key="1" type="button">1</button>
              <button class="key" data-key="2" type="button">2</button>
              <button class="key" data-key="3" type="button">3</button>
              <button class="key key-op key-eq" data-key="=" type="button">=</button>

              <button class="key key-fn" data-key="+/-" type="button">±</button>
              <button class="key" data-key="0" type="button">0</button>
              <button class="key" data-key="." type="button">.</button>
              <button class="key key-empty" type="button" disabled></button>
            </div>
          </div>

          <div class="calc-right">
            <div class="calc-actions">
              <el-button type="primary" @click="handleEval">{{ $t('workspace.tools.calc') }}</el-button>
              <el-button @click="handleClear">{{ $t('common.reset') }}</el-button>
            </div>

            <div class="calc-history" v-if="history.length">
              <div class="history-header">
                <span class="history-title">{{ $t('workspace.tools.history') }}</span>
                <el-button text @click="history = []">{{ $t('common.clear') || '清空' }}</el-button>
              </div>
              <div class="history-list">
                <div v-for="(item, idx) in history" :key="idx" class="history-item" @click="expr = item.expr">
                  <span class="history-expr">{{ item.expr }}</span>
                  <span class="history-eq">=</span>
                  <span class="history-val">{{ item.value }}</span>
                </div>
              </div>
            </div>

            <el-empty v-else :description="$t('workspace.tools.noHistory')" />
          </div>
        </div>

        <!-- 翻译工具 -->
        <div v-else-if="activeTab === 'translate'" class="tool-panel">
          <el-alert
            :title="$t('workspace.tools.translateHint')"
            type="info"
            show-icon
            :closable="false"
            class="hint"
          />

          <div class="translate-controls">
            <div class="lang-select">
              <span class="lang-label">{{ $t('workspace.tools.from') }}</span>
              <el-select v-model="fromLang" class="lang" filterable>
                <el-option v-for="opt in languageOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>

            <el-button class="swap" @click="swapLanguages" :title="$t('workspace.tools.swap')">
              <el-icon><Sort /></el-icon>
            </el-button>

            <div class="lang-select">
              <span class="lang-label">{{ $t('workspace.tools.to') }}</span>
              <el-select v-model="toLang" class="lang" filterable>
                <el-option v-for="opt in languageOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>

            <div class="translate-actions">
              <el-button type="primary" @click="translateWithAI">
                {{ $t('workspace.tools.aiTranslate') }}
              </el-button>
              <el-button @click="handleTranslateExternal('deepl')">
                {{ $t('workspace.tools.openDeepL') }}
              </el-button>
              <el-button @click="handleTranslateExternal('google')">
                {{ $t('workspace.tools.openGoogleTranslate') }}
              </el-button>
            </div>
          </div>

          <div class="translate-grid">
            <div class="col">
              <div class="col-title">{{ $t('workspace.tools.sourceText') }}</div>
              <el-input
                v-model="sourceText"
                type="textarea"
                :rows="7"
                :placeholder="$t('workspace.tools.translatePlaceholder')"
              />
              <div class="actions">
                <el-button @click="copyText(sourceText)">{{ $t('workspace.tools.copy') }}</el-button>
                <el-button @click="sourceText = ''">{{ $t('common.reset') }}</el-button>
              </div>
            </div>
            <div class="col">
              <div class="col-title">{{ $t('workspace.tools.translation') }}</div>
              <el-input v-model="translatedText" type="textarea" :rows="7" readonly />
              <div class="actions">
                <el-button @click="copyText(translatedText)">{{ $t('workspace.tools.copy') }}</el-button>
              </div>
            </div>
          </div>

          <el-divider />
          <div class="future">
            <div class="future-title">{{ $t('workspace.tools.futureTitle') }}</div>
            <div class="future-desc">{{ $t('workspace.tools.futureDesc') }}</div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Operation, ChatLineRound, Back, Sort } from '@element-plus/icons-vue'

const visible = defineModel<boolean>({ required: true })

const activeTab = ref<'calc' | 'translate'>('calc')

// 小工具配置（未来新增工具只需在这里追加配置即可）
const tools = computed(() => [
  {
    key: 'calc' as const,
    icon: Operation,
    title: '计算器',
    desc: '快速税率、汇率等日常运算',
  },
  {
    key: 'translate' as const,
    icon: ChatLineRound,
    title: '翻译助手',
    desc: '中英互译，跳转 DeepL / Google',
  },
])

// Calculator
const expr = ref('')
const result = ref<number | null>(null)
const error = ref<string | null>(null)
const history = ref<Array<{ expr: string; value: string }>>([])

const resultText = computed(() => {
  if (error.value) return error.value
  if (result.value === null) return '-'
  return String(result.value)
})

const sanitizeExpression = (input: string) => input.replace(/,/g, '.').trim()

const isSafeExpression = (input: string) => {
  // only numbers, spaces and basic operators
  return /^[0-9+\-*/().%\s]+$/.test(input)
}

const handleEval = () => {
  error.value = null
  const raw = sanitizeExpression(expr.value)
  if (!raw) {
    result.value = null
    return
  }
  if (!isSafeExpression(raw)) {
    result.value = null
    error.value = '表达式仅支持数字与 +-*/()%()'
    return
  }
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${raw})`)() as unknown
    const num = typeof val === 'number' && Number.isFinite(val) ? val : NaN
    if (!Number.isFinite(num)) throw new Error('NaN')
    result.value = num
    history.value.unshift({ expr: raw, value: String(num) })
    history.value = history.value.slice(0, 20)
  } catch {
    result.value = null
    error.value = '无法计算，请检查表达式'
  }
}

const handleClear = () => {
  expr.value = ''
  result.value = null
  error.value = null
}

const append = (text: string) => {
  expr.value = `${expr.value}${text}`
}

const backspace = () => {
  expr.value = expr.value.slice(0, -1)
}

const clearEntry = () => {
  // remove last number token
  const s = expr.value
  const m = s.match(/(\d+(\.\d*)?|\.\d+)\s*$/)
  if (m && m.index !== undefined) {
    expr.value = s.slice(0, m.index)
    return
  }
  // fallback: remove one char
  backspace()
}

const toggleSign = () => {
  const s = expr.value
  // if ends with (-number), unwrap to number
  const wrapped = s.match(/\(-(\d+(\.\d*)?|\.\d+)\)\s*$/)
  if (wrapped && wrapped.index !== undefined) {
    const numStr = wrapped[1] ?? ''
    expr.value = `${s.slice(0, wrapped.index)}${numStr}`
    return
  }

  // otherwise wrap trailing number
  const m = s.match(/(\d+(\.\d*)?|\.\d+)\s*$/)
  if (!m || m.index === undefined) return
  const numStr = m[1] ?? ''
  expr.value = `${s.slice(0, m.index)}(-${numStr})`
}

const safeEvalNumber = (raw: string): number | null => {
  if (!raw) return null
  if (!isSafeExpression(raw)) return null
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${raw})`)() as unknown
    const num = typeof val === 'number' && Number.isFinite(val) ? val : NaN
    if (!Number.isFinite(num)) return null
    return num
  } catch {
    return null
  }
}

const applyPercent = () => {
  const s = sanitizeExpression(expr.value)
  const m = s.match(/(\d+(\.\d*)?|\.\d+)\s*$/)
  if (!m || m.index === undefined) return
  const numStr = m[1] ?? ''
  const number = Number(numStr)
  if (!Number.isFinite(number)) return

  const left = s.slice(0, m.index)
  // find last operator in left part
  const opMatch = left.match(/([+\-*/])\s*$/)
  const op = opMatch?.[1]

  // Default behavior:
  // - if last op is + or -, percent is based on left expression value (base * p/100)
  // - if last op is * or / or none, percent is p/100
  let replacement = number / 100
  if (op === '+' || op === '-') {
    const baseExpr = left.replace(/([+\-*/])\s*$/, '').trim()
    const base = safeEvalNumber(baseExpr)
    if (base !== null) {
      replacement = base * (number / 100)
    }
  }

  expr.value = `${left}${replacement}`
}

const handleKey = (key: string) => {
  if (key === '=') {
    handleEval()
    return
  }
  if (key === 'C') {
    handleClear()
    return
  }
  if (key === 'CE') {
    clearEntry()
    return
  }
  if (key === '+/-') {
    toggleSign()
    return
  }
  if (key === 'Backspace') {
    backspace()
    return
  }
  if (key === '%') {
    applyPercent()
    return
  }

  // normalize
  if (key === '×') key = '*'
  if (key === '÷') key = '/'

  append(key)
}

const handleKeypadClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null
  if (!target) return
  const btn = target.closest('button') as HTMLButtonElement | null
  if (!btn) return
  const key = btn.dataset.key
  if (!key) return
  handleKey(key)
}

const onKeyDown = (e: KeyboardEvent) => {
  if (!visible.value) return
  if (activeTab.value !== 'calc') return

  const k = e.key
  if (k >= '0' && k <= '9') {
    handleKey(k)
    e.preventDefault()
    return
  }
  if (k === 'Enter' || k === '=') {
    handleKey('=')
    e.preventDefault()
    return
  }
  if (k === 'Backspace') {
    handleKey('Backspace')
    e.preventDefault()
    return
  }
  if (k === 'Delete') {
    handleKey('CE')
    e.preventDefault()
    return
  }
  if (k === 'Escape') {
    handleKey('C')
    e.preventDefault()
    return
  }
  if (k === '.' || k === '(' || k === ')') {
    handleKey(k)
    e.preventDefault()
    return
  }
  if (k === '+' || k === '-' || k === '*' || k === '/') {
    handleKey(k)
    e.preventDefault()
    return
  }
  if (k === '%') {
    handleKey('%')
    e.preventDefault()
    return
  }
}

watch(
  () => visible.value,
  (v) => {
    if (v) window.addEventListener('keydown', onKeyDown)
    else window.removeEventListener('keydown', onKeyDown)
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

// Translate (placeholder: external + ready for API integration)
const sourceText = ref('')
const translatedText = ref('')

type LangValue = 'auto' | 'zh-CN' | 'en' | 'ja' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'pt' | 'it' | 'tr' | 'vi' | 'th'
const fromLang = ref<LangValue>('zh-CN')
const toLang = ref<LangValue>('en')

const languageOptions = computed(() => [
  { value: 'auto', label: 'Auto' },
  { value: 'zh-CN', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'th', label: 'ไทย' },
])

const swapLanguages = () => {
  const a = fromLang.value
  fromLang.value = toLang.value === 'auto' ? 'en' : toLang.value
  toLang.value = a === 'auto' ? 'en' : a
  // swap text for convenience
  const t = sourceText.value
  sourceText.value = translatedText.value
  translatedText.value = t
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text || '')
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败')
  }
}

const toDeepLLang = (lang: LangValue) => {
  // DeepL uses language codes like EN/EN-US/ZH; keep simple mapping
  if (lang === 'auto') return 'auto'
  if (lang === 'zh-CN') return 'zh'
  if (lang === 'en') return 'en'
  return lang.toLowerCase()
}

const toGoogleLang = (lang: LangValue) => {
  if (lang === 'auto') return 'auto'
  if (lang === 'zh-CN') return 'zh-CN'
  return lang
}

const handleTranslateExternal = (provider: 'deepl' | 'google') => {
  const q = encodeURIComponent(sourceText.value || '')
  if (!q) {
    ElMessage.warning('请先输入内容')
    return
  }
  // Keep it simple: open external translation site in new tab.
  // Later we can wire: DeepSeek -> translate / summarize / quote suggestions.
  const url =
    provider === 'deepl'
      ? `https://www.deepl.com/translator#${toDeepLLang(fromLang.value)}/${toDeepLLang(toLang.value)}/${q}`
      : `https://translate.google.com/?sl=${encodeURIComponent(toGoogleLang(fromLang.value))}&tl=${encodeURIComponent(toGoogleLang(toLang.value))}&text=${q}&op=translate`
  window.open(url, '_blank', 'noopener,noreferrer')
}

const translateWithAI = () => {
  // Placeholder for DeepSeek integration:
  // - POST /api/ai/translate { fromLang, toLang, text }
  ElMessage.info('AI 翻译待接入（预留）')
}
</script>

<style scoped lang="scss">
.toolbox-dialog {
  :deep(.el-dialog__header) {
    padding: 14px 22px 0;
    margin-right: 0;
  }

  :deep(.el-dialog__body) {
    padding: 18px 22px 20px;
    background: linear-gradient(180deg, #f6f7fb 0%, #ffffff 40%);
  }
}

.toolbox-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  column-gap: 22px;
}

.tool-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 11px;
  border-radius: 16px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  transition: transform 160ms var(--ease-out), box-shadow 160ms var(--ease-out),
    border-color 160ms var(--ease-out), background 160ms var(--ease-out);
}

.tool-card:hover {
  transform: translateY(-1px);
  border-color: rgba(148, 163, 184, 0.35);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.09);
}

.tool-card.active {
  border-color: rgba(37, 99, 235, 0.5);
  background: radial-gradient(circle at top left, #e0ecff 0, #ffffff 52%);
}

.tool-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  font-size: 22px;
}

.tool-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.tool-card-desc {
  font-size: 12px;
  color: rgba(55, 65, 81, 0.68);
}

.tool-content {
  min-height: 360px;
}

.tool-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.calc-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 14px;
}

.calc-display {
  border-radius: 18px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f9fafb, #ffffff);
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;

  .display-expr {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    color: rgba(28, 28, 30, 0.68);
    font-size: 14px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .display-result {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    color: rgba(28, 28, 30, 0.92);
    font-size: 26px;
    font-weight: 650;
    letter-spacing: 0.2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.calc-keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.key {
  appearance: none;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: #f3f4f6;
  border-radius: 14px;
  height: 42px;
  font-size: 15px;
  color: #111827;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 120ms var(--ease-out), border-color 120ms var(--ease-out);
  user-select: none;
}

.key:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.4);
}

.key:active {
  transform: translateY(0px);
}

.key-op {
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.3);
}

.key-eq {
  background: #2563eb;
  border-color: #2563eb;
  font-weight: 700;
  color: #ffffff;
}

.key-fn {
  background: rgba(249, 250, 251, 0.9);
}

.key-wide {
  grid-column: span 4;
  height: 42px;
  background: rgba(255, 255, 255, 0.60);
}

.key-empty {
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.key-empty:hover {
  transform: none;
  border-color: transparent;
}

.calc-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.calc-result {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.7);

  .result-label {
    font-size: 12px;
    color: rgba(28, 28, 30, 0.56);
    margin-bottom: 6px;
  }

  .result-value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 20px;
    color: rgba(28, 28, 30, 0.92);
    letter-spacing: 0.2px;
  }
}

.calc-left,
.calc-right {
  min-width: 0;
}

.translate-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.62);
}

.lang-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  .lang-label {
    font-size: 12px;
    color: rgba(28, 28, 30, 0.56);
    white-space: nowrap;
  }

  .lang {
    width: 150px;
  }
}

.swap {
  border-radius: 12px;
}

.translate-actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

// 平板 / 手机端：工具区弹窗的响应式布局
@media (max-width: 1024px) {
  .toolbox-layout {
    grid-template-columns: 190px minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .toolbox-dialog {
    :deep(.el-dialog__body) {
      padding: 14px 12px 16px;
    }
  }

  .toolbox-layout {
    grid-template-columns: 1fr;
    row-gap: 14px;
  }

  .tool-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tool-card {
    flex: 1 1 calc(50% - 8px);
  }
}

@media (max-width: 980px) {
  .calc-layout {
    grid-template-columns: 1fr;
  }
  .translate-grid {
    grid-template-columns: 1fr;
  }
}

.calc-history {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.6);

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .history-title {
    font-size: 13px;
    font-weight: 600;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 12px;
    cursor: pointer;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.7);
    transition: transform 180ms var(--ease-out), border-color 180ms var(--ease-out);

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(0, 0, 0, 0.08);
    }

    .history-expr {
      color: rgba(28, 28, 30, 0.78);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .history-eq {
      color: rgba(28, 28, 30, 0.38);
    }

    .history-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      color: rgba(28, 28, 30, 0.92);
    }
  }
}

.translate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  .col-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .actions {
    margin-top: 10px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.hint {
  border-radius: 14px;
}

.future {
  .future-title {
    font-weight: 600;
    margin-bottom: 6px;
  }
  .future-desc {
    color: rgba(28, 28, 30, 0.62);
    line-height: 1.6;
  }
}
</style>


