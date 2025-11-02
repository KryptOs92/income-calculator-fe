import { defineStore } from 'pinia';

const TOKEN_STORAGE_KEY = 'auth-token';

type JwtPayload = {
  exp?: number;
  [key: string]: unknown;
};

function parseJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );

    return JSON.parse(json) as JwtPayload;
  } catch (error) {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const data = parseJwt(token);
  if (!data?.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return data.exp <= now;
}

interface UserState {
  isAuthenticated: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    isAuthenticated: false,
  }),

  actions: {
    evaluateToken() {
      if (typeof window === 'undefined') {
        this.isAuthenticated = false;
        return;
      }

      const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token || isTokenExpired(token)) {
        this.isAuthenticated = false;
        return;
      }

      this.isAuthenticated = true;
    },
  },
});
