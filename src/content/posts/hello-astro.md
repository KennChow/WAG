---
title: 开始写作 —— 排版元素总览
description: 这篇文章把博客支持的所有排版元素过一遍，可以当作写作时的速查表。
pubDate: 2026-09-01
tags: [写作, 排版]
---

这篇文章把站点支持的排版元素集中演示一遍。写新文章时可以直接对照着抄。

## 标题与锚点

二级到四级标题会自动生成锚点，鼠标移到标题上会出现一个 `#`，点击即可复制定位链接。右侧目录也是据此生成的。

### 这是三级标题

#### 这是四级标题

## 文字样式

支持**粗体**、*斜体*、~~删除线~~、`行内代码`，以及[站内链接](/archive/)和[外部链接](https://astro.build)。

中英文混排时会自动处理标点，比如引号会变成 "smart quotes"，破折号 --- 也会正确转换。

## 列表

无序列表：

- 第一项
- 第二项
  - 嵌套的子项
  - 另一个子项
- 第三项

有序列表：

1. 先做这个
2. 再做那个
3. 最后收尾

任务列表：

- [x] 已完成的事项
- [ ] 待办事项

## 引用

> 过早的优化是万恶之源。
>
> —— Donald Knuth

## 代码

行内代码写作 `const x = 1`。代码块支持语法高亮，深浅色主题各有一套配色，右上角有复制按钮：

```ts
interface Post {
  slug: string
  title: string
  pubDate: Date
}

export function sortByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
}
```

```bash
npm run build && npm run preview
```

## 表格

| 内容类型 | 放置位置 | 是否套站点外壳 |
| --- | --- | --- |
| Markdown 文章 | `src/content/posts/*.md` | 是 |
| HTML 文章 | `src/content/posts/*.html` | 是 |
| 独立 HTML 文档 | `public/**/*.html` | 否 |

## 脚注

正文里可以插入脚注[^1]，点击会跳到页面底部，底部也有返回正文的链接。

[^1]: 脚注的内容写在这里，支持 `行内代码` 和[链接](https://astro.build)。

## 分隔线

---

分隔线上下的内容会被明显区隔开。

## 图片

引用图片时，放在 `src/` 下用相对路径引入的图会被 Astro 自动优化并处理好部署前缀；放在 `public/` 下的图必须自己写上 `/WAG/` 前缀，否则线上会 404。这一点在子路径部署时特别容易踩。
