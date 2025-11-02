import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/IndexPage.vue") }],
  },
  {
    path: "/wallets",
    component: () => import("layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        component: () => import("pages/WalletsPage.vue"),
      },
    ],
  },
  {
    path: "/overview",
    component: () => import("layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "overview",
        component: () => import("pages/OverviewPage.vue"),
      },
    ],
  },
  {
    path: "/sign-in",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "sign-in",
        component: () => import("pages/SignInPage.vue"),
      },
    ],
  },
  {
    path: "/reset-password",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "reset-password",
        component: () => import("pages/ResetPasswordPage.vue"),
      },
    ],
  },
  {
    path: "/verify",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "verify",
        component: () => import("pages/VerifyPage.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
