<script setup lang="ts">
import { CodeHighlighter } from '@antdv-next/x';
import { useSlots, type VNodeChild } from 'vue';

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  lang?: string
  block?: boolean
  streamStatus?: 'loading' | 'done'
}>()

const slots = useSlots()

// 注意：XMarkdown 当前版本并不会把 domNode 作为 prop 传入自定义组件
// （ComponentProps 类型里声明了 domNode，但 extractComponentProps 从未设置），
// 因此代码原文需要从默认插槽的 VNode 中提取。
function vnodesToText(vnodes?: VNodeChild[] | VNodeChild): string {
  if (vnodes == null) return ''
  const arr = Array.isArray(vnodes) ? vnodes : [vnodes]
  let text = ''
  for (const node of arr) {
    if (node == null || typeof node === 'boolean') continue
    if (typeof node === 'string' || typeof node === 'number') {
      text += String(node)
      continue
    }
    const children = (node as { children?: unknown }).children
    if (typeof children === 'string') {
      text += children
    } else if (Array.isArray(children)) {
      text += vnodesToText(children as VNodeChild[])
    }
  }
  return text
}

// 用函数而非 computed：slots.default() 本身不是响应式依赖，
// 改用函数保证每次组件重渲染（如流式更新）都从最新插槽提取文本。
function getCodeText(): string {
  return vnodesToText(slots.default?.())
}
</script>

<template>
  <CodeHighlighter
    v-if="block && streamStatus !== 'loading'"
    :content="getCodeText()"
    :language="lang || 'text'"
    show-line-numbers
    show-copy-button
    show-language
  />
</template>
