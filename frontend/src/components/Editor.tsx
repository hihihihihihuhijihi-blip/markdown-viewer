/** 编辑器组件 */
import { useRef } from "react";
import { Save, FileEdit, Maximize2, Minimize2, Lock } from "lucide-react";
import { useState } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  fileName?: string;
  canSave?: boolean;
}

export function Editor({ value, onChange, onSave, fileName, canSave = true }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 处理 Tab 键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue =
        value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd =
          start + 2;
      }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      onSave();
    }
  };

  // 同步滚动
  const handleScroll = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const scrollRatio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
      window.dispatchEvent(
        new CustomEvent("editor-scroll", { detail: { scrollRatio } })
      );
    }
  };

  // 获取文件扩展名图标颜色
  const getFileColor = () => {
    if (!fileName) return "text-slate-400";
    if (fileName.endsWith(".md")) return "text-primary-500";
    if (fileName.endsWith(".js") || fileName.endsWith(".ts") || fileName.endsWith(".tsx")) return "text-accent-500";
    return "text-slate-400";
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <FileEdit className={`w-4 h-4 ${getFileColor()}`} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {fileName || "未命名文件"}
          </span>
          {value && canSave && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="未保存" />
          )}
          {!canSave && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md" title="这是临时文件，无法保存">
              <Lock className="w-3 h-3" />
              只读
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200"
            title={isFullscreen ? "退出全屏" : "全屏编辑"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {canSave ? (
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存</span>
              <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-primary-600/50 rounded font-mono">⌘S</kbd>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg cursor-not-allowed"
              title="此文件无法保存"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>无法保存</span>
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 relative">
        {/* 行号区域 */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col items-end py-4 pr-3 text-xs text-slate-400 dark:text-slate-600 font-mono select-none overflow-hidden">
          {value.split("\n").map((_, i) => (
            <div key={i} className="leading-7">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="flex-1 w-full h-full pl-14 pr-4 py-4 resize-none outline-none font-mono text-sm leading-7 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-700"
          placeholder="开始输入 Markdown 内容..."
          spellCheck={false}
        />
      </div>
      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/80 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>{value.split("\n").length} 行</span>
          <span>{value.length} 字符</span>
        </div>
        <div>Markdown</div>
      </div>
    </div>
  );
}
