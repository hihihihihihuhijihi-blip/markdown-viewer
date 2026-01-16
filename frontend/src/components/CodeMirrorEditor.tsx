/** CodeMirror 6 Markdown 编辑器组件 */
import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
  type KeyBinding,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { highlightSelectionMatches } from "@codemirror/search";
import { autocompletion } from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { Save, Maximize2, Minimize2, Lock, Edit2, Download, History } from "lucide-react";
import { toast } from "./Toast";

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  fileName?: string;
  canSave?: boolean;
  onPasteImage?: (file: File) => Promise<string>;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onRename?: (newName?: string) => void;
  onDownload?: () => void;
  onShowVersionHistory?: () => void;
}

export interface CodeMirrorEditorRef {
  editorView: EditorView | null;
}

// 创建保存功能的扩展工厂
const createSaveExtension = (onSave: () => void) => {
  return keymap.of([
    {
      key: "Mod-s",
      run: () => {
        onSave();
        return true;
      },
    },
  ]);
};

// 粗体快捷键
const boldExtension = keymap.of([
  {
    key: "Mod-b",
    run: (view) => {
      const selection = view.state.selection.main;
      const transaction = view.state.update({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: `****${view.state.sliceDoc(selection.from, selection.to)}****`,
        },
        selection: {
          anchor: selection.from + 2,
          head: selection.to + 2,
        },
      });
      view.dispatch(transaction);
      return true;
    },
  },
]);

// 斜体快捷键
const italicExtension = keymap.of([
  {
    key: "Mod-i",
    run: (view) => {
      const selection = view.state.selection.main;
      const transaction = view.state.update({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: `**${view.state.sliceDoc(selection.from, selection.to)}**`,
        },
        selection: {
          anchor: selection.from + 1,
          head: selection.to + 1,
        },
      });
      view.dispatch(transaction);
      return true;
    },
  },
]);

// 图片粘贴处理器工厂
const createImagePasteHandler = (onPasteImage: (file: File) => Promise<string>) => {
  return EditorView.domEventHandlers({
    paste(event, view) {
      const items = event.clipboardData?.items;
      if (!items) return false;

      const imageFiles = Array.from(items).filter(
        (item) => item.type.startsWith("image/")
      );

      if (imageFiles.length === 0) return false;

      event.preventDefault();

      const handleImageUpload = async (file: File) => {
        try {
          toast("正在上传图片...", "info");
          const imageUrl = await onPasteImage(file);
          const transaction = view.state.update({
            changes: {
              from: view.state.selection.main.from,
              to: view.state.selection.main.to,
              insert: `![${file.name}](${imageUrl})`,
            },
          });
          view.dispatch(transaction);
        } catch (error) {
          toast("图片上传失败", "error");
        }
      };

      imageFiles.forEach((item) => {
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
      });

      return true;
    },
  });
};

// 基础样式（暗色和亮色通用）
const baseStyles = EditorView.theme({
  "&": {
    fontSize: "14px",
    lineHeight: "1.7",
  },
  ".cm-scroller": {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
    overflow: "auto",
  },
  ".cm-content": {
    padding: "16px 16px 16px 60px",
    whiteSpace: "pre-wrap !important",
    wordBreak: "break-word",
  },
  ".cm-line": {
    padding: "0 0",
  },
  ".cm-lineNumbers": {
    minWidth: "50px",
  },
  ".cm-gutters": {
    backgroundColor: "transparent !important",
    borderRight: "none !important",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent !important",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent !important",
  },
});

// 暗色样式覆盖
const darkStyleOverride = EditorView.theme({
  "&": {
    backgroundColor: "#0f172a !important",
  },
  ".cm-gutters": {
    color: "#475569 !important",
  },
  ".cm-lineNumbers": {
    color: "#475569 !important",
  },
  ".cm-content": {
    color: "#e2e8f0 !important",
  },
});

// 亮色样式覆盖
const lightStyleOverride = EditorView.theme({
  "&": {
    backgroundColor: "#ffffff !important",
  },
  ".cm-gutters": {
    color: "#94a3b8 !important",
  },
  ".cm-lineNumbers": {
    color: "#cbd5e1 !important",
  },
  ".cm-content": {
    color: "#1e293b !important",
  },
});

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorRef, CodeMirrorEditorProps>(
  ({ value, onChange, onSave, fileName, canSave = true, onPasteImage, isFullscreen = false, onToggleFullscreen, onRename, onDownload, onShowVersionHistory }, ref) => {
    const editorContainer = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFileName, setEditFileName] = useState("");
    const fileNameInputRef = useRef<HTMLInputElement>(null);

    // 暴露 editorView 给父组件
    useImperativeHandle(ref, () => ({
      editorView: viewRef.current,
    }));

    // 使用 ref 存储 onSave 和 onPasteImage，避免频繁重建编辑器
    const saveCallbackRef = useRef(onSave);
    const pasteCallbackRef = useRef(onPasteImage);

    useEffect(() => {
      saveCallbackRef.current = onSave;
      pasteCallbackRef.current = onPasteImage;
    }, [onSave, onPasteImage]);

    // 编辑文件名时自动聚焦
    useEffect(() => {
      if (isEditing && fileNameInputRef.current) {
        fileNameInputRef.current.focus();
        fileNameInputRef.current.select();
      }
    }, [isEditing]);

    // 开始编辑文件名
    const handleStartEdit = () => {
      setEditFileName(fileName || "");
      setIsEditing(true);
    };

    // 保存文件名编辑
    const handleSaveEdit = () => {
      if (editFileName.trim() && editFileName !== fileName) {
        onRename?.(editFileName.trim());
      }
      setIsEditing(false);
    };

    // 取消编辑
    const handleCancelEdit = () => {
      setIsEditing(false);
    };

    // 键盘事件
    const handleEditKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    };

    // 初始化编辑器
    useEffect(() => {
      if (!editorContainer.current) return;

      const isDark = document.documentElement.classList.contains("dark");

      const startState = EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          foldGutter({
            openText: "{'",
            closedText: "'}",
          }),
          drawSelection(),
          dropCursor(),
          indentOnInput(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          bracketMatching(),
          rectangularSelection(),
          crosshairCursor(),
          highlightSelectionMatches(),
          keymap.of(defaultKeymap),
          keymap.of(historyKeymap),
          keymap.of([
            ...(foldKeymap as readonly KeyBinding[]),
            lintKeymap as KeyBinding,
            indentWithTab as KeyBinding,
          ]),
          createSaveExtension(() => saveCallbackRef.current?.()),
          boldExtension,
          italicExtension,
          markdown({ codeLanguages: languages }),
          autocompletion(),
          onPasteImage ? createImagePasteHandler((file) => pasteCallbackRef.current!(file)) : [],
          baseStyles,
          isDark ? oneDark : lightStyleOverride,
          darkStyleOverride,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
        ],
      });

      const view = new EditorView({
        state: startState,
        parent: editorContainer.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, []);

    // 更新编辑器内容（仅当外部变化时）
    useEffect(() => {
      if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: value,
          },
        });
      }
    }, [value]);

    // 监听主题变化并重新创建编辑器（简单但有效的方法）
    useEffect(() => {
      const handleThemeChange = () => {
        if (viewRef.current && editorContainer.current) {
          const view = viewRef.current;
          const isDark = document.documentElement.classList.contains("dark");
          const currentValue = view.state.doc.toString();

          // 销毁旧视图
          view.destroy();

          // 创建新视图
          const newState = EditorState.create({
            doc: currentValue,
            extensions: [
              lineNumbers(),
              highlightActiveLineGutter(),
              highlightSpecialChars(),
              history(),
              foldGutter({
                openText: "{'",
                closedText: "'}",
              }),
              drawSelection(),
              dropCursor(),
              indentOnInput(),
              syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
              bracketMatching(),
              rectangularSelection(),
              crosshairCursor(),
              highlightSelectionMatches(),
              keymap.of(defaultKeymap),
              keymap.of(historyKeymap),
              keymap.of([
                ...(foldKeymap as readonly KeyBinding[]),
                lintKeymap as KeyBinding,
                indentWithTab as KeyBinding,
              ]),
              createSaveExtension(() => saveCallbackRef.current?.()),
              boldExtension,
              italicExtension,
              markdown({ codeLanguages: languages }),
              autocompletion(),
              onPasteImage ? createImagePasteHandler((file) => pasteCallbackRef.current!(file)) : [],
              baseStyles,
              isDark ? oneDark : lightStyleOverride,
              darkStyleOverride,
              EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                  onChange(update.state.doc.toString());
                }
              }),
            ],
          });

          const newView = new EditorView({
            state: newState,
            parent: editorContainer.current,
          });

          viewRef.current = newView;
        }
      };

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            handleThemeChange();
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => observer.disconnect();
    }, [onChange, onPasteImage]);

    const lines = value.split("\n").length;
    const chars = value.length;

    return (
      <div className={`flex flex-col h-full bg-white dark:bg-slate-900 ${isFullscreen ? "" : "border-r border-slate-200 dark:border-slate-700"}`}>
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-3 py-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {isEditing ? (
              <input
                ref={fileNameInputRef}
                type="text"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleEditKeyDown}
                className="flex-1 min-w-0 max-w-[140px] px-1.5 py-0.5 text-xs font-medium bg-white dark:bg-slate-800 border border-blue-500 rounded outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                  {fileName || "未命名文件"}
                </span>
                {onRename && canSave && (
                  <button
                    onClick={handleStartEdit}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                    title="重命名文件"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
            {canSave && value && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="未保存" />
            )}
            {!canSave && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md flex-shrink-0">
                <Lock className="w-2.5 h-2.5" />
                只读
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title={isFullscreen ? "退出全屏" : "全屏编辑"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="下载文件"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {onShowVersionHistory && canSave && (
              <button
                onClick={onShowVersionHistory}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="版本历史"
              >
                <History className="w-4 h-4" />
              </button>
            )}

            {canSave ? (
              <button
                onClick={onSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all shadow-sm hover:shadow active:scale-95 min-h-[36px]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存</span>
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg cursor-not-allowed min-h-[36px]"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>无法保存</span>
              </button>
            )}
          </div>
        </div>

        {/* 编辑器容器 */}
        <div className="flex-1 min-h-0">
          <div ref={editorContainer} className="h-full overflow-auto" />
        </div>

        {/* 状态栏 */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/80 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>{lines} 行</span>
            <span>{chars} 字符</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Markdown</span>
          </div>
        </div>
      </div>
    );
  }
);

CodeMirrorEditor.displayName = "CodeMirrorEditor";
