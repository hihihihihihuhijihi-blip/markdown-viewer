/** 预览组件 */
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Eye, FileText, Maximize2, Minimize2, Download } from "lucide-react";
import { ExportDialog } from "./ExportDialog";

interface PreviewProps {
  content: string;
  searchQuery?: string;
  fileName?: string;
}

export function Preview({ content, searchQuery: _searchQuery = "", fileName = "document" }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // 同步滚动
  useEffect(() => {
    const handleEditorScroll = (e: CustomEvent<{ scrollRatio: number }>) => {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = e.detail.scrollRatio * (container.scrollHeight - container.clientHeight);
      }
    };

    window.addEventListener("editor-scroll", handleEditorScroll as EventListener);
    return () => {
      window.removeEventListener("editor-scroll", handleEditorScroll as EventListener);
    };
  }, []);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* 工具栏 - 与编辑器顶部工具栏一致的样式 */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            预览
          </span>
        </div>
        <div className="flex items-center gap-1">
          {content && (
            <button
              onClick={() => setIsExportDialogOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="导出"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={isFullscreen ? "退出全屏" : "全屏预览"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto min-h-0"
      >
        {content ? (
          <div className="p-4 sm:p-6 markdown-body max-w-4xl mx-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="empty-state h-full">
            <FileText className="empty-state-icon" />
            <p className="empty-state-text">选择或创建一个文件开始预览</p>
          </div>
        )}
      </div>

      {/* 导出对话框 */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        content={content}
        title={fileName.replace(/\.md$/, "")}
      />
    </div>
  );
}
