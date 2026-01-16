"""文件操作模块"""
import os
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from config import MARKDOWN_ROOT_PATH, ALLOWED_EXTENSIONS, MAX_FILE_SIZE


def normalize_path(relative_path: str) -> Path:
    """规范化路径，防止路径穿越攻击"""
    # 移除开头的斜杠
    clean_path = relative_path.lstrip("/")
    # 构建完整路径
    full_path = (MARKDOWN_ROOT_PATH / clean_path).resolve()
    # 确保路径在允许的根目录内
    try:
        full_path.relative_to(MARKDOWN_ROOT_PATH.resolve())
    except ValueError:
        raise PermissionError("路径穿越攻击检测")
    return full_path


def get_file_type(path: Path) -> str:
    """获取文件类型"""
    if path.is_dir():
        return "directory"
    suffix = path.suffix.lower()
    if suffix in {".md", ".markdown"}:
        return "markdown"
    if suffix in {".txt", ".text"}:
        return "text"
    if suffix in {".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".cpp", ".go", ".rs"}:
        return "code"
    if suffix in {".json", ".yaml", ".yml", ".toml", ".ini"}:
        return "config"
    return "unknown"


def build_tree(path: Path, relative_to: Path = None) -> Dict[str, Any]:
    """构建文件树节点"""
    if relative_to is None:
        relative_to = MARKDOWN_ROOT_PATH

    try:
        rel_path = path.relative_to(relative_to)
    except ValueError:
        rel_path = path

    return {
        "name": path.name,
        "path": str(rel_path).replace("\\", "/"),
        "type": get_file_type(path),
        "children": None if path.is_file() else [],
    }


async def get_directory_tree(relative_path: str = "") -> List[Dict[str, Any]]:
    """获取目录结构"""
    target_path = normalize_path(relative_path) if relative_path else MARKDOWN_ROOT_PATH

    if not target_path.exists():
        return []

    if target_path.is_file():
        return [build_tree(target_path)]

    result = []

    try:
        for item in sorted(target_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
            # 跳过隐藏文件
            if item.name.startswith("."):
                continue

            node = build_tree(item, MARKDOWN_ROOT_PATH)

            if item.is_dir():
                # 递归获取子目录内容
                node["children"] = await get_directory_tree(str(item.relative_to(MARKDOWN_ROOT_PATH)))
            else:
                node["children"] = None

            result.append(node)
    except PermissionError:
        pass

    return result


async def read_file(relative_path: str) -> str:
    """读取文件内容"""
    file_path = normalize_path(relative_path)

    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError(f"文件不存在: {relative_path}")

    # 检查文件大小
    file_size = file_path.stat().st_size
    if file_size > MAX_FILE_SIZE:
        raise ValueError(f"文件过大 ({file_size} bytes)，最大支持 {MAX_FILE_SIZE} bytes")

    # 读取文件
    try:
        # 尝试 UTF-8 编码
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            # 尝试其他编码
            with open(file_path, "r", encoding="gbk") as f:
                return f.read()
        except:
            raise ValueError("无法解码文件内容")


async def save_file(relative_path: str, content: str) -> bool:
    """保存文件到服务器"""
    file_path = normalize_path(relative_path)

    # 确保父目录存在
    file_path.parent.mkdir(parents=True, exist_ok=True)

    # 写入文件
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    return True


async def search_files(query: str, relative_path: str = "") -> List[Dict[str, Any]]:
    """在文件中搜索关键字"""
    if not query or len(query) < 2:
        return []

    target_path = normalize_path(relative_path) if relative_path else MARKDOWN_ROOT_PATH

    if not target_path.exists():
        return []

    results = []
    pattern = re.compile(re.escape(query), re.IGNORECASE)

    def search_in_file(file_path: Path):
        """在单个文件中搜索"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line_num, line in enumerate(f, 1):
                    if pattern.search(line):
                        rel_path = file_path.relative_to(MARKDOWN_ROOT_PATH)
                        return {
                            "path": str(rel_path).replace("\\", "/"),
                            "line": line_num,
                            "preview": line.strip()[:100],
                        }
        except:
            pass
        return None

    def scan_directory(path: Path):
        """扫描目录"""
        for item in path.iterdir():
            if item.name.startswith("."):
                continue

            if item.is_dir():
                scan_directory(item)
            elif item.is_file():
                result = search_in_file(item)
                if result:
                    results.append(result)

    if target_path.is_file():
        result = search_in_file(target_path)
        if result:
            results.append(result)
    else:
        scan_directory(target_path)

    return results[:100]  # 限制返回结果数量


async def upload_file(filename: str, content: bytes, relative_path: str = "") -> Dict[str, Any]:
    """上传文件到服务器"""
    # 验证文件扩展名
    file_path = Path(filename)
    suffix = file_path.suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError(f"不支持的文件类型，允许的类型: {', '.join(ALLOWED_EXTENSIONS)}")

    # 检查文件大小
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"文件过大，最大支持 {MAX_FILE_SIZE} bytes")

    # 构建保存路径
    if relative_path:
        target_dir = normalize_path(relative_path)
    else:
        target_dir = MARKDOWN_ROOT_PATH

    # 确保目录存在
    target_dir.mkdir(parents=True, exist_ok=True)

    # 保存文件
    save_path = target_dir / file_path.name
    with open(save_path, "wb") as f:
        f.write(content)

    rel_path = save_path.relative_to(MARKDOWN_ROOT_PATH)

    return {
        "path": str(rel_path).replace("\\", "/"),
        "name": file_path.name,
        "size": len(content),
    }


async def upload_image(filename: str, content: bytes) -> Dict[str, Any]:
    """上传图片文件"""
    # 验证图片类型
    file_path = Path(filename)
    suffix = file_path.suffix.lower()

    image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"}
    if suffix not in image_extensions:
        raise ValueError(f"不支持的图片类型，允许的类型: {', '.join(image_extensions)}")

    # 检查文件大小 (图片最大 5MB)
    max_image_size = 5 * 1024 * 1024
    if len(content) > max_image_size:
        raise ValueError(f"图片过大，最大支持 5MB")

    # 创建图片目录
    images_dir = MARKDOWN_ROOT_PATH / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # 生成唯一文件名
    import uuid
    unique_name = f"{uuid.uuid4().hex[:8]}_{file_path.name}"
    save_path = images_dir / unique_name

    # 保存图片
    with open(save_path, "wb") as f:
        f.write(content)

    # 返回相对于 markdown-files 的路径
    rel_path = save_path.relative_to(MARKDOWN_ROOT_PATH)

    return {
        "url": f"/api/images/{rel_path}",
        "path": str(rel_path).replace("\\", "/"),
        "name": file_path.name,
        "size": len(content),
    }


async def rename_file(relative_path: str, new_name: str) -> Dict[str, Any]:
    """重命名文件或目录"""
    old_path = normalize_path(relative_path)

    if not old_path.exists():
        raise FileNotFoundError(f"文件不存在: {relative_path}")

    # 验证新文件名
    if not new_name or new_name in {".", ".."}:
        raise ValueError("无效的文件名")

    # 检查危险特殊字符（跨平台兼容）
    forbidden_chars = {'<', '>', ':', '"', '|', '?', '*', '/', '\\'}
    if any(char in new_name for char in forbidden_chars):
        raise ValueError(f"文件名不能包含以下字符: {' '.join(forbidden_chars)}")

    # 检查以点开头（隐藏文件）
    if new_name.startswith("."):
        raise ValueError("文件名不能以点开头")

    # 检查文件名长度（大多数文件系统限制为 255 字节）
    if len(new_name.encode('utf-8')) > 200:
        raise ValueError("文件名过长（最大 200 字节）")

    # 构建新路径
    new_path = old_path.parent / new_name

    # 检查新路径是否已存在
    if new_path.exists():
        raise ValueError(f"文件名已存在: {new_name}")

    try:
        # 重命名
        old_path.rename(new_path)

        # 返回新路径信息
        rel_path = new_path.relative_to(MARKDOWN_ROOT_PATH)
        return {
            "success": True,
            "old_path": str(old_path.relative_to(MARKDOWN_ROOT_PATH)).replace("\\", "/"),
            "new_path": str(rel_path).replace("\\", "/"),
            "new_name": new_name,
        }
    except PermissionError:
        raise PermissionError("没有权限重命名此文件")
    except Exception as e:
        raise Exception(f"重命名失败: {str(e)}")


async def delete_file(relative_path: str) -> Dict[str, Any]:
    """删除文件或目录"""
    file_path = normalize_path(relative_path)

    if not file_path.exists():
        raise FileNotFoundError(f"文件不存在: {relative_path}")

    try:
        if file_path.is_dir():
            import shutil
            shutil.rmtree(file_path)
        else:
            file_path.unlink()

        return {
            "success": True,
            "path": str(file_path.relative_to(MARKDOWN_ROOT_PATH)).replace("\\", "/"),
        }
    except PermissionError:
        raise PermissionError("没有权限删除此文件")
    except Exception as e:
        raise Exception(f"删除失败: {str(e)}")
