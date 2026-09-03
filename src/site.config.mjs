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
    { text: '关于', href: '/about/' },
  ],

  social: [
    { text: 'GitHub', href: 'https://github.com/KennChow' },
    { text: 'RSS', href: '/rss.xml' },
  ],

  /**
   * giscus 评论。四个值需要你自己补：
   *   1. 仓库 Settings → General → Features 勾选 Discussions
   *   2. 打开 https://giscus.app ，填入仓库，选好分类，页面会生成 repoId / categoryId
   * 留空时评论区不渲染，不影响构建。
   */
  giscus: {
    repo: 'KennChow/WAG',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
    mapping: 'pathname',
    reactionsEnabled: '1',
    lang: 'zh-CN',
  },
}

export default SITE
