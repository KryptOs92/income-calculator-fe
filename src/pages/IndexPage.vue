<template>
  <q-page class="index-page q-pa-none">
    <div
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

      <div
        v-for="server in serverNodes"
        :key="server.id"
        class="server-node"
        :class="{
          'server-node--alert': activeAlert === server.id,
          'server-node--ack': highlightedServers[server.id]
        }"
        :style="{
          top: `${server.position.y}%`,
          left: `${server.position.x}%`
        }"
      >
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

      <q-card class="network-hub column items-center justify-center q-pa-lg">
        <transition-group name="block-chain" tag="div" class="block-chain q-mb-md">
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
          color="primary"
          class="network-hub__button"
          :class="{ 'network-hub__button--alert': buttonHighlighted }"
          unelevated
          size="lg"
          label="Effettua login"
        />
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

type ServerNode = {
  id: string;
  position: {
    x: number;
    y: number;
  };
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

const $q = useQuasar();

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

const serverNodes = computed<ServerNode[]>(() => {
  const positions = $q.screen.lt.md ? mobilePositions : desktopPositions;

  return SERVER_IDS.map((id, index) => ({
    id,
    position: (() => {
      const resolved = positions[index] ?? desktopPositions[index] ?? { x: 50, y: 50 };
      return { x: resolved.x, y: resolved.y };
    })(),
  }));
});

const activeAlert = ref<string | null>(null);
const buttonHighlighted = ref(false);
const blocks = ref<Block[]>([]);
const latestBlockId = ref<number | null>(null);
const serverConsumptions = ref<Record<string, number>>({});
const rewardPopups = ref<Popup[]>([]);
const ackPopups = ref<Popup[]>([]);
const highlightedServers = ref<Record<string, boolean>>({});

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

const resetHighlights = () => {
  const initial: Record<string, boolean> = {};
  serverNodes.value.forEach((server) => {
    initial[server.id] = false;
  });
  highlightedServers.value = initial;
};

watch(serverNodes, () => {
  resetHighlights();
});

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

  window.setTimeout(() => {
    rewardPopups.value = rewardPopups.value.filter((reward) => reward.id !== rewardId);
  }, 1600);
};

const generateConsumptionValue = () =>
  parseFloat(
    (MIN_CONSUMPTION + Math.random() * (MAX_CONSUMPTION - MIN_CONSUMPTION)).toFixed(1),
  );

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

onMounted(() => {
  resetHighlights();
  initializeConsumptions();
  addBlock();
  void triggerAlert();
  alertTimer = window.setInterval(() => {
    void triggerAlert();
  }, 6500);
});

onBeforeUnmount(() => {
  if (alertTimer !== undefined) {
    window.clearInterval(alertTimer);
    alertTimer = undefined;
  }
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
  height: 100vh;
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

.network-stage--light .server-node {
  background: rgba(255, 255, 255, 0.65);
  color: #1b244a;
  box-shadow: 0 10px 26px rgba(38, 49, 87, 0.2);
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

.network-stage--light .server-node--ack {
  background: rgba(184, 249, 214, 0.82);
  color: #0f3a2a;
  box-shadow:
    0 12px 26px rgba(10, 122, 78, 0.22),
    0 0 18px rgba(16, 163, 102, 0.28);
}

.network-stage--light .server-node--alert {
  background: linear-gradient(160deg, rgba(255, 168, 38, 0.95), rgba(255, 217, 102, 0.88));
  color: #2d1b00;
  box-shadow:
    0 18px 38px rgba(255, 167, 38, 0.35),
    0 0 26px rgba(255, 195, 77, 0.45);
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

.network-hub__button {
  min-width: 180px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.network-hub__button--alert {
  box-shadow:
    0 0 18px rgba(77, 159, 255, 0.75),
    0 0 36px rgba(77, 159, 255, 0.55);
  transform: translateY(-2px);
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

.network-stage__rewards {
  position: absolute;
  inset: 0;
  pointer-events: none;
  max-height: 100%;
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
