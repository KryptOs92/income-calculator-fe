<template>
  <q-layout view="hHh lpR fFf">
    <q-header
      elevated
      :class="[
        'main-header',
        isDark ? 'main-header--dark' : 'main-header--light'
      ]"
    >
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="menu"
          :color="isDark ? 'white' : 'dark'"
          @click="toggleLeftDrawer"
        />

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
          :color="isDark ? 'white' : 'dark'"
          :aria-label="toggleThemeAriaLabel"
          @click="toggleTheme"
        />

        <q-select
          v-model="selectedLocale"
          class="q-ml-sm"
          dense
          borderless
          :dark="isDark"
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
      <div :class="['main-drawer column fit', isDark ? 'main-drawer--dark' : 'main-drawer--light']">
        <q-scroll-area class="main-drawer__scroll">
          <q-list>
            <q-item
              v-if="isAuthenticated"
              v-ripple
              clickable
              :to="{ name: 'overview' }"
              @click="leftDrawerOpen = false"
            >
              <q-item-section avatar>
                <q-icon name="dashboard" />
              </q-item-section>
              <q-item-section>
                {{ t('layout.nav.overview') }}
              </q-item-section>
            </q-item>
            <q-item
              v-if="isAuthenticated"
              v-ripple
              clickable
              :to="{ path: '/wallets' }"
              @click="leftDrawerOpen = false"
            >
              <q-item-section avatar>
                <q-icon name="account_balance_wallet" />
              </q-item-section>
              <q-item-section>
                {{ t('layout.nav.wallets') }}
              </q-item-section>
            </q-item>
            <q-item
              v-ripple
              clickable
              :to="{ path: '/' }"
              @click="leftDrawerOpen = false"
            >
              <q-item-section avatar>
                <q-icon name="help_outline" />
              </q-item-section>
              <q-item-section>
                {{ t('layout.nav.aboutApp') }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <div class="main-drawer__footer q-pa-md">
          <div class="column q-gutter-sm">
            <q-btn
              v-if="isAuthenticated"
              color="primary"
              icon="logout"
              unelevated
              class="full-width"
              :label="t('layout.nav.logout')"
              @click="handleLogout"
            />
            <q-btn
              v-else
              color="primary"
              unelevated
              class="full-width"
              :label="t('layout.nav.signIn')"
              :to="{ name: 'sign-in' }"
              @click="leftDrawerOpen = false"
            />
          </div>
        </div>
      </div>
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
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/user-store';

const leftDrawerOpen = ref(false);
const THEME_STORAGE_KEY = 'theme-preference';
const LOCALE_STORAGE_KEY = 'locale-preference';
const $q = useQuasar();
const { locale, t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
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
const isAuthenticated = computed(() => userStore.isAuthenticated);

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

const handleLogout = () => {
  userStore.logout();
  leftDrawerOpen.value = false;
  void router.push({ name: 'sign-in' });
};

watch(locale, (newLocale) => {
  selectedLocale.value = newLocale as MessageLanguages;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }
});

onMounted(async () => {
  await userStore.evaluateToken();

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

<style scoped>
.main-header {
  border-bottom: 1px solid transparent;
  transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.main-header--dark {
  background: #0f172a;
  color: #f8fafc;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.main-header--light {
  background: #ffffff;
  color: #111827;
  border-bottom-color: #6f3ff5;
}

.main-header--light .q-toolbar,
.main-header--light .q-toolbar__title,
.main-header--light .q-icon,
.main-header--light .q-btn,
.main-header--light .q-btn span,
.main-header--light .q-select,
.main-header--light .q-field__native,
.main-header--light .q-field__label {
  color: #111827;
}

.main-drawer {
  display: flex;
}

.main-drawer__scroll {
  flex: 1;
}

.main-drawer--light {
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
}

.main-drawer--dark {
  background: rgba(15, 23, 42, 0.94);
  color: #e2e8f0;
}

.main-drawer__footer {
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.main-drawer--dark .main-drawer__footer {
  border-top-color: rgba(226, 232, 240, 0.12);
}
</style>
