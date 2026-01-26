## 权限系统设计（Enbon 综合管理后台）

### 1. 设计目标

- **解耦头衔与权限**：
  - 头衔（Title）= 职位名称/名片信息，可自由输入（如“日韩组总监”、“招聘专员”、“行政前台”）。
  - 权限（Permission）= 在系统中能做什么，由超级管理员单独配置，不直接等于头衔。
- **统一的细粒度权限模型**：
  - 以“模块 → 子模块 → 权限点”的树状结构管理。
  - 支持一个账号拥有多个权限点、多个权限模板。
- **可扩展与可视化**：
  - 能支持后续增加新模块（AI 搜索、智能工作流等），只需新增权限点，不破坏旧逻辑。
  - 前端可用树形勾选界面管理权限。

---

### 2. 核心概念

- **User（用户）**
  - 基础信息：登录名、密码、姓名、部门、头衔 `title`、公司分配账号等。
- **Title（头衔/职位）**
  - 纯展示字段，可自由输入，不直接决定权限。
- **Permission（权限点）**
  - 单个最小功能点，如 `employee.manage.create`、`announcement.publish`。
- **Role（权限模板/角色）**
  - 一组权限点的组合，如“人力资源总监模板”、“招聘专员模板”、“行政前台模板”。
- **UserRole（用户-角色关联）**
  - 指定某个用户拥有哪些角色（从而获得对应的权限集合）。
- **DataScope（数据范围）**
  - 表示权限作用的数据范围：仅自己、本部门、全公司等。

> 说明：系统中已经存在的 `UserRole`（枚举，如 `super_admin`、`employee` 等）继续保留，作为“粗粒度的系统身份”；
> 新增的 Role/Permission 模型提供更细粒度的可配置权限控制。

---

### 3. 权限树结构

权限以树状结构组织，根节点是业务模块，每个模块下再细分到子模块与具体操作。

#### 3.1 总体结构示意

- `system`（系统管理）
  - `system.user`（账号管理）
    - `system.user.view`
    - `system.user.create`
    - `system.user.update`
    - `system.user.delete`
  - `system.permission`（权限管理）
    - `system.permission.view`
    - `system.permission.role.manage`
    - `system.permission.assign`（给用户分配角色/权限）

- `employee`（人员与组织）
  - `employee.manage`
    - `employee.manage.view`
    - `employee.manage.create`
    - `employee.manage.update`
    - `employee.manage.delete`
  - `employee.accounts`（公司分配账号）
    - `employee.accounts.view`
    - `employee.accounts.edit`

- `hr`（人事行政）
  - `hr.frontdesk`（行政前台）
    - `hr.frontdesk.request.view`
    - `hr.frontdesk.request.approve`
  - `hr.recruitment`（招聘）
    - `hr.recruitment.board.view`
    - `hr.recruitment.candidate.edit`
    - `hr.recruitment.offer.approve`
  - `hr.announcement`（公告通知）
    - `hr.announcement.view`
    - `hr.announcement.create`
    - `hr.announcement.publish`
    - `hr.announcement.manage.all`
  - `hr.event`（活动策划）
    - `hr.event.manage`

- `request`（员工申请与审批）
  - `request.material`（物料申请）
    - `request.material.my.create`
    - `request.material.my.view`
    - `request.material.dept.approve`
    - `request.material.admin.approve`
  - 其他申请类型（如请假/报销）可后续扩展 `request.leave.*`、`request.expense.*`。

- `report`（工作汇报）
  - `report.my`
    - `report.my.create`
    - `report.my.view`
  - `report.team`
    - `report.team.view`
  - `report.org`
    - `report.org.view`

- `files`（文件与盘管理）
  - `files.drive`
    - `files.drive.view`
    - `files.drive.manage`（新增/重命名盘）
  - `files.item`
    - `files.item.view`
    - `files.item.upload`
    - `files.item.rename`
    - `files.item.delete`
  - `files.security`
    - `files.folder.lock`
    - `files.folder.unlock`
    - `files.folder.password.manage`

- `finance`（财务模块）
  - `finance.report`
    - `finance.report.view.basic`
    - `finance.report.view.sensitive`
  - `finance.voucher`
    - `finance.voucher.create`
    - `finance.voucher.approve`
  - `finance.cash`
    - `finance.cashbook.manage`

- `sales`（销售 & CRM）
  - `sales.crm`
    - `sales.crm.view`
    - `sales.crm.edit`
  - `sales.board`
    - `sales.board.view.team`
    - `sales.board.view.org`
  - `sales.document`
    - `sales.quotation.create`
    - `sales.contract.approve`

> 实际实现时，所有权限点会被写入 `permissions` 表，包含：`code`、`name`、`module`、`parentId`、`description` 等字段，前端用树形组件展示和勾选。

---

### 4. 数据范围（DataScope）

多数权限需要结合“能看到多大范围的数据”一起使用。推荐统一的数据范围枚举：

- `SELF`：仅自己相关的数据（如自己的申请、自己的汇报）。
- `DEPARTMENT`：本部门的数据（例如：日韩销售组总监看到本组成员的汇报和申请）。
- `ORG`：全公司数据（例如：董事长、人力资源总监）。

使用方式：

- 在 `role_permissions` 表中为每个（角色, 权限）组合增加一个 `dataScope` 字段。
- 后端在查询数据时，根据 `dataScope` 决定 `WHERE` 条件（过滤为本人、本部门或不过滤）。

示例：

- 角色 A 对 `employee.manage.view` 的 `dataScope = DEPARTMENT`：只能看到本部门员工。
- 角色 B 对 `report.org.view` 的 `dataScope = ORG`：可以看到全公司工作汇报。

---

### 5. 角色模板设计（Role 模板）

角色是权限点的组合，用于快速赋权。可以预置以下常用角色：

#### 5.1 系统级角色

- **`super_admin`（超级管理员）**
  - 拥有所有权限点，`isSuperAdmin = true`。
  - 仅内部保留少量账号使用（如 1～2 个）。

#### 5.2 管理和职能角色

- **`hr_director_role`（人力资源总监）**
  - 人员管理：`employee.manage.view`（ORG）、`employee.manage.create/update`。
  - 公司账号：`employee.accounts.view/edit`。
  - 招聘模块全权：`hr.recruitment.*`。
  - 公告：`hr.announcement.view/create/publish/manage.all`。
  - 工作汇报：`report.org.view`。

- **`hr_reception_role`（行政前台）**
  - 行政前台：`hr.frontdesk.request.view/approve`。
  - 物料申请：`request.material.dept.approve`。
  - 公告：`hr.announcement.view`（可选是否赋予 `create`）。

- **`recruiter_role`（招聘专员）**
  - 招聘：`hr.recruitment.board.view`、`hr.recruitment.candidate.edit`。
  - 无 `offer.approve` 权限（交由 HR 总监）。

- **`dept_manager_sales_role`（销售部门负责人模板）**
  - 工作汇报：`report.team.view`（本部门）。
  - 人员管理：`employee.manage.view`（DEPARTMENT）。
  - 销售看板：`sales.board.view.team`。
  - CRM：`sales.crm.view`（本部门客户，后续配合数据范围）。

- **`finance_director_role` / `finance_staff_role` / `cashier_role`**
  - 财务总监：拥有 `finance.report.view.sensitive`、`finance.voucher.approve` 等。
  - 财务专员：`finance.voucher.create`、部分报表查看。
  - 出纳：`finance.cashbook.manage`。

> 角色模板只是一种“打包建议”，实际保存时会把对应的权限点写入用户的权限集合中，之后还可以在权限树上单独微调。

---

### 6. 账号创建与授权流程

#### 6.1 创建账号（人事操作）

1. 在“人员管理 → 新增员工”中填写：
   - 登录名、密码、姓名、部门。
   - 头衔 `title`（例如“日韩组总监”、“招聘专员”、“出纳”等，自由输入）。
   - 公司分配账号（VPN、Facebook、LinkedIn、WhatsApp、Instagram 等）。
2. 此阶段**不配置权限**，新账号只有最基础的登录与查看个人资料能力。

#### 6.2 分配权限（超级管理员操作）

1. 在“权限管理中心”中选择一个用户。
2. 先从“角色模板”下拉中选择一个或多个模板（如“招聘专员模板 + 公告发布模板”）。
3. 权限树自动勾选对应的权限点。
4. 如有需要，在权限树上手工增减某些权限点（例如临时给某人 `files.folder.lock` 能力）。
5. 保存后，用户的有效权限集合更新，立即生效。

#### 6.3 权限与流程节点（如“谁审批”）的关系

审批流、工作汇报归属关系建议通过 **角色类型 + 部门** 来控制，而不是直接使用权限点：

- 在用户表中增加一个简单的“职责类型”字段 `roleType`（可选）：
  - `dept_manager`：部门负责人（如“日韩组总监”、“中东组总监”）。
  - `recruiter`：招聘专员。
  - `hr_director`、`finance_director` 等。
- 审批或工作汇报流转时：
  - 例如销售员提交工作汇报：系统查找 `roleType = 'dept_manager' & department = 'sales_日韩组'` 的用户作为审批人。

这样可以实现：

- 头衔 Title：任意文字，方便展示；
- 权限：通过 Role + Permission 控制能做什么；
- 流程：通过 `roleType + department` 决定“谁来审批/谁来看到”。

---

### 7. 数据表与后端实现概述

#### 7.1 新增主要数据表（概念级）

- `permissions`（权限点）
  - `id`
  - `code`（如 `employee.manage.create`）
  - `name`（中文名称）
  - `module`（所属模块，如 `employee`）
  - `parentId`（父权限，用于构建树）
  - `description`
  - `order`（排序）

- `roles`（角色/权限模板）
  - `id`
  - `code`（如 `hr_director_role`）
  - `name`（显示名称，如“人力资源总监模板”）
  - `description`
  - `isSystem`（是否系统内置）
  - `isSuperAdmin`（是否为超级管理员角色）

- `role_permissions`（角色-权限关系）
  - `id`
  - `roleId`
  - `permissionId`
  - `dataScope`（`SELF` / `DEPARTMENT` / `ORG`）

- `user_roles`（用户-角色关系）
  - `id`
  - `userId`
  - `roleId`

> 后端将通过一个 `PermissionsService` 统一查询某个用户的权限集合（权限点列表 + 数据范围），并通过 Guard 在各接口中做权限检查。

#### 7.2 权限装饰器与守卫

- 装饰器：
  - `@RequirePermissions('employee.manage.update')`：标记接口需要某个权限点。
- 守卫：
  - 从 JWT 中获取用户 ID。
  - 查询用户权限集合（从 `user_roles` → `role_permissions` → `permissions`）。
  - 判断是否包含所需权限点，否则返回 403。

后续可以在关键模块逐步替换或补充掉当前的“硬编码角色判断”（如 `role === 'super_admin'` 等），统一改用权限点校验。

---

### 8. 实施顺序建议

1. **搭建权限表结构与 Permissions 模块**：
   - 实现实体、Service、基础 CRUD 与初始化脚本（插入默认权限点与角色模板）。
2. **前端增加权限管理 API & Store**：
   - 提供获取权限树、角色列表、用户已有权限的接口封装。
3. **打造“权限管理中心”页面（给超级管理员用）**：
   - 用户列表 → 选择用户 → 角色模板多选 + 权限树勾选 → 保存。
4. **逐步接入关键模块的权限校验**：
   - 从“人员管理 / 人事行政 / 公告 / 员工申请 / 文件管理”开始。
5. **审批流和工作汇报流转规则落地**：
   - 引入 `roleType` 字段，与部门信息一并配置审批人。

---

本文件作为权限系统的总体设计说明，与 `architecture.md` 中的总体架构配套。后续在实际开发中，如有新增模块或特殊业务（例如 AI 工作流、外部系统集成），只需要：

- 在此文档中补充新的权限点；
- 在 `permissions` 表中插入对应记录；
- 在相关接口上加上 `@RequirePermissions` 装饰器并更新角色模板。


