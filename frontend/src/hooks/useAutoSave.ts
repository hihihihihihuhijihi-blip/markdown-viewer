/** 自动保存 Hook */
import { useEffect, useRef, useCallback, useState } from "react";

export interface AutoSaveOptions {
  /** 自动保存间隔（毫秒），默认 30 秒 */
  interval?: number;
  /** 是否启用自动保存 */
  enabled?: boolean;
  /** 本地存储键名前缀 */
  storageKey?: string;
}

export interface AutoSaveState {
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
  /** 最后保存时间 */
  lastSavedAt: Date | null;
  /** 是否正在保存 */
  isSaving: boolean;
  /** 上次保存是否成功 */
  saveSuccess: boolean | null;
}

export function useAutoSave(
  filePath: string | null,
  content: string,
  saveFn: (content: string) => Promise<boolean>,
  options: AutoSaveOptions = {}
) {
  const {
    interval = 30000, // 默认 30 秒
    enabled = true,
    storageKey = "markdown-autosave",
  } = options;

  // 状态管理
  const [state, setState] = useState<AutoSaveState>({
    hasUnsavedChanges: false,
    lastSavedAt: null,
    isSaving: false,
    saveSuccess: null,
  });

  // 使用 ref 存储定时器，避免闭包问题
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 存储上次保存的内容，用于对比变化
  const lastSavedContentRef = useRef<string>("");

  /** 手动保存 */
  const save = useCallback(async () => {
    if (!filePath || !enabled) return;

    setState((prev) => ({ ...prev, isSaving: true, saveSuccess: null }));

    try {
      const success = await saveFn(content);
      if (success) {
        lastSavedContentRef.current = content;
        // 清除本地备份
        localStorage.removeItem(`${storageKey}/${filePath}`);
        setState({
          hasUnsavedChanges: false,
          lastSavedAt: new Date(),
          isSaving: false,
          saveSuccess: true,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          saveSuccess: false,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        saveSuccess: false,
      }));
    }
  }, [filePath, content, saveFn, enabled, storageKey]);

  /** 恢复本地备份 */
  const restoreFromBackup = useCallback(() => {
    if (!filePath) return null;
    const backup = localStorage.getItem(`${storageKey}/${filePath}`);
    return backup;
  }, [filePath, storageKey]);

  /** 设置自动保存定时器 */
  useEffect(() => {
    if (!enabled || !filePath) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 检查内容是否有变化
    const hasChanges = content !== lastSavedContentRef.current;

    if (hasChanges) {
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }));

      // 保存到本地存储作为备份
      localStorage.setItem(`${storageKey}/${filePath}`, content);

      // 清除之前的定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 设置新的自动保存定时器
      timerRef.current = setTimeout(() => {
        save();
      }, interval);
    } else {
      setState((prev) => ({ ...prev, hasUnsavedChanges: false }));
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, filePath, enabled, interval, save, storageKey]);

  /** 页面离开前提醒保存 */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Chrome 需要设置 returnValue
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state.hasUnsavedChanges]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    save,
    restoreFromBackup,
  };
}
