/** TOC 目录导航组件 */
import { useEffect, useState } from "react";
import { List, ChevronUp, ChevronDown } from "lucide-react";

interface Heading {
  id: string;
  level: number;
  text: string;
}

interface TableOfContentsProps {
  content: string;
  onHeadingClick: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function TableOfContents({ content, onHeadingClick, isOpen, onToggle }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // 解析 Markdown 内容获取标题
  useEffect(() => {
    const lines = content.split("\n");
    const parsedHeadings: Heading[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[#*_`]/g, "").trim(); // 移除 Markdown 符号
        const id = `heading-${index}`;

        parsedHeadings.push({ id, level, text });
      }
    });

    setHeadings(parsedHeadings);
  }, [content]);

  // 监听滚动高亮当前标题
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -70% 0px",
      }
    );

    // 查找所有标题元素
    document.querySelectorAll(".markdown-body h1, .markdown-body h2, .markdown-body h3").forEach((el) => {
      // 给标题添加 id 以便跳转
      const heading = headings.find((h) => el.textContent?.startsWith(h.text.replace(/[#*_`]/g, "")));
      if (heading && !el.id) {
        el.id = heading.id;
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // 点击标题跳转
  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      onHeadingClick(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 shadow-lg">
      {/* 标题栏 - 可折叠 */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            目录 ({headings.length})
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        )}
      </div>

      {/* 目录列表 - 水平滚动 */}
      {isOpen && (
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => handleHeadingClick(heading.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap
                  transition-all duration-200 border
                  ${
                    activeId === heading.id
                      ? "bg-primary-500 text-white border-primary-500 shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }
                `}
                style={{
                  fontSize: `${1 - heading.level * 0.1}rem`,
                }}
              >
                <span className="text-slate-400 dark:text-slate-500">{"#".repeat(heading.level)}</span>
                <span>{heading.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook 用于在预览中给标题添加 ID
export function useHeadingSync(content: string) {
  useEffect(() => {
    const lines = content.split("\n");
    const parsedHeadings: { id: string; text: string }[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const text = match[2].replace(/[#*_`]/g, "").trim();
        const id = `heading-${index}`;
        parsedHeadings.push({ id, text });
      }
    });

    // 给标题添加 ID
    const headingElements = document.querySelectorAll(".markdown-body h1, .markdown-body h2, .markdown-body h3");
    let headingIndex = 0;
    headingElements.forEach((el) => {
      if (headingIndex < parsedHeadings.length && !el.id) {
        el.id = parsedHeadings[headingIndex].id;
        headingIndex++;
      }
    });
  }, [content]);
}
