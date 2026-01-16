/** 版本对比组件 */
import { useState, useEffect } from "react";
import { X, ArrowRight, Minus, Plus } from "lucide-react";

export interface DiffLine {
  line_number: number;
  type: "added" | "removed" | "modified" | "unchanged";
  content?: string;
  old_content?: string;
  new_content?: string;
}

export interface VersionDiffProps {
  /** 版本1 ID */
  version1Id: string | null;
  /** 版本2 ID */
  version2Id: string | null;
  /** 是否显示对话框 */
  isOpen: boolean;
  /** 关闭对话框 */
  onClose: () => void;
  /** API 基础 URL */
  apiBaseUrl?: string;
}

interface CompareResult {
  version1: {
    id: string;
    timestamp: string;
    note: string;
  };
  version2: {
    id: string;
    timestamp: string;
    note: string;
  };
  diff: DiffLine[];
  stats: {
    lines_added: number;
    lines_removed: number;
    lines_modified: number;
    lines_unchanged: number;
  };
}

export function VersionDiff({
  version1Id,
  version2Id,
  isOpen,
  onClose,
  apiBaseUrl = "http://localhost:8001",
}: VersionDiffProps) {
  const [diff, setDiff] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");

  // 加载对比数据
  useEffect(() => {
    if (isOpen && version1Id && version2Id) {
      loadDiff();
    }
  }, [isOpen, version1Id, version2Id]);

  const loadDiff = async () => {
    if (!version1Id || !version2Id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/versions/compare?v1=${version1Id}&v2=${version2Id}`
      );
      if (response.ok) {
        const data = await response.json();
        setDiff(data);
      }
    } catch (err) {
      console.error("加载版本对比失败:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取差异行的样式
  const getDiffRowClass = (line: DiffLine) => {
    switch (line.type) {
      case "added":
        return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
      case "removed":
        return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
      case "modified":
        return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300";
      default:
        return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[80vh] mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            版本对比
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : diff ? (
            <>
              {/* 版本信息 */}
              <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-slate-500">旧版本:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                      {diff.version1.note || formatTime(diff.version1.timestamp)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="text-sm">
                    <span className="text-slate-500">新版本:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                      {diff.version2.note || formatTime(diff.version2.timestamp)}
                    </span>
                  </div>
                </div>

                {/* 视图切换 */}
                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("side-by-side")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      viewMode === "side-by-side"
                        ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    并排
                  </button>
                  <button
                    onClick={() => setViewMode("unified")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      viewMode === "unified"
                        ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    统一
                  </button>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center gap-6 px-6 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-1">
                  <Plus className="w-3 h-3 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">
                    {diff.stats.lines_added} 新增
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Minus className="w-3 h-3 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">
                    {diff.stats.lines_removed} 删除
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-amber-600 dark:text-amber-400">
                    {diff.stats.lines_modified} 修改
                  </span>
                </div>
              </div>

              {/* 差异内容 */}
              <div className="flex-1 overflow-auto font-mono text-sm">
                {viewMode === "side-by-side" ? (
                  <div className="grid grid-cols-2">
                    {/* 旧版本 */}
                    <div className="border-r border-slate-200 dark:border-slate-700">
                      <div className="sticky top-0 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                        {diff.version1.note || formatTime(diff.version1.timestamp)}
                      </div>
                      {diff.diff.map((line, idx) => (
                        <div
                          key={idx}
                          className={`px-4 py-0.5 border-b border-slate-100 dark:border-slate-800 ${getDiffRowClass(line)}`}
                        >
                          {(line.type === "removed" || line.type === "modified") && line.old_content ? (
                            <span>{line.old_content}</span>
                          ) : line.type === "unchanged" ? (
                            <span className="text-slate-400">{line.content}</span>
                          ) : (
                            <span className="text-slate-300">&nbsp;</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 新版本 */}
                    <div>
                      <div className="sticky top-0 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                        {diff.version2.note || formatTime(diff.version2.timestamp)}
                      </div>
                      {diff.diff.map((line, idx) => (
                        <div
                          key={idx}
                          className={`px-4 py-0.5 border-b border-slate-100 dark:border-slate-800 ${getDiffRowClass(line)}`}
                        >
                          {(line.type === "added" || line.type === "modified") && line.new_content ? (
                            <span>{line.new_content}</span>
                          ) : line.type === "unchanged" ? (
                            <span className="text-slate-400">{line.content}</span>
                          ) : (
                            <span className="text-slate-300">&nbsp;</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 统一视图 */
                  <div>
                    {diff.diff.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex px-4 py-0.5 border-b border-slate-100 dark:border-slate-800 ${getDiffRowClass(line)}`}
                      >
                        <span className="w-12 text-xs text-slate-400 select-none">
                          {line.line_number}
                        </span>
                        <span className="flex-1">
                          {line.type === "unchanged" && (
                            <span className="text-slate-600 dark:text-slate-400">{line.content}</span>
                          )}
                          {line.type === "removed" && (
                            <span className="text-red-600 dark:text-red-400 line-through">{line.old_content}</span>
                          )}
                          {line.type === "added" && (
                            <span className="text-green-600 dark:text-green-400">{line.new_content}</span>
                          )}
                          {line.type === "modified" && (
                            <>
                              <span className="text-red-600 dark:text-red-400 line-through mr-2">{line.old_content}</span>
                              <span className="text-green-600 dark:text-green-400">{line.new_content}</span>
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400">
              请选择两个版本进行对比
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
