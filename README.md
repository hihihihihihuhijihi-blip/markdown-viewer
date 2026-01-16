# Markdown Viewer

一个基于 Web 的 Markdown 文件查看和编辑工具，支持服务器文件和本地文件。

## 功能特性

- **Markdown 预览** - 实时渲染 Markdown，支持 GFM（表格、删除线、任务列表）
- **代码高亮** - 自动识别并高亮代码块
- **编辑功能** - 左右分屏编辑，实时预览
- **目录导航** - 文件树展示，支持展开/折叠
- **搜索功能** - 跨文件搜索内容
- **暗色模式** - 支持亮色/暗色主题切换
- **本地文件** - 支持上传本地 Markdown 文件

## 技术栈

### 前端
- React 19 + TypeScript
- Vite
- Tailwind CSS
- react-markdown + remark-gfm + rehype-highlight
- lucide-react

### 后端
- Python FastAPI
- uvicorn
- aiofiles

## 快速开始

### 1. 配置后端

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 MARKDOWN_ROOT_PATH 为你的 Markdown 文件目录

# 启动后端服务
python main.py
```

### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. 访问应用

打开浏览器访问 `http://localhost:5173`

## 项目结构

```
markdown-viewer/
├── backend/           # Python FastAPI 后端
│   ├── main.py        # 主应用
│   ├── config.py      # 配置
│   ├── file_operations.py  # 文件操作
│   └── requirements.txt
└── frontend/          # React 前端
    ├── src/
    │   ├── components/   # 组件
    │   ├── hooks/        # 自定义 Hooks
    │   ├── lib/          # 工具函数
    │   └── types/        # 类型定义
    └── package.json
```

## API 端点

- `GET /api/tree` - 获取目录结构
- `GET /api/file?path=xxx` - 读取文件内容
- `POST /api/save` - 保存文件
- `GET /api/search?q=xxx` - 搜索文件内容

## 使用说明

1. **查看服务器文件** - 左侧文件树显示服务器目录中的文件，点击即可打开
2. **上传本地文件** - 点击顶部"上传文件"按钮选择本地 Markdown 文件
3. **编辑保存** - 在左侧编辑器编辑内容，点击"保存"或按 ⌘S 保存到服务器
4. **搜索** - 在左侧搜索框输入关键字，实时搜索文件内容
