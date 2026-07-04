<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth";
import { paymentsApi, duesApi, membersApi } from "../../api";
import AppHeader from "../../components/AppHeader.vue";
import PaymentTable from "../../components/PaymentTable.vue";
import type { Payment } from "../../components/PaymentTable.vue";

const auth = useAuthStore();
const payments = ref<Payment[]>([]);
const dues = ref<{
  amount: number;
  frequency: string;
  start_date: string;
} | null>(null);
const loading = ref(true);

// Profile picture upload
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const profilePic = computed(() => auth.user?.profile_picture || null);

const stats = computed(() => {
  const total = payments.value.length;
  const paid = payments.value.filter(
    (p) => p.amount_paid >= p.due_amount,
  ).length;
  return { total, paid };
});

onMounted(async () => {
  try {
    const [paymentsRes, duesRes] = await Promise.all([
      paymentsApi.getMy(),
      duesApi.get(),
    ]);
    // Ensure numeric fields are numbers (API may return them as strings)
    payments.value = paymentsRes.data.map((p: any) => ({
      ...p,
      due_amount: Number(p.due_amount) || 0,
      amount_paid: Number(p.amount_paid) || 0,
    }));
    dues.value = duesRes.data;
  } finally {
    loading.value = false;
  }
});

async function handleProfilePic(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !auth.user) return;
  uploading.value = true;
  try {
    const { data } = await membersApi.uploadProfilePicture(auth.user.id, file);
    auth.updateUser({ profile_picture: data.profile_picture });
  } finally {
    uploading.value = false;
  }
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Profile + Club Header -->
      <div class="card p-6 mb-6">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center gap-5"
        >
          <!-- Profile picture -->
          <div class="relative flex-shrink-0">
            <div
              class="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-100 flex items-center justify-center"
            >
              <img
                v-if="profilePic"
                :src="profilePic"
                alt="Profile"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-3xl font-bold text-indigo-400">
                {{ auth.user?.username?.[0]?.toUpperCase() }}
              </span>
            </div>
            <button
              @click="fileInput?.click()"
              class="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow hover:bg-indigo-700 transition-colors"
              :disabled="uploading"
              title="Change profile picture"
            >
              <span
                v-if="uploading"
                class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"
              />
              <svg
                v-else
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleProfilePic"
            />
          </div>

          <!-- Member info -->
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl font-bold text-slate-900">
                {{ auth.user?.username }}
              </h1>
              <span class="badge-paid">Member</span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">{{ auth.user?.email }}</p>
            <p class="text-xs text-slate-400 mt-1 font-mono">
              ID: {{ auth.user?.id }}
            </p>
          </div>

          <!-- Club logo + dues -->
          <div class="flex-shrink-0 text-right">
            <!-- Club logo placeholder -->
            <div
              class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow mb-2"
            >
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div v-if="dues" class="text-sm text-slate-600">
              <span class="font-semibold text-slate-800">{{
                fmtMoney(dues.amount)
              }}</span>
              <span class="text-slate-400"> / {{ dues.frequency }}</span>
            </div>
            <p v-if="!dues" class="text-xs text-slate-400">
              Dues not configured
            </p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="card p-4">
          <p class="text-xs text-slate-500 font-medium uppercase tracking-wide">
            Records
          </p>
          <p class="text-2xl font-bold text-slate-900 mt-1">
            {{ stats.total }}
          </p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-slate-500 font-medium uppercase tracking-wide">
            Paid
          </p>
          <p class="text-2xl font-bold text-emerald-600 mt-1">
            {{ stats.paid }}
          </p>
        </div>
      </div>

      <!-- Payment history -->
      <div class="card overflow-hidden">
        <div
          class="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
        >
          <h2 class="font-semibold text-slate-900">Payment History</h2>
          <span class="text-xs text-slate-400"
            >Click column headers to sort</span
          >
        </div>

        <div v-if="loading" class="flex items-center justify-center py-16">
          <span
            class="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"
          />
        </div>
        <PaymentTable v-else :payments="payments" />
      </div>
    </main>
  </div>
</template>
