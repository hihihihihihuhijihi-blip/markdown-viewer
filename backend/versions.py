"""版本管理模块"""
import json
import hashlib
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from config import MARKDOWN_ROOT_PATH

# 版本存储目录
VERSIONS_DIR = MARKDOWN_ROOT_PATH / ".versions"


def _get_versions_dir(file_path: str) -> Path:
    """获取文件的版本存储目录"""
    clean_path = file_path.lstrip("/").replace("/", "_")
    dir_path = VERSIONS_DIR / clean_path
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def _hash_content(content: str) -> str:
    """计算内容的 SHA256 哈希值"""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


async def create_version(file_path: str, content: str, note: str = "") -> Dict[str, Any]:
    """
    创建文件版本快照

    Args:
        file_path: 文件路径
        content: 文件内容
        note: 版本备注

    Returns:
        版本信息
    """
    versions_dir = _get_versions_dir(file_path)

    # 计算内容哈希
    content_hash = _hash_content(content)

    # 检查是否有相同内容的版本
    for version_file in versions_dir.glob("*.json"):
        try:
            with open(version_file, 'r', encoding='utf-8') as f:
                version_data = json.load(f)
                if version_data.get("content_hash") == content_hash:
                    return {
                        "id": version_data["id"],
                        "file_path": file_path,
                        "note": version_data.get("note", ""),
                        "timestamp": version_data["timestamp"],
                        "size": len(content),
                        "hash": content_hash,
                        "is_duplicate": True,
                    }
        except:
            continue

    # 创建新版本
    version_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    version_file = versions_dir / f"{timestamp.replace(':', '-')}.json"

    version_data = {
        "id": version_id,
        "file_path": file_path,
        "content": content,
        "content_hash": content_hash,
        "timestamp": timestamp,
        "size": len(content),
        "note": note,
    }

    with open(version_file, 'w', encoding='utf-8') as f:
        json.dump(version_data, f, ensure_ascii=False, indent=2)

    return {
        "id": version_id,
        "file_path": file_path,
        "note": note,
        "timestamp": timestamp,
        "size": len(content),
        "hash": content_hash,
        "is_duplicate": False,
    }


async def get_versions(file_path: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    获取文件的所有版本

    Args:
        file_path: 文件路径
        limit: 最多返回的版本数量

    Returns:
        版本列表（按时间倒序）
    """
    versions_dir = _get_versions_dir(file_path)

    if not versions_dir.exists():
        return []

    versions = []
    for version_file in sorted(versions_dir.glob("*.json"), reverse=True)[:limit]:
        try:
            with open(version_file, 'r', encoding='utf-8') as f:
                version_data = json.load(f)
                versions.append({
                    "id": version_data["id"],
                    "file_path": file_path,
                    "note": version_data.get("note", ""),
                    "timestamp": version_data["timestamp"],
                    "size": version_data["size"],
                    "hash": version_data["content_hash"],
                })
        except:
            continue

    return versions


async def get_version(version_id: str) -> Optional[Dict[str, Any]]:
    """
    获取指定版本的详细信息

    Args:
        version_id: 版本 ID

    Returns:
        版本信息，如果不存在返回 None
    """
    # 搜索版本文件
    for versions_dir in VERSIONS_DIR.rglob("*"):
        if versions_dir.is_dir():
            for version_file in versions_dir.glob("*.json"):
                try:
                    with open(version_file, 'r', encoding='utf-8') as f:
                        version_data = json.load(f)
                        if version_data.get("id") == version_id:
                            return {
                                "id": version_data["id"],
                                "file_path": version_data["file_path"],
                                "content": version_data["content"],
                                "note": version_data.get("note", ""),
                                "timestamp": version_data["timestamp"],
                                "size": version_data["size"],
                                "hash": version_data["content_hash"],
                            }
                except:
                    continue

    return None


async def restore_version(version_id: str) -> Dict[str, Any]:
    """
    恢复到指定版本

    Args:
        version_id: 版本 ID

    Returns:
        恢复结果
    """
    version = await get_version(version_id)
    if not version:
        raise ValueError(f"版本不存在: {version_id}")

    file_path = MARKDOWN_ROOT_PATH / version["file_path"].lstrip("/")

    # 备份当前内容
    if file_path.exists():
        await create_version(
            version["file_path"],
            file_path.read_text(encoding='utf-8'),
            note="恢复前自动备份"
        )

    # 写入版本内容
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(version["content"])

    return {
        "success": True,
        "file_path": version["file_path"],
        "restored_version_id": version_id,
        "restored_timestamp": version["timestamp"],
    }


async def delete_version(version_id: str) -> Dict[str, Any]:
    """
    删除指定版本

    Args:
        version_id: 版本 ID

    Returns:
        删除结果
    """
    for versions_dir in VERSIONS_DIR.rglob("*"):
        if versions_dir.is_dir():
            for version_file in versions_dir.glob("*.json"):
                try:
                    with open(version_file, 'r', encoding='utf-8') as f:
                        version_data = json.load(f)
                        if version_data.get("id") == version_id:
                            version_file.unlink()
                            return {
                                "success": True,
                                "deleted_version_id": version_id,
                            }
                except:
                    continue

    raise ValueError(f"版本不存在: {version_id}")


async def compare_versions(version_id1: str, version_id2: str) -> Dict[str, Any]:
    """
    对比两个版本的差异

    Args:
        version_id1: 版本1 ID
        version_id2: 版本2 ID

    Returns:
        对比结果
    """
    version1 = await get_version(version_id1)
    version2 = await get_version(version_id2)

    if not version1 or not version2:
        raise ValueError("版本不存在")

    # 简单的行级差异对比
    lines1 = version1["content"].splitlines(keepends=True)
    lines2 = version2["content"].splitlines(keepends=True)

    diff = _compute_line_diff(lines1, lines2)

    return {
        "version1": {
            "id": version1["id"],
            "timestamp": version1["timestamp"],
            "note": version1.get("note", ""),
        },
        "version2": {
            "id": version2["id"],
            "timestamp": version2["timestamp"],
            "note": version2.get("note", ""),
        },
        "diff": diff,
        "stats": {
            "lines_added": len([d for d in diff if d["type"] == "added"]),
            "lines_removed": len([d for d in diff if d["type"] == "removed"]),
            "lines_modified": len([d for d in diff if d["type"] == "modified"]),
            "lines_unchanged": len([d for d in diff if d["type"] == "unchanged"]),
        },
    }


def _compute_line_diff(lines1: List[str], lines2: List[str]) -> List[Dict[str, Any]]:
    """
    计算行级差异（简化实现）

    Args:
        lines1: 原始行列表
        lines2: 新行列表

    Returns:
        差异列表
    """
    diff = []
    max_lines = max(len(lines1), len(lines2))

    for i in range(max_lines):
        line1 = lines1[i] if i < len(lines1) else None
        line2 = lines2[i] if i < len(lines2) else None

        if line1 is None:
            diff.append({
                "line_number": i + 1,
                "type": "added",
                "content": line2.rstrip('\n'),
            })
        elif line2 is None:
            diff.append({
                "line_number": i + 1,
                "type": "removed",
                "content": line1.rstrip('\n'),
            })
        elif line1 != line2:
            diff.append({
                "line_number": i + 1,
                "type": "modified",
                "old_content": line1.rstrip('\n'),
                "new_content": line2.rstrip('\n'),
            })
        else:
            diff.append({
                "line_number": i + 1,
                "type": "unchanged",
                "content": line1.rstrip('\n'),
            })

    return diff


async def cleanup_old_versions(file_path: str, keep_count: int = 20) -> Dict[str, Any]:
    """
    清理旧版本，只保留最新的几个版本

    Args:
        file_path: 文件路径
        keep_count: 保留的版本数量

    Returns:
        清理结果
    """
    versions = await get_versions(file_path, limit=1000)

    if len(versions) <= keep_count:
        return {"deleted_count": 0}

    versions_to_delete = versions[keep_count:]
    deleted_count = 0

    for version in versions_to_delete:
        try:
            version_file = VERSIONS_DIR / version["file_path"].lstrip("/").replace("/", "_") / f"{version['timestamp'].replace(':', '-')}.json"
            if version_file.exists():
                version_file.unlink()
                deleted_count += 1
        except:
            continue

    return {
        "deleted_count": deleted_count,
        "remaining_count": len(versions) - deleted_count,
    }


async def get_all_files_with_versions() -> List[Dict[str, Any]]:
    """
    获取所有有版本的文件列表

    Returns:
        文件列表
    """
    if not VERSIONS_DIR.exists():
        return []

    files = []
    for file_dir in VERSIONS_DIR.iterdir():
        if file_dir.is_dir():
            version_files = list(file_dir.glob("*.json"))
            if version_files:
                # 获取最新版本信息
                latest_version = None
                latest_time = ""
                for vf in version_files:
                    try:
                        with open(vf, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            if data["timestamp"] > latest_time:
                                latest_time = data["timestamp"]
                                latest_version = data
                    except:
                        continue

                if latest_version:
                    # 还原原始文件路径
                    original_path = file_dir.relative_to(VERSIONS_DIR).replace("_", "/")
                    files.append({
                        "path": original_path,
                        "version_count": len(version_files),
                        "latest_timestamp": latest_version["timestamp"],
                        "latest_size": latest_version["size"],
                    })

    return sorted(files, key=lambda x: x["latest_timestamp"], reverse=True)
