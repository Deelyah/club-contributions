<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { membersApi } from '../../api'
import AppHeader from '../../components/AppHeader.vue'
import DuesConfigModal from '../../components/DuesConfigModal.vue'
import AuditLogPanel from '../../components/AuditLogPanel.vue'

interface Member {
  id: string
  username: string
  email: string
  profile_picture: string | null
  created_at: string
}

const router = useRouter()
const members = ref<Member[]>([])
const search = ref('')
const loading = ref(true)
const showDues = ref(false)
const showAudit = ref(false)
let searchTimer: ReturnType<typeof setTimeout>

async function fetchMembers() {
  loading.value = true
  try {
    const { data } = await membersApi.list(search.value || undefined)
    members.value = data
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchMembers, 300)
}

onMounted(fetchMembers)

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Members</h1>
          <p class="text-sm text-slate-500 mt-0.5">{{ members.length }} registered member{{ members.length !== 1 ? 's' : '' }}</p>
        </div>
        <div class="flex gap-2">
          <button @click="showAudit = true" class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Audit Log
          </button>
          <button @click="showDues = true" class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Dues Config
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="relative mb-4">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="search" @input="onSearch" class="input pl-10" type="text" placeholder="Search by username or member ID…" />
      </div>

      <!-- Members list -->
      <div class="card overflow-hidden">
        <div v-if="loading" class="flex items-center justify-center py-16">
          <span class="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>

        <div v-else-if="members.length === 0" class="text-center text-slate-400 py-16 text-sm">
          No members found
        </div>

        <div v-else>
          <div v-for="(member, i) in members" :key="member.id"
            class="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
            :class="i > 0 ? 'border-t border-slate-50' : ''"
            @click="router.push(`/admin/members/${member.id}`)">

            <!-- Avatar -->
            <div class="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <img v-if="member.profile_picture" :src="member.profile_picture" alt="" class="w-full h-full object-cover" />
              <span v-else class="text-base font-bold text-indigo-400">{{ member.username[0].toUpperCase() }}</span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900 truncate">{{ member.username }}</p>
              <p class="text-sm text-slate-500 truncate">{{ member.email }}</p>
            </div>

            <!-- ID + joined -->
            <div class="hidden sm:block text-right flex-shrink-0">
              <p class="text-xs font-mono text-slate-400 truncate max-w-36">{{ member.id }}</p>
              <p class="text-xs text-slate-400 mt-0.5">Joined {{ fmt(member.created_at) }}</p>
            </div>

            <!-- Chevron -->
            <svg class="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </main>

    <DuesConfigModal v-if="showDues" @close="showDues = false" @saved="showDues = false" />
    <AuditLogPanel v-if="showAudit" @close="showAudit = false" />
  </div>
</template>
