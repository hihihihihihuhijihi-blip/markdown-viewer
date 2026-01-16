/** 自动保存状态指示器 */
import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export interface AutoSaveIndicatorProps {
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
  /** 最后保存时间 */
  lastSavedAt: Date | null;
  /** 是否正在保存 */
  isSaving: boolean;
  /** 上次保存是否成功 */
  saveSuccess: boolean | null;
}

export function AutoSaveIndicator({
  hasUnsavedChanges,
  lastSavedAt,
  isSaving,
  saveSuccess,
}: AutoSaveIndicatorProps) {
  const getStatusText = () => {
    if (isSaving) return "保存中...";
    if (hasUnsavedChanges) return "有未保存的更改";
    if (lastSavedAt) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastSavedAt.getTime()) / 1000);

      if (diff < 60) return "刚刚保存";
      if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前保存`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前保存`;
      return `${Math.floor(diff / 86400)} 天前保存`;
    }
    return "";
  };

  const getStatusIcon = () => {
    if (isSaving) {
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />;
    }
    if (hasUnsavedChanges) {
      return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (saveSuccess === true || lastSavedAt) {
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    }
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  const statusText = getStatusText();

  if (!statusText) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
        isSaving
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          : hasUnsavedChanges
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
      }`}
    >
      {getStatusIcon()}
      <span className="font-medium">{statusText}</span>
    </div>
  );
}
