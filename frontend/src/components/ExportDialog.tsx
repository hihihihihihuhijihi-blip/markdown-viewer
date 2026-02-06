/** 导出对话框组件 - 纯前端实现 */
import { useState } from "react";
import { X, FileText, Download, Globe, File, Loader2, Moon, Sun, List, Code } from "lucide-react";
import html2pdf from "html2pdf.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { createRoot } from "react-dom/client";

export interface ExportDialogProps {
  /** 是否显示对话框 */
  isOpen: boolean;
  /** 关闭对话框 */
  onClose: () => void;
  /** Markdown 内容 */
  content: string;
  /** 文档标题（用于导出文件名） */
  title?: string;
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

  // 生成 HTML 模板
  const generateHTML = async (markdownContent: string): Promise<string> => {
    const theme = options.theme;
    const isDark = theme === "dark";

    // 提取目录
    let toc = "";
    if (options.includeToc) {
      const headings = markdownContent.match(/^#{1,3}\s+.+$/gm) || [];
      if (headings.length > 0) {
        toc = `
          <nav class="toc">
            <h2 class="toc-title">目录</h2>
            <ul class="toc-list">
              ${headings.map((heading) => {
                const level = heading.match(/^#/)?.[0].length || 1;
                const text = heading.replace(/^#+\s+/, "");
                const slug = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-");
                return `<li class="toc-item toc-level-${level}"><a href="#${slug}">${text}</a></li>`;
              }).join("\n")}
            </ul>
          </nav>
        `;
      }
    }

    // 渲染 Markdown 内容为 HTML
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.width = "800px";
    tempDiv.innerHTML = `
      <div class="markdown-body ${isDark ? "dark" : ""}">
        ${toc}
        <div class="content"></div>
      </div>
    `;
    document.body.appendChild(tempDiv);

    const contentDiv = tempDiv.querySelector(".content") as HTMLElement;
    if (contentDiv) {
      const root = createRoot(contentDiv);
      root.render(
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1({ children }) {
              const text = typeof children === "string" ? children : children?.toString() || "";
              const slug = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-");
              return <h1 id={slug}>{children}</h1>;
            },
            h2({ children }) {
              const text = typeof children === "string" ? children : children?.toString() || "";
              const slug = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-");
              return <h2 id={slug}>{children}</h2>;
            },
            h3({ children }) {
              const text = typeof children === "string" ? children : children?.toString() || "";
              const slug = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-");
              return <h3 id={slug}>{children}</h3>;
            },
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      );

      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const html = tempDiv.innerHTML;
      document.body.removeChild(tempDiv);
      root.unmount();

      // 完整的 HTML 文档
      const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg-color: ${isDark ? "#1e293b" : "#ffffff"};
      --text-color: ${isDark ? "#e2e8f0" : "#1e293b"};
      --border-color: ${isDark ? "#334155" : "#e2e8f0"};
      --code-bg: ${isDark ? "#0f172a" : "#f1f5f9"};
      --code-border: ${isDark ? "#334155" : "#e2e8f0"};
      --link-color: #3b82f6;
      --quote-bg: ${isDark ? "#1e293b" : "#f8fafc"};
      --quote-border: #3b82f6;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg-color);
      color: var(--text-color);
      line-height: 1.7;
      padding: 2rem;
    }

    .markdown-body {
      max-width: 800px;
      margin: 0 auto;
    }

    /* 目录样式 */
    .toc {
      background: ${isDark ? "#334155" : "#f8fafc"};
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .toc-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-color);
    }

    .toc-list {
      list-style: none;
    }

    .toc-item {
      margin: 0.5rem 0;
    }

    .toc-level-1 { padding-left: 0; }
    .toc-level-2 { padding-left: 1.5rem; }
    .toc-level-3 { padding-left: 3rem; }

    .toc-item a {
      color: var(--link-color);
      text-decoration: none;
      display: block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .toc-item a:hover {
      background: ${isDark ? "#475569" : "#e2e8f0"};
    }

    /* Markdown 样式 */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.3;
    }

    h1 { font-size: 2.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
    h2 { font-size: 1.875rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    h5 { font-size: 1.125rem; }
    h6 { font-size: 1rem; color: #6b7280; }

    p { margin: 1em 0; }

    a { color: var(--link-color); text-decoration: none; }
    a:hover { text-decoration: underline; }

    strong, b { font-weight: 600; }
    em, i { font-style: italic; }

    code {
      font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
      font-size: 0.875em;
      background: var(--code-bg);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      border: 1px solid var(--code-border);
    }

    pre {
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      margin: 1em 0;
    }

    pre code {
      background: transparent;
      border: none;
      padding: 0;
      font-size: 0.875em;
    }

    blockquote {
      border-left: 4px solid var(--quote-border);
      padding-left: 1rem;
      margin: 1em 0;
      color: ${isDark ? "#94a3b8" : "#64748b"};
      background: var(--quote-bg);
      padding: 1rem;
      border-radius: 0 8px 8px 0;
    }

    ul, ol { margin: 1em 0; padding-left: 2em; }
    li { margin: 0.5em 0; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      overflow: hidden;
      border-radius: 8px;
    }

    th, td {
      border: 1px solid var(--border-color);
      padding: 0.75rem 1rem;
      text-align: left;
    }

    th {
      background: ${isDark ? "#334155" : "#f1f5f9"};
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: ${isDark ? "#1e293b" : "#f8fafc"};
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em 0;
    }

    hr {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 2em 0;
    }

    /* 任务列表 */
    input[type="checkbox"] {
      margin-right: 0.5em;
    }

    @media print {
      body { padding: 0; }
      .toc { page-break-after: always; }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
      return fullHtml;
    }

    return "";
  };

  // 执行导出
  const handleExport = async () => {
    setIsExporting(true);

    try {
      let filename = `${title}.${options.format}`;

      // Markdown 导出直接在客户端处理
      if (options.format === "md") {
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
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

      // HTML 导出
      if (options.format === "html") {
        const html = await generateHTML(content);
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
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

      // PDF 导出
      if (options.format === "pdf") {
        const html = await generateHTML(content);

        // 创建一个临时容器来渲染 HTML
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.width = "210mm"; // A4 宽度
        container.style.padding = "20mm";
        container.innerHTML = html;
        document.body.appendChild(container);

        // 等待样式应用
        await new Promise(resolve => setTimeout(resolve, 100));

        // 配置 html2pdf
        const pdfOptions = {
          margin: [10, 10, 10, 10],
          filename: filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        };

        // 生成 PDF
        await html2pdf().set(pdfOptions).from(container).save();

        // 清理
        document.body.removeChild(container);

        handleClose();
      }
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
