/**
 * 中文感知的字数与阅读时长。
 *
 * npm 上的 reading-time 按空格切词，中文整段会被算成 1 个词，结果完全失真。
 * 这里把 CJK 字符和拉丁词分开计数，各按各自的阅读速度折算再相加。
 */

const CJK = /[一-鿿㐀-䶿぀-ヿ가-힯]/gu
const LATIN_WORD = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/gu

/** 中文阅读速度：字/分钟 */
const CJK_PER_MINUTE = 400
/** 英文阅读速度：词/分钟 */
const LATIN_PER_MINUTE = 200

/** 剥掉 HTML 标签、代码块、Markdown 记号，只留正文文字 */
export function stripMarkup(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}[-*+]\s+/gm, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
    .replace(/[*_~>|]/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
}

export interface ReadingStats {
  /** CJK 字数 + 拉丁词数 */
  words: number
  /** 向上取整的分钟数，至少 1 */
  minutes: number
}

export function readingStats(source: string): ReadingStats {
  const text = stripMarkup(source)
  const cjk = text.match(CJK)?.length ?? 0
  const latin = text.match(LATIN_WORD)?.length ?? 0
  const minutes = Math.max(1, Math.ceil(cjk / CJK_PER_MINUTE + latin / LATIN_PER_MINUTE))
  return { words: cjk + latin, minutes }
}
