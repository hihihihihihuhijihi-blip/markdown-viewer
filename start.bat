@echo off
echo 🚀 启动 Markdown Viewer...

REM 启动后端
echo 🔧 启动后端服务...
cd backend
if not exist venv (
    echo 📦 创建后端虚拟环境...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
start /B python main.py
cd ..

REM 等待后端启动
timeout /t 2 /nobreak >nul

REM 启动前端
echo 🎨 启动前端服务...
cd frontend
start npm run dev
cd ..

echo ✅ 启动完成!
echo 📖 前端地址: http://localhost:5173
echo 🔌 后端地址: http://localhost:8000
echo.
echo 关闭此窗口不会停止服务，请手动关闭各自的服务窗口
