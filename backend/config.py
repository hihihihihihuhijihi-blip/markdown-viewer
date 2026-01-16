"""配置模块"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Markdown 文件存储根目录
MARKDOWN_ROOT_PATH = Path(os.getenv("MARKDOWN_ROOT_PATH", "./markdown-files"))

# 确保目录存在
MARKDOWN_ROOT_PATH.mkdir(parents=True, exist_ok=True)

# 服务端口
PORT = int(os.getenv("PORT", 8001))

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {".md", ".markdown", ".txt", ".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf"}

# 最大文件大小 (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# CORS 配置
# 开发环境允许所有源，生产环境必须设置 CORS_ORIGINS 环境变量
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else ["*"]
IS_DEVELOPMENT = os.getenv("ENV", "development") == "development"

# 如果未设置 CORS_ORIGINS 且在开发环境，允许所有源
# 生产环境强烈建议设置 CORS_ORIGINS 为具体域名，如: http://localhost:5173,https://yourdomain.com
if not os.getenv("CORS_ORIGINS") and not IS_DEVELOPMENT:
    print("⚠️  警告: 生产环境未设置 CORS_ORIGINS，当前允许所有源访问。请在 .env 中设置 CORS_ORIGINS")
