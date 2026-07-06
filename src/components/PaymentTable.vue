<script setup lang="ts">
import { ref, computed } from "vue";
import PaymentStatusBadge from "./PaymentStatusBadge.vue";

export interface Payment {
  id: string;
  member_id: string;
  payment_type: string;
  payment_date: string;
  due_amount: number;
  amount_paid: number;
  receipt_path: string | null;
  narration: string | null;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
}

const props = defineProps<{
  payments: Payment[];
  showEdit?: boolean;
}>();

const emit = defineEmits<{
  edit: [payment: Payment];
}>();

type SortKey =
  | "payment_type"
  | "payment_date"
  | "due_amount"
  | "amount_paid"
  | "status";
const sortKey = ref<SortKey>("payment_date");
const sortAsc = ref(false);

function computedStatus(p: Payment) {
  if (p.amount_paid > p.due_amount) return "credit";
  if (p.amount_paid >= p.due_amount) return "paid";
  if (p.amount_paid > 0) return "partial";
  return "unpaid";
}

const statusOrder = { unpaid: 0, partial: 1, paid: 2, credit: 3 };

const sorted = computed(() => {
  return [...props.payments].sort((a, b) => {
    let cmp = 0;
    if (sortKey.value === "payment_type")
      cmp = a.payment_type.localeCompare(b.payment_type);
    else if (sortKey.value === "payment_date")
      cmp = a.payment_date.localeCompare(b.payment_date);
    else if (sortKey.value === "due_amount") cmp = a.due_amount - b.due_amount;
    else if (sortKey.value === "amount_paid")
      cmp = a.amount_paid - b.amount_paid;
    else if (sortKey.value === "status")
      cmp = statusOrder[computedStatus(a)] - statusOrder[computedStatus(b)];
    return sortAsc.value ? cmp : -cmp;
  });
});

function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = false;
  }
}

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-100">
          <th
            v-for="col in [
              { key: 'payment_type', label: 'Payment Type' },
              { key: 'payment_date', label: 'Payment Date' },
              { key: 'due_amount', label: 'Due' },
              { key: 'amount_paid', label: 'Paid' },
              { key: 'status', label: 'Status' },
            ] as const"
            :key="col.key"
            class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 cursor-pointer select-none hover:text-slate-700 whitespace-nowrap"
            @click="toggleSort(col.key)"
          >
            {{ col.label }}
            <span class="ml-1 opacity-50">
              {{ sortKey === col.key ? (sortAsc ? "↑" : "↓") : "↕" }}
            </span>
          </th>
          <th
            class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4"
          >
            Narration
          </th>
          <th
            class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4"
          >
            Receipt
          </th>
          <th v-if="showEdit" class="py-3 px-4" />
        </tr>
      </thead>
      <tbody>
        <tr v-if="sorted.length === 0">
          <td
            :colspan="showEdit ? 8 : 7"
            class="text-center text-slate-400 py-12 text-sm"
          >
            No payment records yet
          </td>
        </tr>
        <tr
          v-for="p in sorted"
          :key="p.id"
          class="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
        >
          <td class="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">
            {{ p.payment_type || "—" }}
          </td>
          <td class="py-3 px-4 text-slate-600">{{ fmt(p.payment_date) }}</td>
          <td class="py-3 px-4 text-slate-700 font-medium">
            {{ fmtMoney(p.due_amount) }}
          </td>
          <td class="py-3 px-4 text-slate-700">
            <span>{{ fmtMoney(p.amount_paid) }}</span>
          </td>
          <td class="py-3 px-4">
            <PaymentStatusBadge
              :due-amount="p.due_amount"
              :amount-paid="p.amount_paid"
            />
          </td>
          <td class="py-3 px-4 text-slate-600 max-w-[16rem]">
            <span v-if="p.narration" class="block truncate" :title="p.narration">
              {{ p.narration }}
            </span>
            <span v-else class="text-slate-300">—</span>
          </td>
          <td class="py-3 px-4">
            <a
              v-if="p.receipt_path"
              :href="p.receipt_path"
              target="_blank"
              class="text-indigo-600 hover:text-indigo-700 text-xs font-medium inline-flex items-center gap-1"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View
            </a>
            <span v-else class="text-slate-300 text-xs">—</span>
          </td>
          <td v-if="showEdit" class="py-3 px-4">
            <button
              @click="emit('edit', p)"
              class="btn-ghost text-xs px-2 py-1"
            >
              Edit
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Summary row -->
    <div
      v-if="sorted.length > 0"
      class="flex items-center gap-6 px-4 py-3 bg-slate-50 border-t border-slate-100 text-sm"
    >
      <span class="text-slate-500">{{ sorted.length }} records</span>
      <span class="text-slate-600"
        >Total due:
        <strong>{{
          fmtMoney(sorted.reduce((s, p) => s + p.due_amount, 0))
        }}</strong></span
      >
      <span class="text-slate-600"
        >Total paid:
        <strong>{{
          fmtMoney(sorted.reduce((s, p) => s + p.amount_paid, 0))
        }}</strong></span
      >
    </div>
  </div>
</template>
