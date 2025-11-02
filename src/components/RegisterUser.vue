<template>
  <div class="register-user column items-center">
    <div
      v-if="isSuccess"
      class="register-success column q-gutter-md items-center text-center"
    >
      <q-icon name="check_circle" size="44px" color="positive" />
      <div class="text-h6">{{ t('registerUser.successTitle') }}</div>
      <p class="text-body2">
        {{ t('registerUser.successDescription') }}
      </p>
      <q-btn
        color="primary"
        class="text-subtitle2"
        :label="t('registerUser.backToLogin')"
        unelevated
        @click="handleBackToLogin"
      />
    </div>

    <q-form
      v-else
      class="register-form column q-gutter-md"
      @submit.prevent="handleSubmit"
    >
      <q-input
        v-model="form.name"
        type="text"
        :label="t('registerUser.nameLabel')"
        dense
        outlined
        :disable="isSubmitting"
        :maxlength="NAME_MAX_LENGTH"
      />
      <q-input
        v-model="form.email"
        type="email"
        :label="t('registerUser.emailLabel')"
        dense
        outlined
        :disable="isSubmitting"
        :maxlength="EMAIL_MAX_LENGTH"
      />
      <q-input
        v-model="form.password"
        type="password"
        :label="t('registerUser.passwordLabel')"
        dense
        outlined
        :disable="isSubmitting"
        :maxlength="PASSWORD_MAX_LENGTH"
      />
      <q-input
        v-model="form.confirmPassword"
        type="password"
        :label="t('registerUser.confirmPasswordLabel')"
        dense
        outlined
        :disable="isSubmitting"
        :maxlength="PASSWORD_MAX_LENGTH"
      />

      <div class="register-messages column">
        <transition name="auth-message">
          <div v-if="statusMessage" :class="['auth-message', statusMessageType]">
            {{ statusMessage }}
          </div>
        </transition>
      </div>

      <div class="register-actions column q-gutter-sm">
        <q-btn
          type="submit"
          color="primary"
          class="text-subtitle2"
          :label="t('registerUser.submitLabel')"
          :loading="isSubmitting"
          unelevated
        />
        <q-btn
          flat
          dense
          class="register-cancel text-body2"
          :disable="isSubmitting"
          @click="handleBackToLogin"
        >
          {{ t('registerUser.backToLogin') }}
        </q-btn>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'boot/axios';

type EmitEvents = {
  (event: 'close'): void;
  (event: 'success'): void;
  (event: 'failure'): void;
};

const emit = defineEmits<EmitEvents>();

const { t } = useI18n();

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const isSubmitting = ref(false);
const isSuccess = ref(false);
const statusMessage = ref('');
const statusMessageType = ref<'error' | 'success'>('success');

const clearStatusMessage = () => {
  statusMessage.value = '';
};

const setErrorMessage = (key: string) => {
  statusMessage.value = t(key);
  statusMessageType.value = 'error';
  emit('failure');
};

const resetForm = () => {
  form.name = '';
  form.email = '';
  form.password = '';
  form.confirmPassword = '';
};

const handleBackToLogin = () => {
  if (isSubmitting.value) {
    return;
  }

  clearStatusMessage();
  resetForm();
  isSuccess.value = false;
  emit('close');
};

const handleSubmit = async () => {
  if (isSubmitting.value) {
    emit('failure');
    return;
  }

  clearStatusMessage();

  if (!form.name) {
    setErrorMessage('registerUser.nameRequired');
    return;
  }

  if (form.name.length > NAME_MAX_LENGTH) {
    setErrorMessage('registerUser.nameTooLong');
    return;
  }

  if (!form.email) {
    setErrorMessage('registerUser.emailRequired');
    return;
  }

  if (form.email.length > EMAIL_MAX_LENGTH) {
    setErrorMessage('registerUser.emailTooLong');
    return;
  }

  if (!EMAIL_REGEX.test(form.email)) {
    setErrorMessage('registerUser.emailInvalid');
    return;
  }

  if (!form.password) {
    setErrorMessage('registerUser.passwordRequired');
    return;
  }

  if (form.password.length < PASSWORD_MIN_LENGTH) {
    setErrorMessage('registerUser.passwordTooShort');
    return;
  }

  if (form.password.length > PASSWORD_MAX_LENGTH) {
    setErrorMessage('registerUser.passwordTooLong');
    return;
  }

  if (!PASSWORD_COMPLEXITY_REGEX.test(form.password)) {
    setErrorMessage('registerUser.passwordWeak');
    return;
  }

  if (!form.confirmPassword) {
    setErrorMessage('registerUser.confirmPasswordRequired');
    return;
  }

  if (form.password !== form.confirmPassword) {
    setErrorMessage('registerUser.passwordMismatch');
    return;
  }

  isSubmitting.value = true;

  try {
    await api.post('/auth/register', {
      name: form.name,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    resetForm();
    isSuccess.value = true;
    statusMessage.value = '';
    statusMessageType.value = 'success';
    emit('success');
  } catch {
    setErrorMessage('registerUser.genericError');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.register-user {
  width: min(360px, 100%);
}

.register-form {
  width: 100%;
}

.register-actions {
  width: 100%;
}

.register-cancel {
  color: inherit;
  text-decoration: underline;
  padding: 0;
  min-height: unset;
}

.auth-message {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  text-align: center;
  line-height: 1.4;
}

.auth-message.error {
  background: rgba(244, 67, 54, 0.12);
  color: #c62828;
}

.auth-message.success {
  background: rgba(76, 175, 80, 0.14);
  color: #256029;
}

.register-success {
  max-width: 320px;
}

.register-success p {
  margin: 0;
}
</style>
