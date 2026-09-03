/**
 * base 路径的唯一出口。
 *
 * 站点部署在 https://kennchow.github.io/WAG/ 这样的子路径下，Astro 只会自动处理
 * 经由 import 引入的资源；手写的 href / src / public 下的文件都不会加前缀。
 * 全站所有链接都必须走 withBase()，否则线上 404。
 */

/** import.meta.env.BASE_URL 的尾斜杠受 trailingSlash 影响，这里统一归一化成无尾斜杠形式 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '')

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

/** 是否为站外链接（含 mailto: 等协议链接与协议相对地址） */
export const isExternal = (href: string) => EXTERNAL.test(href)

/**
 * 给站内路径加上 base 前缀；外链、锚点、协议链接原样返回。
 *
 * 幂等：Astro 的 paginate() 等 API 返回的 URL 已经带了 base，
 * 再包一层不能变成 /WAG/WAG/，所以这里先判重。
 */
export function withBase(path: string): string {
  if (!path) return `${BASE}/`
  if (EXTERNAL.test(path) || path.startsWith('#')) return path

  const normalized = path.startsWith('/') ? path : `/${path}`
  if (BASE && (normalized === BASE || normalized.startsWith(`${BASE}/`))) return normalized

  return `${BASE}${normalized}`
}

/** 拼出带域名的绝对地址，用于 canonical、OG、RSS */
export function absoluteUrl(path: string, site: URL | string | undefined): string {
  const withBasePath = withBase(path)
  if (!site) return withBasePath
  return new URL(withBasePath, site).href
}

/** 文章详情页地址 */
export const postUrl = (slug: string) => withBase(`/posts/${slug}/`)

/** 标签归档页地址 */
export const tagUrl = (tag: string) => withBase(`/tags/${encodeURIComponent(tag)}/`)

/**
 * 判断导航项是否处于选中态。
 * 首页要求完全相等，否则任何路径都会命中 '/'。
 */
export function isActiveNav(currentPath: string, navHref: string): boolean {
  const current = withBase(currentPath).replace(/\/+$/, '') || '/'
  const target = withBase(navHref).replace(/\/+$/, '') || '/'
  if (target === (BASE || '/')) return current === (BASE || '/')
  return current === target || current.startsWith(`${target}/`)
}
