/** 键盘快捷键帮助面板 */
import { X, Keyboard } from "lucide-react";
import { formatShortcut } from "../hooks/useKeyboardShortcuts";

export interface ShortcutItem {
  keys: string;
  description: string;
  category?: string;
}

interface KeyboardShortcutsHelpProps {
  /** 是否显示帮助面板 */
  isOpen: boolean;
  /** 关闭帮助面板 */
  onClose: () => void;
  /** 快捷键列表 */
  shortcuts: ShortcutItem[];
}

/** 默认快捷键列表 */
export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { keys: "Ctrl+S", description: "保存文件", category: "文件" },
  { keys: "Ctrl+P", description: "快速打开文件", category: "文件" },
  { keys: "Ctrl+Shift+P", description: "打开命令面板", category: "命令" },
  { keys: "Ctrl+B", description: "切换侧边栏", category: "视图" },
  { keys: "Ctrl+/", description: "显示快捷键帮助", category: "帮助" },
  { keys: "Ctrl+Tab", description: "切换到下一个文件", category: "导航" },
  { keys: "Ctrl+Shift+Tab", description: "切换到上一个文件", category: "导航" },
  { keys: "Escape", description: "关闭弹窗/面板", category: "通用" },
];

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  // 按分类分组
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || "其他";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  // 分类顺序
  const categoryOrder = ["文件", "编辑", "视图", "导航", "命令", "帮助", "通用", "其他"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              键盘快捷键
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {categoryOrder
              .filter((cat) => groupedShortcuts[cat])
              .map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {groupedShortcuts[category].map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                      >
                        <span className="text-slate-700 dark:text-slate-300">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2.5 py-1 text-sm font-mono font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                          {formatShortcut(shortcut.keys)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500">
          按 <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">ESC</kbd> 或点击外部区域关闭
        </div>
      </div>
    </div>
  );
}
