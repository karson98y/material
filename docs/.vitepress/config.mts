import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Materlal",
  description: "A face-to-face experience",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '面经', link: '/InterviewMaterials' }
    ],

    sidebar: [
      {
        text: '面经',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'websocket', link: '/InterviewMaterials/websocket' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
