<template>
  <q-card class="server-node-powers q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="column">
        <div class="row items-center q-gutter-xs">
          <q-icon name="bolt" size="24px" color="amber-3" />
          <div class="text-subtitle1">{{ t('nodeDetail.powers.title') }}</div>
        </div>
        <div class="text-caption text-grey-6">
          {{ t('nodeDetail.powers.subtitle') }}
        </div>
      </div>
      <q-btn color="primary" unelevated icon="add" :label="t('nodeDetail.powers.actions.add')" @click="openModal" />
    </div>

    <q-table flat :rows="rows" :columns="columns" row-key="id" :loading="isLoading" :pagination="pagination"
      hide-pagination :no-data-label="t('nodeDetail.powers.empty')">
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

      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn dense flat round icon="edit" :aria-label="t('nodeDetail.powers.actions.edit')"
            @click="openEditModal(props.row)" />
          <q-btn dense flat round color="negative" icon="delete" :aria-label="t('nodeDetail.powers.actions.delete')"
            @click="openDeleteModal(props.row)" />
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
      <q-card class="server-node-powers__dialog q-pa-md"
        :class="{ 'server-node-powers__dialog--light': !$q.dark.isActive }">
        <div class="text-h6 q-mb-sm">{{ t('nodeDetail.powers.modal.title') }}</div>
        <q-form class="column q-gutter-md" @submit.prevent="submitForm">
          <q-input v-model.number="form.wh" type="number" outlined dense :label="t('nodeDetail.powers.modal.fields.wh')"
            :error="Boolean(formErrors.wh)" :error-message="formErrors.wh" :disable="isSubmitting" min="0" />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.effectiveFrom" outlined dense readonly clearable
                :label="t('nodeDetail.powers.modal.fields.effectiveFrom')" :disable="isSubmitting"
                @clear="form.effectiveFrom = null">
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-date v-model="form.effectiveFrom" mask="YYYY-MM-DD" minimal clearable clear-icon="close" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.effectiveTo" outlined dense readonly clearable
                :label="t('nodeDetail.powers.modal.fields.effectiveTo')" :disable="isSubmitting"
                @clear="form.effectiveTo = null">
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-date v-model="form.effectiveTo" mask="YYYY-MM-DD" minimal clearable clear-icon="close" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>

          <div class="row justify-end q-gutter-sm">
            <q-btn flat :label="t('nodeDetail.powers.modal.actions.cancel')" :disable="isSubmitting"
              @click="closeModal" />
            <q-btn color="primary" unelevated type="submit" :label="t('nodeDetail.powers.modal.actions.confirm')"
              :loading="isSubmitting" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isEditModalOpen" persistent @hide="resetEditForm">
      <q-card class="server-node-powers__dialog q-pa-md"
        :class="{ 'server-node-powers__dialog--light': !$q.dark.isActive }">
        <div class="text-h6 q-mb-sm">{{ t('nodeDetail.powers.editModal.title') }}</div>
        <q-form class="column q-gutter-md" @submit.prevent="submitEditForm">
          <q-input v-model.number="editForm.wh" type="number" outlined dense
            :label="t('nodeDetail.powers.editModal.fields.wh')" :error="Boolean(editFormErrors.wh)"
            :error-message="editFormErrors.wh" :disable="isEditSubmitting" min="0" />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="editForm.effectiveFrom" outlined dense readonly clearable
                :label="t('nodeDetail.powers.editModal.fields.effectiveFrom')" :disable="isEditSubmitting"
                @clear="editForm.effectiveFrom = null">
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-date v-model="editForm.effectiveFrom" mask="YYYY-MM-DD" minimal clearable clear-icon="close" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="editForm.effectiveTo" outlined dense readonly clearable
                :label="t('nodeDetail.powers.editModal.fields.effectiveTo')" :disable="isEditSubmitting"
                @clear="editForm.effectiveTo = null">
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-date v-model="editForm.effectiveTo" mask="YYYY-MM-DD" minimal clearable clear-icon="close" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>

          <div class="row justify-end q-gutter-sm">
            <q-btn flat :label="t('nodeDetail.powers.editModal.actions.cancel')" :disable="isEditSubmitting"
              @click="closeEditModal" />
            <q-btn color="primary" unelevated type="submit" :label="t('nodeDetail.powers.editModal.actions.confirm')"
              :loading="isEditSubmitting" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isDeleteModalOpen" persistent @hide="resetDeleteState">
      <q-card class="server-node-powers__dialog q-pa-md"
        :class="{ 'server-node-powers__dialog--light': !$q.dark.isActive }">
        <div class="text-h6 q-mb-md">{{ t('nodeDetail.powers.deleteModal.title') }}</div>
        <div class="q-mb-lg">{{ t('nodeDetail.powers.deleteModal.message') }}</div>
        <div class="row justify-end q-gutter-sm">
          <q-btn flat :label="t('nodeDetail.powers.deleteModal.actions.cancel')" :disable="isDeleting"
            @click="closeDeleteModal" />
          <q-btn color="negative" unelevated :label="t('nodeDetail.powers.deleteModal.actions.confirm')"
            :loading="isDeleting" @click="confirmDelete" />
        </div>
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
const isEditModalOpen = ref(false);
const isEditSubmitting = ref(false);
const editingRow = ref<ServerNodePower | null>(null);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const deletingRow = ref<ServerNodePower | null>(null);
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

const editForm = reactive<FormState>({
  wh: undefined,
  effectiveFrom: null,
  effectiveTo: null,
});

const formErrors = reactive({
  wh: '',
});

const editFormErrors = reactive({
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
  {
    name: 'actions',
    label: t('nodeDetail.powers.columns.actions'),
    field: 'actions',
    align: 'right' as const,
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

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const openEditModal = (row: ServerNodePower) => {
  editFormErrors.wh = '';
  editingRow.value = row;
  editForm.wh = row.Wh;
  editForm.effectiveFrom = formatInputDate(row.effectiveFrom);
  editForm.effectiveTo = formatInputDate(row.effectiveTo);
  isEditModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
};

const openDeleteModal = (row: ServerNodePower) => {
  deletingRow.value = row;
  isDeleteModalOpen.value = true;
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

const submitEditForm = async () => {
  editFormErrors.wh = '';
  const whValue = Number(editForm.wh);
  if (!Number.isFinite(whValue)) {
    editFormErrors.wh = t('nodeDetail.powers.editModal.errors.wh');
    return;
  }

  if (!editingRow.value?.id) {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.updateError'),
    });
    return;
  }

  isEditSubmitting.value = true;
  try {
    const payload = {
      Wh: whValue,
      effectiveFrom: editForm.effectiveFrom || null,
      effectiveTo: editForm.effectiveTo || null,
    };
    await api.put(`/server-node-powers/${editingRow.value.id}`, payload);
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.updateSuccess'),
    });
    isEditModalOpen.value = false;
    resetEditForm();
    await fetchPowers();
  } catch {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.updateError'),
    });
  } finally {
    isEditSubmitting.value = false;
  }
};

const confirmDelete = async () => {
  if (!deletingRow.value?.id) {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.deleteError'),
    });
    return;
  }

  isDeleting.value = true;
  try {
    await api.delete(`/server-node-powers/${deletingRow.value.id}`);
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.deleteSuccess'),
    });
    isDeleteModalOpen.value = false;
    resetDeleteState();
    await fetchPowers();
  } catch {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodeDetail.powers.notifications.deleteError'),
    });
  } finally {
    isDeleting.value = false;
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

const formatInputDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resetEditForm = () => {
  editForm.wh = undefined;
  editForm.effectiveFrom = null;
  editForm.effectiveTo = null;
  editFormErrors.wh = '';
  editingRow.value = null;
};

const resetDeleteState = () => {
  deletingRow.value = null;
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

body.body--light .server-node-powers__dialog {
  border-color: rgba(111, 63, 245, 0.28);
  background: #ffffff;
  color: #000000;
}

body.body--light .server-node-powers__dialog :deep(.q-field__native),
body.body--light .server-node-powers__dialog :deep(.q-field__prefix),
body.body--light .server-node-powers__dialog :deep(.q-field__suffix),
body.body--light .server-node-powers__dialog :deep(.q-field__label),
body.body--light .server-node-powers__dialog :deep(.q-field__marginal) {
  color: #000000;
}

body.body--light .server-node-powers__dialog :deep(.q-field__control) {
  background-color: #ffffff;
}

.server-node-powers__dialog--light {
  border-color: rgba(111, 63, 245, 0.28);
  background: #ffffff;
  color: #000000;
}

.server-node-powers__dialog--light :deep(.q-field__native),
.server-node-powers__dialog--light :deep(.q-field__prefix),
.server-node-powers__dialog--light :deep(.q-field__suffix),
.server-node-powers__dialog--light :deep(.q-field__label),
.server-node-powers__dialog--light :deep(.q-field__marginal) {
  color: #000000;
}

.server-node-powers__dialog--light :deep(.q-field__control) {
  background-color: #ffffff;
}

.server-node-powers {
  border-radius: 18px;
  border: 1px solid rgba(111, 63, 245, 0.28);
  background: linear-gradient(180deg, rgba(22, 32, 64, 0.9), rgba(12, 18, 34, 0.95));
  color: #f6fbff;
  box-shadow:
    0 0 0 1px rgba(111, 63, 245, 0.25),
    0 0 18px rgba(72, 149, 255, 0.2);
}



.server-node-powers :deep(.q-table__container),
.server-node-powers :deep(.q-table) {
  background: transparent;
}

.server-node-powers :deep(th),
.server-node-powers :deep(td),
.server-node-powers :deep(.q-table__bottom) {
  color: #f6fbff;
  background-color: transparent;
}

body.body--light .server-node-powers {
  border-color: rgba(111, 63, 245, 0.28);
  background: #ffffff;
  color: #000000;
  box-shadow:
    0 0 0 1px rgba(111, 63, 245, 0.3),
    0 0 18px rgba(111, 63, 245, 0.14);
}

body.body--light .server-node-powers :deep(th),
body.body--light .server-node-powers :deep(td),
body.body--light .server-node-powers :deep(.q-table__bottom) {
  color: inherit;
}
</style>
