# Git提交日志管理工具

一个本地部署的Web应用，用于记录和管理项目的Git提交日志。

## 项目背景

因为需要维护公司多个项目，经常忘记记录修改内容或记录不完整。这个工具能够帮助清晰地记录每个项目的修改历史、分类和便签。

## 技术架构

- **后端**: Node.js + Koa2
- **数据库**: SQLite3 (文件数据库，无需服务)
- **ORM**: Sequelize (用于操作 SQLite)
- **前端**: Vue3 (使用 Vite 构建)
- **UI 组件库**: Element Plus
- **HTTP 客户端**: Axios (前后端通信)

## 核心功能

### 数据模型

- **项目表 (Project)**: 记录项目基本信息
- **记录表 (CommitLog)**: 记录每个项目的提交日志，包括修改内容、分类和便签

### 后端 API

- **项目相关**:
  - GET /api/projects: 获取所有项目列表
  - POST /api/projects: 新增项目

- **记录相关**:
  - GET /api/commits?projectId=&category=&keyword=: 获取记录列表（支持按项目ID、分类、关键词模糊查询）
  - POST /api/commits: 新增记录 (必须包含 projectId 和 content)
  - PUT /api/commits/:id: 修改记录
  - DELETE /api/commits/:id: 删除记录

### 前端页面

- **顶部筛选栏**: 项目筛选下拉框 + 分类筛选下拉框 + 全局搜索框
- **主内容区**: 记录列表（按时间倒序）
- **每条记录显示**: 项目名、分类、内容摘要、便签、时间
- **新增面板**: 表单包含"选择项目"(必选)、"输入内容"(必填)、"分类"(可选)、"便签"(可选，支持回车添加)

## 安装步骤

1. **克隆项目**

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动项目**
   ```bash
   npm run dev
   ```

4. **访问页面**
   打开浏览器，访问 http://localhost:5173/

## 使用方法

1. **新增项目**
   - 在后端API中调用 POST /api/projects 接口
   - 或在前端页面中通过新增记录时选择项目（如果项目不存在，需要先通过API创建）

2. **新增记录**
   - 点击"新增记录"按钮
   - 填写项目、内容、分类和便签
   - 点击"保存"按钮

3. **查看记录**
   - 页面加载时会自动获取所有记录
   - 可以通过筛选框按项目、分类和关键词搜索

4. **编辑记录**
   - 点击记录卡片下方的"编辑"按钮
   - 修改内容后点击"保存"按钮

5. **删除记录**
   - 点击记录卡片下方的"删除"按钮

## 项目结构

```
project-root/
├── backend/              # 后端代码
│   ├── app.js            # 主应用文件
│   ├── routes/           # 路由文件
│   │   ├── projectRoutes.js  # 项目相关路由
│   │   └── commitRoutes.js   # 记录相关路由
│   ├── controllers/      # 控制器文件
│   │   ├── ProjectController.js  # 项目控制器
│   │   └── CommitLogController.js  # 记录控制器
│   ├── models/           # 模型文件
│   │   ├── index.js      # 数据库连接和模型初始化
│   │   ├── Project.js    # 项目模型
│   │   └── CommitLog.js  # 记录模型
│   └── data/             # 数据库文件目录
├── frontend/             # 前端代码
│   ├── src/              # 源代码
│   │   ├── views/        # 页面视图
│   │   ├── api/          # API封装
│   │   │   └── index.js  # API请求函数
│   │   ├── components/   # 组件
│   │   ├── main.js       # 主入口文件
│   │   └── App.vue       # 根组件
│   ├── package.json      # 前端依赖
│   └── vite.config.js    # Vite配置
├── package.json          # 项目依赖和脚本
└── README.md             # 项目说明文档
```

## API接口说明

### 项目相关

- **GET /api/projects**
  - 功能: 获取所有项目列表
  - 响应: `{ success: true, data: [项目列表] }`

- **POST /api/projects**
  - 功能: 新增项目
  - 请求体: `{ name: "项目名称", description: "项目描述" }`
  - 响应: `{ success: true, data: 项目对象, message: "项目创建成功" }`

### 记录相关

- **GET /api/commits**
  - 功能: 获取记录列表
  - 查询参数:
    - projectId: 项目ID（可选）
    - category: 分类（可选）
    - keyword: 关键词（可选，模糊查询content字段）
  - 响应: `{ success: true, data: [记录列表] }`

- **POST /api/commits**
  - 功能: 新增记录
  - 请求体: `{ projectId: 项目ID, content: "修改内容", category: "分类", tags: "便签1,便签2" }`
  - 响应: `{ success: true, data: 记录对象, message: "记录创建成功" }`

- **PUT /api/commits/:id**
  - 功能: 修改记录
  - 请求体: `{ content: "修改内容", category: "分类", tags: "便签1,便签2" }`
  - 响应: `{ success: true, data: 记录对象, message: "记录更新成功" }`

- **DELETE /api/commits/:id**
  - 功能: 删除记录
  - 响应: `{ success: true, message: "记录删除成功" }`

## 注意事项

1. 数据库文件存放于 `backend/data/logs.db`，是一个SQLite文件
2. 项目使用本地部署，无需联网
3. 无用户认证功能，纯本地个人使用
4. 前端通过Vite的代理功能将API请求转发到后端服务器

## 开发环境

- Node.js 14+
- npm 6+

## 许可证

MIT
