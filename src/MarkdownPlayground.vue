<script setup lang="ts">
import { XMarkdown } from '@antdv-next/x-markdown'
import { ref } from 'vue'
import demoContent from './assets/markdown-demo.md?raw'
import CodeBlock from './components/CodeBlock.vue'
import PrePassthrough from './components/PrePassthrough.vue'

const markdownComponents = { code: CodeBlock, pre: PrePassthrough }
const content = ref(demoContent)
</script>

<template>
  <div class="playground">
    <header class="playground-header">
      <h2>Markdown 渲染测试</h2>
      <span class="hint"
        >编辑左侧源码 → 右侧实时预览 · 移除 URL 中的
        <code>#/markdown</code> 回到聊天主页</span
      >
    </header>
    <div class="playground-body">
      <div class="pane">
        <div class="pane-title">Markdown 源码</div>
        <textarea v-model="content" class="editor" spellcheck="false" />
      </div>
      <div class="pane">
        <div class="pane-title">预览</div>
        <div class="preview">
          <XMarkdown
            :content="content"
            className="x-markdown-light"
            :components="markdownComponents"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  gap: 12px;
}
.playground-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.playground-header h2 {
  margin: 0;
}
.hint {
  color: #888;
  font-size: 13px;
}
.hint code {
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
}
.playground-body {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
}
.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}
.pane-title {
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-size: 13px;
  color: #666;
}
.editor {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
}
.preview {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
