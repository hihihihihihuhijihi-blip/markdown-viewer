"""导出功能模块"""
import re
from typing import Dict, Any
from datetime import datetime


def export_to_html(
    content: str,
    title: str = "Markdown Document",
    options: Dict[str, Any] = None
) -> str:
    """
    将 Markdown 内容导出为 HTML

    Args:
        content: Markdown 内容
        title: 文档标题
        options: 导出选项
            - standalone: 是否生成独立的 HTML 文件（包含 CSS）
            - include_toc: 是否包含目录
            - theme: 主题 (light/dark)

    Returns:
        HTML 字符串
    """
    if options is None:
        options = {}

    standalone = options.get("standalone", True)
    include_toc = options.get("include_toc", False)
    theme = options.get("theme", "light")

    # 转换 Markdown 为 HTML（基础实现）
    html_content = _markdown_to_html(content, include_toc)

    if standalone:
        # 生成完整的 HTML 文档
        css_styles = _get_html_css(theme)
        html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{_escape_html(title)}</title>
    <style>
{css_styles}
    </style>
</head>
<body class="theme-{theme}">
    <div class="container">
        <h1 class="document-title">{_escape_html(title)}</h1>
{html_content}
    </div>
    <footer class="document-footer">
        <p>导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </footer>
</body>
</html>"""
    else:
        # 仅返回内容部分
        html = html_content

    return html


def export_to_pdf(
    content: str,
    title: str = "Markdown Document",
    options: Dict[str, Any] = None
) -> bytes:
    """
    将 Markdown 内容导出为 PDF

    注意：此功能需要安装 weasyprint
    安装: pip install weasyprint

    Args:
        content: Markdown 内容
        title: 文档标题
        options: 导出选项
            - page_size: 页面大小 (A4/Letter)
            - margin: 页边距
            - include_toc: 是否包含目录

    Returns:
        PDF 二进制数据
    """
    try:
        from weasyprint import HTML, CSS
    except ImportError:
        raise ImportError(
            "PDF 导出功能需要安装 weasyprint。"
            "请运行: pip install weasyprint"
        )

    if options is None:
        options = {}

    # 先转换为 HTML
    html_content = export_to_html(
        content,
        title,
        {
            "standalone": True,
            "include_toc": options.get("include_toc", False),
            "theme": options.get("theme", "light"),
        }
    )

    # PDF 样式
    page_size = options.get("page_size", "A4")
    margin = options.get("margin", "2cm")

    pdf_css = CSS(string=f"""
        @page {{
            size: {page_size};
            margin: {margin};
        }}
        @media print {{
            .container {{
                max-width: none;
            }}
        }}
    """)

    # 生成 PDF
    pdf_bytes = HTML(string=html_content).write_pdf(
        stylesheets=[pdf_css],
        presentational_hints=True
    )

    return pdf_bytes


def _markdown_to_html(content: str, include_toc: bool = False) -> str:
    """基础 Markdown 转 HTML（简化实现）"""

    # 转义 HTML 特殊字符
    content = _escape_html(content)

    # 生成目录
    toc = ""
    if include_toc:
        headings = re.findall(r'^(#{1,6})\s+(.+)$', content, re.MULTILINE)
        if headings:
            toc_items = []
            for level, text in headings:
                indent = (len(level)) * 20
                slug = _slugify(text)
                toc_items.append(
                    f'<li style="margin-left: {indent}px">'
                    f'<a href="#{slug}">{text}</a></li>'
                )
            toc = f'<div class="toc"><h2>目录</h2><ul>{"".join(toc_items)}</ul></div>'

    # 处理标题
    content = re.sub(
        r'^(#{1,6})\s+(.+)$',
        lambda m: f'<h{len(m.group(1))} id="{_slugify(m.group(2))}">{m.group(2)}</h{len(m.group(1))}>',
        content,
        flags=re.MULTILINE
    )

    # 处理代码块
    content = re.sub(
        r'```(\w*)\n(.*?)```',
        lambda m: f'<pre><code class="language-{m.group(1)}">{m.group(2)}</code></pre>',
        content,
        flags=re.DOTALL
    )

    # 处理行内代码
    content = re.sub(r'`([^`]+)`', r'<code>\1</code>', content)

    # 处理粗体
    content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content)
    content = re.sub(r'__(.+?)__', r'<strong>\1</strong>', content)

    # 处理斜体
    content = re.sub(r'\*(.+?)\*', r'<em>\1</em>', content)
    content = re.sub(r'_(.+?)_', r'<em>\1</em>', content)

    # 处理删除线
    content = re.sub(r'~~(.+?)~~', r'<del>\1</del>', content)

    # 处理链接
    content = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', content)

    # 处理图片
    content = re.sub(r'!\[([^\]]*)\]\(([^\)]+)\)', r'<img src="\2" alt="\1">', content)

    # 处理无序列表
    content = re.sub(
        r'^[\*\-]\s+(.+)$',
        r'<li>\1</li>',
        content,
        flags=re.MULTILINE
    )

    # 处理有序列表
    content = re.sub(
        r'^\d+\.\s+(.+)$',
        r'<li>\1</li>',
        content,
        flags=re.MULTILINE
    )

    # 包装列表项
    content = re.sub(r'(<li>.*?</li>\n)+', r'<ul>\1</ul>', content, flags=re.DOTALL)

    # 处理引用
    content = re.sub(
        r'^>\s+(.+)$',
        r'<blockquote>\1</blockquote>',
        content,
        flags=re.MULTILINE
    )

    # 合并连续的 blockquote
    content = re.sub(
        r'</blockquote>\n<blockquote>',
        '\n',
        content
    )

    # 处理分隔线
    content = re.sub(r'^-{3,}$', r'<hr>', content, flags=re.MULTILINE)
    content = re.sub(r'^\*{3,}$', r'<hr>', content, flags=re.MULTILINE)

    # 处理段落
    lines = content.split('\n')
    result = []
    in_paragraph = False

    for line in lines:
        if line.strip() == '':
            if in_paragraph:
                result.append('</p>')
                in_paragraph = False
        elif line.startswith('<h') or line.startswith('<ul') or line.startswith('<ol') or \
             line.startswith('<blockquote>') or line.startswith('<pre>') or \
             line.startswith('<hr>') or line.startswith('<li>') or line.startswith('</li>'):
            if in_paragraph:
                result.append('</p>')
                in_paragraph = False
            result.append(line)
        else:
            if not in_paragraph:
                result.append('<p>')
                in_paragraph = True
            result.append(line)

    if in_paragraph:
        result.append('</p>')

    return toc + '\n'.join(result)


def _escape_html(text: str) -> str:
    """转义 HTML 特殊字符"""
    return (
        text.replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#39;')
    )


def _slugify(text: str) -> str:
    """生成 URL 友好的 slug"""
    text = text.lower()
    text = re.sub(r'[^\w\u4e00-\u9fff\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text.strip('-')


def _get_html_css(theme: str = "light") -> str:
    """获取 HTML 样式"""
    base_css = """
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.document-title {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
}

.document-footer {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
}

h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
}

h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
h4 { font-size: 1rem; }
h5 { font-size: 0.875rem; }
h6 { font-size: 0.75rem; }

p {
    margin-bottom: 1rem;
}

a {
    color: #2563eb;
    text-decoration: underline;
}

a:hover {
    color: #1d4ed8;
}

strong {
    font-weight: 600;
}

em {
    font-style: italic;
}

code {
    font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
    font-size: 0.875em;
    background-color: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
}

pre {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1rem;
}

pre code {
    background-color: transparent;
    padding: 0;
}

blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #6b7280;
}

ul, ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
}

li {
    margin-bottom: 0.25rem;
}

hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 2rem 0;
}

img {
    max-width: 100%;
    height: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
}

th, td {
    border: 1px solid #e5e7eb;
    padding: 0.5rem;
    text-align: left;
}

th {
    background-color: #f9fafb;
    font-weight: 600;
}

.toc {
    background-color: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
}

.toc h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
}

.toc ul {
    list-style: none;
    margin-left: 0;
}

.toc a {
    color: #374151;
    text-decoration: none;
}

.toc a:hover {
    color: #2563eb;
    text-decoration: underline;
}
"""

    if theme == "dark":
        dark_css = """
body.theme-dark {
    background-color: #111827;
    color: #f9fafb;
}

.theme-dark .document-title {
    border-bottom-color: #374151;
}

.theme-dark code {
    background-color: #1f2937;
    color: #e5e7eb;
}

.theme-dark pre {
    background-color: #1f2937;
}

.theme-dark blockquote {
    border-left-color: #374151;
    color: #9ca3af;
}

.theme-dark hr {
    border-top-color: #374151;
}

.theme-dark th, .theme-dark td {
    border-color: #374151;
}

.theme-dark th {
    background-color: #1f2937;
}

.theme-dark .toc {
    background-color: #1f2937;
}

.theme-dark .toc a {
    color: #d1d5db;
}

.theme-dark a {
    color: #60a5fa;
}

.theme-dark a:hover {
    color: #93c5fd;
}
"""
        return base_css + dark_css

    return base_css
