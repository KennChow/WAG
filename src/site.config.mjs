/**
 * 站点唯一配置源。改站点信息只动这个文件。
 *
 * 用 .mjs 而非 .ts，是因为 astro.config.mjs 需要在配置加载阶段导入它；
 * 纯 JS 对象字面量可以被 TS 直接推断出类型，组件里依然有补全。
 */
export const SITE = {
  /** GitHub Pages 的源站，不含仓库子路径 */
  origin: 'https://kennchow.github.io',
  /** 项目仓库子路径部署。若改用 <用户名>.github.io 用户主页，把这里改成 '/' */
  base: '/WAG',

  title: 'WAG',
  subtitle: '写点东西',
  description: '一个记录技术与思考的地方。',
  author: 'KenChow',
  lang: 'zh-CN',

  /** 列表页每页文章数 */
  postsPerPage: 10,
  /** 首页展示的最新文章数 */
  homeRecentCount: 5,

  nav: [
    { text: '首页', href: '/' },
    { text: '文章', href: '/posts/' },
    { text: '标签', href: '/tags/' },
    { text: '归档', href: '/archive/' },
    { text: '搜索', href: '/search/' },
    { text: '独立页面', href: '/pages/' },
    { text: '关于', href: '/about/' },
  ],

  social: [
    { text: 'GitHub', href: 'https://github.com/KennChow' },
    { text: 'RSS', href: '/rss.xml' },
  ],

  /**
   * giscus 评论，基于 GitHub Discussions，数据留在本仓库。
   * repoId / categoryId 是 GitHub 的 node id，换仓库或换分类时要一并更新，
   * 可从 https://giscus.app 重新生成。留空时评论区静默不渲染，不影响构建。
   */
  giscus: {
    repo: 'KennChow/WAG',
    repoId: 'R_kgDOUMnVZQ',
    category: 'Announcements',
    categoryId: 'DIC_kwDOUMnVZc4DEw_e',
    mapping: 'pathname',
    strict: '0',
    reactionsEnabled: '1',
    inputPosition: 'bottom',
    lang: 'zh-CN',
  },
}

export default SITE
