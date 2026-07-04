<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { duesApi } from '../api'

const emit = defineEmits<{ close: []; saved: [] }>()

const form = ref({ amount: '', frequency: 'monthly', start_date: '' })
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const { data } = await duesApi.get()
    if (data) {
      form.value = {
        amount: String(data.amount),
        frequency: data.frequency,
        start_date: data.start_date
      }
    }
  } catch {}
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await duesApi.set({
      amount: parseFloat(form.value.amount),
      frequency: form.value.frequency,
      start_date: form.value.start_date
    })
    emit('saved')
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Failed to update dues'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal max-w-sm">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-slate-900">Dues Configuration</h2>
        <button @click="emit('close')" class="btn-ghost p-1.5 rounded-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="label">Amount per Period</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
            <input v-model="form.amount" class="input pl-7" type="number" min="0" step="0.01" placeholder="0.00" required />
          </div>
        </div>
        <div>
          <label class="label">Frequency</label>
          <select v-model="form.frequency" class="input">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label class="label">Effective From</label>
          <input v-model="form.start_date" class="input" type="date" required />
        </div>

        <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {{ error }}
        </div>

        <div class="flex gap-3 pt-1">
          <button type="button" class="btn-secondary flex-1" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn-primary flex-1" :disabled="loading">
            <span v-if="loading" class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {{ loading ? 'Saving…' : 'Save Config' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
