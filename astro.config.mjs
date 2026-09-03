// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import pagefind from 'astro-pagefind'

// Astro 7 默认用 Sätteri（Rust）渲染 Markdown，它不跑 remark/rehype 插件。
// KaTeX、标题锚点都依赖 rehype 生态，所以显式切回 unified 管线。
import { unified } from '@astrojs/markdown-remark'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkMermaid from './src/plugins/remark-mermaid.mjs'
import rehypeBaseUrl from './src/plugins/rehype-base-url.mjs'

import { SITE } from './src/site.config.mjs'

export default defineConfig({
  site: SITE.origin,
  base: SITE.base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap(), pagefind()],
  markdown: {
    processor: unified({
      // remark 阶段：mermaid 必须在这里拦截，见 src/plugins/remark-mermaid.mjs
      remarkPlugins: [remarkMath, remarkMermaid],
      rehypePlugins: [
        rehypeKatex,
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: { className: ['heading-anchor'], ariaHidden: 'true', tabIndex: -1 },
            content: { type: 'text', value: '#' },
          },
        ],
        // 放在最后：此时正文里的链接已经定型，统一补 base 前缀
        rehypeBaseUrl,
      ],
      remarkRehype: {
        footnoteLabel: '脚注',
        footnoteBackLabel: '返回正文',
      },
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
})
