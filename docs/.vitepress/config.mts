import { defineConfig } from 'vitepress'

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
      { text: '面经', link: '/InterviewMaterials' }
    ],

    sidebar: [
      {
        text: '面试题深度解析',
        items: [
          // {
          //   text: 'Markdown Examples', collapsed: false, items: [
          //   { text: 'd', link: '/markdown-examples' }
          // ] },
          {
            text: 'Vue', collapsed: false, items: [
              { text: '生命周期总览', link: '/InterviewMaterials/vue/proxy' },
              {
                text: 'v2', items: [
                  { text: '响应式原理', link: '/InterviewMaterials/vue/defineProperty' },
                  { text: '组件通信', link: '/InterviewMaterials/vue/v2-communication' },
                ]
              },
              {
                text: 'v3', items: [
                  { text: '响应式原理', link: '/InterviewMaterials/vue/proxy' },
                  { text: '组件通信', link: '/InterviewMaterials/vue/v3-communication' },
                ]
              },
          
          ] },
          { text: 'React', link: '/InterviewMaterials/react' },
          { text: 'Node', link: '/InterviewMaterials/node' },
          { text: 'Websocket', link: '/InterviewMaterials/websocket' },
          { text: 'Print', link: '/InterviewMaterials/print' },
        ],
        
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
