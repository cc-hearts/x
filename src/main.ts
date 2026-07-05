import { createApp, defineComponent, h } from 'vue'
import './style.css'
import App from './App.vue'
import MarkdownPlayground from './MarkdownPlayground.vue'
import 'virtual:uno.css'
import AntdX from '@antdv-next/x'
import Antdv from 'antdv-next'
import { ThemeProvider } from 'antdv-style'
import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import '@antdv-next/x-markdown/themes/dark.css'
import 'antdv-next/dist/reset.css'

// 访问 #/markdown 进入 Markdown 渲染测试页，其余路径走聊天主页
const isMarkdownTest = window.location.hash.startsWith('#/markdown')

const Root = defineComponent({
  name: 'Root',
  setup() {
    return () =>
      h(ThemeProvider, null, {
        default: () => h(isMarkdownTest ? MarkdownPlayground : App),
      })
  },
})

createApp(Root).use(Antdv).use(AntdX).mount('#app')
