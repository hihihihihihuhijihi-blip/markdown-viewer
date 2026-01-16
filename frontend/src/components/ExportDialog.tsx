/** 导出对话框组件 */
import { useState } from "react";
import { X, FileText, Download, Globe, File, Loader2, Moon, Sun, List, Code } from "lucide-react";

export interface ExportDialogProps {
  /** 是否显示对话框 */
  isOpen: boolean;
  /** 关闭对话框 */
  onClose: () => void;
  /** Markdown 内容 */
  content: string;
  /** 文档标题（用于导出文件名） */
  title?: string;
  /** API 基础 URL */
  apiBaseUrl?: string;
}

export interface ExportOptions {
  /** 导出格式 */
  format: "html" | "pdf" | "md";
  /** 是否包含目录 */
  includeToc: boolean;
  /** 主题 */
  theme: "light" | "dark";
}

export function ExportDialog({
  isOpen,
  onClose,
  content,
  title = "document",
  apiBaseUrl = "http://localhost:8001",
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: "html",
    includeToc: false,
    theme: "light",
  });
  const [isExporting, setIsExporting] = useState(false);

  // 重置状态
  const handleClose = () => {
    setOptions({
      format: "html",
      includeToc: false,
      theme: "light",
    });
    onClose();
  };

  // 执行导出
  const handleExport = async () => {
    setIsExporting(true);

    try {
      let filename = `${title}.${options.format}`;
      let blob: Blob;

      // Markdown 导出直接在客户端处理
      if (options.format === "md") {
        blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        handleClose();
        setIsExporting(false);
        return;
      }

      // HTML 和 PDF 需要调用后端 API
      const response = await fetch(`${apiBaseUrl}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          title,
          format: options.format,
          options: {
            include_toc: options.includeToc,
            theme: options.theme,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "导出失败");
      }

      // 获取文件名
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // 下载文件
      blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      handleClose();
    } catch (err) {
      console.error("导出失败:", err);
      alert(err instanceof Error ? err.message : "导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              导出文档
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 文件名 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              文件名
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">{title}.{options.format}</span>
            </div>
          </div>

          {/* 导出格式 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              导出格式
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setOptions({ ...options, format: "html" })}
                className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg border-2 transition-all ${
                  options.format === "html"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium">HTML</span>
              </button>
              <button
                onClick={() => setOptions({ ...options, format: "pdf" })}
                className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg border-2 transition-all ${
                  options.format === "pdf"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <File className="w-4 h-4" />
                <span className="text-xs font-medium">PDF</span>
              </button>
              <button
                onClick={() => setOptions({ ...options, format: "md" })}
                className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg border-2 transition-all ${
                  options.format === "md"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <Code className="w-4 h-4" />
                <span className="text-xs font-medium">Markdown</span>
              </button>
            </div>
          </div>

          {/* 主题选择 - 仅在 HTML/PDF 时显示 */}
          {options.format !== "md" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                主题
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOptions({ ...options, theme: "light" })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    options.theme === "light"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>浅色</span>
                </button>
                <button
                  onClick={() => setOptions({ ...options, theme: "dark" })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    options.theme === "dark"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>深色</span>
                </button>
              </div>
            </div>
          )}

          {/* 选项 - 仅在 HTML/PDF 时显示 */}
          {options.format !== "md" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                选项
              </label>
              <label className="flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeToc}
                  onChange={(e) => setOptions({ ...options, includeToc: e.target.checked })}
                  className="w-4 h-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500"
                />
                <List className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">包含目录</span>
              </label>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>导出中...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>导出</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
