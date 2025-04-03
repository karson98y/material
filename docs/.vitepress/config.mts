import { defineConfig } from 'vitepress'
import guideSidebar from './guide.sidebar'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Materlal",
  appearance: 'dark',
  description: "A face-to-face experience",
  lastUpdated: true,
  themeConfig: {
    search: {
      provider: 'local'
    },
    
    // logo: '/my-logo.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '技术解析', link: '/guide/'},
    ],

    sidebar: {
      '/guide/': guideSidebar,
      '/react/': [
        { text: 'H5 vs RN', link: '/InterviewMaterials/h5vsRn' },
        { text: 'React', link: '/InterviewMaterials/react' },
        { text: 'Node', link: '/InterviewMaterials/node' },
        { text: 'Websocket', link: '/InterviewMaterials/websocket' },
        { text: 'Print', link: '/InterviewMaterials/print' },
      ]
    },
   

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
