<script setup lang="ts">
import useShadcnTheme from './shadcnTheme'

const configProps = useShadcnTheme()
</script>

<template>
  <ax-provider v-bind="configProps">
    <div>
      <ax-sender :auto-size="{ minRows: 3, maxRows: 6 }" />
    </div>
  </ax-provider>
</template>
