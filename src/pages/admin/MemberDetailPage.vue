<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { membersApi, paymentsApi } from "../../api";
import AppHeader from "../../components/AppHeader.vue";
import PaymentTable from "../../components/PaymentTable.vue";
import AddPaymentModal from "../../components/AddPaymentModal.vue";
import AuditLogPanel from "../../components/AuditLogPanel.vue";
import type { Payment } from "../../components/PaymentTable.vue";

const route = useRoute();
const router = useRouter();
const memberId = route.params.id as string;

interface Member {
  id: string;
  username: string;
  email: string;
  profile_picture: string | null;
  created_at: string;
}

const member = ref<Member | null>(null);
const payments = ref<Payment[]>([]);
const loading = ref(true);
const showAddPayment = ref(false);
const showAudit = ref(false);
const editingPayment = ref<Payment | null>(null);

const stats = computed(() => {
  const total = payments.value.length;
  const paid = payments.value.filter(
    (p) => p.amount_paid >= p.due_amount,
  ).length;
  return { total, paid };
});

onMounted(async () => {
  try {
    const [memberRes, paymentsRes] = await Promise.all([
      membersApi.get(memberId),
      paymentsApi.getByMember(memberId),
    ]);
    member.value = memberRes.data;
    // Ensure numeric fields are numbers (API may return them as strings)
    payments.value = paymentsRes.data.map((p: any) => ({
      ...p,
      due_amount: Number(p.due_amount) || 0,
      amount_paid: Number(p.amount_paid) || 0,
    }));
  } finally {
    loading.value = false;
  }
});

function onPaymentSaved(payment: Payment) {
  // Normalize numeric fields from the API (may arrive as strings)
  const normalized = {
    ...payment,
    due_amount: Number((payment as any).due_amount) || 0,
    amount_paid: Number((payment as any).amount_paid) || 0,
  } as Payment;

  const idx = payments.value.findIndex((p) => p.id === normalized.id);
  if (idx >= 0) payments.value[idx] = normalized;
  else payments.value.unshift(normalized);
  showAddPayment.value = false;
  editingPayment.value = null;
}

function openEdit(payment: Payment) {
  editingPayment.value = payment;
  showAddPayment.value = true;
}

function closeModal() {
  showAddPayment.value = false;
  editingPayment.value = null;
}

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Back -->
      <button
        @click="router.push('/admin')"
        class="btn-ghost mb-5 -ml-2 text-sm text-slate-500"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        All members
      </button>

      <div v-if="loading" class="flex items-center justify-center py-24">
        <span
          class="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"
        />
      </div>

      <template v-else-if="member">
        <!-- Member profile card -->
        <div class="card p-6 mb-6">
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center gap-5"
          >
            <div
              class="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0"
            >
              <img
                v-if="member.profile_picture"
                :src="member.profile_picture"
                alt=""
                class="w-full h-full object-cover"
              />
              <span v-else class="text-2xl font-bold text-indigo-400">{{
                member.username[0].toUpperCase()
              }}</span>
            </div>
            <div class="flex-1">
              <h1 class="text-xl font-bold text-slate-900">
                {{ member.username }}
              </h1>
              <p class="text-sm text-slate-500">{{ member.email }}</p>
              <p class="text-xs font-mono text-slate-400 mt-1">
                {{ member.id }}
              </p>
            </div>
            <div class="text-right text-sm text-slate-500">
              Joined {{ fmt(member.created_at) }}
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="card p-4">
            <p
              class="text-xs text-slate-500 font-medium uppercase tracking-wide"
            >
              Records
            </p>
            <p class="text-2xl font-bold text-slate-900 mt-1">
              {{ stats.total }}
            </p>
          </div>
          <div class="card p-4">
            <p
              class="text-xs text-slate-500 font-medium uppercase tracking-wide"
            >
              Paid
            </p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">
              {{ stats.paid }}
            </p>
          </div>
        </div>

        <!-- Payments -->
        <div class="card overflow-hidden">
          <div
            class="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <h2 class="font-semibold text-slate-900">Payment History</h2>
            <div class="flex gap-2">
              <button
                @click="showAudit = true"
                class="btn-secondary text-xs py-1.5 px-3"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Audit
              </button>
              <button
                @click="
                  showAddPayment = true;
                  editingPayment = null;
                "
                class="btn-primary text-xs py-1.5 px-3"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Payment
              </button>
            </div>
          </div>
          <PaymentTable
            :payments="payments"
            :show-edit="true"
            @edit="openEdit"
          />
        </div>
      </template>
    </main>

    <AddPaymentModal
      v-if="showAddPayment"
      :member-id="memberId"
      :payment="editingPayment"
      @close="closeModal"
      @saved="onPaymentSaved"
    />

    <AuditLogPanel
      v-if="showAudit"
      :member-id="memberId"
      @close="showAudit = false"
    />
  </div>
</template>
