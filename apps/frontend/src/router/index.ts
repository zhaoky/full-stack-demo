import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@stores/user';
import { useAppStore } from '@stores/app';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// 配置 NProgress
NProgress.configure({
  showSpinner: false,
  minimum: 0.2,
  easing: 'ease',
  speed: 500,
});

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/main/users',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@views/auth/LoginView.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@views/auth/RegisterView.vue'),
    meta: {
      title: '注册',
      requiresAuth: false,
    },
  },
  {
    path: '/main',
    component: () => import('@views/layout/LayoutView.vue'),
    redirect: '/main/users',
    children: [
      {
        path: 'users',
        name: 'Users',
        component: () => import('@views/users/UserListView.vue'),
        meta: {
          title: '用户管理',
          requiresAuth: true,
          roles: ['admin'],
          icon: 'User',
        },
      },
      {
        path: 'rankings',
        name: 'Rankings',
        component: () => import('@views/rankings/RankingListView.vue'),
        meta: {
          title: '排行榜',
          requiresAuth: true,
          icon: 'TrophyBase',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/main/users',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// 路由守卫
router.beforeEach(async (to, _, next) => {
  console.log('beforeEach', to);
  NProgress.start();

  const userStore = useUserStore();
  const appStore = useAppStore();

  // 设置页面标题
  const title = to.meta?.title as string;
  if (title) {
    appStore.setTitle(`${title} - ${appStore.title}`);
  }

  // 检查是否需要认证
  if (to.meta?.requiresAuth) {
    // 检查是否已登录
    if (!userStore.token) {
      next('/login');
      return;
    }

    // 检查登录状态是否有效
    if (!userStore.isLoggedIn) {
      const isValid = await userStore.checkLoginStatus();
      if (!isValid) {
        next('/login');
        return;
      }
    }

    // 检查角色权限
    const requiredRoles = to.meta?.roles as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      if (!userStore.userInfo || !requiredRoles.includes(userStore.userInfo.role)) {
        // 如果没有权限，重定向到排行榜页面（所有用户都可以访问）
        next('/main/rankings');
        return;
      }
    }
  }

  // 如果已登录用户访问登录/注册页，重定向到用户列表页
  if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    next('/main/users');
    return;
  }

  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
