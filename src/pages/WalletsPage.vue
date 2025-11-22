<template>
  <q-page class="wallets-page q-pa-xl">
    <div class="wallet-steps q-mb-xl">
      <div class="wallet-step" v-for="step in steps" :key="step.id">
        <div class="wallet-step__badge">
          <span>{{ step.id }}</span>
        </div>
        <div class="wallet-step__body">
          <p class="wallet-step__title">
            {{ step.title }}
          </p>
          <p class="wallet-step__description">
            {{ step.description }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="shouldShowError" class="wallet-error q-mt-xl">
      <q-banner dense rounded class="bg-negative text-white text-center">
        {{ t('walletsPage.error') }}
      </q-banner>
    </div>

    <template v-else>
      <div class="wallet-search q-mb-xl">
        <q-input v-model="searchTerm" outlined dense :label="t('walletsPage.search.label')"
          :placeholder="t('walletsPage.search.placeholder')" />
      </div>

      <div class="wallet-map">
        <template v-if="visibleNodes.length">
          <div v-for="node in visibleNodes" :key="node.id" class="wallet-node" :class="{
            'wallet-node--ready': node.isReady,
            'wallet-node--inactive': !node.isReady,
            'wallet-node--blink': node.matchesSearch,
          }">
            <img :src="node.logo" :alt="node.label" class="wallet-node__logo" />
            <span class="wallet-node__label">{{ node.label }}</span>
            <span v-if="!node.isReady" class="wallet-node__status">work in progress..</span>
          </div>
        </template>

        <template v-else>
          <div class="wallet-map__empty column items-center justify-center q-pa-xl">
            <q-spinner v-if="isLoading" size="42px" color="primary" />
            <p v-else class="wallet-map__empty-text">
              {{ t('walletsPage.search.noResults') }}
            </p>
          </div>
        </template>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'src/boot/axios'
import algorandLogo from 'src/assets/logos/algorand-algo-logo.png'
import cardanoLogo from 'src/assets/logos/cardano-ada-logo.png'

type WalletNode = {
  id: string
  label: string
  logo: string
  isReady: boolean
  matchesSearch?: boolean
}

const { t } = useI18n()

const searchTerm = ref('')
const nodes = ref<WalletNode[]>([])
const isLoading = ref(false)
const hasError = ref(false)

const availableLogos: Record<string, string> = {
  AlgorandLogo: algorandLogo,
  CardanoLogo: cardanoLogo,
}
const defaultLogo = cardanoLogo

const fetchCryptos = async () => {
  isLoading.value = true
  hasError.value = false

  try {
    const response = await api.get('/cryptos')
    const list = normalizePayload(response?.data)

    if (!list.length) {
      nodes.value = []
      hasError.value = true
      return
    }

    nodes.value = list.map((crypto, index) => toWalletNode(crypto, index))
  } catch {
    nodes.value = []
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

type CryptoApiEntry = {
  name?: string
  symbol?: string
  isReady?: boolean
  logo?: string
  [key: string]: unknown
}

const normalizePayload = (payload: unknown): CryptoApiEntry[] => {
  if (Array.isArray(payload)) {
    return payload as CryptoApiEntry[]
  }

  if (payload && typeof payload === 'object') {
    const bag = payload as Record<string, unknown>
    if (Array.isArray(bag.cryptos)) {
      return bag.cryptos as CryptoApiEntry[]
    }
    if (Array.isArray(bag.data)) {
      return bag.data as CryptoApiEntry[]
    }
  }

  return []
}

const toWalletNode = (entry: CryptoApiEntry, index: number): WalletNode => {
  const baseName =
    typeof entry.name === 'string' && entry.name.length ? entry.name : `Crypto ${index + 1}`
  const symbol =
    typeof entry.symbol === 'string' && entry.symbol.length ? entry.symbol.toUpperCase() : ''
  const label = symbol ? `${baseName} (${symbol})` : baseName

  const sanitizedKey = baseName.replace(/\s+/g, '')
  const keyCandidates = [`${baseName}Logo`, `${sanitizedKey}Logo`]
  const explicitLogo =
    typeof entry.logo === 'string' && entry.logo.length ? entry.logo : undefined
  const derivedLogo =
    keyCandidates.map((key) => availableLogos[key]).find((value) => typeof value === 'string') ??
    explicitLogo ??
    defaultLogo

  return {
    id: `${sanitizedKey || 'crypto'}-${symbol || index}`,
    label,
    logo: derivedLogo,
    isReady: Boolean(entry.isReady),
  }
}

const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase())

const decoratedNodes = computed(() =>
  nodes.value.map((node) => ({
    ...node,
    matchesSearch:
      normalizedSearch.value.length > 0 &&
      node.label.toLowerCase().includes(normalizedSearch.value),
  }))
)

const visibleNodes = computed(() => {
  if (!normalizedSearch.value.length) {
    return decoratedNodes.value
  }
  return decoratedNodes.value.filter((node) => node.matchesSearch)
})

const shouldShowError = computed(() => !isLoading.value && hasError.value)

const steps = computed(() => [
  {
    id: 1,
    title: t('walletsPage.steps.select.title'),
    description: t('walletsPage.steps.select.description'),
  },
  {
    id: 2,
    title: t('walletsPage.steps.address.title'),
    description: t('walletsPage.steps.address.description'),
  },
  {
    id: 3,
    title: t('walletsPage.steps.assign.title'),
    description: t('walletsPage.steps.assign.description'),
  },
])

onMounted(() => {
  void fetchCryptos()
})
</script>

<style scoped>
.wallet-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.wallet-step {
  flex: 1 1 240px;
  display: flex;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(111, 63, 245, 0.1), rgba(111, 63, 245, 0.02));
  border: 1px solid rgba(111, 63, 245, 0.2);
}

.wallet-step__badge {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6f3ff5;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 6px 16px rgba(111, 63, 245, 0.35);
}

.wallet-step__title {
  font-weight: 600;
  margin: 0 0 4px;
}

.wallet-step__description {
  margin: 0;
  opacity: 0.7;
  font-size: 0.9rem;
}

:global(body.body--light) .wallet-step {
  background: linear-gradient(135deg, rgba(111, 63, 245, 0.14), rgba(111, 63, 245, 0.04));
  border-color: rgba(111, 63, 245, 0.3);
}

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

.wallet-map__empty-text {
  margin: 0;
  color: #cdd7f5;
  font-weight: 600;
}

@keyframes wallet-blink {
  0% {
    opacity: 0.4;
    filter: drop-shadow(0 0 8px rgba(111, 63, 245, 0));
  }

  50% {
    opacity: 1;
    filter: drop-shadow(0 0 20px rgba(111, 63, 245, 0.85));
  }

  100% {
    opacity: 0.4;
    filter: drop-shadow(0 0 8px rgba(111, 63, 245, 0));
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
  color: #0f172a;
}
</style>
