import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

const transformStart = source.indexOf('transformMessage')
const transformEnd = source.indexOf('const provider')
const transformMessageBody = transformStart === -1 || transformEnd === -1
  ? source
  : source.slice(transformStart, transformEnd)

const checks = [
  ['defines ping tool', /const\s+pingTool\s*=/.test(source)],
  ['forces ping tool choice', /tool_choice[\s\S]*type:\s*['"]function['"][\s\S]*function:[\s\S]*name:\s*['"]ping['"]/.test(source)],
  ['adds test button label', source.includes('测试 tools 调用')],
  ['defines local ping function', /const\s+ping\s*=/.test(source) && source.includes('pong:')],
  ['executes local tool calls', /executeLocalToolCall/.test(source) && /toolCall\.function\.name\s*===\s*['"]ping['"]/.test(source)],
  ['preserves finish reason', source.includes('finish_reason')],
  ['gates local execution on finish_reason tool_calls', source.includes("message.finish_reason !== 'tool_calls'")],
  ['does not execute local tools inside transformMessage', !transformMessageBody.includes('executeLocalToolCall')],
  ['renders tool call debug output', source.includes('Tool called:') && source.includes('Arguments:')],
  ['renders local tool result', source.includes('Local result:')],
  ['uses same fallback result key as executor', source.includes('`${toolCall.function.name}-${item.toolCalls.indexOf(toolCall)}`')],
]

const failed = checks.filter(([, passed]) => !passed)
if (failed.length > 0) {
  console.error('Tools demo checks failed:')
  for (const [name] of failed) console.error(`- ${name}`)
  process.exit(1)
}

console.log('Tools demo checks passed')
