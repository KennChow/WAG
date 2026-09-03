/**
 * 第 2 层内容：直接以 .html 写成的文章。
 *
 * Astro 7 的 glob() loader 只认 md / mdx / markdoc / json / yaml / toml，不支持 .html，
 * 所以 HTML 文章不走内容集合，由这里手工解析后再由 posts.ts 归一成统一的 Post 结构。
 */
import yaml from 'js-yaml'
import GithubSlugger from 'github-slugger'
import { withBase } from './url'

/** 文件开头的 <!--astro ... --> 注释即 frontmatter */
const FRONTMATTER = /^\s*<!--\s*astro\s*\n([\s\S]*?)\n\s*-->/

export interface HtmlPostFrontmatter {
  title?: string
  description?: string
  pubDate?: string | Date
  updatedDate?: string | Date
  tags?: string[]
  draft?: boolean
  cover?: string
}

export interface Heading {
  depth: number
  slug: string
  text: string
}

/** 拆出 frontmatter 与正文 */
export function parseHtmlPost(raw: string): { data: HtmlPostFrontmatter; body: string } {
  const match = raw.match(FRONTMATTER)
  if (!match) return { data: {}, body: raw }

  const parsed = yaml.load(match[1]!)
  const data = (parsed && typeof parsed === 'object' ? parsed : {}) as HtmlPostFrontmatter
  return { data, body: raw.slice(match[0].length) }
}

const TAG = /<[^>]+>/g
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

function toPlainText(html: string): string {
  return html
    .replace(TAG, '')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (m) => ENTITIES[m] ?? m)
    .trim()
}

const HEADING = /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/gi
const ID_ATTR = /\bid\s*=\s*["']([^"']*)["']/i

/**
 * 抽出 h2~h4 生成目录，并为缺少 id 的标题补上锚点。
 * 用 github-slugger 是为了和 Markdown 文章（rehype-slug 内部同款）生成完全一致的锚点。
 */
export function extractHeadings(html: string): { html: string; headings: Heading[] } {
  const slugger = new GithubSlugger()
  const headings: Heading[] = []

  const out = html.replace(HEADING, (whole, level: string, attrs: string, inner: string) => {
    const text = toPlainText(inner)
    if (!text) return whole

    const existing = attrs.match(ID_ATTR)?.[1]
    const slug = existing || slugger.slug(text)
    headings.push({ depth: Number(level), slug, text })

    if (existing) return whole
    return `<h${level}${attrs} id="${slug}">${inner}</h${level}>`
  })

  return { html: out, headings }
}

/** 站内根路径，排除 '//host' 这种协议相对外链 */
const ROOT_URL_ATTR = /(\s(?:href|src)\s*=\s*)(["'])(\/(?!\/)[^"']*)\2/gi

/**
 * HTML 文章正文里的站内绝对链接同样要补 base 前缀，
 * 和 Markdown 侧的 rehype-base-url 保持一致的书写体验。
 * withBase() 是幂等的，作者手写了完整前缀也不会被加两次。
 */
export function rewriteBaseUrls(html: string): string {
  return html.replace(ROOT_URL_ATTR, (_whole, prefix: string, quote: string, path: string) => {
    return `${prefix}${quote}${withBase(path)}${quote}`
  })
}
