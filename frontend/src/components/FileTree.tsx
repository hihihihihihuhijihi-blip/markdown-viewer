/** 文件树组件 */
import { useState, useRef, useEffect } from "react";
import { File, Folder, FolderOpen, FileText, Code, ChevronRight, Edit2, Trash2 } from "lucide-react";
import type { FileNode } from "../types";
import { FileTreeSkeleton } from "./SkeletonLoader";

interface FileTreeProps {
  nodes: FileNode[];
  currentPath: string | null;
  onFileSelect: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  onFileDelete?: (path: string) => void;
  isLoading?: boolean;
  level?: number;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case "directory":
      return null;
    case "markdown":
      return <FileText className="w-4 h-4 text-blue-500" />;
    case "code":
      return <Code className="w-4 h-4 text-green-500" />;
    default:
      return <File className="w-4 h-4 text-slate-400" />;
  }
};

export function FileTree({
  nodes,
  currentPath,
  onFileSelect,
  onFileRename,
  onFileDelete,
  isLoading = false,
  level = 0,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPath && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPath]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleNodeClick = (node: FileNode) => {
    if (editingPath) return;
    if (node.type === "directory") {
      toggleFolder(node.path);
    } else {
      onFileSelect(node.path);
    }
  };

  const startEdit = (node: FileNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPath(node.path);
    setEditValue(node.name);
  };

  const handleEditSave = async () => {
    if (!editingPath || !editValue.trim()) {
      setEditingPath(null);
      return;
    }
    if (onFileRename) {
      await onFileRename(editingPath, editValue.trim());
    }
    setEditingPath(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      setEditingPath(null);
    }
  };

  const handleDelete = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFileDelete) {
      await onFileDelete(path);
    }
  };

  // 显示骨架屏
  if (isLoading) {
    return <FileTreeSkeleton />;
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <File className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">暂无文件</p>
      </div>
    );
  }

  return (
    <ul className={level > 0 ? "ml-4" : ""}>
      {nodes.map((node) => {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = currentPath === node.path;
        const isDirectory = node.type === "directory";
        const isEditing = editingPath === node.path;

        return (
          <li key={node.path} className="my-0.5">
            <div
              className={`flex items-center gap-2 w-full px-0 py-1.5 rounded-lg text-left text-sm transition-colors group ${
                isSelected
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isDirectory ? (
                <>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-500" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-4" />
                  {getFileIcon(node.type)}
                </>
              )}
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleEditSave}
                  onKeyDown={handleEditKeyDown}
                  className="flex-1 min-w-0 px-1 py-0.5 text-sm bg-white dark:bg-slate-800 border border-blue-500 rounded outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="truncate flex-1 font-medium"
                  onClick={() => handleNodeClick(node)}
                >
                  {node.name}
                </span>
              )}
              {/* 操作按钮 */}
              {!isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startEdit(node, e)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title="重命名"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(node.path, e)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {isDirectory && isExpanded && node.children && (
              <FileTree
                nodes={node.children}
                currentPath={currentPath}
                onFileSelect={onFileSelect}
                onFileRename={onFileRename}
                onFileDelete={onFileDelete}
                level={level + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
