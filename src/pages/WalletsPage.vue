<template>
  <q-page class="wallets-page q-pa-lg">
    <div class="row q-col-gutter-lg">
      <div
        v-for="crypto in cryptos"
        :key="crypto.label"
        class="col-12 col-sm-6 col-md-4 col-lg-3 flex flex-center"
      >
        <Crypto :label="crypto.label" :logo="crypto.logo" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import Crypto from 'src/components/Crypto.vue'
import cardanoLogo from 'src/assets/logos/cardano-ada-logo.png'

const cryptos = [
  {
    label: 'Cardano (ADA)',
    logo: cardanoLogo,
  },
]
</script>
