/** 键盘快捷键 Hook */
import { useEffect, useRef, useCallback } from "react";

export interface Shortcut {
  /** 快捷键描述 */
  description: string;
  /** 快捷键组合 (如 "Ctrl+S", "Ctrl+Shift+P") */
  keys: string;
  /** 回调函数 */
  handler: (e: KeyboardEvent) => void;
  /** 是否禁用此快捷键 */
  disabled?: boolean;
}

export interface KeyboardShortcutsReturn {
  /** 注册快捷键 */
  registerShortcut: (shortcut: Shortcut) => void;
  /** 注销快捷键 */
  unregisterShortcut: (keys: string) => void;
  /** 触发指定快捷键 */
  triggerShortcut: (keys: string) => void;
}

/**
 * 解析快捷键字符串为键盘事件属性
 */
function parseShortcut(keys: string): {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  key: string;
} {
  const parts = keys.toLowerCase().split("+");
  return {
    ctrlKey: parts.includes("ctrl"),
    shiftKey: parts.includes("shift"),
    altKey: parts.includes("alt"),
    metaKey: parts.includes("meta") || parts.includes("cmd") || parts.includes("command"),
    key: parts[parts.length - 1].toUpperCase(),
  };
}

/**
 * 检查键盘事件是否匹配快捷键
 */
function matchesShortcut(e: KeyboardEvent, shortcut: ReturnType<typeof parseShortcut>): boolean {
  return (
    e.ctrlKey === shortcut.ctrlKey &&
    e.shiftKey === shortcut.shiftKey &&
    e.altKey === shortcut.altKey &&
    e.metaKey === shortcut.metaKey &&
    e.key.toUpperCase() === shortcut.key
  );
}

/**
 * 将快捷键字符串格式化为显示文本
 */
export function formatShortcut(keys: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  return keys
    .replace(/Ctrl/g, isMac ? "⌘" : "Ctrl")
    .replace(/Meta|Cmd|Command/g, "⌘")
    .replace(/Alt/g, "⌥")
    .replace(/Shift/g, "⇧")
    .replace(/\+/g, " + ");
}

export function useKeyboardShortcuts(): KeyboardShortcutsReturn {
  const shortcutsRef = useRef<Map<string, Shortcut>>(new Map());

  /** 注册快捷键 */
  const registerShortcut = useCallback((shortcut: Shortcut) => {
    shortcutsRef.current.set(shortcut.keys, shortcut);
  }, []);

  /** 注销快捷键 */
  const unregisterShortcut = useCallback((keys: string) => {
    shortcutsRef.current.delete(keys);
  }, []);

  /** 触发指定快捷键 */
  const triggerShortcut = useCallback((keys: string) => {
    const shortcut = shortcutsRef.current.get(keys);
    if (shortcut && !shortcut.disabled) {
      // 创建一个模拟的键盘事件
      const mockEvent = new KeyboardEvent("keydown", {
        ctrlKey: keys.includes("Ctrl") || keys.includes("ctrl"),
        shiftKey: keys.includes("Shift") || keys.includes("shift"),
        altKey: keys.includes("Alt") || keys.includes("alt"),
        metaKey: keys.includes("Meta") || keys.includes("Cmd") || keys.includes("Command") || keys.includes("cmd"),
        key: keys.split("+").pop()?.toUpperCase(),
      });
      shortcut.handler(mockEvent);
    }
  }, []);

  /** 全局键盘事件监听 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框或文本区域中
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.closest(".cm-content"); // CodeMirror 编辑器

      // 遍历所有注册的快捷键
      for (const [keys, shortcut] of shortcutsRef.current) {
        if (shortcut.disabled) continue;

        const parsed = parseShortcut(keys);
        if (matchesShortcut(e, parsed)) {
          // 对于输入框中的快捷键，只允许特定的快捷键
          if (isInputFocused) {
            // 在编辑器中允许的快捷键
            const allowedInInput = [
              "Ctrl+S", "Ctrl+P", "Ctrl+Shift+P", "Ctrl+B", "Ctrl+/",
              "Ctrl+Tab", "Ctrl+Shift+Tab", "Escape",
              // Mac 版本
              "Cmd+S", "Cmd+P", "Cmd+Shift+P", "Cmd+B", "Cmd+/",
            ];
            if (!allowedInInput.includes(keys)) {
              continue;
            }
          }

          e.preventDefault();
          e.stopPropagation();
          shortcut.handler(e);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
    triggerShortcut,
  };
}
