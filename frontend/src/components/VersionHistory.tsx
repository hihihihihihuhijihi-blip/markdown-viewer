/** 版本历史组件 */
import { useState, useEffect } from "react";
import { Clock, RotateCcw, Trash2, ArrowLeftRight } from "lucide-react";

export interface FileVersion {
  id: string;
  file_path: string;
  note: string;
  timestamp: string;
  size: number;
  hash: string;
}

export interface VersionHistoryProps {
  /** 文件路径 */
  filePath: string | null;
  /** 是否显示面板 */
  isOpen: boolean;
  /** 关闭面板 */
  onClose: () => void;
  /** 恢复版本回调 */
  onRestore: (versionId: string) => void;
  /** 对比版本回调 */
  onCompare: (version1Id: string, version2Id: string) => void;
  /** API 基础 URL */
  apiBaseUrl?: string;
}

export function VersionHistory({
  filePath,
  isOpen,
  onClose,
  onRestore,
  onCompare,
  apiBaseUrl = "http://localhost:8001",
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());

  // 加载版本列表
  useEffect(() => {
    if (isOpen && filePath) {
      loadVersions();
    }
  }, [isOpen, filePath]);

  const loadVersions = async () => {
    if (!filePath) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/versions?path=${encodeURIComponent(filePath)}`
      );
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("加载版本失败:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 选择版本用于对比
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedVersions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < 2) {
      newSelected.add(id);
    }
    setSelectedVersions(newSelected);
  };

  // 处理恢复
  const handleRestore = (id: string) => {
    if (confirm("确定要恢复到此版本吗？当前内容将被覆盖。")) {
      onRestore(id);
    }
  };

  // 处理对比
  const handleCompare = () => {
    const ids = Array.from(selectedVersions);
    if (ids.length === 2) {
      onCompare(ids[0], ids[1]);
    }
  };

  // 删除版本
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个版本吗？此操作不可恢复。")) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/versions/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        loadVersions();
      }
    } catch (err) {
      console.error("删除版本失败:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-lg z-40 flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            版本历史
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          ×
        </button>
      </div>

      {/* 版本列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : !filePath ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            请先选择一个文件
          </div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            暂无版本记录
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* 对比按钮 */}
            {selectedVersions.size === 2 && (
              <button
                onClick={handleCompare}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>对比选中的版本</span>
              </button>
            )}

            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`p-3 rounded-lg border transition-colors group ${
                  selectedVersions.has(version.id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* 选择框 */}
                  <input
                    type="checkbox"
                    checked={selectedVersions.has(version.id)}
                    onChange={() => toggleSelect(version.id)}
                    className="mt-1 w-4 h-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {version.note || `版本 ${versions.length - index}`}
                      </span>
                      {index === 0 && (
                        <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                          当前
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{formatTime(version.timestamp)}</span>
                      <span>{formatSize(version.size)}</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index !== 0 && (
                      <button
                        onClick={() => handleRestore(version.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                        title="恢复此版本"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(version.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                      title="删除版本"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
        <p>每次保存时自动创建版本快照</p>
      </div>
    </div>
  );
}
