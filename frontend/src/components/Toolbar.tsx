/** 工具栏组件 */
import { Moon, Sun, Upload, RefreshCw, FileText, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface ToolbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onRefresh: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Toolbar({
  isDarkMode,
  onToggleDarkMode,
  onRefresh,
  onUpload,
  isLoading = false,
  isSidebarOpen,
  onToggleSidebar,
}: ToolbarProps) {
  return (
    <header className="h-12 flex items-center justify-between px-5 glass border-b border-slate-200/80 dark:border-slate-800/80 shadow-elevation-1 relative z-50 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all duration-200"
          title={isSidebarOpen ? "收起侧边栏" : "展开侧边栏"}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-lg shadow-primary-500/25">
            <FileText className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
              Markdown Viewer
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="group relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 transition-all duration-200"
          title="刷新文件树"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        <label className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95">
          <Upload className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          <span>上传文件</span>
          <input type="file" accept=".md,.markdown,.txt" multiple className="hidden" onChange={onUpload} />
        </label>

        <button
          onClick={onToggleDarkMode}
          className="group relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all duration-200 overflow-hidden"
          title={isDarkMode ? "切换亮色模式" : "切换暗色模式"}
        >
          <div className="relative">
            {isDarkMode ? (
              <Sun className="w-5 h-5 transition-all duration-300 group-hover:rotate-90 group-hover:text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 transition-all duration-300 group-hover:-rotate-12 group-hover:text-primary-500" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
