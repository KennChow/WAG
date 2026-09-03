import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
// 从 astro:content 导入 z 已废弃，Astro 8 会移除
import { z } from 'astro/zod'

/**
 * 只收 md / mdx —— 同目录下的 .html 文章由 src/lib/posts.ts 用 import.meta.glob 单独加载，
 * 两者靠扩展名分流，互不干扰。
 */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
  }),
})

export const collections = { posts }
