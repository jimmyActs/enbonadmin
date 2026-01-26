# 工作空间设计方案

## 一、整体架构

### 1.1 命名调整
- "工作区" → "工作空间" (Workspace)
- "人事行政" → 保留，但作为行政功能的汇总入口（可选，或整合到工作空间）

### 1.2 模块化设计
工作空间采用**标签页（Tabs）**组织，包含：

#### 通用模块（所有用户可用）
1. **备忘录** (Memo)
   - 支持设置提醒（如：明天一定要记得打开、下班前提醒等）
   - 支持分类、标签
   - 支持搜索

2. **每日工作** (Daily Work)
   - 每日任务列表
   - 支持优先级、状态管理
   - 支持拖拽排序

3. **每周工作** (Weekly Work)
   - 周计划视图
   - 支持周报生成
   - 支持回顾和总结

4. **发布需求** (Request Help)
   - 可以向同事发布需求/请求帮助
   - 支持选择目标用户
   - 支持状态跟踪（待处理、进行中、已完成）

#### 角色特定模块（根据权限显示）

**行政前台** (HR Reception)
- 公司物料管理
- 资产统计
- 员工办公物品统计
- 来访客人统计
- 活动筹办
- 物料申请

**行政招聘专员** (HR Recruiter)
- 招聘记录
- 招聘目标统计
- 候选人管理

**销售** (Sales)
- 客户管理
- 国家统计
- 跟进记录
- 报价管理
- 信息管理

**行政总监/前台** (HR Director/Reception)
- 公告/通知发布（保留现有功能）

## 二、技术实现方案

### 2.1 权限控制
使用 `permissions.ts` 扩展权限检查函数：
- `canAccessWorkspaceModule(module: string, userInfo)`
- `getAvailableWorkspaceModules(userInfo)`

### 2.2 数据结构
```typescript
// 工作空间模块配置
interface WorkspaceModule {
  key: string;
  label: string;
  icon: string;
  component: string;
  roles: string[]; // 允许访问的角色
  isCommon: boolean; // 是否为通用模块
}
```

### 2.3 组件结构
```
Workspace.vue
├── 通用模块
│   ├── Memo.vue (备忘录)
│   ├── DailyWork.vue (每日工作)
│   ├── WeeklyWork.vue (每周工作)
│   └── RequestHelp.vue (发布需求)
└── 角色模块
    ├── AdminReception.vue (行政前台)
    ├── AdminRecruiter.vue (行政招聘)
    ├── Sales.vue (销售)
    └── AnnouncementPublish.vue (公告发布)
```

## 三、关于"人事行政"栏目

**建议方案**：
1. **方案A（推荐）**：将"人事行政"整合到工作空间中
   - 作为行政角色的一个模块标签页
   - 避免功能重复和混淆

2. **方案B**：保留"人事行政"作为独立栏目
   - 作为行政相关功能的汇总入口
   - 工作空间专注于个人和协作功能

**推荐方案A**，因为：
- 避免功能重复
- 统一管理界面
- 更清晰的权限控制

## 四、实施步骤

1. 重构 Workspace.vue，使用 Tabs 组织模块
2. 创建通用模块组件（备忘录、每日工作、每周工作、发布需求）
3. 创建角色特定模块组件
4. 扩展权限系统
5. 更新翻译文件
6. 更新菜单名称（工作区 → 工作空间）

