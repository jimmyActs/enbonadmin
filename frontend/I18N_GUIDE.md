# 国际化(i18n)使用指南

## 📚 概述

本项目使用 `vue-i18n` 实现国际化功能，支持中文(zh-CN)和英文(en-US)两种语言。语言包采用模块化设计，便于管理和维护。

## 📁 文件结构

```
frontend/src/
├── locales/              # 语言包目录
│   ├── zh-CN/          # 中文语言包
│   │   ├── index.ts    # 主入口文件
│   │   ├── common.ts   # 通用文本
│   │   ├── login.ts    # 登录页面
│   │   ├── layout.ts   # 布局相关
│   │   ├── index.ts    # 首页
│   │   ├── files.ts    # 文件管理
│   │   ├── crm.ts      # CRM模块
│   │   ├── finance.ts  # 财务模块
│   │   ├── hr.ts       # 人事模块
│   │   └── workflow.ts # 工作流模块
│   └── en-US/          # 英文语言包（结构同zh-CN）
├── i18n/
│   └── index.ts        # i18n配置文件
└── components/
    └── LanguageSwitcher.vue  # 语言切换组件
```

## 🚀 使用方法

### 1. 在 Vue 组件中使用

#### 方式一：模板中使用 `$t` 函数

```vue
<template>
  <div>
    <h1>{{ $t('common.title') }}</h1>
    <el-button>{{ $t('common.submit') }}</el-button>
  </div>
</template>
```

#### 方式二：在 `<script setup>` 中使用 `useI18n`

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const message = t('common.success')
</script>
```

### 2. 添加新的语言文本

#### 步骤1：在对应的语言包文件中添加文本

**中文语言包** (`src/locales/zh-CN/your-module.ts`):
```typescript
export default {
  title: '我的模块',
  button: {
    save: '保存',
    cancel: '取消'
  }
}
```

**英文语言包** (`src/locales/en-US/your-module.ts`):
```typescript
export default {
  title: 'My Module',
  button: {
    save: 'Save',
    cancel: 'Cancel'
  }
}
```

#### 步骤2：在语言包主入口文件中导出

**中文** (`src/locales/zh-CN/index.ts`):
```typescript
import yourModule from './your-module'

export default {
  // ... 其他模块
  yourModule
}
```

**英文** (`src/locales/en-US/index.ts`):
```typescript
import yourModule from './your-module'

export default {
  // ... 其他模块
  yourModule
}
```

#### 步骤3：在组件中使用

```vue
<template>
  <div>
    <h1>{{ $t('yourModule.title') }}</h1>
    <el-button>{{ $t('yourModule.button.save') }}</el-button>
  </div>
</template>
```

## 📝 最佳实践

### 1. 模块化组织

- 按功能模块划分语言包文件
- 每个模块对应一个 `ts` 文件
- 使用嵌套对象组织相关的文本

```typescript
// ✅ 推荐
export default {
  user: {
    profile: {
      title: '个人资料',
      name: '姓名',
      email: '邮箱'
    },
    settings: {
      title: '设置',
      theme: '主题'
    }
  }
}

// 使用: $t('user.profile.title')
```

### 2. 命名规范

- 使用小驼峰命名（camelCase）
- 使用有意义的键名
- 保持键名简洁明了

```typescript
// ✅ 推荐
export default {
  loginSuccess: '登录成功',
  fileUploadFailed: '文件上传失败'
}

// ❌ 不推荐
export default {
  msg1: '登录成功',
  error: '文件上传失败'
}
```

### 3. 动态文本

对于需要动态参数的文本，使用参数插值：

```typescript
// 语言包
export default {
  welcome: '欢迎, {name}!',
  itemsCount: '共有 {count} 个项目'
}
```

```vue
<template>
  <div>
    <p>{{ $t('welcome', { name: userName }) }}</p>
    <p>{{ $t('itemsCount', { count: items.length }) }}</p>
  </div>
</template>
```

### 4. 数组和对象

对于数组类型的文本（如励志话语列表），使用 `returnObjects` 选项：

```typescript
// 语言包
export default {
  motivations: [
    { text: '第一句话', author: '作者1' },
    { text: '第二句话', author: '作者2' }
  ]
}
```

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const motivations = computed(() => 
  t('index.motivations', { returnObjects: true }) as Array<{text: string, author: string}>
)
</script>
```

## 🔧 语言切换

### 手动切换语言

```typescript
import { setLocale } from '@/i18n'

// 切换到英文
setLocale('en-US')

// 切换到中文
setLocale('zh-CN')
```

### 语言切换组件

已经在 `MainLayout.vue` 中集成了 `LanguageSwitcher` 组件，位于右上角。

## ⚠️ 注意事项

1. **始终同步更新两种语言包**
   - 添加新功能时，必须同时更新 `zh-CN` 和 `en-US` 两个语言包
   - 确保键名完全一致

2. **Element Plus 组件国际化**
   - Element Plus 的组件内部文本会根据当前语言自动切换
   - 已在 `main.ts` 中配置了 Element Plus 的 locale

3. **避免硬编码**
   - 不要在组件中直接写中文字符串
   - 所有面向用户的文本都应该使用 i18n

4. **测试多语言**
   - 开发新功能后，务必切换语言测试
   - 确保英文翻译准确、自然

## 📋 添加新模块的完整流程

假设要添加一个"订单管理"模块：

1. **创建语言包文件**
   ```bash
   # 创建中文语言包
   touch src/locales/zh-CN/orders.ts
   # 创建英文语言包
   touch src/locales/en-US/orders.ts
   ```

2. **编写语言包内容**
   ```typescript
   // src/locales/zh-CN/orders.ts
   export default {
     title: '订单管理',
     list: {
       title: '订单列表',
       orderNo: '订单号',
       customer: '客户',
       amount: '金额'
     },
     actions: {
       create: '新建订单',
       edit: '编辑订单',
       delete: '删除订单'
     }
   }
   ```

3. **在语言包主入口中导入**
   ```typescript
   // src/locales/zh-CN/index.ts
   import orders from './orders'
   export default {
     // ...
     orders
   }
   ```

4. **在组件中使用**
   ```vue
   <template>
     <div>
       <h1>{{ $t('orders.title') }}</h1>
       <el-button>{{ $t('orders.actions.create') }}</el-button>
     </div>
   </template>
   ```

## 🎯 总结

- ✅ 使用模块化组织语言包
- ✅ 保持中英文语言包结构一致
- ✅ 使用有意义的键名
- ✅ 及时同步更新两种语言
- ✅ 测试多语言功能

遵循这些规范，可以确保国际化功能的可维护性和扩展性。

