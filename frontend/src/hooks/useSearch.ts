/** 搜索功能 Hook */
import { useState, useCallback, useRef } from "react";
import { searchFiles } from "../lib/api";
import type { SearchResult } from "../types";

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 执行搜索 */
  const performSearch = useCallback(
    async (query: string, path: string = "") => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await searchFiles(query, path);
        setSearchResults(response.results);
      } catch (err) {
        console.error("搜索失败:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  /** 带防抖的搜索 */
  const debouncedSearch = useCallback(
    (query: string, path: string = "") => {
      // 清除之前的定时器
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      // 设置新的定时器（300ms 防抖）
      searchTimerRef.current = setTimeout(() => {
        performSearch(query, path);
      }, 300);
    },
    [performSearch]
  );

  // 清理定时器
  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    performSearch,
    debouncedSearch,
    clearSearchTimer,
  };
}
