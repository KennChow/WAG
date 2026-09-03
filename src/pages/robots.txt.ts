import type { APIContext } from 'astro'
import { absoluteUrl } from '../lib/url'
import { SITE } from '../site.config.mjs'

export function GET(context: APIContext) {
  const sitemap = absoluteUrl('/sitemap-index.xml', context.site ?? SITE.origin)

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
