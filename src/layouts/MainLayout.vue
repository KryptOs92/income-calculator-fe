<template>
  <q-layout view="hHh lpR fFf">
     <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          Title
        </q-toolbar-title>

        <q-space />

        <q-btn
          dense
          flat
          round
          :icon="themeIcon"
          :aria-label="isDark ? 'Attiva tema chiaro' : 'Attiva tema scuro'"
          @click="toggleTheme"
        />
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" elevated>
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

const leftDrawerOpen = ref(false);
const THEME_STORAGE_KEY = 'theme-preference';
const $q = useQuasar();
const isDark = computed(() => $q.dark.isActive);
const themeIcon = computed(() => (isDark.value ? 'light_mode' : 'dark_mode'));

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const toggleTheme = () => {
  const nextIsDark = !isDark.value;
  $q.dark.set(nextIsDark);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? 'dark' : 'light');
  }
};

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const savedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (savedPreference === 'dark' || savedPreference === 'light') {
    $q.dark.set(savedPreference === 'dark');
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, $q.dark.isActive ? 'dark' : 'light');
  }
});
</script>
