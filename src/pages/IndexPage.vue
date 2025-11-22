<template>
  <q-page class="index-page q-pa-none">
    <div
      ref="stageRef"
      @click="handleStageClick"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      :class="[
        'network-stage',
        isDark ? 'network-stage--dark' : 'network-stage--light'
      ]"
    >
      <div class="network-stage__ack-popups">
        <transition-group name="ack" tag="div">
          <div
            v-for="ack in ackPopups"
            :key="ack.id"
            class="ack-popup"
            :style="{
              '--ack-x': `${ack.position.x}%`,
              '--ack-y': `${ack.position.y}%`
            }"
          >
            <div class="ack-popup__content">
              <span class="ack-popup__label">+</span>
              <span class="ack-popup__icon">
                <q-icon name="thumb_up_alt" size="16px" />
              </span>
            </div>
          </div>
        </transition-group>
      </div>

      <div class="network-stage__rewards">
        <transition-group name="reward" tag="div">
          <div
            v-for="reward in rewardPopups"
            :key="reward.id"
            class="reward-popup"
            :style="{
              '--reward-x': `${reward.position.x}%`,
              '--reward-y': `${reward.position.y}%`
            }"
          >
            <div class="reward-popup__content">
              <span class="reward-popup__label">+</span>
              <span class="reward-popup__icon">
                <q-icon name="sentiment_satisfied_alt" size="18px" />
              </span>
            </div>
          </div>
        </transition-group>
      </div>

      <div class="network-stage__spawns">
        <transition-group name="spawn" tag="div">
          <div
            v-for="spawn in spawnPopups"
            :key="spawn.id"
            :class="['spawn-pulse', spawn.success ? 'spawn-pulse--success' : 'spawn-pulse--fail']"
            :style="{
              '--spawn-x': `${spawn.position.x}%`,
              '--spawn-y': `${spawn.position.y}%`
            }"
          />
        </transition-group>
      </div>

      <div
        v-for="server in serverNodes"
        :key="server.id"
        class="server-node"
        :class="{
          'server-node--alert': activeAlert === server.id,
          'server-node--ack': highlightedServers[server.id],
          'server-node--spawn': spawnHighlights[server.id],
          'server-node--shake': shakingServers[server.id]
        }"
        :style="{
          top: `${server.position.y}%`,
          left: `${server.position.x}%`
        }"
        @mouseenter="handleServerMouseEnter(server.id)"
        @mouseleave="handleServerMouseLeave(server.id)"
      >
        <div
          class="server-node__eyes"
          :class="{ 'server-node__eyes--happy': happyServers[server.id] }"
        >
          <div class="server-eye">
            <div class="server-eye__pupil" :style="getPupilStyle(server)"></div>
          </div>
          <div class="server-eye">
            <div class="server-eye__pupil" :style="getPupilStyle(server)"></div>
          </div>
        </div>
        <q-icon name="dns" size="36px" />
        <transition name="alert-pop">
          <q-icon
            v-if="activeAlert === server.id"
            name="priority_high"
            class="server-node__alert"
          />
        </transition>
        <div class="server-node__consumption">
          {{ formatConsumption(serverConsumptions[server.id]) }} kW/h
        </div>
      </div>

      <q-card ref="hubRef" class="network-hub column items-center justify-center q-pa-lg">
        <transition-group name="block-chain" tag="div" class="block-chain q-mb-lg">
          <div
            v-for="block in blocks"
            :key="block.id"
            class="block-chain__block"
            :class="{ 'block-chain__block--new': block.id === latestBlockId }"
          >
            <div class="block-chain__hash">{{ block.hash }}</div>
            <div class="block-chain__index">#{{ block.index }}</div>
          </div>
        </transition-group>
        <q-btn
          color="secondary"
          class="network-hub__info-button q-mt-sm"
          :class="{ 'network-hub__info-button--highlight': buttonHighlighted }"
          outline
          size="md"
          :label="t('indexPage.aboutButton')"
          @click="openAboutDialog"
        />
      </q-card>

      <q-dialog v-model="aboutDialogOpen" transition-show="scale" transition-hide="scale">
        <q-card
          class="about-modal column no-wrap"
          :class="isDark ? 'about-modal--dark' : 'about-modal--light'"
        >
          <div class="about-modal__header row items-center q-mb-md">
            <div class="about-modal__badge row items-center justify-center q-mr-sm">
              <q-icon name="psychology" size="28px" />
            </div>
            <div class="about-modal__title text-h6">
              {{ t('indexPage.aboutTitle') }}
            </div>
            <q-space />
            <q-btn icon="close" flat round dense @click="aboutDialogOpen = false" />
          </div>

          <div class="about-modal__body column q-gutter-lg">
            <div class="about-steps column items-stretch q-gutter-lg">
              <template v-for="(step, index) in aboutSlides" :key="step.id">
                <div class="about-step row no-wrap items-start q-gutter-md">
                  <div class="about-step__icon row items-center justify-center">
                    <q-icon :name="step.icon" size="32px" />
                  </div>
                  <div class="about-step__content column q-gutter-xs">
                    <div class="text-subtitle1 about-step__title">
                      {{ step.title }}
                    </div>
                    <p class="text-body2 about-step__text">
                      {{ step.description }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="index < aboutSlides.length - 1"
                  class="about-step__connector row items-center justify-center"
                >
                  <div class="about-step__line" />
                  <q-icon name="arrow_downward" size="20px" class="about-step__arrow" />
                  <div class="about-step__line" />
                </div>
              </template>
            </div>

            <div class="about-modal__summary">
              <div class="text-subtitle1 q-mb-xs">
                {{ t('indexPage.aboutSummaryTitle') }}
              </div>
              <p class="text-body2">
                {{ t('indexPage.aboutSummaryBody') }}
              </p>
            </div>
          </div>

          <div class="about-modal__actions q-mt-md">
            <q-btn
              color="primary"
              class="full-width"
              unelevated
              :label="t('indexPage.cta')"
              :to="{ name: 'overview' }"
              @click="aboutDialogOpen = false"
            />
          </div>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

type ServerNode = {
  id: string;
  position: {
    x: number;
    y: number;
  };
  kind: 'base' | 'dynamic';
};

type Block = {
  id: number;
  index: number;
  hash: string;
};

type Popup = {
  id: number;
  position: {
    x: number;
    y: number;
  };
};

type SpawnFeedback = Popup & {
  success: boolean;
};

type AboutSlide = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

const $q = useQuasar();
const { t } = useI18n();

const isDark = computed(() => $q.dark.isActive);

const SERVER_COUNT = 8;
const SERVER_IDS = Array.from({ length: SERVER_COUNT }, (_, index) => `node-${index + 1}`);
const OCTAGON_RADIUS = 32;

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

const stageRef = ref<HTMLElement | null>(null);
const hubRef = ref<HTMLElement | null>(null);
const serverNodes = ref<ServerNode[]>(createBaseNodes());
const hoveredServerId = ref<string | null>(null);
const happyServers = ref<Record<string, boolean>>({});
const shakingServers = ref<Record<string, boolean>>({});
const stageSize = reactive({ width: 1, height: 1 });
const cursor = reactive({ x: 0, y: 0 });
const pendingCursor = { x: 0, y: 0 };
let cursorRafId: number | null = null;
const shakeTimeouts = new Map<string, number>();
const happyTimeouts = new Map<string, number>();

const activeAlert = ref<string | null>(null);
const buttonHighlighted = ref(false);
const blocks = ref<Block[]>([]);
const latestBlockId = ref<number | null>(null);
const serverConsumptions = ref<Record<string, number>>({});
const rewardPopups = ref<Popup[]>([]);
const ackPopups = ref<Popup[]>([]);
const spawnPopups = ref<SpawnFeedback[]>([]);
const highlightedServers = ref<Record<string, boolean>>({});
const spawnHighlights = ref<Record<string, boolean>>({});
const aboutDialogOpen = ref(false);

let alertTimer: number | undefined;
let blockIndex = 0;
let isAnimating = false;

const wait = (delay: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), delay);
  });

const shuffle = <T>(items: readonly T[]) => {
  const array = items.slice();
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const aboutSlides = computed<AboutSlide[]>(() => [
  {
    id: 'validators',
    icon: 'dns',
    title: t('indexPage.aboutSlides.validators.title'),
    description: t('indexPage.aboutSlides.validators.description'),
  },
  {
    id: 'energy',
    icon: 'bolt',
    title: t('indexPage.aboutSlides.energy.title'),
    description: t('indexPage.aboutSlides.energy.description'),
  },
  {
    id: 'rewards',
    icon: 'currency_exchange',
    title: t('indexPage.aboutSlides.rewards.title'),
    description: t('indexPage.aboutSlides.rewards.description'),
  },
  {
    id: 'insights',
    icon: 'insights',
    title: t('indexPage.aboutSlides.insights.title'),
    description: t('indexPage.aboutSlides.insights.description'),
  },
]);

const setServerHappy = (serverId: string, value: boolean) => {
  if (value) {
    happyServers.value = {
      ...happyServers.value,
      [serverId]: true,
    };
    return;
  }

  if (happyServers.value[serverId]) {
    const next = { ...happyServers.value };
    delete next[serverId];
    happyServers.value = next;
  }
};

const setServerShake = (serverId: string, value: boolean) => {
  if (value) {
    shakingServers.value = {
      ...shakingServers.value,
      [serverId]: true,
    };
    return;
  }

  if (shakingServers.value[serverId]) {
    const next = { ...shakingServers.value };
    delete next[serverId];
    shakingServers.value = next;
  }
};

const clearHappyTimeout = (serverId: string) => {
  const timeout = happyTimeouts.get(serverId);
  if (timeout !== undefined) {
    window.clearTimeout(timeout);
    happyTimeouts.delete(serverId);
  }
};

const clearShakeTimeout = (serverId: string) => {
  const timeout = shakeTimeouts.get(serverId);
  if (timeout !== undefined) {
    window.clearTimeout(timeout);
    shakeTimeouts.delete(serverId);
  }
};

const triggerServerHappy = (serverId: string, duration = 1400) => {
  setServerHappy(serverId, true);
  clearHappyTimeout(serverId);
  const timeoutId = window.setTimeout(() => {
    if (hoveredServerId.value !== serverId) {
      setServerHappy(serverId, false);
    }
    happyTimeouts.delete(serverId);
  }, duration);
  happyTimeouts.set(serverId, timeoutId);
};

const triggerServerShake = (serverId: string, duration = 1000) => {
  setServerShake(serverId, true);
  clearShakeTimeout(serverId);
  const timeoutId = window.setTimeout(() => {
    if (hoveredServerId.value !== serverId) {
      setServerShake(serverId, false);
    }
    shakeTimeouts.delete(serverId);
  }, duration);
  shakeTimeouts.set(serverId, timeoutId);
};

const handleServerMouseEnter = (serverId: string) => {
  hoveredServerId.value = serverId;
  clearHappyTimeout(serverId);
  clearShakeTimeout(serverId);
  setServerHappy(serverId, true);
  setServerShake(serverId, true);
};

const handleServerMouseLeave = (serverId: string) => {
  if (hoveredServerId.value === serverId) {
    hoveredServerId.value = null;
  }

  if (!happyTimeouts.has(serverId)) {
    setServerHappy(serverId, false);
  }

  if (!shakeTimeouts.has(serverId)) {
    setServerShake(serverId, false);
  }
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

const commitCursorUpdate = () => {
  cursor.x = pendingCursor.x;
  cursor.y = pendingCursor.y;
};

const scheduleCursorUpdate = () => {
  if (cursorRafId !== null) {
    return;
  }
  cursorRafId = window.requestAnimationFrame(() => {
    cursorRafId = null;
    commitCursorUpdate();
  });
};

const handleMouseMove = (event: MouseEvent) => {
  const stageEl = stageRef.value;
  if (!stageEl) {
    return;
  }

  const rect = stageEl.getBoundingClientRect();
  pendingCursor.x = event.clientX - rect.left;
  pendingCursor.y = event.clientY - rect.top;
  scheduleCursorUpdate();
};

const handleMouseLeave = () => {
  pendingCursor.x = stageSize.width / 2;
  pendingCursor.y = stageSize.height / 2;
  scheduleCursorUpdate();
};

const getPupilStyle = (server: ServerNode) => {
  const stageEl = stageRef.value;
  if (!stageEl) {
    return {};
  }

  const nodeX = (server.position.x / 100) * stageSize.width;
  const nodeY = (server.position.y / 100) * stageSize.height;

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

const resetHighlights = () => {
  const initial: Record<string, boolean> = {};
  serverNodes.value.forEach((server) => {
    initial[server.id] = false;
  });
  highlightedServers.value = initial;
};

watch(
  serverNodes,
  () => {
    resetHighlights();
    const ids = new Set(serverNodes.value.map((node) => node.id));
    happyServers.value = Object.fromEntries(
      Object.entries(happyServers.value).filter(([id]) => ids.has(id))
    );
    shakingServers.value = Object.fromEntries(
      Object.entries(shakingServers.value).filter(([id]) => ids.has(id))
    );
    shakeTimeouts.forEach((timeoutId, id) => {
      if (!ids.has(id)) {
        window.clearTimeout(timeoutId);
        shakeTimeouts.delete(id);
      }
    });
    happyTimeouts.forEach((timeoutId, id) => {
      if (!ids.has(id)) {
        window.clearTimeout(timeoutId);
        happyTimeouts.delete(id);
      }
    });
  },
  { deep: true },
);

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
    resetHighlights();
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

const runAcknowledgements = async (source: ServerNode) => {
  const others = shuffle(serverNodes.value.filter((server) => server.id !== source.id));

  for (const node of others) {
    highlightedServers.value = {
      ...highlightedServers.value,
      [node.id]: true,
    };

    addAckPopup(node);

    window.setTimeout(() => {
      highlightedServers.value = {
        ...highlightedServers.value,
        [node.id]: false,
      };
    }, 900);

    const delay = 180 + Math.random() * 140;
    await wait(delay);
  }
};

const triggerAlert = async () => {
  if (isAnimating) {
    return;
  }

  const nodes = serverNodes.value;

  if (!nodes.length) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * nodes.length);
  const server = nodes[randomIndex];

  if (!server) {
    return;
  }

  isAnimating = true;
  activeAlert.value = server.id;
  updateConsumption(server.id);
  resetHighlights();

  await runAcknowledgements(server);

  buttonHighlighted.value = true;
  addBlock();

  await wait(550);
  addRewardPopup(server);

  await wait(900);
  buttonHighlighted.value = false;
  activeAlert.value = null;
  resetHighlights();
  isAnimating = false;
};

const MAX_BLOCKS = 6;
const MIN_CONSUMPTION = 45;
const MAX_CONSUMPTION = 180;

const generateHash = () => {
  const randomPart = Math.random().toString(16).slice(2, 8);
  const timestampPart = Date.now().toString(16).slice(-6);
  return `${timestampPart}${randomPart}`.toUpperCase();
};

const addBlock = () => {
  blockIndex += 1;
  const blockId = blockIndex;

  if (blocks.value.length >= MAX_BLOCKS) {
    blocks.value.shift();
  }

  blocks.value.push({
    id: blockId,
    index: blockIndex,
    hash: generateHash(),
  });

  latestBlockId.value = blockId;

  window.setTimeout(() => {
    if (latestBlockId.value === blockId) {
      latestBlockId.value = null;
    }
  }, 1200);
};

const addAckPopup = (server: ServerNode) => {
  const ackId = Date.now() + Math.random();

  ackPopups.value.push({
    id: ackId,
    position: {
      x: server.position.x,
      y: Math.max(6, server.position.y - 10),
    },
  });

  window.setTimeout(() => {
    ackPopups.value = ackPopups.value.filter((ack) => ack.id !== ackId);
  }, 1200);
};

const addRewardPopup = (server: ServerNode) => {
  const rewardId = Date.now() + Math.random();

  rewardPopups.value.push({
    id: rewardId,
    position: {
      x: server.position.x,
      y: Math.max(8, server.position.y - 10),
    },
  });

  triggerServerHappy(server.id, 1600);
  triggerServerShake(server.id, 1200);

  window.setTimeout(() => {
    rewardPopups.value = rewardPopups.value.filter((reward) => reward.id !== rewardId);
  }, 1600);
};

const generateConsumptionValue = () =>
  parseFloat(
    (MIN_CONSUMPTION + Math.random() * (MAX_CONSUMPTION - MIN_CONSUMPTION)).toFixed(1),
  );

const MAX_TOTAL_NODES = 20;
const addServerNodeAtPosition = (position: { x: number; y: number }) => {
  if (serverNodes.value.length >= MAX_TOTAL_NODES) {
    addSpawnFeedback(position, false);
    addHubPulse(false);
    return;
  }

  const id = `node-dyn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const clampedPosition = {
    x: clamp(position.x, 5, 95),
    y: clamp(position.y, 8, 92),
  };

  const newNode: ServerNode = {
    id,
    position: clampedPosition,
    kind: 'dynamic',
  };

  serverNodes.value = [...serverNodes.value, newNode];

  serverConsumptions.value = {
    ...serverConsumptions.value,
    [id]: generateConsumptionValue(),
  };

  highlightedServers.value = {
    ...highlightedServers.value,
    [id]: false,
  };

  addSpawnFeedback(clampedPosition, true);
  addHubPulse(true);
  triggerSpawnHighlight(id);
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
  const hubEl = target?.closest('.network-hub');

  if (hubEl) {
    addHubPulse(false);
    return;
  }

  if (target && target.closest('.server-node')) {
    return;
  }

  const rect = stageEl.getBoundingClientRect();
  const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
  const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

  if (!Number.isFinite(xPercent) || !Number.isFinite(yPercent)) {
    return;
  }

  addServerNodeAtPosition({
    x: xPercent,
    y: yPercent,
  });
};

const addSpawnFeedback = (position: { x: number; y: number }, success: boolean) => {
  const spawnId = Date.now() + Math.random();

  const clampedPosition = {
    x: clamp(position.x, 5, 95),
    y: clamp(position.y, 8, 92),
  };

  spawnPopups.value.push({
    id: spawnId,
    position: clampedPosition,
    success,
  });

  window.setTimeout(() => {
    spawnPopups.value = spawnPopups.value.filter((spawn) => spawn.id !== spawnId);
  }, success ? 1200 : 800);
};

const addHubPulse = (success: boolean) => {
  const stageEl = stageRef.value;
  const hubEl = hubRef.value;

  if (!stageEl || !hubEl) {
    return;
  }

  const stageRect = stageEl.getBoundingClientRect();
  const hubRect = hubEl.getBoundingClientRect();

  const xPercent = ((hubRect.left + hubRect.width / 2 - stageRect.left) / stageRect.width) * 100;
  const yPercent = ((hubRect.top + hubRect.height / 2 - stageRect.top) / stageRect.height) * 100;

  addSpawnFeedback(
    {
      x: xPercent,
      y: yPercent,
    },
    success,
  );
};

const triggerSpawnHighlight = (nodeId: string) => {
  spawnHighlights.value = {
    ...spawnHighlights.value,
    [nodeId]: true,
  };

  window.setTimeout(() => {
    const highlights = { ...spawnHighlights.value };
    delete highlights[nodeId];
    spawnHighlights.value = highlights;
  }, 900);
};

const initializeConsumptions = () => {
  const initial: Record<string, number> = {};

  serverNodes.value.forEach((server) => {
    initial[server.id] = generateConsumptionValue();
  });

  serverConsumptions.value = initial;
};

const updateConsumption = (serverId: string) => {
  const current = serverConsumptions.value[serverId] ?? generateConsumptionValue();
  const delta = (Math.random() - 0.5) * 14;
  const next = Math.min(
    MAX_CONSUMPTION,
    Math.max(MIN_CONSUMPTION, parseFloat((current + delta).toFixed(1))),
  );

  serverConsumptions.value = {
    ...serverConsumptions.value,
    [serverId]: next,
  };
};

const formatConsumption = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return value.toFixed(1);
};

const openAboutDialog = () => {
  aboutDialogOpen.value = true;
};

onMounted(() => {
  resetHighlights();
  initializeConsumptions();
  addBlock();
  void triggerAlert();
  void nextTick(() => {
    updateStageMetrics();
    handleMouseLeave();
  });
  window.addEventListener('resize', updateStageMetrics);
  alertTimer = window.setInterval(() => {
    void triggerAlert();
  }, 6500);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateStageMetrics);
  if (cursorRafId !== null) {
    window.cancelAnimationFrame(cursorRafId);
    cursorRafId = null;
  }
  if (alertTimer !== undefined) {
    window.clearInterval(alertTimer);
    alertTimer = undefined;
  }
  shakeTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  shakeTimeouts.clear();
  happyTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  happyTimeouts.clear();
});
</script>

<style scoped>
.index-page {
  display: flex;
  align-items: stretch;
  height: 100%;
  overflow: hidden;
}

.network-stage {
  position: relative;
  flex: 1;
  overflow: hidden;
  width: 100%;
  max-height: 100vh;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.4s ease;
  padding: clamp(16px, 4vw, 40px);
}

.network-stage--light {
  background: radial-gradient(circle at 50% 20%, #f6f9ff, #dbe6ff, #bac8ff);
}

.network-stage--dark {
  background: radial-gradient(circle at 50% 20%, #0b1026, #111a3d, #1b264f);
}

.server-node {
  position: absolute;
  width: 76px;
  height: 76px;
  margin: -38px 0 0 -38px;
  border-radius: 24px;
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, box-shadow 0.4s ease;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  background: rgba(21, 31, 67, 0.45);
  color: #e7ecff;
}

.server-node--shake {
  animation: server-node-shake 0.75s ease;
}

.network-stage--light .server-node {
  background: rgba(255, 255, 255, 0.65);
  color: #1b244a;
  box-shadow: 0 10px 26px rgba(38, 49, 87, 0.2);
}

.network-stage--dark .server-node {
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.server-node__eyes {
  position: absolute;
  top: -6px;
  display: flex;
  gap: 10px;
  transform: translateY(-2px);
}

.server-eye {
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

.network-stage--dark .server-eye {
  background: rgba(240, 246, 255, 0.92);
  border-color: rgba(226, 232, 240, 0.85);
}

.server-eye__pupil {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0f172a;
  transition: transform 0.12s ease;
}

.network-stage--dark .server-eye__pupil {
  background: #0f172a;
}

.server-node__eyes--happy .server-eye {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(15, 23, 42, 0.6);
}

.server-node__eyes--happy .server-eye__pupil {
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

.server-node__eyes--happy .server-eye__pupil::before {
  content: '^';
  transform: translateY(-1px);
}

.network-stage--dark .server-node__eyes--happy .server-eye {
  background: rgba(240, 246, 255, 0.96);
  border-color: rgba(148, 163, 184, 0.55);
}

.network-stage--dark .server-node__eyes--happy .server-eye__pupil {
  background: rgba(13, 17, 38, 0.95);
  color: #e2e8f0;
}

.server-node--alert {
  transform: scale(1.18) translateY(-6px);
  box-shadow:
    0 18px 40px rgba(255, 152, 0, 0.45),
    0 0 28px rgba(255, 184, 77, 0.6);
  background: linear-gradient(160deg, rgba(255, 140, 0, 0.92), rgba(255, 196, 61, 0.85));
  color: #2a1b02;
}

.server-node--ack {
  transform: scale(1.04);
  box-shadow:
    0 12px 30px rgba(78, 205, 142, 0.32),
    0 0 18px rgba(92, 255, 185, 0.4);
  background: rgba(46, 110, 85, 0.75);
}

.server-node--spawn::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 28px;
  border: 2px solid rgba(74, 222, 128, 0.85);
  animation: node-spawn-ring 0.9s ease-out forwards;
  pointer-events: none;
}

.network-stage--light .server-node--ack {
  background: rgba(184, 249, 214, 0.82);
  color: #0f3a2a;
  box-shadow:
    0 12px 26px rgba(10, 122, 78, 0.22),
    0 0 18px rgba(16, 163, 102, 0.28);
}

.network-stage--dark .server-node--ack {
  border: 1px solid rgba(144, 255, 206, 0.35);
}

.network-stage--light .server-node--spawn::after {
  border-color: rgba(16, 163, 102, 0.75);
}

.network-stage--light .server-node--alert {
  background: linear-gradient(160deg, rgba(255, 168, 38, 0.95), rgba(255, 217, 102, 0.88));
  color: #2d1b00;
  box-shadow:
    0 18px 38px rgba(255, 167, 38, 0.35),
    0 0 26px rgba(255, 195, 77, 0.45);
}

.network-stage--dark .server-node--alert {
  border: 1px solid rgba(255, 206, 132, 0.6);
}

.server-node__alert {
  position: absolute;
  top: -12px;
  right: -12px;
  color: #ffb74d;
  font-size: 28px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
}

.server-node__consumption {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.4px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(16, 26, 56, 0.8);
  color: #d6e3ff;
  box-shadow: 0 6px 15px rgba(5, 10, 24, 0.45);
  backdrop-filter: blur(6px);
}

.network-stage--light .server-node__consumption {
  background: rgba(255, 255, 255, 0.85);
  color: #14213d;
  box-shadow: 0 6px 12px rgba(23, 33, 60, 0.2);
}

@keyframes server-node-shake {
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

@keyframes node-spawn-ring {
  0% {
    opacity: 0.9;
    transform: scale(0.6);
  }
  60% {
    opacity: 0.35;
    transform: scale(1.3);
  }
  100% {
    opacity: 0;
    transform: scale(1.9);
  }
}

.network-stage__ack-popups {
  position: absolute;
  inset: 0;
  pointer-events: none;
  max-height: 100%;
}

.ack-popup {
  position: absolute;
  left: var(--ack-x);
  top: var(--ack-y);
  transform: translate(-50%, -50%);
  animation: ack-pop 1.2s ease-out forwards;
}

.ack-popup__content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(46, 179, 120, 0.95);
  color: #052c1d;
  font-weight: 700;
  letter-spacing: 0.6px;
  box-shadow:
    0 8px 18px rgba(46, 179, 120, 0.32),
    0 0 14px rgba(46, 179, 120, 0.38);
}

.network-stage--light .ack-popup__content {
  background: rgba(198, 255, 224, 0.95);
  color: #0c3924;
}

.ack-popup__label {
  font-size: 12px;
  text-transform: uppercase;
}

.ack-popup__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes ack-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.7);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -52%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -60%) scale(1.05);
  }
}

.ack-enter-active,
.ack-leave-active,
.ack-move {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.ack-enter-from,
.ack-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%);
}

.alert-pop-enter-active,
.alert-pop-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.alert-pop-enter-from,
.alert-pop-leave-to {
  transform: scale(0.2);
  opacity: 0;
}

.network-hub {
  position: relative;
  z-index: 2;
  border-radius: 24px;
  min-width: 280px;
  max-width: min(420px, 90vw);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 45px rgba(23, 33, 60, 0.25);
}

.network-stage--dark .network-hub {
  background: rgba(10, 16, 35, 0.8);
  color: #f1f5ff;
  box-shadow: 0 18px 45px rgba(8, 13, 28, 0.55);
}

.network-hub__title {
  letter-spacing: 0.5px;
}

.network-hub__info-button {
  min-width: 180px;
  border-radius: 14px;
  border: 1px solid rgba(56, 91, 180, 0.35);
  backdrop-filter: blur(4px);
  transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
}

.network-stage--dark .network-hub__info-button {
  border-color: rgba(148, 163, 184, 0.35);
  color: #e2e8f0;
}

.network-hub__info-button--highlight {
  box-shadow:
    0 0 18px rgba(77, 159, 255, 0.75),
    0 0 36px rgba(77, 159, 255, 0.55);
  transform: translateY(-2px);
  border-color: rgba(77, 159, 255, 0.55);
}

.block-chain {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  max-width: 360px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 0 auto;
}

.block-chain__block {
  position: relative;
  width: 64px;
  min-height: 86px;
  border-radius: 14px;
  padding: 10px;
  background: rgba(14, 22, 48, 0.82);
  color: #e5edff;
  border: 1px solid rgba(90, 136, 255, 0.18);
  box-shadow: 0 12px 30px rgba(6, 12, 28, 0.45);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border 0.35s ease;
}

.network-stage--light .block-chain__block {
  background: rgba(255, 255, 255, 0.9);
  color: #172040;
  border: 1px solid rgba(46, 76, 184, 0.2);
  box-shadow: 0 12px 28px rgba(23, 33, 60, 0.25);
}

.block-chain__block--new {
  transform: translateY(-6px);
  border-color: rgba(125, 187, 255, 0.65);
  box-shadow:
    0 14px 40px rgba(77, 159, 255, 0.4),
    0 0 24px rgba(77, 159, 255, 0.55);
}

.block-chain__hash {
  font-size: 10px;
  line-height: 1.2;
  letter-spacing: 1px;
  font-family: monospace;
  word-break: break-word;
  opacity: 0.8;
}

.block-chain__index {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.75;
}

.block-chain-enter-active,
.block-chain-leave-active,
.block-chain-move {
  transition: all 0.4s ease;
}

.block-chain-enter-from,
.block-chain-leave-to {
  opacity: 0;
  transform: translateY(20px);
}


.about-modal {
  width: min(680px, 94vw);
  max-height: 92vh;
  padding: 28px;
  border-radius: 26px;
  box-shadow: 0 28px 56px rgba(17, 24, 39, 0.32);
}

.about-modal--light {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.97), rgba(237, 242, 255, 0.96));
  color: #0f172a;
}

.about-modal--dark {
  background: linear-gradient(145deg, rgba(13, 17, 38, 0.95), rgba(19, 28, 58, 0.9));
  color: #e2e8f0;
  box-shadow: 0 28px 56px rgba(5, 10, 24, 0.55);
}

.about-modal__header {
  gap: 12px;
}

.about-modal__badge {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.16);
  color: #1e3a8a;
}

.about-modal--dark .about-modal__badge {
  background: rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
}

.about-modal__title {
  font-weight: 600;
}

.about-steps {
  position: relative;
}

.about-step {
  padding: 18px 22px;
  border-radius: 20px;
  background: rgba(248, 250, 255, 0.82);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.12),
    inset 0 0 0 1px rgba(77, 107, 177, 0.14);
}

.about-modal--dark .about-step {
  background: rgba(20, 27, 62, 0.78);
  box-shadow:
    0 12px 26px rgba(4, 10, 32, 0.4),
    inset 0 0 0 1px rgba(96, 105, 140, 0.24);
}

.about-step__icon {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 18px;
  background: rgba(59, 130, 246, 0.18);
  color: #1e3a8a;
}

.about-modal--dark .about-step__icon {
  background: rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
}

.about-step__title {
  font-weight: 600;
}

.about-step__text {
  margin: 0;
  line-height: 1.55;
  opacity: 0.88;
}

.about-step__connector {
  height: 36px;
  position: relative;
  color: rgba(59, 130, 246, 0.65);
  gap: 8px;
}

.about-step__line {
  flex: 1;
  height: 2px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.25);
}

.about-modal--dark .about-step__line {
  background: rgba(129, 162, 255, 0.25);
}

.about-step__arrow {
  color: currentColor;
}

.about-modal__summary {
  border-radius: 20px;
  padding: 16px 22px;
  background: rgba(226, 232, 255, 0.55);
  box-shadow: inset 0 0 0 1px rgba(77, 107, 177, 0.14);
}

.about-modal--dark .about-modal__summary {
  background: rgba(30, 41, 89, 0.52);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
}

.network-stage__rewards {
  position: absolute;
  inset: 0;
  pointer-events: none;
  max-height: 100%;
}

.network-stage__spawns {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.spawn-pulse {
  position: absolute;
  left: var(--spawn-x);
  top: var(--spawn-y);
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  opacity: 0;
  border: 2px solid currentColor;
}

.spawn-pulse--success {
  color: #4ade80;
  animation: spawn-pulse-success 1.1s ease-out forwards;
  box-shadow: 0 0 18px rgba(74, 222, 128, 0.45);
}

.spawn-pulse--fail {
  color: #f87171;
  animation: spawn-pulse-fail 0.9s ease-out forwards;
  box-shadow: 0 0 14px rgba(248, 113, 113, 0.35);
}

.spawn-enter-active,
.spawn-leave-active,
.spawn-move {
  transition: opacity 0.2s ease;
}

.spawn-enter-from,
.spawn-leave-to {
  opacity: 0;
}

@keyframes spawn-pulse-success {
  0% {
    opacity: 0.75;
    transform: translate(-50%, -50%) scale(0.4);
  }
  60% {
    opacity: 0.35;
    transform: translate(-50%, -50%) scale(1.6);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2.5);
  }
}

@keyframes spawn-pulse-fail {
  0% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1.4);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.9);
  }
}

.reward-popup {
  position: absolute;
  left: var(--reward-x);
  top: var(--reward-y);
  transform: translate(-50%, -50%);
  animation: reward-float 1.6s ease-out forwards;
}

.reward-popup__content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 206, 86, 0.95);
  color: #1b1e2f;
  font-weight: 700;
  letter-spacing: 0.6px;
  box-shadow:
    0 8px 20px rgba(255, 202, 70, 0.28),
    0 0 16px rgba(255, 202, 70, 0.35);
}

.network-stage--dark .reward-popup__content {
  background: rgba(254, 220, 120, 0.92);
  color: #12172c;
}

.reward-popup__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-popup__label {
  font-size: 12px;
  text-transform: uppercase;
}

@keyframes reward-float {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.75);
  }
  10% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -60%) scale(1.05);
  }
}

.reward-enter-active,
.reward-leave-active,
.reward-move {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.reward-enter-from,
.reward-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%);
}

@media (max-width: 600px) {
  .network-stage {
    padding: 16px 12px 24px;
  }

  .server-node__consumption {
    bottom: -28px;
  }

  .network-hub {
    width: 100%;
  }

  .block-chain {
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    max-width: 100%;
    padding-bottom: 4px;
  }

  .block-chain__block {
    flex: 0 0 auto;
  }
}
</style>
