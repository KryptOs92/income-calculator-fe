<template>
  <q-page class="sign-in-page q-pa-none">
    <div
      ref="stageRef"
      :class="['sign-stage', themeClass]"
      @click="handleStageClick"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <div
        v-for="node in serverNodes"
        :key="node.id"
        :class="[
          'signin-node',
          { 'signin-node--dynamic': node.kind === 'dynamic' },
          (isShaking || hoveredNode === node.id) ? 'signin-node--shake' : null
        ]"
        :style="{
          top: `${node.position.y}%`,
          left: `${node.position.x}%`
        }"
        @mouseenter="handleNodeMouseEnter(node.id)"
        @mouseleave="handleNodeMouseLeave(node.id)"
      >
        <div
          class="node-eyes"
          :class="{
            'node-eyes--closed': eyesClosed,
            'node-eyes--happy': happyNodes[node.id]
          }"
        >
          <div class="node-eye">
            <div class="node-eye__pupil" :style="getPupilStyle(node)"></div>
          </div>
          <div class="node-eye">
            <div class="node-eye__pupil" :style="getPupilStyle(node)"></div>
          </div>
        </div>
        <q-icon name="dns" size="38px" />
      </div>

      <div class="sign-stage__popups">
        <transition-group name="sign-popup" tag="div">
          <div
            v-for="popup in authPopups"
            :key="popup.id"
            class="sign-popup"
            :class="`sign-popup--${popup.type}`"
            :style="{
              top: `${popup.position.y}%`,
              left: `${popup.position.x}%`
            }"
          >
            <div class="sign-popup__content">
              <q-icon
                :name="popup.type === 'success' ? 'thumb_up_alt' : 'thumb_down_alt'"
                size="22px"
              />
            </div>
          </div>
        </transition-group>
      </div>

      <q-card ref="hubRef" class="sign-card">
        <div
          class="sign-card__inner"
          :class="{ 'sign-card__inner--flipped': isRegistering }"
        >
          <div class="sign-card__face sign-card__face--front column items-center justify-center q-pa-lg">
            <AuthenticateUser
              @login-success="handleLoginSuccess"
              @login-failed="handleLoginFailed"
              @register-request="handleRegisterRequest"
            />
          </div>
          <div class="sign-card__face sign-card__face--back column items-center justify-center q-pa-lg">
            <RegisterUser
              @close="handleRegisterClose"
              @success="handleRegisterSuccess"
              @failure="handleRegisterFailure"
            />
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AuthenticateUser from 'src/components/AuthenticateUser.vue';
import RegisterUser from 'src/components/RegisterUser.vue';

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
const $q = useQuasar();

const stageRef = ref<HTMLElement | null>(null);
const hubRef = ref<HTMLElement | null>(null);

const SERVER_COUNT = 8;
const SERVER_IDS = Array.from({ length: SERVER_COUNT }, (_, index) => `signin-node-${index + 1}`);
const OCTAGON_RADIUS = 32;
const MAX_TOTAL_NODES = 20;

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
const eyesClosed = ref(false);
const happyNodes = ref<Record<string, boolean>>({});
const isShaking = ref(false);
const isRegistering = ref(false);
const authPopups = ref<AuthPopup[]>([]);
const hoveredNode = ref<string | null>(null);
const isGlobalHappy = ref(false);

const cursor = reactive({
  x: 0,
  y: 0,
});

const stageSize = reactive({
  width: 1,
  height: 1,
});

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

const clearHappyNodes = () => {
  happyNodes.value = {};
};

const triggerHappyEyes = (duration = 1600) => {
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

const triggerNodeShake = () => {
  if (shakeTimer) {
    window.clearTimeout(shakeTimer);
  }

  isShaking.value = false;

  void nextTick(() => {
    isShaking.value = true;
    shakeTimer = window.setTimeout(() => {
      isShaking.value = false;
      shakeTimer = undefined;
    }, 1100);
  });
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
  }, 1500);
};

const updateBaseNodePositions = () => {
  const positions = getBasePositions();
  serverNodes.value = serverNodes.value.map((node) => {
    if (node.kind !== 'base') {
      return node;
    }
    const baseIndex = SERVER_IDS.indexOf(node.id);
    const basePosition = positions[baseIndex] ?? { x: 50, y: 50 };
    return {
      ...node,
      position: { ...basePosition },
    };
  });
};

watch(
  () => $q.screen.lt.md,
  () => {
    updateBaseNodePositions();
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
  const ratio = distance === 0 ? 0 : Math.min(distance / 80, 1);

  const offsetX = Math.cos(Math.atan2(dy, dx)) * maxOffset * ratio;
  const offsetY = Math.sin(Math.atan2(dy, dx)) * maxOffset * ratio;

  return {
    transform: `translate(${offsetX}px, ${offsetY}px)`
  };
};

const addServerNodeAt = (position: { x: number; y: number }) => {
  if (serverNodes.value.length >= MAX_TOTAL_NODES) {
    return;
  }

  const id = `signin-node-dyn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  serverNodes.value = [
    ...serverNodes.value,
    {
      id,
      position: {
        x: clamp(position.x, 5, 95),
        y: clamp(position.y, 8, 92),
      },
      kind: 'dynamic',
    },
  ];

  if (isGlobalHappy.value) {
    setHappyNode(id, true);
  }
};

const handleStageClick = (event: MouseEvent) => {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  const stageEl = stageRef.value;
  if (!stageEl) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target && (target.closest('.sign-card') || target.closest('.signin-node'))) {
    return;
  }

  const rect = stageEl.getBoundingClientRect();
  const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
  const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

  if (!Number.isFinite(xPercent) || !Number.isFinite(yPercent)) {
    return;
  }

  addServerNodeAt({
    x: xPercent,
    y: yPercent,
  });
};

const handleLoginFailed = () => {
  if (isRegistering.value) {
    return;
  }

  addAuthPopup('error');
  triggerEyesClosure();
  triggerNodeShake();
};

const handleLoginSuccess = () => {
  eyesClosed.value = false;
  if (shakeTimer) {
    window.clearTimeout(shakeTimer);
    shakeTimer = undefined;
  }
  isShaking.value = false;
  addAuthPopup('success');
  triggerHappyEyes();
};

const handleRegisterRequest = () => {
  isRegistering.value = true;
  eyesClosed.value = false;
  if (shakeTimer) {
    window.clearTimeout(shakeTimer);
    shakeTimer = undefined;
  }
  isShaking.value = false;
};

const handleRegisterClose = () => {
  isRegistering.value = false;
};

const handleRegisterSuccess = () => {
  eyesClosed.value = false;
  isShaking.value = false;
  addAuthPopup('success');
  triggerHappyEyes();
};

const handleRegisterFailure = () => {
  addAuthPopup('error');
  triggerEyesClosure();
  triggerNodeShake();
};

const handleNodeMouseEnter = (nodeId: string) => {
  hoveredNode.value = nodeId;
  setHappyNode(nodeId, true);
};

const handleNodeMouseLeave = (nodeId: string) => {
  if (hoveredNode.value === nodeId) {
    hoveredNode.value = null;
  }

  if (!isGlobalHappy.value) {
    setHappyNode(nodeId, false);
  }
};
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

watch(
  () => stageRef.value,
  () => {
    void nextTick(() => {
      updateStageMetrics();
      handleMouseLeave();
    });
  },
);

const themeClass = computed(() => ( $q.dark.isActive ? 'sign-stage--dark' : 'sign-stage--light'));
</script>

<style scoped>
.sign-in-page {
  display: flex;
  align-items: stretch;
}

.sign-stage {
  position: relative;
  flex: 1;

  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 40px);
  transition: background-color 0.3s ease;
}

.sign-stage__popups {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.sign-popup {
  position: absolute;
  transform: translate(-50%, -110%);
  animation: sign-popup-pop 1.25s ease forwards;
}

.sign-popup__content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 999px;
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(8px);
}

.sign-popup--success .sign-popup__content {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.94), rgba(16, 185, 129, 0.9));
  color: #052e16;
}

.sign-popup--error .sign-popup__content {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.94), rgba(239, 68, 68, 0.9));
  color: #7f1d1d;
}

.sign-popup :deep(.q-icon) {
  color: currentColor;
}

.sign-popup-enter-active,
.sign-popup-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.sign-popup-enter-from,
.sign-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -130%);
}

.sign-popup-leave-active {
  display: none;
}

.sign-stage--dark .sign-popup--success .sign-popup__content {
  color: #d1fae5;
}

.sign-stage--dark .sign-popup--error .sign-popup__content {
  color: #fee2e2;
}

@keyframes sign-popup-pop {
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

.sign-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sign-stage--light {
  background: radial-gradient(circle at 50% 20%, #f7f9ff, #dce6ff, #b8c6ff);
}

.sign-stage--dark {
  background: radial-gradient(circle at 50% 20%, #0b0f24, #131c3d, #1c274f);
}

.signin-node {
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
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.sign-stage--light .signin-node {
  background: rgba(255, 255, 255, 0.7);
  color: #1c2448;
  box-shadow: 0 12px 28px rgba(30, 44, 92, 0.2);
}

.sign-stage--dark .signin-node {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.signin-node--dynamic {
  border-radius: 22px;
}

.node-eyes {
  position: absolute;
  top: -4px;
  display: flex;
  gap: 10px;
  transform: translateY(-2px);
}

.node-eye {
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

.sign-stage--dark .node-eye {
  background: rgba(240, 246, 255, 0.92);
  border-color: rgba(226, 232, 240, 0.85);
}

.node-eye__pupil {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0f172a;
  transition: transform 0.12s ease;
}

.node-eyes--closed .node-eye__pupil {
  opacity: 0;
}

.node-eyes--closed .node-eye::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  top: 50%;
  height: 2px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.85);
}

.sign-stage--dark .node-eyes--closed .node-eye::after {
  background: rgba(15, 23, 42, 0.92);
}

.node-eyes--happy .node-eye {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(15, 23, 42, 0.6);
}

.node-eyes--happy .node-eye__pupil {
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

.node-eyes--happy .node-eye__pupil::before {
  content: '^';
  transform: translateY(-1px);
}

.sign-stage--dark .node-eyes--happy .node-eye {
  background: rgba(240, 246, 255, 0.96);
  border-color: rgba(148, 163, 184, 0.55);
}

.sign-stage--dark .node-eyes--happy .node-eye__pupil {
  background: rgba(13, 17, 38, 0.95);
  color: #e2e8f0;
}

.sign-card {
  position: relative;
  width: min(420px, 90%);
  border-radius: 26px;
  background: transparent;
  box-shadow: none;
  perspective: 1600px;
  z-index: 2;
}

.sign-card__inner {
  position: relative;
  width: 100%;
  min-height: 420px;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.sign-card__inner--flipped {
  transform: rotateY(180deg);
}

.sign-card__face {
  position: absolute;
  inset: 0;
  border-radius: 26px;
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 45px rgba(22, 31, 64, 0.25);
  background: rgba(255, 255, 255, 0.82);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  pointer-events: none;
}

.sign-card__face--back {
  transform: rotateY(180deg);
}

.sign-card__inner:not(.sign-card__inner--flipped) .sign-card__face--front,
.sign-card__inner--flipped .sign-card__face--back {
  pointer-events: auto;
}

.sign-stage--dark .sign-card__face {
  background: rgba(13, 18, 38, 0.85);
  color: #f1f5ff;
  box-shadow: 0 18px 45px rgba(5, 9, 21, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.signin-node--shake {
  animation: signin-node-shake 0.75s ease;
}

.signin-node--shake.signin-node--dynamic {
  animation-duration: 0.85s;
}

@keyframes signin-node-shake {
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
  .sign-stage {
    padding: 16px 12px 24px;
  }

  .sign-card {
    width: 100%;
  }
}
</style>
