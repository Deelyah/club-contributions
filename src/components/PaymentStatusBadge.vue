<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dueAmount: number
  amountPaid: number
}>()

const status = computed(() => {
  if (props.amountPaid > props.dueAmount) return 'credit'
  if (props.amountPaid >= props.dueAmount) return 'paid'
  if (props.amountPaid > 0) return 'partial'
  return null // fully unpaid — no badge
})

const label = computed(() => status.value ? ({
  paid: 'Paid',
  partial: 'Partial',
  credit: 'Credit'
})[status.value] : '')

const icon = computed(() => status.value ? ({
  paid: '✓',
  partial: '~',
  credit: '+'
})[status.value] : '')
</script>

<template>
  <span v-if="status" :class="`badge-${status}`">
    <span class="font-bold text-[10px]">{{ icon }}</span>
    {{ label }}
  </span>
</template>
