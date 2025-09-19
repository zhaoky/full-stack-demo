<template>
  <div class="layout-container">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="asideWidth" class="layout-aside" :class="{ 'is-collapsed': appStore.collapsed }">
        <div class="aside-header">
          <div class="logo">
            <el-icon class="logo-icon">
              <Trophy />
            </el-icon>
            <span v-show="!appStore.collapsed" class="logo-text"> 管理系统 </span>
          </div>
        </div>

        <el-scrollbar class="aside-scrollbar">
          <el-menu :default-active="activeMenu" class="aside-menu" :collapse="appStore.collapsed" router>
            <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path" :disabled="!hasPermission(item.meta?.roles)">
              <el-icon>
                <component :is="item.meta?.icon" />
              </el-icon>
              <template #title>{{ item.meta?.title }}</template>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <!-- 顶部导航 -->
        <div class="layout-header">
          <div class="header-left">
            <el-button text @click="appStore.toggleSidebar" class="collapse-btn">
              <el-icon>
                <Expand v-if="appStore.collapsed" />
                <Fold v-else />
              </el-icon>
            </el-button>

            <div class="breadcrumb">
              <span class="current-page">{{ currentPageTitle }}</span>
            </div>
          </div>

          <div class="header-right">
            <el-button text @click="appStore.toggleTheme">
              <el-icon>
                <Moon v-if="!appStore.isDark" />
                <Sunny v-else />
              </el-icon>
            </el-button>

            <el-dropdown @command="handleUserCommand">
              <div class="user-profile">
                <el-avatar :src="userStore.userInfo?.avatar" class="user-avatar">
                  {{ userStore.displayName.charAt(0) }}
                </el-avatar>
                <span class="user-name">{{ userStore.displayName }}</span>
                <el-icon class="dropdown-arrow">
                  <ArrowDown />
                </el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 页面内容 -->
        <div class="page-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useUserStore } from '@stores/user';
import { useAppStore } from '@stores/app';
import { Trophy, Expand, Fold, Moon, Sunny, User, ArrowDown, SwitchButton, HomeFilled, UserFilled, TrophyBase } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();

// 菜单项配置
const menuItems = [
  {
    path: '/main/users',
    meta: { title: '用户管理', icon: 'User', roles: ['admin'] },
  },
  {
    path: '/main/rankings',
    meta: { title: '排行榜', icon: 'TrophyBase' },
  },
];

// 计算属性
const asideWidth = computed(() => {
  return appStore.collapsed ? '64px' : '240px';
});

const activeMenu = computed(() => {
  return route.path;
});

const currentPageTitle = computed(() => {
  return (route.meta?.title as string) || '首页';
});

// 权限检查
const hasPermission = (roles?: string[]) => {
  if (!roles || roles.length === 0) return true;
  return userStore.hasPermission(roles);
};

// 用户操作处理
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
          confirmButtonText: '退出',
          cancelButtonText: '取消',
          type: 'warning',
        });
        await userStore.logout();
        router.push('/login');
      } catch {
        // 用户取消操作
      }
      break;
  }
};
</script>

<style scoped lang="scss">
.layout-container {
  min-height: 100vh;
  background: var(--bg-color-secondary);
}

.layout-aside {
  background: var(--bg-color-primary);
  border-right: 1px solid var(--border-color-secondary);
  transition: width var(--transition-normal);

  &.is-collapsed {
    .logo-text {
      opacity: 0;
    }
  }
}

.aside-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--border-color-secondary);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);

  .logo-icon {
    font-size: 24px;
  }

  .logo-text {
    transition: opacity var(--transition-normal);
  }
}

.aside-scrollbar {
  height: calc(100vh - 64px);
}

.aside-menu {
  border-right: none;

  :deep(.el-menu-item) {
    height: 56px;
    line-height: 56px;
    margin: 4px 8px;
    border-radius: var(--border-radius-medium);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--color-gray-6);
    }

    &.is-active {
      background: var(--color-primary);
      color: white;

      .el-icon {
        color: white;
      }
    }
  }
}

.layout-main {
  padding: 0;
  background: var(--bg-color-secondary);
}

.layout-header {
  height: 64px;
  background: var(--bg-color-primary);
  border-bottom: 1px solid var(--border-color-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  box-shadow: var(--shadow-small);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.collapse-btn {
  font-size: 18px;
  color: var(--text-color-secondary);

  &:hover {
    background: var(--color-gray-6);
  }
}

.breadcrumb {
  .current-page {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-color-primary);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background: var(--color-gray-6);
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    background: var(--color-primary);
    color: white;
    font-weight: var(--font-weight-semibold);
  }

  .user-name {
    font-size: var(--font-size-sm);
    color: var(--text-color-primary);
    font-weight: var(--font-weight-medium);
  }

  .dropdown-arrow {
    font-size: 12px;
    color: var(--text-color-tertiary);
    transition: transform var(--transition-fast);
  }
}

.page-content {
  padding: var(--spacing-lg);
  min-height: calc(100vh - 64px);
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .layout-aside {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);

    &:not(.is-collapsed) {
      transform: translateX(0);
    }
  }

  .layout-main {
    margin-left: 0;
  }

  .page-content {
    padding: var(--spacing-md);
  }

  .header-left {
    .breadcrumb {
      display: none;
    }
  }

  .user-profile {
    .user-name {
      display: none;
    }
  }
}
</style>
