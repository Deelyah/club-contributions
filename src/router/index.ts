import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: () => '/login' },
    {
      path: '/login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      component: () => import('../pages/RegisterPage.vue'),
      meta: { guest: true }
    },
    {
      path: '/member',
      component: () => import('../pages/member/DashboardPage.vue'),
      meta: { requiresAuth: true, role: 'member' }
    },
    {
      path: '/admin',
      component: () => import('../pages/admin/DashboardPage.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/members/:id',
      component: () => import('../pages/admin/MemberDetailPage.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.token) return '/login'

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return auth.user?.role === 'admin' ? '/admin' : '/member'
  }

  if (to.meta.guest && auth.token) {
    return auth.user?.role === 'admin' ? '/admin' : '/member'
  }
})

export default router
