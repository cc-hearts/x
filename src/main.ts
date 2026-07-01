import { createApp, defineComponent, h } from 'vue'
import './style.css'
import App from './App.vue'
import 'virtual:uno.css'
import AntdX from '@antdv-next/x'
import Antdv from 'antdv-next'
import { ThemeProvider } from 'antdv-style'

import "antdv-next/dist/reset.css";

const Root = defineComponent({
  name: 'Root',
  setup() {
    return () => h(ThemeProvider, null, { default: () => h(App) })
  },
})

createApp(Root).use(Antdv).use(AntdX).mount('#app')
