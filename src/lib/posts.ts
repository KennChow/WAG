/**
 * 把两类文章归一成同一个 Post 结构：
 *   1. src/content/posts/**\/*.{md,mdx}  → 内容集合
 *   2. src/content/posts/**\/*.html      → import.meta.glob 原文加载
 * 列表页、标签页、归档、RSS、搜索都只面向 Post，不关心它原本是什么格式。
 */
import { getCollection, type CollectionEntry } from 'astro:content'
import {
  parseHtmlPost,
  extractHeadings,
  rewriteBaseUrls,
  scopeInlineStyles,
  type Heading,
} from './htmlPost'
import { readingStats } from './readingTime'

export type PostFormat = 'md' | 'html'

export interface Post {
  slug: string
  title: string
  description: string
  pubDate: Date
  updatedDate?: Date
  tags: string[]
  draft: boolean
  cover?: string
  format: PostFormat
  words: number
  minutes: number
  /** 仅 md 有：详情页拿它调 render() */
  entry?: CollectionEntry<'posts'>
  /** 仅 html 有：已补好锚点 id 的正文 */
  html?: string
  /** 仅 html 有；md 的目录来自 render() 返回的 headings */
  headings?: Heading[]
  /** 仅 html：文章自带 <style>，正文已包进 .scoped-doc，需要更宽的版心 */
  scoped?: boolean
}

const HTML_DIR = '/src/content/posts/'

const htmlModules = import.meta.glob<string>('/src/content/posts/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function toDate(value: string | Date, filePath: string): Date {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`[posts] ${filePath} 的日期无法解析：${String(value)}`)
  }
  return date
}

function loadHtmlPosts(): Post[] {
  return Object.entries(htmlModules).map(([filePath, raw]) => {
    const { data, body } = parseHtmlPost(raw)

    if (!data.title) throw new Error(`[posts] ${filePath} 缺少 title，请在开头的 <!--astro --> 注释里补上`)
    if (!data.pubDate) throw new Error(`[posts] ${filePath} 缺少 pubDate`)

    // 先补 base 前缀，再把自带样式收窄进容器，最后抽目录
    const scoped = scopeInlineStyles(rewriteBaseUrls(body))
    const { html, headings } = extractHeadings(scoped.html)
    const { words, minutes } = readingStats(body)

    return {
      slug: filePath.slice(HTML_DIR.length).replace(/\.html$/i, ''),
      title: data.title,
      description: data.description ?? '',
      pubDate: toDate(data.pubDate, filePath),
      updatedDate: data.updatedDate ? toDate(data.updatedDate, filePath) : undefined,
      tags: data.tags ?? [],
      draft: data.draft ?? false,
      cover: data.cover,
      format: 'html' as const,
      words,
      minutes,
      html,
      headings,
      scoped: scoped.scoped,
    }
  })
}

async function loadMarkdownPosts(): Promise<Post[]> {
  const entries = await getCollection('posts')
  return entries.map((entry) => {
    const { words, minutes } = readingStats(entry.body ?? '')
    return {
      slug: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      updatedDate: entry.data.updatedDate,
      tags: entry.data.tags,
      draft: entry.data.draft,
      cover: entry.data.cover,
      format: 'md' as const,
      words,
      minutes,
      entry,
    }
  })
}

/** 全部文章，按发布时间倒序。生产构建会滤掉草稿，dev 下保留以便预览。 */
export async function getAllPosts(): Promise<Post[]> {
  const all = [...(await loadMarkdownPosts()), ...loadHtmlPosts()]

  // 两类文章共用 /posts/<slug>/ 命名空间，重名会静默互相覆盖，必须在构建期炸出来
  const seen = new Map<string, PostFormat>()
  for (const post of all) {
    const previous = seen.get(post.slug)
    if (previous) {
      throw new Error(
        `[posts] slug 冲突：「${post.slug}」同时来自 ${previous} 和 ${post.format} 文章，请重命名其中一个文件`,
      )
    }
    seen.set(post.slug, post.format)
  }

  validateTags(all)

  return all
    .filter((post) => (import.meta.env.PROD ? !post.draft : true))
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
}

/**
 * 标签是直接拿来当 URL 路径段的（/tags/<标签>/），有两类问题必须在构建期拦下来：
 *   1. 含 '/' 或 '\\' 会把单段路由撑成多段，Astro 只会抛一句
 *      「Missing parameter: tag」，完全看不出是哪个标签的问题；
 *   2. 只有大小写不同的标签会静默生成两个独立标签页，几乎总是笔误。
 */
function validateTags(posts: Post[]): void {
  const byLowercase = new Map<string, Set<string>>()

  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tag.trim()) {
        throw new Error(`[posts] 「${post.slug}」有一个空标签，请删掉它`)
      }
      if (/[/\\]/.test(tag)) {
        throw new Error(
          `[posts] 「${post.slug}」的标签「${tag}」含有斜杠。` +
            `标签会直接作为 URL 路径段，不能包含 / 或 \\，请改成「${tag.replace(/[/\\]/g, '-')}」这类写法`,
        )
      }

      const key = tag.toLowerCase()
      if (!byLowercase.has(key)) byLowercase.set(key, new Set())
      byLowercase.get(key)!.add(tag)
    }
  }

  // 大小写撞车不阻断构建，但要吵出来，否则一个标签会被拆成两页
  for (const variants of byLowercase.values()) {
    if (variants.size > 1) {
      console.warn(
        `[posts] 标签大小写不一致：${[...variants].map((v) => `「${v}」`).join(' 和 ')}` +
          ` 会各自生成独立的标签页，确认是否想统一成同一个`,
      )
    }
  }
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  return (await getAllPosts()).find((post) => post.slug === slug)
}

export interface TagCount {
  tag: string
  count: number
}

/** 标签按文章数倒序，同数按名称排，保证构建结果稳定 */
export function getAllTags(posts: Post[]): TagCount[] {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'))
}

export interface YearGroup {
  year: number
  posts: Post[]
}

/** 归档页用：按年份倒序分组 */
export function groupByYear(posts: Post[]): YearGroup[] {
  const groups = new Map<number, Post[]>()
  for (const post of posts) {
    const year = post.pubDate.getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(post)
  }
  return [...groups.entries()]
    .map(([year, list]) => ({ year, posts: list }))
    .sort((a, b) => b.year - a.year)
}

/** 统一的日期显示格式 */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/* ---------- 分页 ---------- */

export interface PageSlice {
  posts: Post[]
  currentPage: number
  lastPage: number
  prevUrl?: string
  nextUrl?: string
}

/** 第 1 页固定在 /posts/，其余在 /posts/page/N/ */
export function pageUrlOf(page: number): string {
  return page <= 1 ? '/posts/' : `/posts/page/${page}/`
}

/**
 * 手写分页而不用 Astro 的 paginate()：
 * paginate() 需要 /posts/[...page]，会和文章详情的 /posts/[...slug] 抢同一段路由。
 */
export function pageSlice(posts: Post[], page: number, perPage: number): PageSlice {
  const lastPage = Math.max(1, Math.ceil(posts.length / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage

  return {
    posts: posts.slice(start, start + perPage),
    currentPage,
    lastPage,
    prevUrl: currentPage > 1 ? pageUrlOf(currentPage - 1) : undefined,
    nextUrl: currentPage < lastPage ? pageUrlOf(currentPage + 1) : undefined,
  }
}
