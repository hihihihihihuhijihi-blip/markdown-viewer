#!/bin/bash

# Markdown Viewer 启动脚本

echo "🚀 启动 Markdown Viewer..."

# 检查后端虚拟环境
if [ ! -d "backend/venv" ]; then
    echo "📦 创建后端虚拟环境..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# 启动后端
echo "🔧 启动后端服务..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ 启动完成!"
echo "📖 前端地址: http://localhost:5173"
echo "🔌 后端地址: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
