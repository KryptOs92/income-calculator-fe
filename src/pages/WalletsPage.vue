<template>
  <q-page class="wallets-page q-pa-xl">
    <div class="wallet-map">
      <div
        v-for="node in decoratedNodes"
        :key="node.id"
        class="wallet-node"
        :class="{
          'wallet-node--ready': node.ready,
          'wallet-node--inactive': !node.ready,
          'wallet-node--blink': node.matchesSearch,
        }"
      >
        <img :src="node.logo" :alt="node.label" class="wallet-node__logo" />
        <span class="wallet-node__label">{{ node.label }}</span>
        <span v-if="!node.ready" class="wallet-node__status">work in progress..</span>
      </div>
    </div>

    <div class="wallet-search q-mt-xl">
      <q-input
        v-model="searchTerm"
        outlined
        dense
        label="Cerca una crypto"
        placeholder="Es. Cardano"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import algorandLogo from 'src/assets/logos/algorand-algo-logo.png'
import cardanoLogo from 'src/assets/logos/cardano-ada-logo.png'

type WalletNode = {
  id: string
  label: string
  logo: string
  ready: boolean
}

const baseNodes: WalletNode[] = [
  {
    id: 'algorand',
    label: 'Algorand (ALGO)',
    logo: algorandLogo,
    ready: true,
  },
  {
    id: 'cardano',
    label: 'Cardano (ADA)',
    logo: cardanoLogo,
    ready: false,
  },
]

const searchTerm = ref('')
const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase())

const decoratedNodes = computed(() =>
  baseNodes.map((node) => ({
    ...node,
    matchesSearch:
      normalizedSearch.value.length > 0 &&
      node.label.toLowerCase().includes(normalizedSearch.value),
  }))
)
</script>

<style scoped>
.wallet-map {
  display: flex;
  flex-wrap: wrap;
  gap: 48px;
  justify-content: center;
  width: 100%;
  padding: 32px;
}

.wallet-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #cdd7f5;
  opacity: 0.35;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.wallet-node__logo {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  transition: transform 0.3s ease;
}

.wallet-node--ready {
  opacity: 1;
  filter: drop-shadow(0 0 12px rgba(118, 197, 255, 0.7));
}

.wallet-node--inactive {
  opacity: 0.3;
  filter: grayscale(0.5);
}

.wallet-node--blink {
  animation: wallet-blink 0.9s ease-in-out infinite;
}

.wallet-node--blink .wallet-node__logo {
  transform: scale(1.08);
}

.wallet-node__label {
  font-weight: 600;
  text-align: center;
}

.wallet-node__status {
  font-size: 0.85rem;
  color: #ffb347;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.wallet-search {
  max-width: 320px;
}

@keyframes wallet-blink {
  0% {
    opacity: 0.4;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0));
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 16px rgba(255, 236, 182, 0.9));
  }
  100% {
    opacity: 0.4;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0));
  }
}

:global(body.body--light) .wallet-map {
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.02);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

:global(body.body--light) .wallet-node {
  color: #0f172a;
}

:global(body.body--light) .wallet-node__logo {
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

:global(body.body--light) .wallet-node--ready {
  filter: drop-shadow(0 12px 24px rgba(15, 23, 42, 0.18));
}

:global(body.body--light) .wallet-node--inactive {
  opacity: 0.6;
  filter: grayscale(0.4);
}

:global(body.body--light) .wallet-node__label {
  color: #0f172a;
}

:global(body.body--light) .wallet-node__status {
  color: #d97706;
}
</style>
