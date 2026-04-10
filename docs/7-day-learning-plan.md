# Student Helper 7 天学习计划

目标：7 天后，你能独立给这个项目增加一个简单功能，并理解它从界面到数据库的基本实现流程。

## 总目标

7 天结束时，你应该能独立完成这些事：

1. 找到一个功能对应的页面和数据位置
2. 看懂它从前端到数据库的调用链
3. 修改一个字段或增加一个简单功能
4. 让它在界面里正常显示出来

## 第 1 天：建立项目地图

目标：知道这个项目有哪些层。

阅读顺序：

1. `README.md`
2. `package.json`
3. `electron.vite.config.ts`
4. `src/App.tsx`
5. `src/components/layout/Sidebar.tsx`

今天要搞懂：

- 这是个什么软件
- 页面有哪些
- 前端代码在哪
- Electron 主进程在哪
- 数据库相关代码在哪

今天的产出：

- 自己画一张简图：`UI -> store -> preload -> main -> Prisma -> SQLite`

## 第 2 天：把项目跑起来

目标：先建立“能运行、能改动、能看到结果”的反馈。

操作：

1. 在项目目录运行 `npm install`
2. 运行 `npm run dev`
3. 修改 `src/components/layout/Sidebar.tsx` 里的标题或底部版本号
4. 修改一个按钮文字
5. 看界面是否更新

今天要搞懂：

- 哪些文件改了会立刻影响界面
- 哪些是前端文件，哪些不是
- 开发模式和打包模式的区别

今天的产出：

- 完成一次最简单的 UI 修改

## 第 3 天：只看前端页面结构

目标：弄懂 React 组件怎么组成页面。

建议阅读：

1. `src/App.tsx`
2. `src/components/features/Dashboard.tsx`
3. `src/components/features/KanbanBoard.tsx`
4. `src/components/features/InstitutionDetail.tsx`
5. `src/components/features/Timeline.tsx`

今天要搞懂：

- `App.tsx` 是怎么切换页面的
- `selectedInstitutionId` 为什么会决定显示详情页
- 组件之间如何传参
- 页面是如何按功能拆分的

练习：

- 找出“点击某个院校卡片后进入详情页”的代码路径

今天的产出：

- 说清楚“一个页面是怎么切换到另一个页面的”

## 第 4 天：看状态管理

目标：理解 store 是整个前端的数据中枢。

重点阅读：

- `src/stores/appStore.ts`

今天要搞懂：

- `institutions`、`orphanTasks`、`emailTemplates` 分别是什么
- `loadInstitutions` 为什么在应用启动时调用
- 为什么有些增删改后会重新 `loadInstitutions()`
- 前端状态和数据库数据有什么区别

练习：

- 随机挑一个函数，比如 `addTask`
- 画出它的调用链：谁调用它，它又调用谁

今天的产出：

- 写出至少 3 条调用链，例如：`组件 -> store -> window.api -> ipc -> main`

## 第 5 天：看 Electron 通信

目标：理解前端为什么不能直接操作数据库。

重点阅读：

1. `electron/preload/index.ts`
2. `electron/main/index.ts`

今天要搞懂：

- `contextBridge.exposeInMainWorld` 是干什么的
- `ipcRenderer.invoke` 和 `ipcMain.handle` 如何配对
- 为什么 Electron 要用 preload 做桥接
- 文件选择、打开文件、LaTeX 编译为什么放在主进程

练习：

- 找出 `institution:getAll` 的完整流向
- 找出 `task:update` 的完整流向

今天的产出：

- 能口头解释“为什么 Electron 项目常见三层：renderer / preload / main”

## 第 6 天：看数据库和业务建模

目标：从“会看页面”升级到“会看业务结构”。

重点阅读：

1. `prisma/schema.prisma`
2. `electron/main/index.ts` 里的 CRUD 部分

今天要搞懂：

- `Institution`、`Advisor`、`Task`、`Interview`、`Asset`、`EmailTemplate` 之间的关系
- 为什么 `Task.institutionId` 可以为空
- 为什么 `Institution` 查询时经常 `include: { advisors: true, tasks: true }`
- Prisma schema 和实际功能的对应关系

练习：

- 自己画一个 ER 图，简单就行
- 标出一对多关系

今天的产出：

- 能回答“如果要加一个字段，应该先改哪里”

## 第 7 天：做一个真正的小功能

目标：完成一次最小完整开发闭环。

推荐选择一个最简单的功能：

- 给 `Institution` 增加一个 `website` 字段
- 或给 `Task` 增加一个 `tag` 字段
- 或给 `Advisor` 增加一个 `wechat` 字段

建议按这个顺序做：

1. 改 `prisma/schema.prisma`
2. 改主进程 CRUD：`electron/main/index.ts`
3. 改 store 类型和调用：`src/stores/appStore.ts`
4. 改表单组件，比如 `src/components/features/InstitutionForm.tsx`
5. 改详情展示组件，比如 `src/components/features/InstitutionDetail.tsx`

今天要搞懂：

- 一个字段为什么要改这么多层
- 前后端一体项目里“功能开发”其实是贯穿多层的

今天的产出：

- 完成一个真正可用的小改动

## 每天的学习方法

每天都做这 3 件事：

1. 先读 1 到 3 个关键文件，不要贪多
2. 画一条调用链
3. 做一个很小的修改验证理解

不要只是看。一定要改。只看代码，理解会很虚；改一处再跑起来，理解才会落地。

## 这一周里最该掌握的 5 个核心问题

1. 页面切换是怎么做的
2. 状态存在哪里
3. 前端怎么调用主进程
4. 主进程怎么操作数据库
5. 新功能为什么要跨多个文件修改

如果这 5 个问题都能回答，这个项目就算入门了。
