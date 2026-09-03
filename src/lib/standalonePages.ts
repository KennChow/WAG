/**
 * 第 3 层内容：public/ 下的独立 HTML 文档。
 *
 * 这类文件由 Astro 原样拷贝，不经过任何渲染管线，因此站内没有任何地方会自动
 * 链接到它们——不做索引的话就是死角。这里在构建期扫一遍 public/，
 * 读出每个文件的 <title> 生成清单，新增文件自动出现，不用手工登记。
 */
import fs from 'node:fs'
import path from 'node:path'
import { withBase } from './url'

const PUBLIC_DIR = path.resolve('public')

export interface StandalonePage {
  /** 相对 public/ 的路径，如 demo/dashboard.html */
  file: string
  /** 站内地址，已带 base 前缀 */
  url: string
  title: string
  description?: string
  bytes: number
}

const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/i
const DESCRIPTION = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

const decode = (text: string) =>
  text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (m) => ENTITIES[m] ?? m).trim()

/** 递归收集 public/ 下的 .html，跳过 _ 和 . 开头的文件与目录 */
function walk(dir: string, prefix = ''): string[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const found: string[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue

    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      found.push(...walk(path.join(dir, entry.name), relative))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      // 这两个是 Astro 自己产出的，不属于内容
      if (relative === '404.html' || relative === 'index.html') continue
      found.push(relative)
    }
  }
  return found
}

export function getStandalonePages(): StandalonePage[] {
  return walk(PUBLIC_DIR)
    .map((file) => {
      const source = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf-8')
      const title = source.match(TITLE)?.[1]
      const description = source.match(DESCRIPTION)?.[1]

      return {
        file,
        url: withBase(`/${file}`),
        // 没写 <title> 就退回文件名，至少不会出现一行空白
        title: title ? decode(title) : file,
        description: description ? decode(description) : undefined,
        bytes: Buffer.byteLength(source),
      }
    })
    // 按路径排序而不是按修改时间：CI 里 checkout 出来的 mtime 全是当次构建时间，没有意义
    .sort((a, b) => a.file.localeCompare(b.file))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
