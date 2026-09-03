# WAG

个人静态博客。Astro 7 构建，GitHub Actions 自动发布到 GitHub Pages。

线上地址：<https://kennchow.github.io/WAG/>

## 快速开始

```bash
npm install
npm run dev      # http://localhost:4321/WAG/
```

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发，热更新。**搜索在这个模式下不可用** |
| `npm run build` | 构建到 `dist/`，同时生成搜索索引与站点地图 |
| `npm run preview` | 预览构建产物。**验证子路径和搜索必须用这个** |
| `npm run check` | TypeScript / Astro 类型检查 |

## 写文章

内容分三层，**把文件放进哪个目录，决定了它怎么被呈现**。

### 第 1 层：Markdown 文章

放 `src/content/posts/*.md`（或 `.mdx`），产出 `/WAG/posts/<文件名>/`。

```markdown
---
title: 文章标题
description: 一句话摘要，会出现在列表页和 RSS 里
pubDate: 2026-09-03
updatedDate: 2026-09-10   # 可选
tags: [标签一, 标签二]     # 可选
draft: false              # 可选，true 时只在 dev 可见，不会发布
cover: /images/cover.png  # 可选
---

正文……
```

`title` 和 `pubDate` 必填，缺了会在构建期报错。

支持：GFM（表格、任务列表、删除线、脚注）、代码高亮与一键复制、标题锚点、右侧目录、
KaTeX 数学公式、Mermaid 图表、深浅色主题。

### 第 2 层：HTML 文章

放 `src/content/posts/*.html`，同样产出 `/WAG/posts/<文件名>/`，**套完全一样的站点外壳**，
一样进列表、标签、归档、RSS 和搜索。

frontmatter 写在文件开头的注释里，字段与第 1 层完全一致：

```html
<!--astro
title: 文章标题
description: 一句话摘要
pubDate: 2026-09-03
tags: [标签]
-->

<h2>正文</h2>
<p>可以写任意 HTML。</p>
```

`<h2>`~`<h4>` 如果没写 `id`，构建时会自动补上锚点（和 Markdown 用同一套 slug 算法）。

**自带 `<style>` 的文章会被自动作用域化。** 很多人是把一份完整独立的 HTML 文档直接丢进来，
里面带着 `body {}`、`h1 {}` 这类宽泛选择器，原样注入会把站点页头页脚一起重新上色。
构建时用 postcss 解析这些 `<style>`，把选择器收窄到 `.scoped-doc` 容器内，正文整体包进该容器，
并自动切换到更宽的版心（正文列 62rem，因为这类文档通常按 1000px 左右的画布设计）。

`:root[data-theme="dark"]` 这类写法会被改写成 `:root[data-theme="dark"] .scoped-doc`，
限定部分保留在祖先位置——所以文章自带的暗色配色能跟着站点的主题切换一起生效。
`@keyframes` 和 `@font-face` 不受影响。

> **安全边界**：这一层是用 `set:html` 直出的，等于完全信任文件内容。
> **只放自己写的 HTML。** 第三方来源或用户提交的 HTML 请放到第 3 层。

### 第 3 层：独立 HTML 文档

放 `public/` 下的任意 `.html`，原样输出、**不套外壳**，按原路径访问：
`public/demo/dashboard.html` → `/WAG/demo/dashboard.html`。

适合导出的报告、自带样式与脚本的可视化页面、需要完全掌控 `<head>` 的旧页面。
它有独立的执行上下文，不会和站点其他部分互相影响。

这类文件不进文章列表，但会自动汇总到 **`/WAG/pages/`**（导航里的「独立页面」）——
构建时扫描 `public/`，读每个文件的 `<title>` 和 `<meta name="description">` 生成清单，
新增文件自动出现，不用手工登记。文件名或目录名以 `_` 或 `.` 开头的会被跳过。

### 三层对比

| | 位置 | URL | 站点外壳 | 进列表/RSS/搜索 |
| --- | --- | --- | --- | --- |
| Markdown 文章 | `src/content/posts/*.md` | `/WAG/posts/<slug>/` | ✅ | ✅ |
| HTML 文章 | `src/content/posts/*.html` | `/WAG/posts/<slug>/` | ✅ | ✅ |
| 独立 HTML | `public/**/*.html` | `/WAG/<路径>.html` | ❌ | ❌，但自动列在 `/WAG/pages/` |

两类文章共用 `/posts/` 命名空间，**文件名重复会在构建期直接报错**，不会静默覆盖。

## 数学公式与图表

**公式**用 `$...$`（行内）和 `$$...$$`（块级），由 KaTeX 在构建期渲染成静态 HTML，
浏览器端零 JavaScript。

**图表**在 Markdown 里用 ` ```mermaid ` 代码块；在 HTML 文章里直接写
`<div class="mermaid" data-mermaid-src="...">`。Mermaid 运行时按需懒加载，
不含图表的页面一个字节都不会下载。切换主题时图表会自动重绘。

## 子路径部署的坑

站点部署在 `/WAG/` 子路径下，**手写的绝对路径不会自动加前缀**。

- 组件和页面里：所有链接必须走 `src/lib/url.ts` 的 `withBase()` / `postUrl()` / `tagUrl()`。
- 文章正文里：可以直接写 `/archive/` 这样的根路径，构建时会自动补成 `/WAG/archive/`
  （Markdown 由 `src/plugins/rehype-base-url.mjs` 处理，HTML 文章由 `rewriteBaseUrls()` 处理）。
- 引用 `public/` 下的图片等资源时，同样按根路径写即可。

改站点地址：只改 `src/site.config.mjs` 里的 `origin` 和 `base`。
若换成用户主页 `<用户名>.github.io`，把 `base` 改成 `'/'`。

## 配置

站点信息集中在 **`src/site.config.mjs`**：标题、描述、作者、导航、社交链接、每页文章数、giscus。

### 开启评论

评论用 [giscus](https://giscus.app)（基于 GitHub Discussions，数据留在自己仓库）。
`repoId` 和 `categoryId` 需要自己生成，**没填时评论区不渲染，不影响构建**：

1. 仓库 Settings → General → Features，勾选 **Discussions**
2. 打开 <https://giscus.app>，填入仓库、选好分类，页面会给出 `repoId` 和 `categoryId`
3. 把两个值填进 `src/site.config.mjs` 的 `giscus` 字段

## 部署

推送到 `main` 自动触发 `.github/workflows/deploy.yml`。

**首次部署前**：仓库 Settings → Pages → Source 选 **GitHub Actions**（不是 Deploy from a branch）。

## 技术选型备忘

- **Markdown 管线走 unified，不是 Astro 7 默认的 Sätteri。** Sätteri 是 Rust 实现，不跑
  remark/rehype 插件，而 KaTeX、标题锚点都依赖 rehype 生态。切换方式见 `astro.config.mjs`。
- **`katex` 锁死在 0.16.x。** `rehype-katex@7` 依赖 `katex@^0.16`，若把顶层 katex 升到 0.18，
  会出现「渲染器 0.16 / CSS 0.18」版本错位，公式排版错乱。
- **分页是手写的**（`src/lib/posts.ts` 的 `pageSlice`），没用 Astro 的 `paginate()`——
  后者需要 `/posts/[...page]` 路由，会和文章详情的 `/posts/[...slug]` 抢同一段路径。
- **Mermaid 转换放在 remark 阶段**（`src/plugins/remark-mermaid.mjs`）。Astro 的语法高亮器
  排在用户插件之前，到 rehype 阶段代码块已被 Shiki 拆成一堆 span，原始图表源码拼不回来。
- **搜索索引只收文章。** `PostLayout` 上的 `data-pagefind-body` 让 Pagefind 跳过标签页、
  归档页这类列表页，避免污染搜索结果。

## 目录结构

```
src/
├── site.config.mjs        # 站点配置唯一来源
├── content.config.ts      # 内容集合 schema（只管 md/mdx）
├── content/posts/         # 文章：.md / .mdx / .html 混放
├── lib/
│   ├── posts.ts           # 归一 md + html → Post[]，标签、归档、分页
│   ├── htmlPost.ts        # HTML 文章的 frontmatter 解析与锚点补全
│   ├── readingTime.ts     # 中文感知的字数与阅读时长
│   ├── scopeCss.ts        # 把文章自带 <style> 收窄到容器内
│   ├── standalonePages.ts # 扫描 public/ 生成独立页面清单
│   └── url.ts             # withBase()：base 前缀唯一出口
├── plugins/               # remark-mermaid / rehype-base-url
├── components/
├── layouts/
└── pages/
```
