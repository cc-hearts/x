<script setup lang="ts">
// XMarkdown 会把 <pre><code data-block="true">…</code></pre> 中的 <code>
// 替换为 CodeHighlighter。这里让 <pre> 仅透传子节点，避免 <pre> 与
// CodeHighlighter 双层包裹造成样式/语义冲突。
defineOptions({ inheritAttrs: false })
</script>

<template>
  <slot />
</template>
