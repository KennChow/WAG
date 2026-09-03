import { visit } from 'unist-util-visit'

/**
 * 把 ```mermaid 代码块换成 <div class="mermaid">，交给客户端 runtime 渲染。
 *
 * 为什么必须放在 remark（mdast）阶段：Astro 把语法高亮器排在用户插件之前，
 * 等流程走到 rehype（hast）时，代码块已经被 Shiki 拆成一堆着色 <span>，
 * 原始图表源码再也拼不回来。mdast 的 code 节点里 node.value 才是干净的原文。
 *
 * 图表源码存进 data-mermaid-src，是因为 Mermaid 渲染是一次性替换 DOM 的，
 * 不留一份原文，切换深浅色主题时就无法重绘。
 */

const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

const escapeAttr = (value) => value.replace(/[&<>"]/g, (c) => ESCAPE[c])

export default function remarkMermaid() {
  return (tree, file) => {
    const isMdx = String(file?.history?.[0] ?? '').endsWith('.mdx')

    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'mermaid' || !parent || index === null || index === undefined) return

      const source = node.value ?? ''

      // .md 走原始 html 节点；.mdx 里 html 节点会被当成 JSX 解析，必须建 JSX 节点
      parent.children[index] = isMdx
        ? {
            type: 'mdxJsxFlowElement',
            name: 'div',
            attributes: [
              { type: 'mdxJsxAttribute', name: 'class', value: 'mermaid' },
              { type: 'mdxJsxAttribute', name: 'data-mermaid-src', value: source },
            ],
            children: [],
          }
        : {
            type: 'html',
            value: `<div class="mermaid" data-mermaid-src="${escapeAttr(source)}"></div>`,
          }
    })
  }
}
