/** 文件树节点类型 */
export interface FileNode {
  name: string;
  path: string;
  type: "directory" | "markdown" | "text" | "code" | "config" | "unknown";
  children?: FileNode[] | null;
}

/** API 响应类型 */
export interface TreeResponse {
  data: FileNode[];
}

export interface FileResponse {
  content: string;
}

export interface SaveRequest {
  path: string;
  content: string;
}

export interface SaveResponse {
  success: boolean;
}

export interface SearchResult {
  path: string;
  line: number;
  preview: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

/** 应用状态类型 */
export interface AppState {
  fileTree: FileNode[];
  currentFile: string | null;
  fileContent: string;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: SearchResult[];
  isDarkMode: boolean;
}
