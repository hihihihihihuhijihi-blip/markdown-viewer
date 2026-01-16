/** 搜索栏组件 */
import { Search, X, FileText } from "lucide-react";
import type { SearchResult } from "../types";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  onResultClick: (path: string) => void;
}

export function SearchBar({
  query,
  onQueryChange,
  results,
  isSearching,
  onResultClick,
}: SearchBarProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索..."
          className="w-full h-8 pl-9 pr-8 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {query && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500">找到 {results.length} 个结果</p>
          </div>
          {results.map((result, index) => (
            <button
              key={`${result.path}-${result.line}-${index}`}
              onClick={() => onResultClick(result.path)}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {result.path.split("/").pop()}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    第 {result.line} 行 · {result.preview}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {query && !isSearching && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 px-4 py-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 text-center">
          <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-500">未找到匹配的结果</p>
        </div>
      )}

      {query && isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 px-4 py-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 text-center">
          <div className="w-5 h-5 mx-auto mb-2 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">搜索中...</p>
        </div>
      )}
    </div>
  );
}
