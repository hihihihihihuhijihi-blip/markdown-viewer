/** 文件系统操作 Hook */
import { useState, useCallback } from "react";
import { getTree, getFile, saveFile } from "../lib/api";
import type { FileNode } from "../types";

export function useFileSystem() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 加载目录树 */
  const loadTree = useCallback(async (path: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTree(path);
      setFileTree(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** 加载文件内容 */
  const loadFile = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getFile(path);
      setFileContent(response.content);
      setCurrentFile(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** 保存文件 */
  const saveCurrentFile = useCallback(async (content: string) => {
    if (!currentFile) return false;

    setIsLoading(true);
    setError(null);
    try {
      await saveFile({ path: currentFile, content });
      setFileContent(content);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentFile]);

  return {
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
  };
}
