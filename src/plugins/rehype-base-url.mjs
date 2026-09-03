import { visit } from 'unist-util-visit'
import { SITE } from '../site.config.mjs'

/**
 * 把 Markdown 正文里的站内绝对链接补上 base 前缀。
 *
 * 站点部署在 /WAG/ 子路径下，但作者在正文里写的是 [归档](/archive/)——
 * 这类链接不经过 withBase()，不处理的话线上全是 404。
 * 有了这个插件，正文里按根路径写就行，构建时自动补前缀。
 */

const BASE = SITE.base.replace(/\/+$/, '')

/** 只处理这些标签的这些属性，避免误伤 */
const TARGETS = {
  a: 'href',
  area: 'href',
  link: 'href',
  img: 'src',
  source: 'src',
  video: 'src',
  audio: 'src',
  iframe: 'src',
  embed: 'src',
}

export default function rehypeBaseUrl() {
  // 根路径部署时整个插件是空操作
  if (!BASE) return () => {}

  return (tree) => {
    visit(tree, 'element', (node) => {
      const attribute = TARGETS[node.tagName]
      if (!attribute) return

      const value = node.properties?.[attribute]
      if (typeof value !== 'string') return

      // 只认站内根路径；'//host' 是协议相对外链，要放过
      if (!value.startsWith('/') || value.startsWith('//')) return
      // Astro 处理过的资源已经带了前缀，别加第二次
      if (value === BASE || value.startsWith(`${BASE}/`)) return

      node.properties[attribute] = `${BASE}${value}`
    })
  }
}
