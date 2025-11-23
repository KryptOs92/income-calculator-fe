<template>
  <q-page class="nodes-page q-pa-xl">
    <div class="nodes-header row items-center q-mb-xl">
      <div>
        <h2 class="nodes-title text-h5 q-mb-xs">{{ t('nodesPage.title') }}</h2>
        <p class="nodes-subtitle text-body2">{{ t('nodesPage.subtitle') }}</p>
      </div>
      <q-btn class="nodes-add-button" color="primary" icon="add" unelevated :label="t('nodesPage.actions.add')"
        @click="handleAddClick" />
    </div>

    <q-banner v-if="shouldShowError" dense rounded class="bg-negative text-white text-center q-mb-lg">
      {{ t('nodesPage.error') }}
    </q-banner>

    <div v-else>
      <div v-if="isLoading" class="nodes-loading column items-center justify-center">
        <q-spinner color="primary" size="48px" />
      </div>

      <template v-else>
        <section class="nodes-section q-mb-xl">
          <div class="row items-center justify-between q-mb-md">
            <h3 class="nodes-section__title text-subtitle1">{{ t('nodesPage.sections.active') }}</h3>
            <div v-if="activeNodes.length" class="text-caption text-grey-5">
              {{ t('nodesPage.sections.count', { count: activeNodes.length }) }}
            </div>
          </div>

          <div v-if="activeNodes.length" class="nodes-grid">
            <div v-for="node in activeNodes" :key="node.id" class="nodes-card nodes-card--active">
              <div class="nodes-card__body" :ref="(el) => setNodeRef(el, node.id)">
                <div class="nodes-eyes nodes-eyes--open">
                  <div class="nodes-eye">
                    <div class="nodes-eye__pupil" :style="getPupilStyle()"></div>
                  </div>
                  <div class="nodes-eye">
                    <div class="nodes-eye__pupil" :style="getPupilStyle()"></div>
                  </div>
                </div>
                <div class="nodes-card__content">
                  <div class="nodes-card__name">{{ node.label }}</div>
                  <div class="nodes-card__actions nodes-card__actions--dual row q-gutter-sm justify-center">
                    <q-btn color="primary" unelevated icon="open_in_new" round @click="goToNode(node.id)" />
                    <q-btn color="negative" unelevated icon="power_settings_new" round
                      @click="openDisableDialog(node)" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="nodes-empty nodes-empty--compact column items-center justify-center">
            <p class="nodes-empty__title">{{ t('nodesPage.emptyActive.label') }}</p>
            <p class="nodes-empty__hint">{{ t('nodesPage.emptyActive.hint') }}</p>
          </div>
        </section>

        <section>
          <q-expansion-item dense switch-toggle expand-separator class="nodes-accordion">
            <template #header>
              <div class="row items-center justify-between full-width">
                <div class="row items-center">
                  <q-icon name="power_settings_new" color="negative" class="q-mr-sm" />
                  <span class="nodes-section__title text-subtitle1">{{ t('nodesPage.sections.disabled') }}</span>
                </div>
                <q-badge color="grey-7" text-color="white" :label="disabledNodes.length" />
              </div>
            </template>

            <div v-if="disabledNodes.length" class="nodes-grid q-mt-md">
              <div v-for="node in disabledNodes" :key="node.id" class="nodes-card nodes-card--disabled">
                <div class="nodes-card__body" :ref="(el) => setNodeRef(el, node.id)">
                  <div class="nodes-eyes nodes-eyes--closed">
                    <div class="nodes-eye">
                      <div class="nodes-eye__pupil" :style="getPupilStyle()"></div>
                    </div>
                    <div class="nodes-eye">
                      <div class="nodes-eye__pupil" :style="getPupilStyle()"></div>
                    </div>
                  </div>
                  <div class="nodes-card__content">
                    <div class="nodes-card__name">{{ node.label }}</div>
                    <div class="nodes-card__actions nodes-card__actions--single">
                      <q-btn color="primary" unelevated icon="open_in_new" round @click="goToNode(node.id)" />
                      <q-btn color="positive" unelevated icon="power_settings_new" round
                        @click="openActivateDialog(node)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="nodes-empty nodes-empty--compact column items-center justify-center q-mt-md">
              <p class="nodes-empty__title">{{ t('nodesPage.emptyDisabled.label') }}</p>
              <p class="nodes-empty__hint">{{ t('nodesPage.emptyDisabled.hint') }}</p>
            </div>
          </q-expansion-item>
        </section>
      </template>
    </div>

    <q-dialog v-model="isDialogOpen" @hide="handleDialogHide">
      <q-card class="nodes-dialog q-pa-md">
        <div class="text-h6 q-mb-sm">{{ t('nodesPage.dialog.title') }}</div>
        <q-form @submit.prevent="submitNode" class="column q-gutter-md">
          <q-input v-model="form.name" :label="t('nodesPage.dialog.fields.name')" outlined dense
            :disable="form.submitting" />

          <div v-if="form.error" class="text-negative text-caption">
            {{ form.error }}
          </div>

          <div class="row justify-end q-gutter-sm">
            <q-btn flat :label="t('nodesPage.dialog.actions.cancel')" :disable="form.submitting" @click="closeDialog" />
            <q-btn color="primary" unelevated :label="t('nodesPage.dialog.actions.save')" type="submit"
              :loading="form.submitting" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isDisableDialogOpen" @hide="closeDisableDialog">
      <q-card class="nodes-dialog q-pa-md">
        <div class="text-h6 q-mb-sm">{{ t('nodesPage.disableDialog.title') }}</div>
        <p class="q-mb-md">{{ t('nodesPage.disableDialog.message') }}</p>
        <div class="row justify-end q-gutter-sm">
          <q-btn flat :disable="disableSubmitting" :label="t('nodesPage.disableDialog.actions.cancel')"
            @click="closeDisableDialog" />
          <q-btn color="negative" unelevated icon="power_settings_new"
            :label="t('nodesPage.disableDialog.actions.confirm')" :loading="disableSubmitting"
            @click="confirmDisableNode" />
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isActivateDialogOpen" @hide="closeActivateDialog">
      <q-card class="nodes-dialog q-pa-md">
        <div class="text-h6 q-mb-sm">{{ t('nodesPage.activateDialog.title') }}</div>
        <p class="q-mb-md">{{ t('nodesPage.activateDialog.message') }}</p>
        <div class="row justify-end q-gutter-sm">
          <q-btn flat :disable="activateSubmitting" :label="t('nodesPage.activateDialog.actions.cancel')"
            @click="closeActivateDialog" />
          <q-btn color="positive" unelevated icon="power_settings_new"
            :label="t('nodesPage.activateDialog.actions.confirm')" :loading="activateSubmitting"
            @click="confirmActivateNode" />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

type ServerNodeResponse = {
  id?: string | number;
  name?: string;
  symbol?: string;
  isReady?: boolean;
  [key: string]: unknown;
};

type LocalNode = {
  id: string;
  label: string;
  isReady: boolean;
  isDeleted?: boolean;
};

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();

const activeNodes = ref<LocalNode[]>([]);
const disabledNodes = ref<LocalNode[]>([]);
const isLoading = ref(false);
const hasError = ref(false);
const isDialogOpen = ref(false);
const isDisableDialogOpen = ref(false);
const isActivateDialogOpen = ref(false);
const disableSubmitting = ref(false);
const activateSubmitting = ref(false);
const nodeToDisable = ref<LocalNode | null>(null);
const nodeToActivate = ref<LocalNode | null>(null);
const form = reactive({
  name: '',
  submitting: false,
  error: '',
});

const shouldShowError = computed(() => hasError.value && !isLoading.value);

const fetchNodes = async () => {
  isLoading.value = true;
  hasError.value = false;
  try {
    const [activeResponse, deletedResponse] = await Promise.all([
      api.get('/server-nodes'),
      api.get('/server-nodes/deleted'),
    ]);
    const activeList = normalizePayload(activeResponse?.data);
    const deletedList = normalizePayload(deletedResponse?.data);
    activeNodes.value = activeList.length
      ? activeList.map((entry, index) => toLocalNode(entry, index))
      : [];
    disabledNodes.value = deletedList.length
      ? deletedList.map((entry, index) => toLocalNode(entry, index, { isDeleted: true }))
      : [];
  } catch {
    activeNodes.value = [];
    disabledNodes.value = [];
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const normalizePayload = (payload: unknown): ServerNodeResponse[] => {
  if (Array.isArray(payload)) {
    return payload as ServerNodeResponse[];
  }
  if (payload && typeof payload === 'object') {
    const bag = payload as Record<string, unknown>;
    if (Array.isArray(bag.serverNodes)) {
      return bag.serverNodes as ServerNodeResponse[];
    }
    if (Array.isArray(bag.data)) {
      return bag.data as ServerNodeResponse[];
    }
  }
  return [];
};

const toLocalNode = (entry: ServerNodeResponse, index: number, options?: { isDeleted?: boolean }): LocalNode => {
  const rawName =
    typeof entry.name === 'string' && entry.name.length ? entry.name : `Node ${index + 1}`;
  const symbol =
    typeof entry.symbol === 'string' && entry.symbol.length ? entry.symbol.toUpperCase() : '';
  const label = symbol ? `${rawName} (${symbol})` : rawName;
  const sanitizedName = rawName.replace(/\s+/g, '');

  return {
    id: `${entry.id ?? `${sanitizedName}-${symbol || index}`}`,
    label,
    isReady: Boolean(entry.isReady),
    isDeleted: Boolean(options?.isDeleted),
  };
};

const nodeRefs = new Map<string, HTMLElement>();

const isComponentInstance = (
  target: Element | ComponentPublicInstance | null
): target is ComponentPublicInstance => Boolean(target && '$el' in target);

const setNodeRef = (el: Element | ComponentPublicInstance | null, id: string) => {
  if (el instanceof HTMLElement) {
    nodeRefs.set(id, el);
    return;
  }
  if (isComponentInstance(el) && el.$el instanceof HTMLElement) {
    nodeRefs.set(id, el.$el);
    return;
  }
  nodeRefs.delete(id);
};

const getPupilStyle = () => ({});

const handleAddClick = () => {
  isDialogOpen.value = true;
};

const goToNode = (id: string) => {
  void router.push({ path: `/nodes/${id}` });
};

const openDisableDialog = (node: LocalNode) => {
  nodeToDisable.value = node;
  isDisableDialogOpen.value = true;
};

const closeDisableDialog = () => {
  isDisableDialogOpen.value = false;
  nodeToDisable.value = null;
};

const openActivateDialog = (node: LocalNode) => {
  nodeToActivate.value = node;
  isActivateDialogOpen.value = true;
};

const closeActivateDialog = () => {
  isActivateDialogOpen.value = false;
  nodeToActivate.value = null;
};

const closeDialog = () => {
  isDialogOpen.value = false;
};

const resetForm = () => {
  form.name = '';
  form.error = '';
  form.submitting = false;
};

const handleDialogHide = () => {
  resetForm();
};

const submitNode = async () => {
  form.error = '';
  if (!form.name.trim()) {
    form.error = t('nodesPage.dialog.errors.name');
    return;
  }

  form.submitting = true;
  try {
    const payload = {
      name: form.name.trim(),
    };
    await api.post('/server-nodes', payload);
    isDialogOpen.value = false;
    await fetchNodes();
  } catch {
    form.error = t('nodesPage.dialog.errors.generic');
  } finally {
    form.submitting = false;
  }
};

const confirmDisableNode = async () => {
  if (!nodeToDisable.value) {
    return;
  }

  disableSubmitting.value = true;
  try {
    await api.delete(`/server-nodes/${nodeToDisable.value.id}`);
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('nodesPage.notifications.disableSuccess'),
    });
    closeDisableDialog();
  } catch {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodesPage.notifications.disableError'),
    });
  } finally {
    disableSubmitting.value = false;
    await fetchNodes();
  }
};

const confirmActivateNode = async () => {
  if (!nodeToActivate.value) {
    return;
  }

  activateSubmitting.value = true;
  try {
    await api.post(`/server-nodes/${nodeToActivate.value.id}/activate`);
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('nodesPage.notifications.activateSuccess'),
    });
    closeActivateDialog();
  } catch {
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('nodesPage.notifications.disableError'),
    });
  } finally {
    activateSubmitting.value = false;
    await fetchNodes();
  }
};

onMounted(() => {
  void fetchNodes();
});

onBeforeUnmount(() => {
  nodeRefs.clear();
});
</script>

<style scoped>
.nodes-header {
  gap: 12px;
}

.nodes-add-button {
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  transform-origin: center;
}

.nodes-add-button:hover,
.nodes-add-button:focus-visible {
  box-shadow: 0 14px 26px rgba(5, 10, 24, 0.35);
}




.nodes-title {
  font-weight: 600;
}

.nodes-page :global(.text-h5),
.nodes-page :global(.text-body2),
.nodes-page :global(.text-white) {
  transition: color 0.2s ease;
}

.nodes-subtitle {
  color: rgba(255, 255, 255, 0.7);
}

.nodes-loading {
  min-height: 280px;
}

.nodes-section__title {
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.2px;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 32px;
  padding-bottom: 30px;
}

.nodes-section {
  border: 1px solid rgba(111, 63, 245, 0.18);
  border-radius: 18px;
  padding: 18px;
  background: linear-gradient(180deg, rgba(22, 32, 64, 0.6), rgba(12, 18, 34, 0.65));
}

.nodes-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.nodes-card__body {
  width: 160px;
  height: 160px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(145deg, rgba(31, 45, 97, 0.9), rgba(13, 22, 48, 0.92));
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.45), 0 0 12px rgba(79, 133, 255, 0.15);
}

.nodes-card--disabled .nodes-card__body {
  background: linear-gradient(145deg, rgba(30, 32, 40, 0.9), rgba(12, 14, 22, 0.92));
  border-color: rgba(255, 255, 255, 0.1);
  opacity: 0.92;
}

.nodes-eyes {
  position: absolute;
  top: -10px;
  display: flex;
  gap: 10px;
}

.nodes-eye {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(17, 27, 43, 0.15);
  box-shadow: inset 0 -2px 3px rgba(0, 0, 0, 0.05);
}

.nodes-eye::after {
  content: '';
  position: absolute;
  width: 70%;
  height: 4px;
  border-radius: 999px;
  background: rgba(10, 15, 33, 0.85);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
}

.nodes-eye__pupil {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #111b2a;
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0;
  transform: translateY(6px) scaleX(0.7) scaleY(0.2);
}

.nodes-eyes--open .nodes-eye::after {
  opacity: 0;
}

.nodes-eyes--open .nodes-eye__pupil {
  opacity: 1;
  transform: none;
}

.nodes-eyes--closed .nodes-eye::after {
  opacity: 1;
}

.nodes-eyes--closed .nodes-eye__pupil {
  opacity: 0;
  transform: translateY(6px) scaleX(0.7) scaleY(0.2);
}

.nodes-card__logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
}

.nodes-card__content {
  position: relative;
  width: 100%;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.nodes-card__name {
  text-align: center;
  font-weight: 600;
  padding: 0 8px;
  transition: opacity 0.2s ease;
  color: rgba(255, 255, 255, 0.92);
}

.nodes-card__actions {
  position: static;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  pointer-events: auto;
  transition: none;
}

.nodes-card__actions--dual {
  flex-direction: row;
  gap: 10px;
  width: 100%;
}

.nodes-card__actions--single {
  max-width: 140px;
  width: auto;
  justify-content: center;
  gap: 10px;
}



.nodes-accordion {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(111, 63, 245, 0.18);

}

.nodes-accordion :global(.q-expansion-item__container) {
  background: transparent;
}

.nodes-accordion :global(.q-item) {
  padding: 14px 18px;
}

.nodes-accordion :global(.q-item__label) {
  font-size: 18px;
  font-weight: 700;
}

:global(.body--light) {

  .nodes-add-button:hover,
  .nodes-add-button:focus-visible {
    box-shadow: 0 14px 22px rgba(15, 23, 43, 0.2);
  }

  .nodes-title {
    color: #8b5a2b;
  }

  .nodes-subtitle {
    color: #4c566a;
  }

  .nodes-header .q-btn {
    color: #ffffff;
  }

  .nodes-section {
    border-color: rgba(111, 63, 245, 0.28);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 255, 0.92));
  }

  .nodes-card__body {
    border-color: rgba(15, 23, 43, 0.1);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 18px 26px rgba(15, 23, 42, 0.14);
    color: #0f172a;
  }

  .nodes-card--disabled .nodes-card__body {
    background: linear-gradient(145deg, #f4f7ff, #dfe6f5);
    border-color: rgba(15, 23, 43, 0.12);
    opacity: 0.96;
  }


  .nodes-card__name {
    color: #0f172a;
  }

  :deep(.nodes-accordion) {
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
    border-color: rgba(111, 63, 245, 0.28);
  }

  .nodes-empty__popup {
    background: rgba(255, 255, 255, 0.94);
    color: #1a1f33;
    box-shadow:
      0 18px 36px rgba(20, 27, 43, 0.18),
      0 6px 12px rgba(15, 19, 33, 0.15);
    border-color: rgba(41, 55, 97, 0.2);
  }

  .nodes-empty__popup::after {
    border-top-color: rgba(255, 255, 255, 0.94);
  }

  .nodes-empty__server {
    border-color: rgba(41, 55, 99, 0.2);
    background: radial-gradient(circle at 50% 25%, rgba(255, 255, 255, 0.98), #dfe8ff);
    color: #1b2448;
    box-shadow: 0 20px 30px rgba(15, 23, 42, 0.15);
  }

  .nodes-empty__server:hover,
  .nodes-empty__server:focus-visible {
    box-shadow: 0 26px 34px rgba(19, 30, 72, 0.25);
  }

  .server-eye {
    background: rgba(243, 247, 255, 0.98);
    border-color: rgba(15, 23, 42, 0.35);
  }

  .server-eye__pupil {
    background: #0f172a;
  }

  .nodes-empty__title {
    color: #8b5a2b;
  }

  .nodes-empty__hint {
    color: #5b5e6b;
  }
}

.nodes-empty--compact {
  min-height: 120px;
}

.nodes-empty {
  text-align: center;
}

.nodes-empty__scene {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  padding-top: 48px;
}

.nodes-empty__popup {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -100%);
  padding: 10px 18px;
  border-radius: 18px;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: rgba(18, 27, 49, 0.92);
  color: #f1f5ff;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.35),
    0 6px 16px rgba(5, 10, 20, 0.4);
  border: 1px solid rgba(32, 44, 78, 0.25);
  max-width: 280px;
  text-align: center;
}

.nodes-empty__popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 12px;
  border-style: solid;
  border-color: rgba(18, 27, 49, 0.92) transparent transparent transparent;
}

.nodes-empty__shadow {
  position: absolute;
  bottom: -26px;
  left: 50%;
  width: 90px;
  height: 26px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(6, 8, 23, 0.35), transparent 70%);
  filter: blur(10px);
  z-index: 0;
  pointer-events: none;
}




.nodes-empty__server {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 28px;
  background: radial-gradient(circle at 50% 20%, #192344, #0e172c);
  border: 1px solid rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e7ecff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  z-index: 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.nodes-empty__server:hover,
.nodes-empty__server:focus-visible {
  animation: nodes-server-shake 0.75s ease;
  box-shadow: 0 28px 40px rgba(0, 0, 0, 0.5);
}

.nodes-empty__server-icon {
  color: currentcolor;
}

.server-node__eyes {
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translate(-50%, -4px);
  display: flex;
  gap: 12px;
}

.server-eye {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.85);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.15);
}

.server-eye::after {
  content: '';
  position: absolute;
  width: 70%;
  height: 3px;
  border-radius: 999px;
  background: rgba(16, 23, 42, 0.85);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
}

.server-eye__pupil {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0f172a;
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0;
  transform: translateY(4px) scaleX(0.8) scaleY(0.2);
}

.server-node__eyes--happy .server-eye::after {
  opacity: 0;
}

.server-node__eyes--happy .server-eye__pupil {
  opacity: 1;
  transform: none;
}

.nodes-empty__title {
  margin: 0 0 4px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.nodes-empty__hint {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
}



.nodes-dialog {
  width: 420px;
  max-width: 90vw;
}

@keyframes nodes-server-shake {

  0%,
  100% {
    transform: rotate(0deg) translate3d(0, 0, 0);
  }

  20% {
    transform: rotate(-6deg) translate3d(-2px, 0, 0);
  }

  40% {
    transform: rotate(5deg) translate3d(2px, 0, 0);
  }

  60% {
    transform: rotate(-4deg) translate3d(-1px, 0, 0);
  }

  80% {
    transform: rotate(3deg) translate3d(1px, 0, 0);
  }
}
</style>
