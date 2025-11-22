<template>
  <q-page class="nodes-page q-pa-xl">
    <div class="nodes-header row items-center q-mb-xl">
      <div>
        <h2 class="nodes-title text-h5 q-mb-xs">{{ t('nodesPage.title') }}</h2>
        <p class="nodes-subtitle text-body2">{{ t('nodesPage.subtitle') }}</p>
      </div>
      <q-btn class="nodes-add-button" color="primary" icon="add" unelevated :label="t('nodesPage.actions.add')"
        @click="handleAddClick" @mouseenter="handleAddButtonEnter" @mouseleave="handleAddButtonLeave"
        @focus="handleAddButtonEnter" @blur="handleAddButtonLeave" />
    </div>

    <q-banner v-if="shouldShowError" dense rounded class="bg-negative text-white text-center q-mb-lg">
      {{ t('nodesPage.error') }}
    </q-banner>

    <div v-else>
      <div v-if="isLoading" class="nodes-loading column items-center justify-center">
        <q-spinner color="primary" size="48px" />
      </div>

      <template v-else>
        <div v-if="visibleNodes.length" class="nodes-grid">
          <div v-for="node in visibleNodes" :key="node.id" class="nodes-card">
            <div class="nodes-card__body" :ref="(el) => setNodeRef(el, node.id)">
              <div class="nodes-eyes" :class="{ 'nodes-eyes--happy': isNodeHappy }">
                <div class="nodes-eye">
                  <div class="nodes-eye__pupil" :style="getPupilStyle()"></div>
                </div>
                <div class="nodes-eye">
                  <div class="nodes-eye__pupil" :style="getPupilStyle()"></div>
                </div>
              </div>
              <img v-if="node.logo" :src="node.logo" :alt="node.label" class="nodes-card__logo" />
              <q-icon v-else name="dns" size="36px" />
            </div>
            <p class="nodes-card__label">{{ node.label }}</p>
          </div>
        </div>

        <div v-else class="nodes-empty column items-center justify-center">
          <div class="nodes-empty__scene">

            <div class="nodes-empty__shadow"></div>
            <div class="nodes-empty__server" :ref="(el) => setNodeRef(el, '__empty__server__')">
              <div class="server-node__eyes" :class="{ 'server-node__eyes--happy': isNodeHappy }">
                <div class="server-eye">
                  <div class="server-eye__pupil" :style="getPupilStyle()"></div>
                </div>
                <div class="server-eye">
                  <div class="server-eye__pupil" :style="getPupilStyle()"></div>
                </div>
              </div>
              <q-icon name="dns" size="40px" class="nodes-empty__server-icon" />
            </div>
          </div>
          <p class="nodes-empty__title">{{ t('nodesPage.empty.label') }}</p>
          <p class="nodes-empty__hint">{{ t('nodesPage.empty.hint') }}</p>
        </div>
      </template>
    </div>

    <q-dialog v-model="isDialogOpen" @hide="handleDialogHide">
      <q-card class="nodes-dialog q-pa-md">
        <div class="text-h6 q-mb-sm">{{ t('nodesPage.dialog.title') }}</div>
        <q-form @submit.prevent="submitNode" class="column q-gutter-md">
          <q-input v-model="form.name" :label="t('nodesPage.dialog.fields.name')" outlined dense
            :disable="form.submitting" />
          <q-input v-model="form.powerKw" type="number" step="0.1" :label="t('nodesPage.dialog.fields.power')" outlined
            dense :disable="form.submitting" />
          <div>
            <div class="text-caption text-grey-6 q-mb-xs">
              {{ t('nodesPage.dialog.fields.uptime') }}
            </div>
            <div class="row q-col-gutter-sm">
              <q-input
                v-model.number="form.uptimeHours"
                type="number"
                min="0"
                max="24"
                :label="t('nodesPage.dialog.fields.hours')"
                outlined
                dense
                :disable="form.submitting"
              />
              <q-input
                v-model.number="form.uptimeMinutes"
                type="number"
                min="0"
                max="59"
                :label="t('nodesPage.dialog.fields.minutes')"
                outlined
                dense
                :disable="form.submitting"
              />
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              {{ t('nodesPage.dialog.uptimeHelper') }}
            </div>
          </div>

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
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import algorandLogo from 'src/assets/logos/algorand-algo-logo.png';
import cardanoLogo from 'src/assets/logos/cardano-ada-logo.png';

type ServerNodeResponse = {
  id?: string | number;
  name?: string;
  symbol?: string;
  isReady?: boolean;
  logo?: string;
  [key: string]: unknown;
};

type LocalNode = {
  id: string;
  label: string;
  logo: string;
  isReady: boolean;
};

const { t } = useI18n();

const nodes = ref<LocalNode[]>([]);
const searchTerm = ref('');
const isLoading = ref(false);
const hasError = ref(false);
const isDialogOpen = ref(false);
const isNodeHappy = ref(false);
const form = reactive({
  name: '',
  powerKw: '',
  uptimeHours: 24,
  uptimeMinutes: 0,
  submitting: false,
  error: '',
});

const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase());

const decoratedNodes = computed(() =>
  nodes.value.map((node) => ({
    ...node,
    matchesSearch:
      normalizedSearch.value.length > 0 &&
      node.label.toLowerCase().includes(normalizedSearch.value),
  }))
);

const visibleNodes = computed(() => {
  if (!normalizedSearch.value.length) {
    return decoratedNodes.value;
  }

  return decoratedNodes.value.filter((node) => node.matchesSearch);
});

const shouldShowError = computed(() => hasError.value && !isLoading.value);

const availableLogos: Record<string, string> = {
  AlgorandLogo: algorandLogo,
  CardanoLogo: cardanoLogo,
};
const fallbackLogo = cardanoLogo;

const fetchNodes = async () => {
  isLoading.value = true;
  hasError.value = false;
  try {
    const response = await api.get('/server-nodes');
    const list = normalizePayload(response?.data);
    nodes.value = list.length ? list.map((entry, index) => toLocalNode(entry, index)) : [];
  } catch {
    nodes.value = [];
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

const toLocalNode = (entry: ServerNodeResponse, index: number): LocalNode => {
  const rawName =
    typeof entry.name === 'string' && entry.name.length ? entry.name : `Node ${index + 1}`;
  const symbol =
    typeof entry.symbol === 'string' && entry.symbol.length ? entry.symbol.toUpperCase() : '';
  const label = symbol ? `${rawName} (${symbol})` : rawName;
  const sanitizedName = rawName.replace(/\s+/g, '');
  const record = entry as Record<string, unknown>;
  const rawLogoKey = `${rawName}Logo`;
  const sanitizedLogoKey = `${sanitizedName}Logo`;
  const keyCandidates = [rawLogoKey, sanitizedLogoKey];
  const propertyLogo = keyCandidates
    .map((key) => record[key])
    .find((value) => typeof value === 'string' && value.length) as string | undefined;
  const derivedLogo =
    propertyLogo ??
    availableLogos[sanitizedLogoKey] ??
    availableLogos[rawLogoKey] ??
    (typeof entry.logo === 'string' ? entry.logo : undefined) ??
    fallbackLogo;

  return {
    id: `${entry.id ?? `${sanitizedName}-${symbol || index}`}`,
    label,
    logo: derivedLogo,
    isReady: Boolean(entry.isReady),
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

const setNodeHappiness = (value: boolean) => {
  isNodeHappy.value = value;
};

const handleAddButtonEnter = () => {
  setNodeHappiness(true);
};

const handleAddButtonLeave = () => {
  setNodeHappiness(false);
};

const handleAddClick = () => {
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
};

const resetForm = () => {
  form.name = '';
  form.powerKw = '';
  form.uptimeHours = 24;
  form.uptimeMinutes = 0;
  form.error = '';
  form.submitting = false;
};

const handleDialogHide = () => {
  resetForm();
};

const timeToSeconds = (hoursInput: number, minutesInput: number) => {
  const hours = Math.min(Math.max(Number(hoursInput) || 0, 0), 24);
  const minutes = Math.min(Math.max(Number(minutesInput) || 0, 0), 59);
  return hours * 3600 + minutes * 60;
};

const submitNode = async () => {
  form.error = '';
  if (!form.name.trim()) {
    form.error = t('nodesPage.dialog.errors.name');
    return;
  }
  if (form.powerKw === '' || Number.isNaN(Number(form.powerKw))) {
    form.error = t('nodesPage.dialog.errors.power');
    return;
  }

  form.submitting = true;
  try {
    const payload = {
      name: form.name.trim(),
      powerKw: Number(form.powerKw),
      dailyUptimeSeconds: timeToSeconds(form.uptimeHours, form.uptimeMinutes),
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
  animation: nodes-server-shake 0.75s ease;
  box-shadow: 0 14px 26px rgba(5, 10, 24, 0.35);
}

:global(body.body--light) .nodes-add-button:hover,
:global(body.body--light) .nodes-add-button:focus-visible {
  box-shadow: 0 14px 22px rgba(15, 23, 43, 0.2);
}




.nodes-title {
  font-weight: 600;
}

.nodes-page :global(.text-h5),
.nodes-page :global(.text-body2),
.nodes-page :global(.text-white) {
  transition: color 0.2s ease;
}

:global(body.body--light) .nodes-title {
  color: #8b5a2b;
}

:global(body.body--light) .nodes-subtitle {
  color: #0f172a;
}

:global(body.body--light) .nodes-header .q-btn {
  color: #ffffff;
}

.nodes-subtitle {
  color: rgba(255, 255, 255, 0.7);
}

:global(body.body--light) .nodes-subtitle {
  color: #4c566a;
}

.nodes-loading {
  min-height: 280px;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 32px;
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: radial-gradient(circle at top, rgba(18, 34, 58, 0.9), rgba(9, 17, 30, 0.95));
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
}

:global(body.body--light) .nodes-card__body {
  border-color: rgba(15, 23, 43, 0.1);
  background: radial-gradient(circle at top, #f2f0ff, #dcd7ff);
  box-shadow: 0 20px 30px rgba(15, 23, 42, 0.15);
}

.nodes-eyes {
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

.nodes-eyes--happy .nodes-eye::after {
  opacity: 0;
}

.nodes-eyes--happy .nodes-eye__pupil {
  opacity: 1;
  transform: none;
}

.nodes-card__logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
}

.nodes-card__label {
  margin: 0;
  font-weight: 600;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}

:global(body.body--light) .nodes-card__label {
  color: #1c2340;
}

.nodes-empty {
  min-height: 320px;
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

:global(body.body--light) .nodes-empty__popup {
  background: rgba(255, 255, 255, 0.94);
  color: #1a1f33;
  box-shadow:
    0 18px 36px rgba(20, 27, 43, 0.18),
    0 6px 12px rgba(15, 19, 33, 0.15);
  border-color: rgba(41, 55, 97, 0.2);
}

:global(body.body--light) .nodes-empty__popup::after {
  border-top-color: rgba(255, 255, 255, 0.94);
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

:global(body.body--light) .nodes-empty__server {
  border-color: rgba(41, 55, 99, 0.2);
  background: radial-gradient(circle at 50% 25%, rgba(255, 255, 255, 0.98), #dfe8ff);
  color: #1b2448;
  box-shadow: 0 20px 30px rgba(15, 23, 42, 0.15);
}

.nodes-empty__server:hover,
.nodes-empty__server:focus-visible {
  animation: nodes-server-shake 0.75s ease;
  box-shadow: 0 28px 40px rgba(0, 0, 0, 0.5);
}

:global(body.body--light) .nodes-empty__server:hover,
:global(body.body--light) .nodes-empty__server:focus-visible {
  box-shadow: 0 26px 34px rgba(19, 30, 72, 0.25);
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

:global(body.body--light) .server-eye {
  background: rgba(243, 247, 255, 0.98);
  border-color: rgba(15, 23, 42, 0.35);
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

:global(body.body--light) .server-eye__pupil {
  background: #0f172a;
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

:global(body.body--light) .nodes-empty__title {
  color: #8b5a2b;
}

.nodes-empty__hint {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
}

:global(body.body--light) .nodes-empty__hint {
  color: #5b5e6b;
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
