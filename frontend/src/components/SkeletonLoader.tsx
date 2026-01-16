/** 骨架屏加载组件 */
import { cn } from "../lib/utils";

export interface SkeletonProps {
  /** 额外的类名 */
  className?: string;
  /** 是否显示动画 */
  animate?: boolean;
}

/** 基础骨架屏元素 */
export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-slate-200 dark:bg-slate-700 rounded-md",
        animate && "animate-pulse",
        className
      )}
    />
  );
}

/** 文件树骨架屏 */
export function FileTreeSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="w-4 h-4 flex-shrink-0" />
          <Skeleton className={cn("h-4", i === 2 ? "w-24" : i === 4 ? "w-32" : "w-20")} />
        </div>
      ))}
    </div>
  );
}

/** 编辑器骨架屏 */
export function EditorSkeleton() {
  return (
    <div className="flex h-full">
      {/* 行号区域 */}
      <div className="w-12 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-end py-4 pr-3 gap-3">
        {[...Array(15)].map((_, i) => (
          <Skeleton key={i} className="w-6 h-4" animate={false} />
        ))}
      </div>
      {/* 编辑内容区域 */}
      <div className="flex-1 p-4 space-y-3">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i % 3 === 0 ? "w-3/4" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

/** 预览区骨架屏 */
export function PreviewSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {/* 标题 */}
      <Skeleton className="h-8 w-1/2 mb-6" />
      {/* 内容段落 */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          {i % 2 === 0 && <Skeleton className="h-4 w-4/5" />}
        </div>
      ))}
      {/* 代码块模拟 */}
      <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

/** 搜索结果骨架屏 */
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-lg">
          <Skeleton className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 工具栏骨架屏 */
export function ToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="w-8 h-8 rounded-lg" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-16 h-8 rounded-lg" />
      </div>
    </div>
  );
}
