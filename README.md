# Enbon 综合管理后台系统

一个整合文件存储、业务系统（小满CRM、金蝶财务、飞书等）的统一办公入口平台。

## 🚀 项目概述

本项目旨在解决LED显示屏外贸公司在业务管理中的痛点：
- 多系统分散：金蝶、小满、飞书、共享盘各自独立
- 文件传输繁琐：需要百度网盘等中转
- 数据孤岛：各部门数据不互通
- 权限管理混乱：共享盘权限不清晰
- 文件查找困难：在海量文件中寻找特定文档耗时费力
- 重复性工作：报价单、合同等文档需要重复填写

## 📋 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **HTTP客户端**: Axios

### 后端
- **框架**: NestJS + TypeScript
- **数据库**: SQLite (开发环境) / MySQL (生产环境)
- **认证**: JWT + Passport
- **ORM**: TypeORM
- **文件上传**: Multer
- **缓存**: Redis (可选)

## 📁 项目结构

```
enbonadmin/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/             # API接口
│   │   ├── components/      # 公共组件
│   │   ├── layout/          # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── store/           # Pinia状态管理
│   │   ├── views/           # 页面组件
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── modules/         # 业务模块
│   │   │   ├── auth/        # 认证模块
│   │   │   ├── users/       # 用户模块
│   │   │   ├── files/       # 文件管理模块
│   │   │   ├── employees/   # 员工与人事基础信息
│   │   │   ├── announcements/      # 通知公告
│   │   │   ├── reminders/          # 个人提醒
│   │   │   ├── exchange-rates/     # 汇率
│   │   │   ├── motivations/        # 励志名言/激励内容
│   │   │   ├── material-applications/ # 物料申请工作流
│   │   │   ├── personal-docs/      # 个人文档空间
│   │   ├── config/          # 配置文件
│   │   ├── common/          # 公共代码
│   │   └── main.ts
│   ├── storage/             # 文件存储
│   ├── data/                # 数据库文件
│   ├── package.json
│   └── .env                 # 环境变量
│
└── architecture.md          # 架构文档
```

## 🧱 系统整体架构与当前实现情况

### 1. 整体分层与运行方式

- **前端（frontend）**：基于 Vue 3 + TypeScript + Element Plus，运行在浏览器，使用 `Vite` 打包，默认 dev 端口 `5173`。
- **后端（backend）**：基于 NestJS + TypeORM + SQLite（开发环境），提供 RESTful API，默认端口 `3002`。
- **鉴权机制**：
  - 登录成功后由后端 `/auth/login` 颁发 **JWT**，前端存储在 `localStorage` 中。
  - 所有需要权限的 API 通过 `Authorization: Bearer <token>` 访问。
  - 前端路由守卫结合 `Pinia` 中的用户信息与权限工具函数，实现菜单/页面级别访问控制。
- **数据存储**：
  - **结构化数据**：通过 TypeORM 写入 SQLite（`backend/data/enbon-admin.db`），未来切换 MySQL 只需调整 `database.config.ts`。
  - **文件数据**：通过本地磁盘目录（`backend/storage` + 部门盘路径）管理，支持部门盘、个人空间、共享链接及锁定文件夹。

### 2. 前端框架与模块划分

#### 2.1 入口与全局配置

- **入口文件**：`frontend/src/main.ts`
  - 挂载 Vue 应用，注册 `Element Plus`、`vue-router`、`pinia`、`vue-i18n` 等。
- **根组件**：`frontend/src/App.vue`
  - 主要承载路由视图与全局样式。
- **国际化**：`frontend/src/i18n/index.ts` + `frontend/src/locales/zh-CN/*` / `en-US/*`
  - 所有文案通过 `t('xxx.yyy')` 访问，支持中英文切换。
  - 独立的 `I18N_GUIDE.md` 说明如何新增文案与语言。

#### 2.2 路由与布局

- **路由配置**：`frontend/src/router/index.ts`
  - 登录页：`/login`
  - 主布局：`/` 对应 `MainLayout.vue`，子路由：
    - `/index`：首页（励志名言、全球时钟、汇率、通知、通告）
    - `/workspace`：个人工作台（备忘录/每日/每周/个人文档/销售小模块）
    - `/workgroup`：工作群组（按部门查看成员与状态）
    - `/files`：文件管理（部门盘、配额、预览、共享链接）
    - `/crm`：CRM 总览（当前为“小满CRM对接前”的本地仪表盘 Demo）
    - `/finance`：财务概览占位（未来对接金蝶）
    - `/hr`：人事行政中心（行政前台、招聘、公告、活动策划）
    - `/sales`：销售管理（客户记录、目标、复盘、报价单）
    - `/workflow`：智能工作流占位（文档自动生成等）
    - `/employees`：员工与人事档案管理
    - `/profile`：个人资料与密码修改
  - **路由守卫**：
    - 检查 `localStorage` 中的 `token` 和 `user`，未登录跳转 `/login`。
    - 对带 `meta.requiresAuth` 的路由按业务函数做细粒度权限校验：
      - `canAccessEmployeeManagement`、`canAccessHR`、`canAccessSales`、
        `canAccessFinance`、`canAccessCRM`、`canAccessFiles` 等。

- **布局组件**：`frontend/src/layout/MainLayout.vue`
  - 左侧菜单：根据当前登录用户角色动态显示菜单项（HR、Sales、Finance、CRM、文件、员工等）。
  - 顶部栏：语言切换、用户下拉菜单（个人资料、退出登录），支持折叠侧边栏。
  - 内容区：通过 `router-view + transition` 实现页面切换动画。

#### 2.3 状态管理（Pinia）

- **用户状态**：`frontend/src/store/user.ts`
  - `state`：
    - `token`：从 `localStorage` 初始化，保存 JWT。
    - `userInfo`：登录接口返回的用户信息（id、username、nickname、role、department、email）。
  - `getters`：
    - `isLoggedIn`：是否已登录。
    - `userName`：优先显示 `nickname`，否则 `username`。
  - `actions`：
    - `login`：调用 `/auth/login`，成功后写入 `localStorage` 与 Store。
    - `logout`：清空 Store 与 `localStorage`，由布局触发并回到登录页。

#### 2.4 API 封装层

- 统一在 `frontend/src/api` 下按业务模块划分：
  - `auth.ts`：登录/退出（目前退出仅清本地状态）。
  - `users.ts`：当前用户资料、头像上传获取、修改密码。
  - `employees.ts`：员工列表、统计、增删改查（人事模块）。
  - `files.ts`：盘信息、文件列表、上传/下载、文件夹创建/重命名/删除、锁定/解锁、共享链接。
  - `announcements.ts` / `reminders.ts` / `exchange-rates.ts` / `motivations.ts` /
    `material-applications.ts` / `personal-docs.ts` 等：对应后端模块，提供首页卡片、工作台、物料申请等能力。
- 所有 API 通过统一的 `axios` 实例（`api/config.ts`），自动带上 `baseURL` 与 `token`。

#### 2.5 主要页面与业务模块

- **首页 `Index.vue`**：
  - 展示励志名言、全球时钟、实时汇率、公告、提醒等信息。
  - 数据来源：后端 `motivations`、`exchange-rates`、`announcements`、`reminders` 模块。
- **工作台 `Workspace.vue`**：
  - 顶部快捷卡片：物料申请、会议室预约、工具箱。
  - Tab 模块：备忘录、每日/每周工作、需求求助、个人文档、销售小组件等。
  - 物料申请记录：调用 `/material-applications/my` 加载当前用户历史申请。
  - 可访问模块由 `getAvailableWorkspaceModules(userInfo)` 决定。
- **工作群组 `WorkGroup.vue`**：
  - 基于 `/employees/statistics` 与 `/employees/grouped`，按部门展示成员工作状态。
  - 为跨部门协作提供组织视图（不是聊天，而是“看人和状态”的面板）。
- **员工管理 `Employees.vue`**：
  - 统计卡片（总人数、在职人数、部门数量、岗位数量）。
  - 支持按部门与关键字搜索、增删改查、软删除。
  - 内置 admin 账号保护：仅超级管理员可操作用户名为 `admin` 的账号。
  - 与后端 `/employees` 模块完全打通，兼顾账号与人事信息。
- **文件管理 `Files.vue`**：
  - 左侧：部门盘网格（带容量进度条和锁图标）。
  - 右侧：文件浏览器，支持列表/卡片两种视图：
    - 文件/文件夹双击打开或下载。
    - 文件上传（支持进度条）、创建/重命名文件夹、删除文件/文件夹。
    - 锁定/解锁文件夹，生成并管理共享链接，图片/视频/PDF/文本在线预览。
  - 与后端 `FilesController` 的各类接口（`/files/drives`、`/files/list`、`/files/upload` 等）一一对应。
- **CRM 总览 `Crm.vue`**：
  - 目前为“本地仪表盘 + 假数据”形式，用来验证 UI 与交互（客户漏斗、待跟进时间线、AI 建议等）。
  - 集成状态由 `hasIntegration` 控制，尚未真正打通小满 CRM API。
- **销售管理 `Sales.vue`**：
  - 四个子模块：客户记录、目标制定、销售复盘、报价单。
  - 目前主要是结构与前端交互，后台实体与对接逻辑待后续扩展。
- **人事行政 `Hr.vue`**：
  - 基于 `WorkspaceModule` 与 `canPublishAnnouncement`，按角色展示：
    - 行政前台模块：前台工作台。
    - 行政招聘模块：招聘看板。
    - 公告发布模块：公告发起与管理。
    - 活动策划模块：公司活动计划。
  - 与工作台部分组件重用，减少重复开发。

### 3. 后端框架与模块说明

#### 3.1 核心入口与配置

- **`main.ts`**：
  - 创建 Nest 应用实例，配置全局前缀 `/api`（由 `README_NETWORK_SETUP.md` 和前端 `api/config.ts` 约定）。
  - 注册全局中间件（如 JWT 校验中间件）与全局管道。
- **`app.module.ts`**：
  - 加载 `ConfigModule`（从 `.env` 读取配置）、`TypeOrmModule`（读取 `databaseConfig()`）。
  - 注册所有业务模块：`AuthModule`、`UsersModule`、`FilesModule`、`EmployeesModule`、
    `RemindersModule`、`AnnouncementsModule`、`ExchangeRatesModule`、`MotivationsModule`、
    `MaterialApplicationsModule`、`PersonalDocsModule` 等。
- **配置目录 `backend/src/config`**：
  - `database.config.ts`：SQLite / MySQL 切换、实体注册、同步策略。
  - `jwt.config.ts`：JWT 密钥、过期时间从 `.env` 读取。
  - `redis.config.ts`：为未来缓存与会话扩展预留。
  - `storage.config.ts`：文件根目录等存储配置。

#### 3.2 认证与用户模块

- **Auth 模块**：`backend/src/modules/auth`
  - `AuthController`：
    - `POST /auth/login`：用户名 + 密码登录，返回 `{ access_token, user }`。
  - `AuthService`：
    - 登录流程：
      - `UsersService.findByUsername` 获取用户。
      - `validatePassword` 使用 `bcrypt` 校验密码。
      - 检查 `isActive`，禁用账号拒绝登录。
      - 更新 `lastLoginAt`。
      - 生成 JWT（`sub` 为用户 ID，payload 包含 `username`、`role`），`remember=true` 时有效期 7 天，否则 24 小时。

- **Users 模块**：`backend/src/modules/users`
  - `User` 实体：包含用户名、密码哈希、昵称、角色（`UserRole` 枚举）、部门（`Department` 枚举）、员工编号、头像、工作状态等。
  - `UsersService`：
    - 用户创建、查询、更新、删除。
    - 使用 `bcrypt` 对密码进行加盐哈希。
    - 模块初始化时自动创建默认管理员 `admin / 123456`，角色 `super_admin`。
  - `UsersController`：
    - `GET /users/profile`：基于 JWT 获取当前用户信息（去掉密码字段）。
    - `PUT /users/profile`：更新工作状态、签名、中文/英文名、国家/城市等，空字符串自动转换为 `null`。
    - `POST /users/avatar`：上传头像到 `storage/avatars`，限制 5MB，按 `userId_timestamp.ext` 命名。
    - `GET /users/avatar/:filename`：返回头像二进制数据。
    - `PUT /users/change-password`：校验旧密码与新密码长度后更新密码。

#### 3.3 员工与人事基础模块

- **Employees 模块**：`backend/src/modules/employees`
  - Controller 使用 JWT 解析函数 `getUserFromRequest` 获取当前用户。
  - 权限规则 `canAccessEmployeeManagement(role)`：
    - 允许 `super_admin`、`department_head`、`hr_director`、`hr_reception`、`hr`。
  - 核心接口：
    - `GET /employees`：获取所有员工（需要管理权限）。
    - `GET /employees/statistics`：员工统计（所有登录用户可访问，用于工作群组和员工页顶部统计卡片）。
    - `GET /employees/department/:department`：按部门筛选员工。
    - `GET /employees/grouped`：按部门分组员工，用于工作群组视图。
    - `POST /employees` / `PUT /employees/:id` / `DELETE /employees/:id`：员工维护，包含对 admin 账号的操作保护。

#### 3.4 文件管理与部门盘模块

- **Files 模块**：`backend/src/modules/files`
  - 实体：
    - `DriveName`：部门盘信息（名称、路径、类型、部门、显示名、是否需要密码、容量、使用量等）。
    - `FolderPermission`：目录锁定与可见性控制（谁是 owner，是否锁定，需要密码等）。
    - `ShareLink`：临时共享链接（路径、过期时间、创建人）。
  - `FilesController` 核心接口：
    - 盘与权限：
      - `GET /files/drives`：根据当前用户部门返回其可见的盘列表。
      - `POST /files/drives/verify-password`：校验部门盘密码。
      - `PUT /files/drives/:driveId/rename`：仅 `super_admin` 可重命名盘。
    - 文件浏览：
      - `GET /files/list`：列出指定盘与路径下的文件/文件夹，返回前端使用的 `FileItem` 列表（含锁定状态、预览支持等）。
      - `GET /files/preview`：根据扩展名分别处理图片、视频、PDF、文本文件的在线预览，并包含路径安全检查。
      - `GET /files/download`：以附件形式下载文件，处理文件名编码。
    - 文件操作：
      - `POST /files/folder`：创建文件夹，支持“创建后马上锁定”的一体化操作。
      - `DELETE /files`：删除文件/文件夹。
      - `PUT /files/rename`：重命名文件/文件夹。
      - `POST /files/upload`：
        - 使用 `multer` 内存存储 + `MaxFileSizeValidator`（100MB）。
        - 对文件名进行编码修复与非法字符清理，兼容中文文件名。
        - 借助 `DriveQuotaService` 在盘级别做配额检查（当前默认 500MB/盘，可调）。
        - 自动创建多级目标目录并确保可写。
    - 共享与锁定：
      - `POST /files/share` / `GET /files/share` / `DELETE /files/share/:id`：生成、列出、删除共享链接。
      - `POST /files/folder/lock`：锁定文件夹并隐藏，支持密码。
      - `POST /files/folder/unlock`：解锁文件夹，带 owner 与密码校验。

#### 3.5 首页相关模块

- **Motivations 模块**：提供首页励志名言内容（随机/列表）。
- **Exchange-Rates 模块**：定期拉取并提供多币种日常汇率（首页展示）。
- **Announcements 模块**：公告/通知的增删改查与发布权限控制。
- **Reminders 模块**：个人提醒/待办事项。
- **Material-Applications 模块**：物料申请工作流（与工作台物料申请卡片/列表联动）。
- **Personal-Docs 模块**：个人文档管理（工作台“个人文档”模块后端支撑）。

> 说明：上述模块均已具备基础 CRUD 能力并与前端页面联通，但仍有部分业务细节和审批流设计预留扩展空间。

### 4. 权限与角色模型

#### 4.1 角色定义（与前后端统一）

- **UserRole 枚举（`frontend/src/utils/permissions.ts` 与后端 `UserRole` 一致）**：
  - `super_admin`：超级管理员，拥有系统配置与所有菜单/数据访问权限。
  - `department_head`：部门领导，拥有本部门员工与业务的管理权限。
  - `employee`：普通员工，访问授权的业务模块与文件。
  - `hr_director`：行政总监。
  - `hr_reception`：行政前台。
  - `finance`：财务人员。
  - `guest`：访客，只读或受限访问。
  - `hr`：旧数据兼容角色，等价于“人事行政”。

#### 4.2 前端菜单与页面级权限

- **路由守卫**（`frontend/src/router/index.ts`）：
  - 未登录用户：任何非 `/login` 路径将被重定向至登录页。
  - 登录用户：从 Pinia 或 `localStorage` 恢复用户信息，再根据具体路径走权限判断。
- **权限工具函数**（`frontend/src/utils/permissions.ts`）：
  - **页面级权限**：
    - `canAccessEmployeeManagement`：控制员工管理菜单与员工 API 的入口。
    - `canAccessHR`：限制 HR 模块为行政部门或超级管理员。
    - `canAccessSales`：限制销售模块为销售部门 + 管理层。
    - `canAccessFinance`：限制财务模块为财务和管理层。
    - `canAccessCRM`：目前较宽松，面向大部分业务人员。
    - `canAccessFiles`：禁止访客角色对文件管理进行写操作。
  - **工作台模块权限**：
    - `canAccessWorkspaceModule` + `getAvailableWorkspaceModules`：
      - 决定工作台中每个 Tab（备忘录/每日/每周/个人文档/销售/公告/行政前台等）是否展示。
    - `canPublishAnnouncement`：决定是否能使用公告发布模块。

#### 4.3 后端接口级权限

- 多数受保护接口通过 Controller 内部的 `getUserFromRequest` + 角色判断实现：
  - 员工管理接口：仅部分角色可访问。
  - 文件盘重命名：仅 `super_admin` 可执行。
  - 物料申请审批、公告发布等后续审批流将采用类似模式。

### 5. 前后端关键业务流程

#### 5.1 登录流程

- 前端：
  - 登录页提交用户名、密码与“记住我”选项给 `/auth/login`。
  - 成功后保存 `access_token` 与 `user` 信息到 Pinia + `localStorage`。
  - 跳转到 `/index`，后续所有 API 请求带上 `Authorization` 头。
- 后端：
  - `AuthService.login` 校验账号密码、状态，生成带角色信息的 JWT。
  - 登录后更新 `lastLoginAt` 以支持审计与统计。

#### 5.2 文件浏览与操作流程

- 获取盘列表：
  - 前端调用 `GET /files/drives`，根据当前用户部门返回其对应的部门盘与公共盘。
  - 若盘需要密码且当前用户未验证，则前端展示密码输入框。
- 访问盘内容：
  - 验证密码通过后，前端请求 `GET /files/list?driveId=...&path=...` 获取指定路径下内容。
  - 双击文件夹继续下钻，路径通过 `pathHistory` 管理“返回上级”。
- 文件上传：
  - 前端使用 `FormData` + `uploadFile` 接口，支持进度条与多文件循环上传。
  - 后端 `FilesController.uploadFile` 做配额校验、路径/文件名处理并落盘。
- 文件预览 / 下载：
  - 预览/下载时，前端通过 `getPreviewUrl` 与 `downloadFile` 组合生成 URL 或 Blob。
  - 后端按文件类型设置正确的 `Content-Type` 与 `Content-Disposition`。

#### 5.3 员工与工作群组数据流

- 首页/工作群组：
  - 通过 `GET /employees/statistics` 与 `GET /employees/grouped` 读取员工分布与工作状态。
- 员工管理：
  - `Employees.vue` 通过 `getEmployees`、`createEmployee`、`updateEmployee`、`deleteEmployee` 操作员工信息。
  - 表单中角色、部门、状态等均与后端枚举保持一致，避免“前后端概念不统一”。

#### 5.4 工作台与物料申请流程

- 工作台：
  - 根据当前用户角色与部门，前端决定展示哪些工作台模块。
- 物料申请：
  - 员工在工作台中通过 `MaterialApplicationDialog` 创建申请，调用 `POST /material-applications`。
  - “我的申请”列表调用 `GET /material-applications/my`，展示当前用户所有申请记录。
  - 后续行政审批与状态流转通过 `updateApplicationStatus` 接口扩展。

### 6. 当前完成度与后续规划（基于代码现状）

- **已基本打通的模块**：
  - 用户认证与资料管理（登录、个人信息、头像、密码修改）。
  - 员工与人事基础信息（员工档案、部门划分、统计、权限控制）。
  - 文件管理系统（部门盘、上传/下载、预览、锁定、共享链接、容量统计）。
  - 首页展示相关的励志名言、汇率、公告、提醒等。
  - 个人工作台与部分工作流（物料申请、个人文档等）。
- **前端 UI 已完成、后端待深度集成的模块**：
  - CRM 仪表盘、小满 CRM 真实数据对接。
  - 财务总览与金蝶 API 对接。
  - 更复杂的 AI 智能搜索与文档自动生成工作流（目前为规划阶段，与 `architecture.md` 保持一致）。
- **扩展方向**：
  - 按 `architecture.md` 中的阶段计划，优先完善：
    - 文件全文检索与 AI 语义搜索。
    - 文档自动生成工作流（报价单、合同、确认单等）。
    - 小满 CRM / 金蝶 / 飞书 等第三方系统的 API 集成与数据同步。

以上内容已经与当前代码实现对齐，可视为本项目“实际框架与逻辑”的权威说明，可直接作为项目成员的入门与架构总览使用。

## 🛠️ 快速开始

### 环境要求

- Node.js >= 16.x
- npm >= 8.x

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 配置环境变量

在 `backend` 目录下创建 `.env` 文件（已包含 `.env.example` 作为参考）：

```env
PORT=3002
NODE_ENV=development
JWT_SECRET=your-secret-key
STORAGE_PATH=./storage
```

### 启动项目

**启动后端服务器**：
```bash
cd backend
npm run start:dev
```
后端服务将在 http://localhost:3002 启动

**启动前端开发服务器**：
```bash
cd frontend
npm run dev
```
前端服务将在 http://localhost:5173 启动

### 默认登录信息

- **用户名**: admin
- **密码**: 123456

## 📖 功能模块

### ✅ 已完成

- [x] 项目基础架构搭建
- [x] 用户认证系统（JWT）
- [x] 登录页面
- [x] 首页（励志名言、全球时钟、汇率、通知、通告）
- [x] 侧边导航栏
- [x] 文件管理系统基础框架
- [x] 权限管理系统基础框架

### 🚧 开发中

- [ ] 文件上传/下载功能
- [ ] 文件在线预览
- [ ] 文件夹管理
- [ ] 权限细粒度控制
- [ ] 小满CRM集成
- [ ] 金蝶财务集成
- [ ] 飞书集成
- [ ] AI智能搜索
- [ ] 智能工作流

## 🎯 核心功能说明

### 1. 文件管理系统

基于本地服务器的部门级文件系统，支持：
- 部门存储空间（企划部、销售部、技术部、财务部、人事行政）
- 文件上传/下载（支持断点续传）
- 在线预览（Office、PDF、图片、视频）
- 文件搜索（全文检索）
- 版本控制
- 共享链接
- 访问日志
- 容量监控

### 2. 权限管理系统

基于RBAC（角色权限控制）：
- 超级管理员：所有权限，系统配置
- 部门负责人：管理本部门文件
- 普通员工：访问授权文件
- 财务人员：财务部门文件
- 人事行政：人事文件管理
- 访客：只读权限

### 3. AI智能搜索

结合DeepSeek等AI，实现：
- 自然语言搜索文件
- 文件内容分析
- 智能推荐
- 搜索结果优化

### 4. 智能工作流

一键生成常用文档：
- 销售报价单
- 产品合同
- 订单确认单
- 自定义模板

## 📝 开发计划

详细开发计划请参考 `architecture.md` 文件

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用私有许可证，仅供Enbon公司内部使用。

## 📧 联系方式

- 项目负责人: [待填写]
- 技术负责人: [待填写]

---

**最后更新**: 2024年12月

