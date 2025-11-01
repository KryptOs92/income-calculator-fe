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
          :aria-label="toggleThemeAriaLabel"
          @click="toggleTheme"
        />

        <q-select
          v-model="selectedLocale"
          class="q-ml-sm"
          dense
          borderless
          dark
          options-dense
          emit-value
          map-options
          dropdown-icon="translate"
          :options="localeOptions"
          style="width: 130px"
          :aria-label="t('layout.nav.language')"
          @update:model-value="onLocaleChange"
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
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { MessageLanguages } from 'src/boot/i18n';

const leftDrawerOpen = ref(false);
const THEME_STORAGE_KEY = 'theme-preference';
const LOCALE_STORAGE_KEY = 'locale-preference';
const $q = useQuasar();
const { locale, t } = useI18n();
const isDark = computed(() => $q.dark.isActive);
const themeIcon = computed(() => (isDark.value ? 'light_mode' : 'dark_mode'));
const toggleThemeAriaLabel = computed(() =>
  isDark.value ? t('layout.nav.lightMode') : t('layout.nav.darkMode'),
);
const localeOptions: Array<{ label: string; value: MessageLanguages }> = [
  { label: 'Italiano', value: 'it-IT' },
  { label: 'English', value: 'en-US' },
];
const selectedLocale = ref<MessageLanguages>(locale.value as MessageLanguages);

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

const onLocaleChange = (value: MessageLanguages) => {
  locale.value = value;
};

watch(locale, (newLocale) => {
  selectedLocale.value = newLocale as MessageLanguages;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }
});

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

  selectedLocale.value = locale.value as MessageLanguages;
});
</script>
