<template>
  <q-card class="crypto-card column items-center q-pa-md" :class="cardClasses" flat bordered>
    <q-img
      :src="logo"
      :alt="`${label} logo`"
      class="crypto-logo"
      ratio="1"
      contain
    />
    <div class="crypto-label q-mt-md">{{ label }}</div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'

defineProps<{
  label: string
  logo: string
}>()

const $q = useQuasar()

const cardClasses = computed(() => {
  return $q.dark.isActive
    ? ['crypto-card--dark', 'text-white']
    : ['crypto-card--light', 'text-dark']
})
</script>

<style scoped>
.crypto-card {
  width: 200px;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.crypto-card--light {
  background-color: #fff;
}

.crypto-card--dark {
  background-color: #1f2933;
}

.crypto-logo {
  width: 96px;
  max-width: 100%;
}

.crypto-label {
  font-weight: 600;
  text-align: center;
}
</style>
