"""日志配置模块"""
import logging
import sys
from pathlib import Path
from datetime import datetime
from config import IS_DEVELOPMENT


class ColoredFormatter(logging.Formatter):
    """带颜色的控制台日志格式化器"""

    # ANSI 颜色代码
    COLORS = {
        'DEBUG': '\033[36m',      # 青色
        'INFO': '\033[32m',       # 绿色
        'WARNING': '\033[33m',    # 黄色
        'ERROR': '\033[31m',      # 红色
        'CRITICAL': '\033[35m',   # 紫色
    }
    RESET = '\033[0m'

    def format(self, record):
        # 添加颜色
        levelcolor = self.COLORS.get(record.levelname, '')
        record.levelname = f"{levelcolor}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logger(name: str = "markdown-viewer") -> logging.Logger:
    """设置并返回配置好的日志记录器"""

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if IS_DEVELOPMENT else logging.INFO)

    # 避免重复添加处理器
    if logger.handlers:
        return logger

    # 创建日志目录
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG if IS_DEVELOPMENT else logging.INFO)

    # 控制台格式（带颜色）
    console_format = ColoredFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_format)

    # 文件处理器（错误日志）
    error_file_handler = logging.FileHandler(
        log_dir / f"error_{datetime.now().strftime('%Y%m%d')}.log",
        encoding='utf-8'
    )
    error_file_handler.setLevel(logging.ERROR)
    file_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    error_file_handler.setFormatter(file_format)

    # 文件处理器（所有日志）
    all_file_handler = logging.FileHandler(
        log_dir / f"app_{datetime.now().strftime('%Y%m%d')}.log",
        encoding='utf-8'
    )
    all_file_handler.setLevel(logging.DEBUG)
    all_file_handler.setFormatter(file_format)

    # 添加处理器
    logger.addHandler(console_handler)
    logger.addHandler(error_file_handler)
    logger.addHandler(all_file_handler)

    return logger


# 创建全局日志实例
logger = setup_logger()


def log_request(method: str, path: str, status_code: int = None, error: str = None):
    """记录 API 请求"""
    if error:
        logger.error(f"{method} {path} - Error: {error}")
    else:
        logger.info(f"{method} {path} - Status: {status_code}")


def log_file_operation(operation: str, path: str, success: bool = True, detail: str = None):
    """记录文件操作"""
    status = "SUCCESS" if success else "FAILED"
    msg = f"File {operation}: {path} - {status}"
    if detail:
        msg += f" - {detail}"

    if success:
        logger.info(msg)
    else:
        logger.error(msg)
