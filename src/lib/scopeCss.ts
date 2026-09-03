/**
 * 把一段 CSS 收窄到某个容器内，供第 2 层 HTML 文章使用。
 *
 * 作者常常是把一份完整独立的 HTML 文档丢进 src/content/posts/，
 * 里面带着 `body {}`、`h1 {}` 这类宽泛选择器。直接注入的话，
 * 这些规则会把站点页头页脚一起重新上色。
 *
 * 这里用 postcss 真正解析一遍再改写选择器，而不是拿正则去凑——
 * 嵌套的 @media、@supports、@keyframes 各有各的规则，正则改不对。
 */
import postcss from 'postcss'

/** 这些 at-rule 内部不是选择器，绝不能加前缀 */
const KEYFRAMES = /(?:^|-)keyframes$/i

/**
 * 选择器开头的 :root / html / body，以及紧跟其后的限定部分
 * （如 `:root[data-theme="dark"]`、`:root:not([data-theme="light"])`）。
 */
const ROOT_LIKE = /^(:root|html|body)((?:\[[^\]]*\]|::?[\w-]+(?:\([^)]*\))?|\.[\w-]+|#[\w-]+)*)/i

function scopeSelector(selector: string, scope: string): string {
  const s = selector.trim()
  if (!s) return s

  // 已经在作用域内，别套第二层
  if (s === scope || s.startsWith(`${scope} `) || s.startsWith(`${scope}.`) || s.startsWith(`${scope}:`)) {
    return s
  }

  // 通配符要同时命中容器自身，否则 `* { box-sizing }` 这类重置会漏掉容器
  if (s === '*') return `${scope}, ${scope} *`

  const rootMatch = s.match(ROOT_LIKE)
  if (rootMatch) {
    const qualifier = rootMatch[2] ?? ''
    const rest = s.slice(rootMatch[0].length).trim()

    /*
     * 带限定的根选择器不能降级成后代选择器：
     * `:root[data-theme="dark"]` 说的是「根元素处于暗色」，而 data-theme 挂在 <html> 上，
     * 是容器的祖先。写成 `.scoped-doc [data-theme="dark"]` 会变成「容器内任意暗色元素」，
     * 语义全错。正确做法是把限定原样留作祖先，再接上作用域容器——
     * 这样文章自带的暗色配色还能跟着站点的主题切换一起生效。
     */
    if (qualifier) {
      return rest ? `${rootMatch[1]}${qualifier} ${scope} ${rest}` : `${rootMatch[1]}${qualifier} ${scope}`
    }

    // 裸的 :root / html / body 就是文档根本身，映射成容器
    return rest ? `${scope} ${rest}` : scope
  }

  return `${scope} ${s}`
}

export function scopeCss(css: string, scope: string): string {
  const root = postcss.parse(css)

  root.walkRules((rule) => {
    const parent = rule.parent
    // @keyframes 里的 from / to / 0% 是关键帧选择器，不是 CSS 选择器
    if (parent && parent.type === 'atrule' && KEYFRAMES.test(parent.name)) return

    rule.selectors = rule.selectors.map((selector) => scopeSelector(selector, scope))
  })

  return root.toString()
}
