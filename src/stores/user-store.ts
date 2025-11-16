import { defineStore } from "pinia";
import { api } from "boot/axios";

export const TOKEN_STORAGE_KEY = "auth-token";
const REFRESH_THRESHOLD_SECONDS = 60 * 5;

type JwtPayload = {
  exp?: number;
  [key: string]: unknown;
};

function parseJwt(token: string): JwtPayload | null {
  try {
    const segments = token.split(".");
    const payload = segments[1];

    if (!payload) {
      return null;
    }

    const json = decodeURIComponent(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function secondsUntilExpiration(token: string): number | null {
  const data = parseJwt(token);
  if (!data?.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  return data.exp - now;
}

interface UserState {
  isAuthenticated: boolean;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    isAuthenticated: false,
  }),

  actions: {
    async evaluateToken(): Promise<boolean> {
      if (typeof window === "undefined") {
        this.isAuthenticated = false;
        return false;
      }

      const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) {
        this.isAuthenticated = false;
        return false;
      }

      const secondsRemaining = secondsUntilExpiration(token);

      if (secondsRemaining === null) {
        this.logout();
        return false;
      }

      if (secondsRemaining <= REFRESH_THRESHOLD_SECONDS) {
        return this.refreshToken();
      }

      this.isAuthenticated = true;
      return true;
    },

    async refreshToken(): Promise<boolean> {
      if (typeof window === "undefined") {
        this.isAuthenticated = false;
        return false;
      }

      try {
        const response = await api.post("/auth/refresh");
        const newToken = response?.data?.token as string | undefined;

        if (!newToken) {
          throw new Error("missing-token");
        }

        window.localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
        this.isAuthenticated = true;
        return true;
      } catch {
        this.logout();
        return false;
      }
    },

    logout() {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      this.isAuthenticated = false;
    },
  },
});
