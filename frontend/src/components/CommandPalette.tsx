/** 命令面板组件 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Search, FileText, FolderOpen, Save, Moon } from "lucide-react";

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  handler: () => void;
  category?: "file" | "edit" | "view" | "settings";
}

interface CommandPaletteProps {
  /** 是否显示命令面板 */
  isOpen: boolean;
  /** 关闭命令面板 */
  onClose: () => void;
  /** 可用的命令列表 */
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 过滤命令
  const filteredCommands = commands.filter((command) => {
    const query = searchQuery.toLowerCase();
    return (
      command.label.toLowerCase().includes(query) ||
      command.description?.toLowerCase().includes(query)
    );
  });

  // 获取分类名称
  const getCategoryName = (category?: string) => {
    const names: Record<string, string> = {
      file: "文件",
      edit: "编辑",
      view: "视图",
      settings: "设置",
    };
    return category ? names[category] || "其他" : "其他";
  };

  // 获取图标
  const getDefaultIcon = (category?: string) => {
    const icons: Record<string, React.ReactNode> = {
      file: <FileText className="w-4 h-4" />,
      edit: <Save className="w-4 h-4" />,
      view: <FolderOpen className="w-4 h-4" />,
      settings: <Moon className="w-4 h-4" />,
    };
    return category ? icons[category] || <Search className="w-4 h-4" /> : <Search className="w-4 h-4" />;
  };

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].handler();
          onClose();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  // 滚动到选中项
  useEffect(() => {
    if (listRef.current && filteredCommands[selectedIndex]) {
      const items = listRef.current.querySelectorAll("li");
      const selectedItem = items[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, filteredCommands.length]);

  // 执行命令
  const executeCommand = useCallback((command: Command) => {
    command.handler();
    onClose();
  }, [onClose]);

  // 按分类分组命令
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    const category = command.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索框 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入命令搜索..."
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <span className="text-xs text-slate-400">ESC</span>
        </div>

        {/* 命令列表 */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              未找到匹配的命令
            </div>
          ) : (
            <ul ref={listRef} className="py-2">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <li key={category}>
                  <div className="px-4 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {getCategoryName(category)}
                  </div>
                  {cmds.map((command) => {
                    // 计算在所有命令中的实际索引
                    const actualIndex = filteredCommands.indexOf(command);
                    const isSelected = actualIndex === selectedIndex;

                    return (
                      <button
                        key={command.id}
                        onClick={() => executeCommand(command)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <span className={`flex-shrink-0 ${isSelected ? "text-blue-500" : "text-slate-400"}`}>
                          {command.icon || getDefaultIcon(command.category)}
                        </span>
                        <span className="flex-1 font-medium">{command.label}</span>
                        {command.description && (
                          <span className="text-sm text-slate-400">{command.description}</span>
                        )}
                      </button>
                    );
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部提示 */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          <span>↑↓ 导航</span>
          <span>Enter 执行</span>
          <span>ESC 关闭</span>
        </div>
      </div>
    </div>
  );
}
