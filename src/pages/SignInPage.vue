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
          isShaking ? 'signin-node--shake' : null
        ]"
        :style="{
          top: `${node.position.y}%`,
          left: `${node.position.x}%`
        }"
      >
        <div class="node-eyes" :class="{ 'node-eyes--closed': eyesClosed }">
          <div class="node-eye">
            <div class="node-eye__pupil" :style="getPupilStyle(node)"></div>
          </div>
          <div class="node-eye">
            <div class="node-eye__pupil" :style="getPupilStyle(node)"></div>
          </div>
        </div>
        <q-icon name="dns" size="38px" />
      </div>

      <q-card ref="hubRef" class="sign-card column items-center justify-center q-pa-lg">
        <AuthenticateUser @login-success="handleLoginSuccess" @login-failed="handleLoginFailed" />
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AuthenticateUser from 'src/components/AuthenticateUser.vue';

type ServerNode = {
  id: string;
  position: {
    x: number;
    y: number;
  };
  kind: 'base' | 'dynamic';
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
const isShaking = ref(false);

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
  eyesClosed.value = true;

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

  window.setTimeout(() => {
    eyesClosed.value = false;
  }, 1200);
};

const handleLoginSuccess = () => {
  eyesClosed.value = false;
  if (shakeTimer) {
    window.clearTimeout(shakeTimer);
    shakeTimer = undefined;
  }
  isShaking.value = false;
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
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 40px);
  transition: background-color 0.3s ease;
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

.sign-card {
  position: relative;
  width: min(420px, 90%);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 45px rgba(22, 31, 64, 0.25);
  z-index: 2;
}

.sign-stage--dark .sign-card {
  background: rgba(13, 18, 38, 0.85);
  color: #f1f5ff;
  box-shadow: 0 18px 45px rgba(5, 9, 21, 0.55);
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
