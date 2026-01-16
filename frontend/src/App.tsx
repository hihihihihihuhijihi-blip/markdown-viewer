import { useEffect, useState, useRef } from "react";
import { FileTree } from "./components/FileTree";
import { Preview } from "./components/Preview";
import { SearchBar } from "./components/SearchBar";
import { Toolbar } from "./components/Toolbar";
import { ToastContainer, useToast, toast } from "./components/Toast";
import { TableOfContents } from "./components/TableOfContents";
import { MarkdownToolbar } from "./components/MarkdownToolbar";
import { CodeMirrorEditor } from "./components/CodeMirrorEditor";
import { AutoSaveIndicator } from "./components/AutoSaveIndicator";
import { CommandPalette, type Command } from "./components/CommandPalette";
import { KeyboardShortcutsHelp, DEFAULT_SHORTCUTS } from "./components/KeyboardShortcutsHelp";
import { VersionHistory } from "./components/VersionHistory";
import { VersionDiff } from "./components/VersionDiff";
import { useFileSystem } from "./hooks/useFileSystem";
import { useSearch } from "./hooks/useSearch";
import { useAutoSave } from "./hooks/useAutoSave";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import "./index.css";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored === "true" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarOpen");
    return stored !== "false";
  });
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [versionDiffVersions, setVersionDiffVersions] = useState<{ v1: string | null; v2: string | null }>({
    v1: null,
    v2: null,
  });

  const {
    fileTree,
    currentFile,
    fileContent,
    setFileContent,
    isLoading,
    error,
    loadTree,
    loadFile,
    saveCurrentFile,
    setCurrentFile,
  } = useFileSystem();

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    debouncedSearch,
    clearSearchTimer,
  } = useSearch();

  // 自动保存功能
  const autoSave = useAutoSave(currentFile, fileContent, saveCurrentFile, {
    interval: 30000, // 30 秒自动保存
    enabled: !!currentFile, // 只在有打开文件时启用
  });

  // 键盘快捷键
  const { registerShortcut } = useKeyboardShortcuts();

  const { toasts, removeToast } = useToast();
  const editorViewRef = useRef<any>(null);

  // 初始化加载
  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // 清理搜索定时器
  useEffect(() => {
    return () => {
      clearSearchTimer();
    };
  }, [clearSearchTimer]);

  // 暗色模式切换
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(isDarkMode));
  }, [isDarkMode]);

  // 显示错误提示
  useEffect(() => {
    if (error) {
      toast(error, "error", 5000);
    }
  }, [error]);

  // 处理文件上传
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          toast(`文件上传成功: ${file.name}`, "success");
          await loadTree();
          if (result.file?.path) {
            await loadFile(result.file.path);
          }
        } else {
          const error = await response.json();
          toast(error.detail || "上传失败", "error");
        }
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setFileContent(content);
          setCurrentFile(null);
          toast(`已加载本地文件: ${file.name} (无法保存到服务器)`, "warning");
        };
        reader.readAsText(file);
      }
    }

    e.target.value = "";
  };

  // 处理图片粘贴上传
  const handlePasteImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/upload-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("图片上传失败");
    }

    const result = await response.json();
    return `${import.meta.env.VITE_API_URL || "http://localhost:8001"}${result.image.url}`;
  };

  // 处理保存
  const handleSave = async () => {
    const success = await saveCurrentFile(fileContent);
    if (success) {
      toast("保存成功！", "success");
    } else {
      toast("保存失败，请重试", "error");
    }
  };

  // 处理刷新
  const handleRefresh = async () => {
    await loadTree();
    toast("文件树已刷新", "info");
  };

  // 切换侧边栏
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem("sidebarOpen", String(newValue));
      return newValue;
    });
  };

  // 插入 Markdown 语法
  const handleInsertMarkdown = (markdown: string) => {
    if (editorViewRef.current) {
      const view = editorViewRef.current;
      const transaction = view.state.update({
        changes: {
          from: view.state.selection.main.from,
          to: view.state.selection.main.to,
          insert: markdown,
        },
      });
      view.dispatch(transaction);
      view.focus();
    }
  };

  // 处理文件重命名
  const handleRename = async (oldPath: string, newName: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: oldPath, new_name: newName }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast(error.detail || "重命名失败", "error");
        return;
      }

      const result = await response.json();

      // 如果重命名的是当前打开的文件，更新当前文件路径
      if (currentFile === oldPath) {
        setCurrentFile(result.new_path);
      }

      toast(`已重命名为: ${newName}`, "success");
      await loadTree();
    } catch (err) {
      toast("重命名失败，请重试", "error");
    }
  };

  // 处理文件删除
  const handleDelete = async (path: string) => {
    if (!confirm("确定要删除吗？此操作不可恢复。")) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/file?path=${encodeURIComponent(path)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        toast(error.detail || "删除失败", "error");
        return;
      }

      // 如果删除的是当前打开的文件，清空编辑器
      if (currentFile === path) {
        setCurrentFile(null);
        setFileContent("");
      }

      toast("删除成功", "success");
      await loadTree();
    } catch (err) {
      toast("删除失败，请重试", "error");
    }
  };

  // 从编辑器工具栏触发重命名
  const handleRenameFromEditor = (newName?: string) => {
    if (!currentFile) return;

    if (newName) {
      handleRename(currentFile, newName);
    } else {
      const currentName = currentFile.split("/").pop() || "";
      const inputName = prompt("请输入新文件名：", currentName);
      if (inputName && inputName !== currentName) {
        handleRename(currentFile, inputName);
      }
    }
  };

  // 处理文件下载
  const handleDownload = () => {
    const rawFileName = currentFile?.split("/").pop() || "未命名.md";

    // 清理文件名中的危险字符
    const sanitizeFileName = (name: string): string => {
      // 移除或替换危险字符
      return name
        .replace(/[<>:"|?*\\/]/g, '') // 移除 Windows 不允许的字符
        .replace(/\s+/g, '_') // 空格替换为下划线
        .slice(0, 200); // 限制长度
    };

    const cleanName = sanitizeFileName(rawFileName);
    const fileName = cleanName.endsWith(".md") ? cleanName : `${cleanName}.md`;

    const blob = new Blob([fileContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast("文件下载已开始", "success");
  };

  // 处理版本恢复
  const handleRestoreVersion = async (versionId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/versions/${versionId}/restore`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        toast(error.detail || "恢复版本失败", "error");
        return;
      }

      await response.json();
      toast("版本恢复成功", "success");

      // 重新加载文件内容
      if (currentFile) {
        await loadFile(currentFile);
      }

      // 关闭版本历史面板
      setIsVersionHistoryOpen(false);
    } catch (err) {
      toast("恢复版本失败，请重试", "error");
    }
  };

  // 处理版本对比
  const handleCompareVersions = (v1Id: string, v2Id: string) => {
    setVersionDiffVersions({ v1: v1Id, v2: v2Id });
  };

  // 命令面板命令列表
  const commands: Command[] = [
    {
      id: "save",
      label: "保存文件",
      description: "保存当前编辑的文件",
      category: "file",
      handler: handleSave,
    },
    {
      id: "toggle-sidebar",
      label: "切换侧边栏",
      description: "显示或隐藏文件树侧边栏",
      category: "view",
      handler: toggleSidebar,
    },
    {
      id: "toggle-dark-mode",
      label: "切换暗色模式",
      description: "切换明暗主题",
      category: "settings",
      handler: () => setIsDarkMode((prev) => !prev),
    },
    {
      id: "download",
      label: "下载文件",
      description: "下载当前文件为 Markdown",
      category: "file",
      handler: handleDownload,
    },
    {
      id: "version-history",
      label: "版本历史",
      description: "查看和恢复文件历史版本",
      category: "file",
      handler: () => setIsVersionHistoryOpen(true),
    },
    {
      id: "show-shortcuts",
      label: "快捷键帮助",
      description: "查看所有键盘快捷键",
      category: "settings",
      handler: () => setIsShortcutsHelpOpen(true),
    },
  ];

  // 注册键盘快捷键
  useEffect(() => {
    registerShortcut({
      keys: "Ctrl+S",
      description: "保存文件",
      handler: (e) => {
        e.preventDefault();
        handleSave();
      },
    });

    registerShortcut({
      keys: "Ctrl+Shift+P",
      description: "打开命令面板",
      handler: (e) => {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      },
    });

    registerShortcut({
      keys: "Ctrl+B",
      description: "切换侧边栏",
      handler: (e) => {
        e.preventDefault();
        toggleSidebar();
      },
    });

    registerShortcut({
      keys: "Ctrl+/",
      description: "显示快捷键帮助",
      handler: (e) => {
        e.preventDefault();
        setIsShortcutsHelpOpen(true);
      },
    });

    registerShortcut({
      keys: "Escape",
      description: "关闭面板",
      handler: () => {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        if (isShortcutsHelpOpen) setIsShortcutsHelpOpen(false);
        if (isVersionHistoryOpen) setIsVersionHistoryOpen(false);
        if (versionDiffVersions.v1 || versionDiffVersions.v2) {
          setVersionDiffVersions({ v1: null, v2: null });
        }
      },
    });
  }, [registerShortcut, handleSave, toggleSidebar, isCommandPaletteOpen, isShortcutsHelpOpen]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Toolbar
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onRefresh={handleRefresh}
        onUpload={handleUpload}
        isLoading={isLoading}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* 主布局 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧边栏 - 文件树 */}
        <aside
          className={`
            fixed left-0 top-12 bottom-0 z-30 w-64
            bg-white dark:bg-slate-900
            border-r border-slate-200 dark:border-slate-800
            transition-transform duration-300 ease-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex flex-col h-full">
            <div className="h-12 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
              <SearchBar
                query={searchQuery}
                onQueryChange={(value) => {
                  setSearchQuery(value);
                  debouncedSearch(value);
                }}
                results={searchResults}
                isSearching={isSearching}
                onResultClick={loadFile}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 max-h-[300px]">
              <FileTree
                nodes={fileTree || []}
                currentPath={currentFile}
                onFileSelect={loadFile}
                onFileRename={handleRename}
                onFileDelete={handleDelete}
                isLoading={isLoading && !fileTree?.length}
              />
            </div>
          </div>
        </aside>

        {/* 主内容区 - 编辑器和预览 */}
        <main
          className={`
            flex-1 flex overflow-hidden
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          <div className="flex-1 min-w-0 min-h-0 flex flex-col relative">
            {/* Markdown 工具栏 + 自动保存状态 */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
              <MarkdownToolbar onInsert={handleInsertMarkdown} />
              {/* 自动保存状态指示器 */}
              <AutoSaveIndicator
                hasUnsavedChanges={autoSave.hasUnsavedChanges}
                lastSavedAt={autoSave.lastSavedAt}
                isSaving={autoSave.isSaving}
                saveSuccess={autoSave.saveSuccess}
              />
            </div>

            {/* CodeMirror 编辑器 */}
            <div className="flex-1 min-h-0">
              <CodeMirrorEditor
                ref={(ref: any) => {
                  if (ref) {
                    editorViewRef.current = ref.editorView;
                  }
                }}
                value={fileContent}
                onChange={setFileContent}
                onSave={handleSave}
                fileName={currentFile?.split("/").pop()}
                canSave={!!currentFile}
                onPasteImage={handlePasteImage}
                isFullscreen={isEditorFullscreen}
                onToggleFullscreen={() => setIsEditorFullscreen(!isEditorFullscreen)}
                onRename={handleRenameFromEditor}
                onDownload={handleDownload}
                onShowVersionHistory={() => setIsVersionHistoryOpen(true)}
              />
            </div>
          </div>

          {/* 预览区 */}
          <div className="flex-1 min-w-0 min-h-0 border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <Preview content={fileContent} searchQuery={searchQuery} fileName={currentFile?.split("/").pop()} />
          </div>
        </main>

        {/* 全屏编辑器覆盖层 */}
        {isEditorFullscreen && (
          <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 flex flex-col">
            {/* Markdown 工具栏 + 自动保存状态 */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
              <MarkdownToolbar onInsert={handleInsertMarkdown} />
              {/* 自动保存状态指示器 */}
              <AutoSaveIndicator
                hasUnsavedChanges={autoSave.hasUnsavedChanges}
                lastSavedAt={autoSave.lastSavedAt}
                isSaving={autoSave.isSaving}
                saveSuccess={autoSave.saveSuccess}
              />
            </div>
            {/* CodeMirror 编辑器 */}
            <div className="flex-1 min-h-0">
              <CodeMirrorEditor
                ref={(ref: any) => {
                  if (ref) {
                    editorViewRef.current = ref.editorView;
                  }
                }}
                value={fileContent}
                onChange={setFileContent}
                onSave={handleSave}
                fileName={currentFile?.split("/").pop()}
                canSave={!!currentFile}
                onPasteImage={handlePasteImage}
                isFullscreen={isEditorFullscreen}
                onToggleFullscreen={() => setIsEditorFullscreen(!isEditorFullscreen)}
                onRename={handleRenameFromEditor}
                onDownload={handleDownload}
                onShowVersionHistory={() => setIsVersionHistoryOpen(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* TOC 目录导航 */}
      {fileContent && (
        <TableOfContents
          content={fileContent}
          onHeadingClick={() => {}}
          isOpen={isTOCOpen}
          onToggle={() => setIsTOCOpen(!isTOCOpen)}
        />
      )}

      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* 命令面板 */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />

      {/* 快捷键帮助 */}
      <KeyboardShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        shortcuts={DEFAULT_SHORTCUTS}
      />

      {/* 版本历史面板 */}
      <VersionHistory
        filePath={currentFile}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        onRestore={handleRestoreVersion}
        onCompare={handleCompareVersions}
        apiBaseUrl={import.meta.env.VITE_API_URL || "http://localhost:8001"}
      />

      {/* 版本对比对话框 */}
      <VersionDiff
        version1Id={versionDiffVersions.v1}
        version2Id={versionDiffVersions.v2}
        isOpen={!!(versionDiffVersions.v1 && versionDiffVersions.v2)}
        onClose={() => setVersionDiffVersions({ v1: null, v2: null })}
        apiBaseUrl={import.meta.env.VITE_API_URL || "http://localhost:8001"}
      />
    </div>
  );
}

export default App;
