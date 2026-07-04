<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { paymentsApi, duesApi } from "../api";
import type { Payment } from "./PaymentTable.vue";

const props = defineProps<{
  memberId: string;
  payment?: Payment | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [payment: Payment];
}>();

const form = ref({
  period_label: "",
  amount_paid: "",
  payment_date: "",
  notes: "",
});
const receiptFile = ref<File | null>(null);
const receiptInput = ref<HTMLInputElement | null>(null);
const error = ref("");
const loading = ref(false);
const dueAmountFromConfig = ref(0);
const storedDueAmount = ref(0);

onMounted(async () => {
  try {
    const { data } = await duesApi.get();
    if (data) dueAmountFromConfig.value = data.amount;
  } catch {}
});

watch(
  () => props.payment,
  (p) => {
    if (p) {
      form.value = {
        period_label: p.period_label,
        amount_paid: String(p.amount_paid),
        payment_date: p.payment_date || "",
        notes: p.notes || "",
      };
      storedDueAmount.value = p.due_amount;
    } else {
      form.value = {
        period_label: "",
        amount_paid: "",
        payment_date: "",
        notes: "",
      };
      storedDueAmount.value = 0;
    }
  },
  { immediate: true },
);

const effectiveDueAmount = computed(() =>
  props.payment ? storedDueAmount.value : dueAmountFromConfig.value,
);

const amountPaidNum = computed(() => parseFloat(form.value.amount_paid) || 0);

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  receiptFile.value = target.files?.[0] ?? null;
}

function clearFile() {
  receiptFile.value = null;
  if (receiptInput.value) receiptInput.value.value = "";
}

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append("member_id", props.memberId);
    fd.append("period_label", form.value.period_label);
    fd.append("due_amount", String(effectiveDueAmount.value));
    fd.append("payment_date", form.value.payment_date);
    fd.append("amount_paid", String(amountPaidNum.value));
    if (form.value.notes) fd.append("notes", form.value.notes);
    if (receiptFile.value) fd.append("receipt", receiptFile.value);

    const { data } = props.payment
      ? await paymentsApi.update(props.payment.id, fd)
      : await paymentsApi.add(fd);

    emit("saved", data);
  } catch (e: any) {
    error.value = e.response?.data?.error || "Failed to save payment";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal max-w-md">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-slate-900">
          {{ payment ? "Edit Payment" : "Add Payment" }}
        </h2>
        <button @click="emit('close')" class="btn-ghost p-1.5 rounded-lg">
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <!-- Period label -->
        <div>
          <label class="label">Period Label</label>
          <input
            v-model="form.period_label"
            class="input"
            type="text"
            placeholder="e.g. January 2026"
            required
          />
        </div>

        <!-- Amount paid + Payment date -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Amount Paid</label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
                >₦</span
              >
              <input
                v-model="form.amount_paid"
                class="input pl-7"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div>
            <label class="label">Payment Date</label>
            <input
              v-model="form.payment_date"
              class="input"
              type="date"
              required
            />
          </div>
        </div>

        <!-- Receipt upload -->
        <div>
          <label class="label">Receipt</label>

          <div
            v-if="receiptFile"
            class="flex items-center gap-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50"
          >
            <div
              class="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0"
            >
              <svg
                class="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">
                {{ receiptFile.name }}
              </p>
              <p class="text-xs text-slate-500">
                {{ (receiptFile.size / 1024).toFixed(1) }} KB
              </p>
            </div>
            <button
              type="button"
              @click="clearFile"
              class="w-7 h-7 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <button
            v-else
            type="button"
            @click="receiptInput?.click()"
            class="w-full flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-500 transition-all duration-150 cursor-pointer group"
          >
            <div
              class="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div class="text-center">
              <p class="text-sm font-medium">Click to upload receipt</p>
              <p class="text-xs mt-0.5">PDF or image · up to 10 MB</p>
            </div>
          </button>

          <input
            ref="receiptInput"
            type="file"
            accept="image/*,.pdf"
            class="hidden"
            @change="onFileChange"
          />

          <p
            v-if="payment?.receipt_path && !receiptFile"
            class="text-xs text-slate-400 mt-1.5 flex items-center gap-1"
          >
            <svg
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            A receipt already exists — upload a new one to replace it.
          </p>
        </div>

        <!-- Notes -->
        <div>
          <label class="label">Notes</label>
          <textarea
            v-model="form.notes"
            class="input resize-none"
            rows="2"
            placeholder="Optional notes…"
          />
        </div>

        <div
          v-if="error"
          class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {{ error }}
        </div>

        <div class="flex gap-3 pt-1">
          <button
            type="button"
            class="btn-secondary flex-1"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button type="submit" class="btn-primary flex-1" :disabled="loading">
            <span
              v-if="loading"
              class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"
            />
            {{ loading ? "Saving…" : "Save Payment" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
