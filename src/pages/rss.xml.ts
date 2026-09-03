import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts } from '../lib/posts'
import { absoluteUrl, postUrl } from '../lib/url'
import { SITE } from '../site.config.mjs'

export async function GET(context: APIContext) {
  const posts = await getAllPosts()

  return rss({
    title: SITE.title,
    description: SITE.description,
    /*
     * site 要指到带子路径的站点根，频道 <link> 才是 .../WAG/ 而不是域名根。
     * item.link 用的是 /WAG/... 这种根绝对路径，解析时会忽略 site 的路径段，
     * 所以不会变成 /WAG/WAG/。
     */
    site: absoluteUrl('/', context.site ?? SITE.origin),
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.pubDate,
      link: postUrl(post.slug),
      categories: post.tags,
    })),
    customData: `<language>zh-cn</language>`,
  })
}
