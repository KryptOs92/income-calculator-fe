<template>
  <q-page class="verify-page q-pa-none">
    <div
      ref="stageRef"
      :class="['verify-stage', themeClass]"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <div
        v-for="node in serverNodes"
        :key="node.id"
        :class="[
          'verify-node',
          { 'verify-node--dynamic': node.kind === 'dynamic' },
          (globalShake || hoveredNode === node.id || shakingNodes[node.id]) ? 'verify-node--shake' : null
        ]"
        :style="{
          top: `${node.position.y}%`,
          left: `${node.position.x}%`
        }"
        @mouseenter="handleNodeMouseEnter(node.id)"
        @mouseleave="handleNodeMouseLeave(node.id)"
      >
        <div
          class="verify-node__eyes"
          :class="{
            'verify-node__eyes--closed': eyesClosed,
            'verify-node__eyes--happy': happyNodes[node.id]
          }"
        >
          <div class="verify-eye">
            <div class="verify-eye__pupil" :style="getPupilStyle(node)"></div>
          </div>
          <div class="verify-eye">
            <div class="verify-eye__pupil" :style="getPupilStyle(node)"></div>
          </div>
        </div>
        <q-icon name="dns" size="38px" />
      </div>

      <div class="verify-popups">
        <transition-group name="verify-popup" tag="div">
          <div
            v-for="popup in authPopups"
            :key="popup.id"
            class="verify-popup"
            :class="`verify-popup--${popup.type}`"
            :style="{
              top: `${popup.position.y}%`,
              left: `${popup.position.x}%`
            }"
          >
            <div class="verify-popup__content">
              <q-icon
                :name="popup.type === 'success' ? 'thumb_up_alt' : 'thumb_down_alt'"
                size="22px"
              />
            </div>
          </div>
        </transition-group>
      </div>

      <div class="verify-panel column items-center q-gutter-md">
        <q-spinner v-if="status === 'loading'" color="primary" size="42px" />
        <q-icon
          v-else-if="status === 'success'"
          name="verified"
          size="48px"
          color="positive"
        />
        <q-icon
          v-else-if="status === 'error'"
          name="error_outline"
          size="48px"
          color="negative"
        />

        <div class="verify-panel__title text-h5 text-center">
          {{ statusTexts[status].title }}
        </div>
        <p class="verify-panel__message text-body1 text-center">
          {{ statusTexts[status].message }}
        </p>

        <q-btn
          v-if="status === 'error'"
          color="primary"
          unelevated
          :label="t('verifyPage.backToSignIn')"
          :to="{ name: 'sign-in' }"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { api } from 'boot/axios';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
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

type VerifyStatus = 'loading' | 'success' | 'error';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();

const stageRef = ref<HTMLElement | null>(null);

const SERVER_COUNT = 8;
const SERVER_IDS = Array.from({ length: SERVER_COUNT }, (_, index) => `verify-node-${index + 1}`);
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
const authPopups = ref<AuthPopup[]>([]);
const globalShake = ref(false);

const stageSize = reactive({
  width: 1,
  height: 1,
});

const cursor = reactive({
  x: 0,
  y: 0,
});

const status = ref<VerifyStatus>('loading');

let shakeTimer: number | undefined;
let eyesTimer: number | undefined;
let happyTimer: number | undefined;

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

  const state: Record<string, boolean> = {};
  serverNodes.value.forEach((node) => {
    state[node.id] = true;
  });
  happyNodes.value = state;

  happyTimer = window.setTimeout(() => {
    happyNodes.value = {};
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
  happyNodes.value = {};

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

  if (!happyNodes.value[nodeId]) {
    setHappyNode(nodeId, false);
  }

  const next = { ...shakingNodes.value };
  delete next[nodeId];
  shakingNodes.value = next;
};

const themeClass = computed(() => ($q.dark.isActive ? 'verify-stage--dark' : 'verify-stage--light'));

const statusTexts = computed<Record<VerifyStatus, { title: string; message: string }>>(() => ({
  loading: {
    title: t('verifyPage.loadingTitle'),
    message: t('verifyPage.loadingMessage'),
  },
  success: {
    title: t('verifyPage.successTitle'),
    message: t('verifyPage.successMessage'),
  },
  error: {
    title: t('verifyPage.errorTitle'),
    message: t('verifyPage.errorMessage'),
  },
}));

const verifyToken = async () => {
  status.value = 'loading';
  const token = route.query.token;

  if (typeof token !== 'string' || !token) {
    status.value = 'error';
    addAuthPopup('error');
    triggerEyesClosure();
    triggerNodeShake();
    return;
  }

  try {
    await api.get('/auth/verify-email', {
      params: {
        token,
      },
    });

    status.value = 'success';
    addAuthPopup('success');
    triggerHappyEyes();
  } catch {
    status.value = 'error';
    addAuthPopup('error');
    triggerEyesClosure();
    triggerNodeShake();
  }
};

watch(
  () => $q.screen.lt.md,
  () => {
    serverNodes.value = createBaseNodes();
  },
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
    void verifyToken();
  },
);

onMounted(() => {
  void nextTick(() => {
    updateStageMetrics();
    handleMouseLeave();
  });
  window.addEventListener('resize', updateStageMetrics);
  void verifyToken();
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
.verify-page {
  display: flex;
  align-items: stretch;
}

.verify-stage {
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

.verify-stage--light {
  background: radial-gradient(circle at 50% 20%, #f7f9ff, #dce6ff, #b8c6ff);
}

.verify-stage--dark {
  background: radial-gradient(circle at 50% 20%, #0b0f24, #131c3d, #1c274f);
}

.verify-node {
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

.verify-node--dynamic {
  border-radius: 22px;
}

.verify-stage--light .verify-node {
  background: rgba(255, 255, 255, 0.7);
  color: #1c2448;
  box-shadow: 0 12px 28px rgba(30, 44, 92, 0.2);
}

.verify-node--shake {
  animation: verify-node-shake 0.75s ease;
}

.verify-node__eyes {
  position: absolute;
  top: -6px;
  display: flex;
  gap: 10px;
  transform: translateY(-2px);
}

.verify-eye {
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

.verify-stage--dark .verify-eye {
  background: rgba(240, 246, 255, 0.92);
  border-color: rgba(226, 232, 240, 0.85);
}

.verify-eye__pupil {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0f172a;
  transition: transform 0.12s ease;
}

.verify-node__eyes--closed .verify-eye__pupil {
  opacity: 0;
}

.verify-node__eyes--closed .verify-eye::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  top: 50%;
  height: 2px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.85);
}

.verify-stage--dark .verify-node__eyes--closed .verify-eye::after {
  background: rgba(15, 23, 42, 0.92);
}

.verify-node__eyes--happy .verify-eye {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(15, 23, 42, 0.6);
}

.verify-node__eyes--happy .verify-eye__pupil {
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

.verify-node__eyes--happy .verify-eye__pupil::before {
  content: '^';
  transform: translateY(-1px);
}

.verify-stage--dark .verify-node__eyes--happy .verify-eye {
  background: rgba(240, 246, 255, 0.96);
  border-color: rgba(148, 163, 184, 0.55);
}

.verify-stage--dark .verify-node__eyes--happy .verify-eye__pupil {
  background: rgba(13, 17, 38, 0.95);
  color: #e2e8f0;
}

.verify-popups {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}

.verify-popup {
  position: absolute;
  transform: translate(-50%, -110%);
  animation: verify-popup-pop 1.25s ease forwards;
}

.verify-popup__content {
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

.verify-popup--success .verify-popup__content {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.94), rgba(16, 185, 129, 0.9));
}

.verify-popup--error .verify-popup__content {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.94), rgba(239, 68, 68, 0.9));
  color: #7f1d1d;
}

.verify-popup :deep(.q-icon) {
  color: currentColor;
}

.verify-panel {
  position: relative;
  z-index: 5;
  min-width: min(440px, 90%);
  padding: clamp(24px, 4vw, 36px);
  border-radius: 26px;
  backdrop-filter: blur(14px);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 22px 48px rgba(10, 16, 38, 0.25);
}

.verify-stage--dark .verify-panel {
  background: rgba(13, 18, 38, 0.88);
  color: #f1f5ff;
  box-shadow: 0 22px 48px rgba(5, 9, 21, 0.55);
}

.verify-panel__message {
  margin: 0;
  line-height: 1.5;
}

.verify-popup-enter-active,
.verify-popup-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.verify-popup-enter-from,
.verify-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -130%);
}

.verify-popup-leave-active {
  display: none;
}

@keyframes verify-popup-pop {
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

@keyframes verify-node-shake {
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
  .verify-panel {
    min-width: 100%;
  }
}
</style>
