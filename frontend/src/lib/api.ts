/** API 请求封装 */
import axios from "axios";
import type {
  TreeResponse,
  FileResponse,
  SaveRequest,
  SaveResponse,
  SearchResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/** 获取目录结构 */
export async function getTree(path: string = ""): Promise<TreeResponse> {
  const response = await api.get<TreeResponse>("/api/tree", {
    params: { path },
  });
  return response.data;
}

/** 读取文件内容 */
export async function getFile(path: string): Promise<FileResponse> {
  const response = await api.get<FileResponse>("/api/file", {
    params: { path },
  });
  return response.data;
}

/** 保存文件 */
export async function saveFile(request: SaveRequest): Promise<SaveResponse> {
  const response = await api.post<SaveResponse>("/api/save", request);
  return response.data;
}

/** 搜索文件 */
export async function searchFiles(
  query: string,
  path: string = ""
): Promise<SearchResponse> {
  const response = await api.get<SearchResponse>("/api/search", {
    params: { q: query, path },
  });
  return response.data;
}

export default api;
