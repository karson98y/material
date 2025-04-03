export default [
  {
    text: '介绍', link: '/guide/index.md'
  },
  {
    text: 'Vue2/3指南',
    items: [
      {
        items: [
          {
            text: 'V2', items: [
              { text: '生命周期总览', link: '/guide/v2/created' },
              { text: '响应式原理', link: '/guide/v2/defineProperty' },
              { text: '异步队列更新原理', link: '/guide/v2/nextTick' },
              { text: 'vue.$set原理', link: '/guide/v2/$set' },
              { text: '组件通信', link: '/guide/v2/communication' },
              { text: 'v2弊端与改进', link: '/guide/v2/disadvantages' },
            ]
          },
          {
            text: 'V3', items: [
              { text: '响应式原理', link: '/guide/v3/proxy' },
              { text: '组件通信', link: '/guide/v3/v3-communication' },
            ]
          },
        ]
      }
    ]
  },
  {
    text: 'react 指南', items: []
  },
  {
    text: '其他 指南', items: []
  }
]