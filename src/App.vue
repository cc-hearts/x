<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import useShadcnTheme from './shadcnTheme'

import { BubbleList, Think, type BubbleItemType } from '@antdv-next/x';

import { XMarkdown } from "@antdv-next/x-markdown";
import { DeepSeekChatProvider, useXChat, XRequest, type XModelMessage, type XModelParams, } from "@antdv-next/x-sdk";

const configProps = useShadcnTheme()

const senderRef = useTemplateRef('senderRef')

interface ToolCall {
  id?: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

interface SelectTimeToolArguments {
  title: string
  mode: 'date' | 'time' | 'datetime'
}

interface ActiveSelectTimeTool {
  key: string | number
  id?: string
  arguments: SelectTimeToolArguments
}

type ChatMessage = XModelMessage & {
  tool_calls?: ToolCall[]
  finish_reason?: string
}

const selectedTimes = reactive<Record<string, string>>({})
const handledToolCallKeys = reactive<Record<string, boolean>>({})
const localToolResults = reactive<Record<string, string>>({})
const pendingSelectTime = ref('')

const ping = ({ message }: { message: string }) => `pong: ${message}`

const executeLocalToolCall = (toolCall: ToolCall): string | undefined => {
  if (toolCall.function.name === 'ping') {
    try {
      const args = JSON.parse(toolCall.function.arguments || '{}') as { message?: string }
      return ping({ message: args.message || '' })
    } catch (error) {
      return `ping 参数解析失败：${error instanceof Error ? error.message : String(error)}`
    }
  }

  return undefined
}

const selectTimeTool = {
  type: 'function',
  function: {
    name: 'select_time',
    description: '当用户需要预约、安排日程、设置提醒或选择日期时间时调用，让用户在界面中选择日期时间。',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '时间选择器标题，例如“请选择会议时间”。',
        },
        mode: {
          type: 'string',
          enum: ['date', 'time', 'datetime'],
          description: '时间选择模式。',
        },
      },
      required: ['title', 'mode'],
    },
  },
} as const

const pingTool = {
  type: 'function',
  function: {
    name: 'ping',
    description: '测试模型和接口是否支持 OpenAI tools/tool_calls。被要求 ping 时必须调用此工具。',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: '测试消息，固定填写 hello。',
        },
      },
      required: ['message'],
    },
  },
} as const

const getToolCallKey = (messageId: string | number, toolCall: ToolCall, index: number) =>
  `${messageId}:${toolCall.id || `${toolCall.function.name}-${index}`}`

const normalizeToolCalls = (originToolCalls: ToolCall[] = [], nextToolCalls: any[] = []): ToolCall[] => {
  const result = originToolCalls.map((toolCall) => ({
    ...toolCall,
    function: { ...toolCall.function },
  }))

  nextToolCalls.forEach((toolCall, index) => {
    const targetIndex = typeof toolCall.index === 'number' ? toolCall.index : index
    const existing = result[targetIndex] || {
      type: 'function',
      function: {
        name: '',
        arguments: '',
      },
    }

    result[targetIndex] = {
      id: toolCall.id || existing.id,
      type: toolCall.type || existing.type || 'function',
      function: {
        name: toolCall.function?.name || existing.function.name,
        arguments: `${existing.function.arguments || ''}${toolCall.function?.arguments || ''}`,
      },
    }
  })

  return result
}

class ToolCallingChatProvider extends DeepSeekChatProvider<ChatMessage> {
  transformMessage(info: any): ChatMessage {
    const { originMessage, chunk, responseHeaders } = info
    let currentContent = ''
    let currentThink = ''
    let role = originMessage?.role || 'assistant'
    let finishReason = originMessage?.finish_reason
    let currentToolCalls: ToolCall[] = originMessage?.tool_calls || []

    try {
      let message
      if (responseHeaders.get('content-type')?.includes('text/event-stream')) {
        if (chunk && chunk.data?.trim() !== '[DONE]') {
          message = JSON.parse(chunk.data)
        }
      } else {
        message = chunk
      }

      message?.choices?.forEach((choice: any) => {
        const choiceMessage = choice?.delta || choice?.message
        if (!choiceMessage) return

        finishReason = choice.finish_reason || finishReason
        currentThink += choiceMessage.reasoning_content || choiceMessage.thinking || ''
        currentContent += choiceMessage.content || ''
        role = choiceMessage.role || role
        currentToolCalls = normalizeToolCalls(currentToolCalls, choiceMessage.tool_calls || [])
      })
    } catch (error) {
      console.error('transformMessage error', error)
    }

    const originContent = typeof originMessage?.content === 'string'
      ? originMessage.content
      : originMessage?.content?.text || ''

    return {
      role,
      content: `${originContent}${currentThink}${currentContent}`,
      tool_calls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
      finish_reason: finishReason,
    }
  }
}

const provider = new ToolCallingChatProvider({
  request: XRequest("http://localhost:8082/v1/chat/completions", {
    manual: true,
    headers: {
      Authorization: "Bearer change-me", // 替换为实际的 token
    },
  }),
});

interface ParsedThinkContent {
  thinkContent: string;
  answerContent: string;
  thinkDone: boolean;
}

const parseThinkContent = (value: string): ParsedThinkContent | null => {
  const openMatch = value.match(/<think(?:\s+status=["']?([^"'>\s]+)["']?)?>/i);
  if (!openMatch || openMatch.index === undefined) {
    return null;
  }

  const openTag = openMatch[0];
  const status = (openMatch[1] || "").toLowerCase();
  const thinkStart = openMatch.index + openTag.length;
  const closeTag = "</think>";
  const closeIndex = value.indexOf(closeTag, thinkStart);

  const prefix = value.slice(0, openMatch.index).trim();
  const thinkRaw =
    closeIndex === -1 ? value.slice(thinkStart) : value.slice(thinkStart, closeIndex);
  const suffix = closeIndex === -1 ? "" : value.slice(closeIndex + closeTag.length).trim();

  const thinkContent = thinkRaw.replace(/^\n+/, "").trim();
  const answerContent = [prefix, suffix].filter(Boolean).join("\n\n").trim();
  const thinkDone = closeIndex !== -1 || status === "done";

  return {
    thinkContent,
    answerContent,
    thinkDone,
  };
};

const { onRequest, messages } = useXChat<ChatMessage, ChatMessage, XModelParams>({
  provider,
  requestPlaceholder: {
    role: 'assistant',
    content: 'Waiting...',
  },
  requestFallback: {
    role: 'assistant',
    content: 'Mock failed return. Please try again later.',
  },
});

watch(messages, () => {
  messages.value.forEach(({ id, message }) => {
    if (message.finish_reason !== 'tool_calls') return

    message.tool_calls?.forEach((toolCall, index) => {
      const key = getToolCallKey(id, toolCall, index)
      if (localToolResults[key]) return

      const result = executeLocalToolCall(toolCall)
      if (result !== undefined) {
        localToolResults[key] = result
      }
    })
  })
}, { deep: true })

const getMessageContent = (content: XModelMessage['content']) => {
  if (typeof content === 'string') return content

  return content.text
}

const bubbleItems = computed<BubbleItemType[]>(() =>
  messages.value.map(({ id, message, status, extraInfo }) => {
    const isUser = message.role === 'user'
    const msg = getMessageContent(message.content)

    const { thinkContent, answerContent, thinkDone } = parseThinkContent(msg) || {}
    return {
      key: id,
      role: isUser ? 'user' : 'ai',
      placement: isUser ? 'end' : 'start',
      content: answerContent || msg,
      thinkContent,
      thinkDone,
      toolCalls: message.tool_calls,
      finishReason: message.finish_reason,
      localToolResults,
      status,
      extraInfo,
    }
  }),
)

const parseSelectTimeArguments = (value: string): SelectTimeToolArguments => {
  try {
    const parsed = JSON.parse(value || '{}') as Partial<SelectTimeToolArguments>

    return {
      title: parsed.title || '请选择时间',
      mode: parsed.mode || 'datetime',
    }
  } catch {
    return {
      title: '请选择时间',
      mode: 'datetime',
    }
  }
}

const activeSelectTimeTool = computed<ActiveSelectTimeTool | null>(() => {
  for (const { id, message } of [...messages.value].reverse()) {
    const toolCall = message.tool_calls?.find((item) => item.function.name === 'select_time')
    const key = toolCall?.id || id

    if (toolCall && !handledToolCallKeys[String(key)]) {
      return {
        key,
        id: toolCall.id,
        arguments: parseSelectTimeArguments(toolCall.function.arguments),
      }
    }
  }

  return null
})

const handleSelectTimeChange = (_date: unknown, dateString: string | string[]) => {
  pendingSelectTime.value = Array.isArray(dateString) ? dateString.join(' ~ ') : dateString
}

const handleConfirmSelectTime = () => {
  const activeTool = activeSelectTimeTool.value
  if (!activeTool || !pendingSelectTime.value) return

  selectedTimes[String(activeTool.key)] = pendingSelectTime.value
  handledToolCallKeys[String(activeTool.key)] = true
  senderRef.value?.insert(`我选择的时间是：${pendingSelectTime.value}`)
  pendingSelectTime.value = ''
}

const handleSubmit = (val: string) => {
  onRequest({
    "model": "xopqwen36v35b",
    "messages": [
      {
        "role": "user",
        "content": val
      }
    ],
    "stream": true,
    "tools": [selectTimeTool],
    "tool_choice": "auto"
  })


  senderRef.value?.clear()
}

const handleTestToolCall = () => {
  onRequest({
    model: 'xopqwen36v35b',
    messages: [
      {
        role: 'user',
        content: '请调用 ping 工具，参数 message 填 hello',
      },
    ],
    stream: true,
    tools: [pingTool],
    tool_choice: {
      type: 'function',
      function: {
        name: 'ping',
      },
    },
  })
}

</script>

<template>
  <ax-provider v-bind="configProps">

    <bubble-list :items="bubbleItems">

      <template #contentRender="{ content, item }">

        <think title="deep thinking" v-if="item.thinkContent" blink>
          <XMarkdown :content="item.thinkContent" />
        </think>

        <a-flex v-if="item.thinkDone || !item.thinkContent" vertical gap="small">
          <XMarkdown :content="content" />
          <a-flex v-if="item.toolCalls?.length" vertical gap="small">
            <a-alert v-for="toolCall in item.toolCalls" :key="toolCall.id || toolCall.function.name" type="info"
              show-icon>
              <template #message>
                Tool called: {{ toolCall.function.name }}
              </template>
              <template #description>
                <a-flex vertical gap="small">
                  <span>Arguments: {{ toolCall.function.arguments }}</span>
                  <span v-if="item.localToolResults?.[`${item.key}:${toolCall.id || `${toolCall.function.name}-${item.toolCalls.indexOf(toolCall)}`}`]">
                    Local result: {{ item.localToolResults[`${item.key}:${toolCall.id || `${toolCall.function.name}-${item.toolCalls.indexOf(toolCall)}`}`] }}
                  </span>
                </a-flex>
              </template>
            </a-alert>
          </a-flex>

        </a-flex>
      </template>

    </bubble-list>
    <div>
      <a-flex justify="end" style="margin-bottom: 8px">
        <a-button @click="handleTestToolCall">测试 tools 调用</a-button>
      </a-flex>
      <ax-sender ref="senderRef" :auto-size="{ minRows: 3, maxRows: 6 }" @submit="handleSubmit">
        <template #header v-if="activeSelectTimeTool">
          <a-flex vertical gap="small" style="padding: 12px">
            <a-typography-text strong>
              {{ activeSelectTimeTool.arguments.title }}
            </a-typography-text>
            <a-space>
              <a-date-picker :show-time="activeSelectTimeTool.arguments.mode !== 'date'"
                :picker="activeSelectTimeTool.arguments.mode === 'time' ? 'time' : 'date'"
                :placeholder="activeSelectTimeTool.arguments.title" @change="handleSelectTimeChange" />
              <a-button type="primary" :disabled="!pendingSelectTime" @click="handleConfirmSelectTime">
                确认时间
              </a-button>
            </a-space>
            <a-typography-text v-if="pendingSelectTime" type="secondary">
              将插入：我选择的时间是：{{ pendingSelectTime }}
            </a-typography-text>
          </a-flex>
        </template>
      </ax-sender>
    </div>
  </ax-provider>
</template>
