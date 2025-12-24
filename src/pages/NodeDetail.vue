<template>
  <q-page class="node-detail q-pa-xl">
    <div class="node-detail__header row items-center q-gutter-sm q-mb-lg">
      <q-btn flat round icon="arrow_back" @click="goBack" />
      <div>
        <div class="text-overline text-grey-5">{{ t('nodeDetail.title') }}</div>
        <div class="text-h5">{{ displayName }}</div>
        <div class="text-caption text-grey-6">
          {{ t('nodeDetail.subtitle', { id: nodeId }) }}
        </div>
      </div>
    </div>

    <q-card class="node-detail__card q-pa-md q-mb-xl">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input v-model="nodeName" outlined dense :label="t('nodeDetail.form.nameLabel')"
            :hint="t('nodeDetail.form.nameHint')" :error="Boolean(nameError)" :error-message="nameError"
            :loading="isSavingName" :disable="isLoading" data-testid="node-name-input" />
        </div>
      </div>
    </q-card>

    <div v-if="isLoading" class="row items-center justify-center q-my-xl">
      <q-spinner color="primary" size="42px" />
    </div>

    <template v-else>
      <server-node-powers-table :node-id="nodeId" />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { debounce, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import ServerNodePowersTable from 'src/components/ServerNodePowersTable.vue';

type ServerNodeResponse = {
  id?: string | number;
  name?: string;
};

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const $q = useQuasar();

const nodeId = computed(() => route.params.id as string);
const nodeName = ref('');
const displayName = computed(() => nodeName.value || t('nodeDetail.fallbackName'));
const isLoading = ref(false);
const isSavingName = ref(false);
const nameError = ref('');
const isReady = ref(false);
const skipNextSave = ref(true);
const debouncedSaveName = debounce((value: string) => {
  void saveName(value);
}, 600);

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push({ path: '/nodes' });
};

const loadNode = async () => {
  isLoading.value = true;
  nameError.value = '';
  try {
    const { data } = await api.get(`/server-nodes/${nodeId.value}`);
    const payload = data as ServerNodeResponse | undefined;
    const name =
      payload && typeof payload.name === 'string' && payload.name.trim().length
        ? payload.name
        : t('nodeDetail.fallbackName');
    skipNextSave.value = true;
    nodeName.value = name;
    isReady.value = true;
  } catch {
    isReady.value = false;
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodeDetail.notifications.loadError'),
    });
  } finally {
    isLoading.value = false;
  }
};

const saveName = async (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    nameError.value = t('nodeDetail.form.errors.name');
    return;
  }

  nameError.value = '';
  isSavingName.value = true;
  try {
    await api.put(`/server-nodes/${nodeId.value}`, { name: trimmed });
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('nodeDetail.notifications.renameSuccess'),
    });
  } catch {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodeDetail.notifications.renameError'),
    });
  } finally {
    isSavingName.value = false;
  }
};

watch(
  nodeName,
  (value, oldValue) => {
    if (!isReady.value) {
      return;
    }
    if (skipNextSave.value) {
      skipNextSave.value = false;
      return;
    }
    if (value === oldValue) {
      return;
    }
    debouncedSaveName(value);
  },
  { flush: 'post' }
);

watch(
  () => nodeId.value,
  () => {
    isReady.value = false;
    void loadNode();
  }
);

onMounted(() => {
  void loadNode();
});

onBeforeUnmount(() => {
  debouncedSaveName.cancel();
});
</script>

<style scoped>
.node-detail__header .text-h5 {
  font-weight: 700;
}

.node-detail__card {
  border-radius: 18px;
  border: 1px solid rgba(111, 63, 245, 0.18);
  background-color: white;
  color: black;
}

:global(body.body--light) .node-detail__card {
  border-color: rgba(111, 63, 245, 0.28);
  background: #ffffff;
  color: #000000;
}
</style>
