"""FastAPI 主应用"""
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os

from file_operations import get_directory_tree, read_file, save_file, search_files, upload_file, upload_image, rename_file, delete_file
from config import PORT, MARKDOWN_ROOT_PATH, CORS_ORIGINS
from logger_config import logger, log_request, log_file_operation
from exporters import export_to_html, export_to_pdf
from versions import create_version, get_versions, get_version, restore_version, compare_versions, delete_version, cleanup_old_versions

app = FastAPI(title="Markdown Viewer API")

# CORS 配置
# 根据环境变量设置允许的源，开发环境允许所有源，生产环境建议限制
# 在 .env 文件中设置: CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class FileSaveRequest(BaseModel):
    path: str
    content: str


class FileRenameRequest(BaseModel):
    path: str
    new_name: str


class ExportRequest(BaseModel):
    content: str
    title: str = "Markdown Document"
    format: str = "html"  # html 或 pdf
    options: Optional[dict] = None


class CreateVersionRequest(BaseModel):
    path: str
    content: str
    note: Optional[str] = None


@app.get("/")
async def root():
    """健康检查"""
    return {"status": "ok", "message": "Markdown Viewer API is running"}


@app.get("/api/tree")
async def get_tree(path: str = Query("")):
    """获取目录结构"""
    try:
        tree = await get_directory_tree(path)
        log_request("GET", f"/api/tree?path={path}", 200)
        return {"data": tree}
    except PermissionError as e:
        log_request("GET", f"/api/tree?path={path}", 403, str(e))
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        log_request("GET", f"/api/tree?path={path}", 500, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/file")
async def get_file(path: str = Query(...)):
    """读取文件内容"""
    try:
        content = await read_file(path)
        log_request("GET", f"/api/file?path={path}", 200)
        return {"content": content}
    except FileNotFoundError as e:
        log_request("GET", f"/api/file?path={path}", 404, str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        log_request("GET", f"/api/file?path={path}", 400, str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log_request("GET", f"/api/file?path={path}", 500, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/save")
async def save_file_endpoint(request: FileSaveRequest):
    """保存文件"""
    try:
        # 保存前创建版本快照
        try:
            await read_file(request.path)
            await create_version(request.path, request.content, "自动保存")
        except:
            pass  # 文件不存在时不创建版本

        result = await save_file(request.path, request.content)
        log_file_operation("SAVE", request.path, True)
        return {"success": result}
    except PermissionError as e:
        log_file_operation("SAVE", request.path, False, str(e))
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        log_file_operation("SAVE", request.path, False, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search")
async def search(q: str = Query(..., min_length=1), path: str = Query("")):
    """搜索文件内容"""
    try:
        results = await search_files(q, path)
        logger.info(f"Search: query='{q}', path='{path}', results={len(results)}")
        return {"results": results}
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    path: str = Form("")
):
    """上传文件"""
    try:
        # 读取文件内容
        content = await file.read()

        # 上传文件
        result = await upload_file(file.filename, content, path)
        log_file_operation("UPLOAD", result.get("path", file.filename), True)

        return {
            "success": True,
            "file": result
        }
    except ValueError as e:
        log_file_operation("UPLOAD", file.filename, False, str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        log_file_operation("UPLOAD", file.filename, False, str(e))
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        log_file_operation("UPLOAD", file.filename, False, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-image")
async def upload_image_endpoint(
    file: UploadFile = File(...)
):
    """上传图片"""
    try:
        # 读取文件内容
        content = await file.read()

        # 上传图片
        result = await upload_image(file.filename, content)
        logger.info(f"Image uploaded: {file.filename} -> {result.get('path')}")

        return {
            "success": True,
            "image": result
        }
    except ValueError as e:
        logger.error(f"Image upload failed: {file.filename} - {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Image upload failed: {file.filename} - {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/{image_path:path}")
async def get_image(image_path: str):
    """获取上传的图片"""
    # 安全检查路径
    clean_path = image_path.lstrip("/")
    full_path = (MARKDOWN_ROOT_PATH / clean_path).resolve()

    # 确保路径在允许的目录内
    try:
        full_path.relative_to(MARKDOWN_ROOT_PATH.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="路径穿越攻击检测")

    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="图片不存在")

    return FileResponse(full_path)


@app.post("/api/rename")
async def rename_file_endpoint(request: FileRenameRequest):
    """重命名文件或目录"""
    try:
        result = await rename_file(request.path, request.new_name)
        log_file_operation("RENAME", f"{request.path} -> {result.get('new_name')}", True)
        return result
    except FileNotFoundError as e:
        log_file_operation("RENAME", request.path, False, str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        log_file_operation("RENAME", request.path, False, str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        log_file_operation("RENAME", request.path, False, str(e))
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        log_file_operation("RENAME", request.path, False, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/file")
async def delete_file_endpoint(path: str = Query(...)):
    """删除文件或目录"""
    try:
        result = await delete_file(path)
        log_file_operation("DELETE", path, True)
        return result
    except FileNotFoundError as e:
        log_file_operation("DELETE", path, False, str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        log_file_operation("DELETE", path, False, str(e))
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        log_file_operation("DELETE", path, False, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export")
async def export_file(request: ExportRequest):
    """导出 Markdown 为 HTML 或 PDF"""
    try:
        format_type = request.format.lower()

        if format_type == "html":
            # 导出为 HTML
            html_content = export_to_html(
                request.content,
                request.title,
                request.options or {}
            )
            logger.info(f"Exported to HTML: {request.title}")
            return Response(
                content=html_content,
                media_type="text/html",
                headers={
                    "Content-Disposition": f'attachment; filename="{request.title}.html"'
                }
            )

        elif format_type == "pdf":
            # 导出为 PDF
            pdf_bytes = export_to_pdf(
                request.content,
                request.title,
                request.options or {}
            )
            logger.info(f"Exported to PDF: {request.title}")
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{request.title}.pdf"'
                }
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的导出格式: {format_type}。支持的格式: html, pdf"
            )

    except ImportError as e:
        logger.error(f"PDF export failed: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="PDF 导出功能需要安装 weasyprint。请运行: pip install weasyprint"
        )
    except Exception as e:
        logger.error(f"Export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 版本管理 API ====================

@app.post("/api/versions")
async def create_version_endpoint(request: CreateVersionRequest):
    """手动创建文件版本"""
    try:
        version = await create_version(request.path, request.content, request.note or "手动保存")
        logger.info(f"Version created: {request.path} - {version['id']}")
        return version
    except Exception as e:
        logger.error(f"Create version failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/versions")
async def get_versions_endpoint(path: str = Query(...), limit: int = Query(50)):
    """获取文件的所有版本"""
    try:
        versions = await get_versions(path, limit)
        return {"versions": versions}
    except Exception as e:
        logger.error(f"Get versions failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/versions/{version_id}")
async def get_version_endpoint(version_id: str):
    """获取指定版本的详细信息"""
    try:
        version = await get_version(version_id)
        if not version:
            raise HTTPException(status_code=404, detail="版本不存在")
        return version
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get version failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/versions/{version_id}/restore")
async def restore_version_endpoint(version_id: str):
    """恢复到指定版本"""
    try:
        result = await restore_version(version_id)
        logger.info(f"Version restored: {version_id}")
        return result
    except ValueError as e:
        logger.error(f"Restore version failed: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Restore version failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/versions/compare")
async def compare_versions_endpoint(v1: str = Query(...), v2: str = Query(...)):
    """对比两个版本的差异"""
    try:
        diff = await compare_versions(v1, v2)
        return diff
    except ValueError as e:
        logger.error(f"Compare versions failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Compare versions failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/versions/{version_id}")
async def delete_version_endpoint(version_id: str):
    """删除指定版本"""
    try:
        result = await delete_version(version_id)
        logger.info(f"Version deleted: {version_id}")
        return result
    except ValueError as e:
        logger.error(f"Delete version failed: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Delete version failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
