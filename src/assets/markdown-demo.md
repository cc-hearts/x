# Markdown 渲染测试

访问根路径（不带 hash）回到聊天主页。编辑左侧源码可实时预览右侧渲染效果。

## 1. 代码块（应被 CodeHighlighter 高亮）

```ts
interface User {
  id: number
  name: string
}

function greet(user: User): string {
  return `Hello, ${user.name}!`
}
```

```javascript
const arr = [1, 2, 3].map((x) => x * 2)
console.log(arr)
```

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b
```

```bash
pnpm install
pnpm dev
```

```json
{
  "name": "x-starter",
  "version": "0.0.0"
}
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

## 2. 行内代码

使用 `npm run dev` 启动项目，配置文件在 `vite.config.ts` 中。

## 3. 其他语法

**粗体**、*斜体*、~~删除线~~

- 列表项 1
- 列表项 2
  - 嵌套项

> 引用块

| 名称 | 值 |
| --- | --- |
| a | 1 |
| b | 2 |

[链接](https://vuejs.org)
