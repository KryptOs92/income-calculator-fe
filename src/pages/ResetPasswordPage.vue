<template>
  <q-page class="reset-password-page q-pa-none">
    <div
      ref="stageRef"
      :class="['reset-stage', themeClass]"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <div
        v-for="node in serverNodes"
        :key="node.id"
        :class="[
          'reset-node',
          { 'reset-node--dynamic': node.kind === 'dynamic' },
          (globalShake || hoveredNode === node.id || shakingNodes[node.id]) ? 'reset-node--shake' : null
        ]"
        :style="{
          top: `${node.position.y}%`,
          left: `${node.position.x}%`
        }"
        @mouseenter="handleNodeMouseEnter(node.id)"
        @mouseleave="handleNodeMouseLeave(node.id)"
      >
        <div
          class="reset-node__eyes"
          :class="{
            'reset-node__eyes--closed': eyesClosed,
            'reset-node__eyes--happy': happyNodes[node.id]
          }"
        >
          <div class="reset-eye">
            <div class="reset-eye__pupil" :style="getPupilStyle(node)"></div>
          </div>
          <div class="reset-eye">
            <div class="reset-eye__pupil" :style="getPupilStyle(node)"></div>
          </div>
        </div>
        <q-icon name="dns" size="38px" />
      </div>

      <div class="reset-popups">
        <transition-group name="reset-popup" tag="div">
          <div
            v-for="popup in authPopups"
            :key="popup.id"
            class="reset-popup"
            :class="`reset-popup--${popup.type}`"
            :style="{
              top: `${popup.position.y}%`,
              left: `${popup.position.x}%`
            }"
          >
            <div class="reset-popup__content">
              <q-icon
                :name="popup.type === 'success' ? 'thumb_up_alt' : 'thumb_down_alt'"
                size="22px"
              />
            </div>
          </div>
        </transition-group>
      </div>

      <q-card class="reset-card">
        <div
          v-if="!tokenPresent"
          class="reset-card__content column items-center q-gutter-md"
        >
          <q-btn
            color="primary"
            unelevated
            :label="t('resetPasswordPage.backToHome')"
            to="/"
          />
        </div>

        <template v-else>
          <div
            v-if="submissionStatus === 'success'"
            class="reset-card__content column items-center q-gutter-md"
          >
            <q-icon name="lock_open" size="48px" color="positive" />
            <div class="reset-card__title text-h5 text-center">
              {{ t('resetPasswordPage.successTitle') }}
            </div>
            <p class="reset-card__message text-body1 text-center">
              {{ t('resetPasswordPage.successMessage') }}
            </p>
            <q-btn
              color="primary"
              unelevated
              :label="t('resetPasswordPage.goToSignIn')"
              :to="{ name: 'sign-in' }"
            />
          </div>

          <q-form
            v-else
            ref="formRef"
            class="reset-card__content column q-gutter-lg"
            @submit.prevent="handleSubmit"
          >
            <div class="reset-card__header column items-center q-gutter-xs">
              <div class="reset-card__title text-h5 text-center">
                {{ t('resetPasswordPage.title') }}
              </div>
              <p class="reset-card__message text-body1 text-center">
                {{ t('resetPasswordPage.subtitle') }}
              </p>
            </div>

            <div class="column q-gutter-md">
              <q-input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :label="t('resetPasswordPage.newPassword')"
                :rules="passwordRules"
                filled
                lazy-rules="ondemand"
                autocapitalize="off"
                autocomplete="new-password"
              >
                <template #append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>

              <q-input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :label="t('resetPasswordPage.confirmPassword')"
                :rules="confirmPasswordRules"
                filled
                lazy-rules="ondemand"
                autocapitalize="off"
                autocomplete="new-password"
              >
                <template #append>
                  <q-icon
                    :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showConfirmPassword = !showConfirmPassword"
                  />
                </template>
              </q-input>
            </div>

            <q-banner
              v-if="submissionStatus === 'error' && helperMessage"
              dense
              class="reset-card__banner reset-card__banner--error"
            >
              {{ helperMessage }}
            </q-banner>

            <q-btn
              color="primary"
              unelevated
              type="submit"
              :loading="submitting"
              :label="t('resetPasswordPage.submit')"
            />
            <q-btn
              outline
              color="positive"
              class="reset-card__back-btn"
              :label="t('resetPasswordPage.backToSignIn')"
              :to="{ name: 'sign-in' }"
            />
          </q-form>
        </template>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { api } from 'boot/axios';
import type { QForm } from 'quasar';
import { useQuasar } from 'quasar';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

type ServerNode = {
  id: string;
  position: {
    x: number;
    y: number;
  };
  kind: 'base' | 'dynamic';
};

type AuthPopup = {
  id: number;
  type: 'success' | 'error';
  position: {
    x: number;
    y: number;
  };
};

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();

const formRef = ref<QForm | null>(null);
const form = reactive({
  password: '',
  confirmPassword: '',
});
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const submitting = ref(false);
const submissionStatus = ref<'idle' | 'success' | 'error'>('idle');
const helperMessage = ref<string | null>(null);

const stageRef = ref<HTMLElement | null>(null);

const SERVER_COUNT = 8;
const SERVER_IDS = Array.from({ length: SERVER_COUNT }, (_, index) => `reset-node-${index + 1}`);
const OCTAGON_RADIUS = 32;

const desktopPositions = SERVER_IDS.map((_, index) => {
  const angle = (Math.PI * 2 * index) / SERVER_COUNT - Math.PI / 2;

  return {
    x: Math.round(50 + OCTAGON_RADIUS * Math.cos(angle)),
    y: Math.round(50 + OCTAGON_RADIUS * Math.sin(angle)),
  };
});

if (desktopPositions.length >= 5) {
  const topY = Math.max(desktopPositions[0]!.y - 4, 6);
  desktopPositions[0] = {
    x: 44,
    y: topY,
  };
  desktopPositions[4] = {
    x: 56,
    y: topY,
  };
}

const mobilePositions: Array<{ x: number; y: number }> = [
  { x: 18, y: 25 },
  { x: 38, y: 25 },
  { x: 62, y: 25 },
  { x: 82, y: 25 },
  { x: 18, y: 75 },
  { x: 38, y: 75 },
  { x: 62, y: 75 },
  { x: 82, y: 75 },
];

const getBasePositions = () => ($q.screen.lt.md ? mobilePositions : desktopPositions);

const createBaseNodes = (): ServerNode[] =>
  SERVER_IDS.map((id, index) => {
    const basePosition = getBasePositions()[index] ?? { x: 50, y: 50 };
    return {
      id,
      position: { ...basePosition },
      kind: 'base',
    };
  });

const serverNodes = ref<ServerNode[]>(createBaseNodes());
const hoveredNode = ref<string | null>(null);
const eyesClosed = ref(false);
const happyNodes = ref<Record<string, boolean>>({});
const shakingNodes = ref<Record<string, boolean>>({});
const globalShake = ref(false);
const authPopups = ref<AuthPopup[]>([]);
const isGlobalHappy = ref(false);

const stageSize = reactive({
  width: 1,
  height: 1,
});

const cursor = reactive({
  x: 0,
  y: 0,
});

let shakeTimer: number | undefined;
let eyesTimer: number | undefined;
let happyTimer: number | undefined;

const token = computed(() => {
  const value = route.query.token;
  return typeof value === 'string' ? value : '';
});

const tokenPresent = computed(() => !!token.value);

const themeClass = computed(() => ($q.dark.isActive ? 'reset-stage--dark' : 'reset-stage--light'));

const passwordRules = [
  (val: string) => !!val || t('resetPasswordPage.fieldRequired'),
  (val: string) => (val?.length ?? 0) >= 8 || t('resetPasswordPage.passwordMinLength'),
];

const confirmPasswordRules = [
  (val: string) => !!val || t('resetPasswordPage.fieldRequired'),
  (val: string) => val === form.password || t('resetPasswordPage.passwordsMustMatch'),
];

const clearHappyNodes = () => {
  happyNodes.value = {};
};

const setHappyNode = (nodeId: string, value: boolean) => {
  if (value) {
    happyNodes.value = {
      ...happyNodes.value,
      [nodeId]: true,
    };
    return;
  }

  if (happyNodes.value[nodeId]) {
    const next = { ...happyNodes.value };
    delete next[nodeId];
    happyNodes.value = next;
  }
};

const triggerNodeShake = () => {
  if (shakeTimer) {
    window.clearTimeout(shakeTimer);
  }

  globalShake.value = false;

  void nextTick(() => {
    globalShake.value = true;
    shakeTimer = window.setTimeout(() => {
      globalShake.value = false;
      shakeTimer = undefined;
    }, 1200);
  });
};

const triggerHappyEyes = (duration = 2000) => {
  if (eyesTimer) {
    window.clearTimeout(eyesTimer);
    eyesTimer = undefined;
  }

  if (happyTimer) {
    window.clearTimeout(happyTimer);
  }

  eyesClosed.value = false;
  isGlobalHappy.value = true;

  const state: Record<string, boolean> = {};
  serverNodes.value.forEach((node) => {
    state[node.id] = true;
  });
  happyNodes.value = state;

  happyTimer = window.setTimeout(() => {
    isGlobalHappy.value = false;
    clearHappyNodes();
    happyTimer = undefined;
    if (hoveredNode.value) {
      setHappyNode(hoveredNode.value, true);
    }
  }, duration);
};

const triggerEyesClosure = () => {
  if (happyTimer) {
    window.clearTimeout(happyTimer);
    happyTimer = undefined;
  }
  isGlobalHappy.value = false;
  clearHappyNodes();

  eyesClosed.value = true;

  if (eyesTimer) {
    window.clearTimeout(eyesTimer);
  }

  eyesTimer = window.setTimeout(() => {
    eyesClosed.value = false;
    eyesTimer = undefined;
    if (hoveredNode.value) {
      setHappyNode(hoveredNode.value, true);
    }
  }, 1200);
};

const addAuthPopup = (type: AuthPopup['type']) => {
  const nodes = serverNodes.value;

  if (!nodes.length) {
    return;
  }

  const timestamp = Date.now();
  const createdIds: number[] = [];
  const additions = nodes.map((node, index) => {
    const id = timestamp + index + Math.random();
    createdIds.push(id);
    return {
      id,
      type,
      position: {
        x: node.position.x,
        y: Math.max(5, node.position.y - 12),
      },
    } satisfies AuthPopup;
  });

  authPopups.value = [...authPopups.value, ...additions];

  window.setTimeout(() => {
    const idSet = new Set(createdIds);
    authPopups.value = authPopups.value.filter((popup) => !idSet.has(popup.id));
  }, 1600);
};

const updateStageMetrics = () => {
  const stageEl = stageRef.value;
  if (!stageEl) {
    return;
  }
  const rect = stageEl.getBoundingClientRect();
  stageSize.width = rect.width;
  stageSize.height = rect.height;
};

const handleMouseMove = (event: MouseEvent) => {
  const stageEl = stageRef.value;
  if (!stageEl) {
    return;
  }

  const rect = stageEl.getBoundingClientRect();
  cursor.x = event.clientX - rect.left;
  cursor.y = event.clientY - rect.top;
};

const handleMouseLeave = () => {
  cursor.x = stageSize.width / 2;
  cursor.y = stageSize.height / 2;
};

const getPupilStyle = (node: ServerNode) => {
  const stageEl = stageRef.value;
  if (!stageEl) {
    return {};
  }

  const nodeX = (node.position.x / 100) * stageSize.width;
  const nodeY = (node.position.y / 100) * stageSize.height;

  const dx = cursor.x - nodeX;
  const dy = cursor.y - nodeY;
  const distance = Math.hypot(dx, dy);
  const maxOffset = 6;
  const ratio = distance === 0 ? 0 : Math.min(distance / 90, 1);

  const offsetX = Math.cos(Math.atan2(dy, dx)) * maxOffset * ratio;
  const offsetY = Math.sin(Math.atan2(dy, dx)) * maxOffset * ratio;

  return {
    transform: `translate(${offsetX}px, ${offsetY}px)`
  };
};

const handleNodeMouseEnter = (nodeId: string) => {
  hoveredNode.value = nodeId;
  setHappyNode(nodeId, true);
  shakingNodes.value = {
    ...shakingNodes.value,
    [nodeId]: true,
  };
};

const handleNodeMouseLeave = (nodeId: string) => {
  if (hoveredNode.value === nodeId) {
    hoveredNode.value = null;
  }

  if (!isGlobalHappy.value) {
    setHappyNode(nodeId, false);
  }

  const next = { ...shakingNodes.value };
  delete next[nodeId];
  shakingNodes.value = next;
};

const resetForm = () => {
  form.password = '';
  form.confirmPassword = '';
  showPassword.value = false;
  showConfirmPassword.value = false;
  formRef.value?.resetValidation();
};

const handleValidationError = () => {
  submissionStatus.value = 'error';
  helperMessage.value = t('resetPasswordPage.formInvalid');
  addAuthPopup('error');
  triggerEyesClosure();
  triggerNodeShake();
};

const handleSubmissionError = () => {
  submissionStatus.value = 'error';
  helperMessage.value = t('resetPasswordPage.errorMessage');
  addAuthPopup('error');
  triggerEyesClosure();
  triggerNodeShake();
};

const handleSubmit = async () => {
  if (!tokenPresent.value) {
    return;
  }

  submissionStatus.value = 'idle';
  helperMessage.value = null;

  const formInstance = formRef.value;
  if (formInstance) {
    const valid = await formInstance.validate();
    if (!valid) {
      handleValidationError();
      return;
    }
  }

  submitting.value = true;

  try {
    await api.post('/auth/reset-password', {
      password: form.password,
      token: token.value,
    });

    resetForm();
    submissionStatus.value = 'success';
    helperMessage.value = null;
    addAuthPopup('success');
    triggerHappyEyes();
  } catch {
    handleSubmissionError();
  } finally {
    submitting.value = false;
  }
};

watch(
  () => $q.screen.lt.md,
  () => {
    serverNodes.value = createBaseNodes();
  },
);

watch(
  serverNodes,
  (nodes) => {
    if (isGlobalHappy.value) {
      const state: Record<string, boolean> = {};
      nodes.forEach((node) => {
        state[node.id] = true;
      });
      happyNodes.value = state;
    }
  },
  { deep: true },
);

watch(
  () => stageRef.value,
  () => {
    void nextTick(() => {
      updateStageMetrics();
      handleMouseLeave();
    });
  },
);

watch(
  () => route.query.token,
  () => {
    submissionStatus.value = 'idle';
    helperMessage.value = null;
    resetForm();
  },
);

onMounted(() => {
  void nextTick(() => {
    updateStageMetrics();
    handleMouseLeave();
  });
  window.addEventListener('resize', updateStageMetrics);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateStageMetrics);
  if (shakeTimer) {
    window.clearTimeout(shakeTimer);
  }
  if (eyesTimer) {
    window.clearTimeout(eyesTimer);
  }
  if (happyTimer) {
    window.clearTimeout(happyTimer);
  }
});
</script>

<style scoped>
.reset-password-page {
  display: flex;
  align-items: stretch;
}

.reset-stage {
  position: relative;
  flex: 1;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 40px);
  transition: background-color 0.3s ease;
}

.reset-stage--light {
  background: radial-gradient(circle at 50% 20%, #f7f9ff, #dce6ff, #b8c6ff);
}

.reset-stage--dark {
  background: radial-gradient(circle at 50% 20%, #0b0f24, #131c3d, #1c274f);
}

.reset-node {
  position: absolute;
  width: 80px;
  height: 80px;
  margin: -40px 0 0 -40px;
  border-radius: 24px;
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(22, 31, 64, 0.65);
  color: #dde4ff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
  transition: transform 0.16s ease;
}

.reset-node--dynamic {
  border-radius: 22px;
}

.reset-stage--light .reset-node {
  background: rgba(255, 255, 255, 0.7);
  color: #1c2448;
  box-shadow: 0 12px 28px rgba(87, 116, 179, 0.28);
}

.reset-node--shake {
  animation: reset-node-shake 0.85s ease;
}

.reset-node__eyes {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translate(-50%, -2px);
  display: flex;
  gap: 10px;
}

.reset-eye {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.reset-stage--dark .reset-eye {
  background: rgba(240, 246, 255, 0.92);
  border-color: rgba(226, 232, 240, 0.85);
}

.reset-eye__pupil {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0f172a;
  transition: transform 0.12s ease;
}

.reset-stage--dark .reset-eye__pupil {
  background: rgba(13, 17, 38, 0.95);
}

.reset-node__eyes--closed .reset-eye__pupil {
  opacity: 0;
}

.reset-node__eyes--closed .reset-eye::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  top: 50%;
  height: 2px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.85);
}

.reset-stage--dark .reset-node__eyes--closed .reset-eye::after {
  background: rgba(15, 23, 42, 0.92);
}

.reset-node__eyes--happy .reset-eye {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(15, 23, 42, 0.6);
}

.reset-node__eyes--happy .reset-eye__pupil {
  width: 10px;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  font-size: 10px;
  font-weight: 700;
  border-radius: 50%;
}

.reset-node__eyes--happy .reset-eye__pupil::before {
  content: '^';
  transform: translateY(-1px);
}

.reset-stage--dark .reset-node__eyes--happy .reset-eye {
  background: rgba(240, 246, 255, 0.96);
  border-color: rgba(148, 163, 184, 0.55);
}

.reset-stage--dark .reset-node__eyes--happy .reset-eye__pupil {
  background: rgba(13, 17, 38, 0.95);
  color: #e2e8f0;
}

.reset-popups {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}

.reset-popup {
  position: absolute;
  transform: translate(-50%, -110%);
  animation: reset-popup-pop 1.25s ease forwards;
}

.reset-popup__content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 999px;
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(8px);
  color: #052e16;
}

.reset-popup--success .reset-popup__content {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.94), rgba(16, 185, 129, 0.9));
}

.reset-popup--error .reset-popup__content {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.94), rgba(239, 68, 68, 0.9));
  color: #7f1d1d;
}

.reset-popup :deep(.q-icon) {
  color: currentColor;
}

.reset-card {
  position: relative;
  z-index: 5;
  min-width: min(440px, 90%);
  padding: clamp(24px, 4vw, 36px);
  border-radius: 26px;
  backdrop-filter: blur(14px);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 22px 48px rgba(10, 16, 38, 0.25);
}

.reset-stage--dark .reset-card {
  background: rgba(13, 18, 38, 0.88);
  color: #f1f5ff;
  box-shadow: 0 22px 48px rgba(5, 9, 21, 0.55);
}

.reset-card__content {
  width: 100%;
}

.reset-card__title {
  font-weight: 600;
}

.reset-card__message {
  margin: 0;
  line-height: 1.5;
}

.reset-card__back-btn {
  width: 100%;
  margin-top: 6px;
  font-weight: 600;
}

.reset-card__back-btn :deep(.q-btn__content) {
  gap: 6px;
}

.reset-card__banner {
  border-radius: 16px;
  padding: 10px 14px;
}

.reset-card__banner--error {
  background: rgba(248, 113, 113, 0.16);
  color: #991b1b;
}

.reset-stage--dark .reset-card__banner--error {
  background: rgba(248, 113, 113, 0.12);
  color: #fecaca;
}

.reset-popup-enter-active,
.reset-popup-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.reset-popup-enter-from,
.reset-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -130%);
}

.reset-popup-leave-active {
  display: none;
}

@keyframes reset-popup-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -130%) scale(0.85);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -110%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -135%) scale(1.05);
  }
}

@keyframes reset-node-shake {
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

@media (max-width: 600px) {
  .reset-card {
    min-width: 100%;
  }
}
</style>
