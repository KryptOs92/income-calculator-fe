<template>
  <div class="authenticate-user column items-center">
    <div v-if="userStore.isAuthenticated" class="auth-status text-subtitle2">
      {{ t('authenticateUser.alreadySignedIn') }}
    </div>

    <q-form
      v-else
      class="auth-form column q-gutter-md"
      @submit.prevent="handleSubmit"
    >
      <q-input
        v-model="form.email"
        type="email"
        :label="t('authenticateUser.emailLabel')"
        dense
        outlined
        :disable="isSubmitting"
        autocomplete="email"
      />
      <q-input
        v-model="form.password"
        type="password"
        :label="t('authenticateUser.passwordLabel')"
        dense
        outlined
        :disable="isSubmitting"
        autocomplete="current-password"
      />

      <div class="auth-messages column">
        <transition name="auth-message">
          <div v-if="statusMessage" :class="['auth-message', statusMessageType]">
            {{ statusMessage }}
          </div>
        </transition>
      </div>

      <div class="auth-actions column q-gutter-sm">
        <q-btn
          type="submit"
          color="primary"
          class="text-subtitle2"
          :label="t('authenticateUser.signIn')"
          :loading="isSubmitting"
          unelevated
        />
        <div class="auth-reset text-body2">
          <span>{{ t('authenticateUser.forgotPrompt') }}</span>
          <q-btn
            flat
            dense
            class="auth-reset__link"
            :disable="isSubmitting || isResetting"
            @click="handleReset"
          >
            {{ t('authenticateUser.forgotLink') }}
          </q-btn>
        </div>
        <div class="auth-register text-body2">
          <span>{{ t('authenticateUser.notRegistered') }}</span>
          <q-btn
            flat
            dense
            class="auth-register__link"
            :disable="isSubmitting || isResetting"
            @click="handleRegisterClick"
          >
            {{ t('authenticateUser.registerCta') }}
          </q-btn>
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'boot/axios';
import { useUserStore, TOKEN_STORAGE_KEY } from 'src/stores/user-store';

type EmitEvents = {
  (event: 'login-success'): void;
  (event: 'login-failed'): void;
  (event: 'register-request'): void;
};

const emit = defineEmits<EmitEvents>();

const { t } = useI18n();
const userStore = useUserStore();

const form = reactive({
  email: '',
  password: '',
});

const isSubmitting = ref(false);
const isResetting = ref(false);
const statusMessage = ref('');
const statusMessageType = ref<'error' | 'success'>('success');

const clearStatusMessage = () => {
  statusMessage.value = '';
};

const handleRegisterClick = () => {
  emit('register-request');
};

const handleSubmit = async () => {
  if (isSubmitting.value) {
    return;
  }

  clearStatusMessage();

  if (!form.email) {
    statusMessage.value = t('authenticateUser.emailRequired');
    statusMessageType.value = 'error';
    return;
  }

  if (!form.password) {
    statusMessage.value = t('authenticateUser.passwordRequired');
    statusMessageType.value = 'error';
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await api.post('/auth/login', {
      email: form.email,
      password: form.password,
    });

    const token = response?.data?.token as string | undefined;

    if (!token) {
      throw new Error('missing-token');
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    userStore.evaluateToken();
    statusMessage.value = '';
    emit('login-success');
  } catch {
    statusMessage.value = t('authenticateUser.loginFailed');
    statusMessageType.value = 'error';
    userStore.isAuthenticated = false;
    emit('login-failed');
  } finally {
    isSubmitting.value = false;
  }
};

const handleReset = async () => {
  if (isResetting.value || isSubmitting.value) {
    return;
  }

  clearStatusMessage();

  if (!form.email) {
    statusMessage.value = t('authenticateUser.emailRequired');
    statusMessageType.value = 'error';
    return;
  }

  isResetting.value = true;

  try {
    await api.post('/auth/request-password-reset', {
      email: form.email,
    });

    statusMessage.value = t('authenticateUser.resetSuccess');
    statusMessageType.value = 'success';
  } catch {
    statusMessage.value = t('authenticateUser.resetError');
    statusMessageType.value = 'error';
  } finally {
    isResetting.value = false;
  }
};
</script>

<style scoped>
.authenticate-user {
  width: min(360px, 100%);
}

.auth-form {
  width: 100%;
}

.auth-actions {
  width: 100%;
}

.auth-reset {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  text-align: center;
}

.auth-reset__link {
  color: inherit;
  text-decoration: underline;
  padding: 0;
  min-height: unset;
}

.auth-register {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  text-align: center;
}

.auth-register__link {
  color: inherit;
  text-decoration: underline;
  padding: 0;
  min-height: unset;
}

.auth-message {
  text-align: center;
  font-weight: 600;
}

.auth-message.success {
  color: #16a34a;
}

.auth-message.error {
  color: #dc2626;
}

.auth-message-enter-active,
.auth-message-leave-active {
  transition: opacity 0.2s ease;
}

.auth-message-enter-from,
.auth-message-leave-to {
  opacity: 0;
}

.auth-status {
  text-align: center;
}
</style>
