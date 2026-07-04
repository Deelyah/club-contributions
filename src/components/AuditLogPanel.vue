<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auditApi } from '../api'

const props = defineProps<{ memberId?: string }>()
const emit = defineEmits<{ close: [] }>()

interface AuditLog {
  id: number
  admin_username: string
  member_username: string | null
  action: string
  details: string | null
  created_at: string
}

const logs = ref<AuditLog[]>([])
const loading = ref(true)

const actionLabel: Record<string, string> = {
  ADD_PAYMENT: 'Added payment',
  UPDATE_PAYMENT: 'Updated payment',
  UPDATE_DUES_CONFIG: 'Updated dues config'
}

onMounted(async () => {
  try {
    const { data } = await auditApi.get(props.memberId)
    logs.value = data
  } finally {
    loading.value = false
  }
})

function fmt(dt: string) {
  return new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function parseDetails(raw: string | null) {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal max-w-2xl max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 class="text-lg font-semibold text-slate-900">Audit Trail</h2>
        <button @click="emit('close')" class="btn-ghost p-1.5 rounded-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="overflow-y-auto flex-1 -mx-6 px-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <span class="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>

        <div v-else-if="logs.length === 0" class="text-center text-slate-400 py-12 text-sm">
          No audit records found
        </div>

        <div v-else class="space-y-2">
          <div v-for="log in logs" :key="log.id"
            class="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              {{ log.admin_username[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium text-slate-800">{{ log.admin_username }}</span>
                <span class="text-xs text-slate-500">{{ actionLabel[log.action] || log.action }}</span>
                <span v-if="log.member_username" class="text-xs text-indigo-600 font-medium">
                  for {{ log.member_username }}
                </span>
              </div>
              <div v-if="parseDetails(log.details)" class="text-xs text-slate-500 mt-0.5">
                <template v-for="(val, key) in parseDetails(log.details)" :key="key">
                  <span class="mr-3">{{ key }}: <strong>{{ val }}</strong></span>
                </template>
              </div>
              <p class="text-xs text-slate-400 mt-1">{{ fmt(log.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
