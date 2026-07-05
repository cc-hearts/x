export interface SystemPrompt {
  /** 唯一标识：文件名（不含扩展名），如 text-optimize */
  key: string
  /** 下拉框显示名 */
  name: string
  /** 源文件相对路径 */
  path: string
  /** 提示词正文 */
  content: string
}

// 通过 Vite 的 import.meta.glob 以原始字符串形式同步加载 src/prompt 下所有 .md 文件。
// 新增 .md 文件会自动被发现，无需修改此处代码。
const promptModules = import.meta.glob('../prompt/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const systemPrompts: SystemPrompt[] = Object.entries(promptModules)
  .map(([path, content]) => {
    const fileName = path.split('/').pop() ?? path
    const key = fileName.replace(/\.md$/i, '')
    return {
      key,
      name: key,
      path,
      content: content.trim(),
    }
  })
  .sort((a, b) => a.key.localeCompare(b.key))

/** a-select 直接可用的 options */
export const promptOptions = systemPrompts.map((p) => ({
  label: p.name,
  value: p.key,
}))

/** 根据 key 查找系统提示词；key 为空时返回 undefined */
export function findSystemPrompt(key?: string | null): SystemPrompt | undefined {
  if (!key) return undefined
  return systemPrompts.find((p) => p.key === key)
}
