/** Markdown 工具栏组件 */
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Table,
  Minus,
  Type,
} from "lucide-react";

interface MarkdownToolbarProps {
  onInsert: (markdown: string) => void;
}

interface ToolbarButton {
  name: string;
  icon: React.ReactNode;
  insert: string;
  title: string;
}

const toolbarButtons: ToolbarButton[] = [
  { name: "h1", icon: <Heading1 className="w-3.5 h-3.5" />, insert: "# ", title: "一级标题" },
  { name: "h2", icon: <Heading2 className="w-3.5 h-3.5" />, insert: "## ", title: "二级标题" },
  { name: "h3", icon: <Heading3 className="w-3.5 h-3.5" />, insert: "### ", title: "三级标题" },
  { name: "bold", icon: <Bold className="w-3.5 h-3.5" />, insert: "****", title: "粗体 (⌘B)" },
  { name: "italic", icon: <Italic className="w-3.5 h-3.5" />, insert: "**", title: "斜体 (⌘I)" },
  { name: "strikethrough", icon: <Strikethrough className="w-3.5 h-3.5" />, insert: "~~~~", title: "删除线" },
  { name: "code", icon: <Code className="w-3.5 h-3.5" />, insert: "`", title: "行内代码" },
  { name: "link", icon: <Link className="w-3.5 h-3.5" />, insert: "[title](url)", title: "链接 (⌘K)" },
  { name: "image", icon: <Image className="w-3.5 h-3.5" />, insert: "![alt](url)", title: "图片" },
  { name: "ul", icon: <List className="w-3.5 h-3.5" />, insert: "- ", title: "无序列表" },
  { name: "ol", icon: <ListOrdered className="w-3.5 h-3.5" />, insert: "1. ", title: "有序列表" },
  { name: "check", icon: <CheckSquare className="w-3.5 h-3.5" />, insert: "- [ ] ", title: "任务列表" },
  { name: "quote", icon: <Quote className="w-3.5 h-3.5" />, insert: "> ", title: "引用" },
  { name: "codeblock", icon: <Type className="w-3.5 h-3.5" />, insert: "```\n```\n", title: "代码块" },
  { name: "hr", icon: <Minus className="w-3.5 h-3.5" />, insert: "\n---\n", title: "分割线" },
  { name: "table", icon: <Table className="w-3.5 h-3.5" />, insert: "\n| 列1 | 列2 |\n|-----|-----|\n| 内容 | 内容 |\n", title: "表格" },
];

export function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  const handleInsert = (button: ToolbarButton) => {
    onInsert(button.insert);
  };

  return (
    <div className="h-12 flex items-center gap-1 px-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 overflow-x-auto">
      {toolbarButtons.map((button) => (
        <button
          key={button.name}
          onClick={() => handleInsert(button)}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-150 group active:scale-95 min-w-[36px] flex items-center justify-center"
          title={button.title}
        >
          <div className="group-hover:scale-110 transition-transform duration-150">
            {button.icon}
          </div>
        </button>
      ))}
    </div>
  );
}
