<template>
  <q-card class="server-node-powers q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle1">{{ t('nodeDetail.powers.title') }}</div>
        <div class="text-caption text-grey-6">
          {{ t('nodeDetail.powers.subtitle') }}
        </div>
      </div>
      <q-btn
        color="primary"
        unelevated
        icon="add"
        :label="t('nodeDetail.powers.actions.add')"
        @click="openModal"
      />
    </div>

    <q-table
      flat
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      :pagination="pagination"
      hide-pagination
      :no-data-label="t('nodeDetail.powers.empty')"
    >
      <template #body-cell-Wh="props">
        <q-td :props="props">
          {{ props.row.Wh }}
        </q-td>
      </template>

      <template #body-cell-effectiveFrom="props">
        <q-td :props="props">
          {{ formatDate(props.row.effectiveFrom) }}
        </q-td>
      </template>

      <template #body-cell-effectiveTo="props">
        <q-td :props="props">
          {{ formatDate(props.row.effectiveTo, { fallbackNow: true }) }}
        </q-td>
      </template>

      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #no-data>
        <div class="full-width text-center q-pa-lg text-grey-6">
          {{ t('nodeDetail.powers.empty') }}
        </div>
      </template>
    </q-table>

    <q-dialog v-model="isModalOpen" persistent @hide="resetForm">
      <q-card class="server-node-powers__dialog q-pa-md">
        <div class="text-h6 q-mb-sm">{{ t('nodeDetail.powers.modal.title') }}</div>
        <q-form class="column q-gutter-md" @submit.prevent="submitForm">
          <q-input
            v-model.number="form.wh"
            type="number"
            outlined
            dense
            :label="t('nodeDetail.powers.modal.fields.wh')"
            :error="Boolean(formErrors.wh)"
            :error-message="formErrors.wh"
            :disable="isSubmitting"
            min="0"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.effectiveFrom"
                outlined
                dense
                readonly
                clearable
                :label="t('nodeDetail.powers.modal.fields.effectiveFrom')"
                :disable="isSubmitting"
                @clear="form.effectiveFrom = null"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="form.effectiveFrom"
                        mask="YYYY-MM-DD"
                        minimal
                        clearable
                        clear-icon="close"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.effectiveTo"
                outlined
                dense
                readonly
                clearable
                :label="t('nodeDetail.powers.modal.fields.effectiveTo')"
                :disable="isSubmitting"
                @clear="form.effectiveTo = null"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="form.effectiveTo"
                        mask="YYYY-MM-DD"
                        minimal
                        clearable
                        clear-icon="close"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>

          <div class="row justify-end q-gutter-sm">
            <q-btn
              flat
              :label="t('nodeDetail.powers.modal.actions.cancel')"
              :disable="isSubmitting"
              @click="closeModal"
            />
            <q-btn
              color="primary"
              unelevated
              type="submit"
              :label="t('nodeDetail.powers.modal.actions.confirm')"
              :loading="isSubmitting"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

type ServerNodePower = {
  id?: string | number;
  Wh?: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  [key: string]: unknown;
};

const props = defineProps<{
  nodeId: string | number;
}>();

const { t, locale } = useI18n();
const $q = useQuasar();

const rows = ref<ServerNodePower[]>([]);
const isLoading = ref(false);
const isModalOpen = ref(false);
const isSubmitting = ref(false);
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
});

type FormState = {
  wh: number | undefined;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

const form = reactive<FormState>({
  wh: undefined,
  effectiveFrom: null,
  effectiveTo: null,
});

const formErrors = reactive({
  wh: '',
});

const columns = computed(() => [
  {
    name: 'Wh',
    label: t('nodeDetail.powers.columns.wh'),
    field: 'Wh',
    align: 'left' as const,
  },
  {
    name: 'effectiveFrom',
    label: t('nodeDetail.powers.columns.validFrom'),
    field: 'effectiveFrom',
    align: 'left' as const,
  },
  {
    name: 'effectiveTo',
    label: t('nodeDetail.powers.columns.validTo'),
    field: 'effectiveTo',
    align: 'left' as const,
  },
]);

const normalizeResponse = (payload: unknown): ServerNodePower[] => {
  if (Array.isArray(payload)) {
    return payload as ServerNodePower[];
  }

  if (payload && typeof payload === 'object') {
    const bag = payload as Record<string, unknown>;
    if (Array.isArray(bag.data)) {
      return bag.data as ServerNodePower[];
    }
    if (Array.isArray(bag.items)) {
      return bag.items as ServerNodePower[];
    }
  }

  return [];
};

const fetchPowers = async () => {
  isLoading.value = true;
  try {
    const { data } = await api.get('/server-node-powers', {
      params: {
        serverNodeId: props.nodeId,
        page: pagination.value.page,
        perPage: pagination.value.rowsPerPage,
      },
    });
    rows.value = normalizeResponse(data);
  } catch {
    rows.value = [];
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.loadError'),
    });
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  form.wh = undefined;
  form.effectiveFrom = null;
  form.effectiveTo = null;
  formErrors.wh = '';
};

const closeModal = () => {
  isModalOpen.value = false;
};

const openModal = () => {
  isModalOpen.value = true;
};

const submitForm = async () => {
  formErrors.wh = '';
  const whValue = Number(form.wh);
  if (!Number.isFinite(whValue)) {
    formErrors.wh = t('nodeDetail.powers.modal.errors.wh');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      serverNodeId: props.nodeId,
      Wh: whValue,
      effectiveFrom: form.effectiveFrom || null,
      effectiveTo: form.effectiveTo || null,
    };
    await api.post('/server-node-powers', payload);
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.createSuccess'),
    });
    isModalOpen.value = false;
    resetForm();
    await fetchPowers();
  } catch {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.createError'),
    });
  } finally {
    isSubmitting.value = false;
  }
};

const formatDate = (
  value: string | null | undefined,
  options?: { fallbackNow?: boolean }
) => {
  if (!value) {
    return options?.fallbackNow ? t('nodeDetail.powers.now') : '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

watch(
  () => props.nodeId,
  () => {
    pagination.value.page = 1;
    void fetchPowers();
  },
  { immediate: true }
);
</script>

<style scoped>
.server-node-powers__dialog {
  width: 520px;
  max-width: 95vw;
}

.server-node-powers__dialog {
  border-radius: 18px;
  border: 1px solid rgba(111, 63, 245, 0.18);
  background: linear-gradient(180deg, rgba(22, 32, 64, 0.9), rgba(12, 18, 34, 0.95));
  color: #f6fbff;
}

.server-node-powers__dialog :deep(.q-field__native),
.server-node-powers__dialog :deep(.q-field__prefix),
.server-node-powers__dialog :deep(.q-field__suffix),
.server-node-powers__dialog :deep(.q-field__label),
.server-node-powers__dialog :deep(.q-field__marginal) {
  color: #f6fbff;
}

.server-node-powers__dialog :deep(.q-field__control) {
  background-color: rgba(255, 255, 255, 0.04);
}

:global(body.body--light) .server-node-powers__dialog {
  border-color: rgba(111, 63, 245, 0.28);
  background: linear-gradient(180deg, #fdfdff 0%, #f4f7ff 40%, #eff5ff 100%);
  color: #1f2a44;
}

:global(body.body--light) .server-node-powers__dialog :deep(.q-field__native),
:global(body.body--light) .server-node-powers__dialog :deep(.q-field__prefix),
:global(body.body--light) .server-node-powers__dialog :deep(.q-field__suffix),
:global(body.body--light) .server-node-powers__dialog :deep(.q-field__label),
:global(body.body--light) .server-node-powers__dialog :deep(.q-field__marginal) {
  color: inherit;
}

:global(body.body--light) .server-node-powers__dialog :deep(.q-field__control) {
  background-color: white;
}

.server-node-powers {
  border-radius: 18px;
  border: 1px solid rgba(111, 63, 245, 0.18);
  background: linear-gradient(180deg, rgba(22, 32, 64, 0.6), rgba(12, 18, 34, 0.65));
  color: #f6fbff;
}

.server-node-powers :deep(.q-table__container) {
  background: transparent;
}

.server-node-powers :deep(th),
.server-node-powers :deep(td) {
  color: #f6fbff;
}

.server-node-powers :deep(.q-table__bottom) {
  color: #f6fbff;
}

:global(body.body--light) .server-node-powers {
  border-color: rgba(111, 63, 245, 0.28);
  background: linear-gradient(180deg, #fdfdff 0%, #f4f7ff 40%, #eff5ff 100%);
  color: #1f2a44;
}

:global(body.body--light) .server-node-powers :deep(th),
:global(body.body--light) .server-node-powers :deep(td),
:global(body.body--light) .server-node-powers :deep(.q-table__bottom) {
  color: inherit;
}
</style>
