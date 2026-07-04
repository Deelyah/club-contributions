<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../api'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await authApi.login(form.value)
    auth.setAuth(data.token, data.user)
    router.push(data.user.role === 'admin' ? '/admin' : '/member')
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">Club Collections</h1>
        <p class="text-sm text-slate-500 mt-1">Sign in to your account</p>
      </div>

      <!-- Card -->
      <div class="card p-6">
        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="label">Username or Email</label>
            <input v-model="form.username" class="input" type="text" placeholder="Enter your username" autocomplete="username" required />
          </div>
          <div>
            <label class="label">Password</label>
            <input v-model="form.password" class="input" type="password" placeholder="••••••••" autocomplete="current-password" required />
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {{ error }}
          </div>

          <button type="submit" class="btn-primary w-full py-2.5" :disabled="loading">
            <span v-if="loading" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>

      <p class="text-center text-sm text-slate-500 mt-4">
        Not a member yet?
        <RouterLink to="/register" class="text-indigo-600 hover:text-indigo-700 font-medium">Create account</RouterLink>
      </p>
    </div>
  </div>
</template>
