<template>
  <div class="login-container">
    <div class="login-background"></div>

    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">欢迎回来</h1>
        <p class="login-subtitle">登录您的账户以继续</p>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form" size="large" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名（可选）" prefix-icon="User" clearable @keyup.enter="handleLogin" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="密码（可选）" prefix-icon="Lock" show-password clearable @keyup.enter="handleLogin" />
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="rememberMe" class="remember-me"> 记住我 </el-checkbox>
          <el-link type="primary" class="forgot-password"> 忘记密码？ </el-link>
        </div>

        <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </el-button>

        <div class="register-link">
          <span>还没有账户？</span>
          <el-link type="primary" @click="goToRegister"> 立即注册 </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElForm, ElMessage } from 'element-plus';
import { useUserStore } from '@stores/user';
import type { LoginRequest } from '@types/api';
import { isValidEmail } from '@utils/index';

const router = useRouter();
const userStore = useUserStore();

const loginFormRef = ref<InstanceType<typeof ElForm>>();
const loading = ref(false);
const rememberMe = ref(false);

const loginForm = reactive<LoginRequest>({
  username: '',
  password: '',
});

const loginRules = {
  username: [
    // 无验证模式：移除所有验证规则
  ],
  password: [
    // 无验证模式：移除所有验证规则
  ],
};

const handleLogin = async () => {
  try {
    loading.value = true;

    // 无验证模式：直接尝试登录，无需表单验证
    const success = await userStore.login(loginForm);
    if (success) {
      ElMessage.success('登录成功！');
      router.push('/main/users');
    }
  } catch (error) {
    console.error('登录失败:', error);
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped lang="scss">
.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g"><stop stop-color="%23ffffff" stop-opacity="0.1"/><stop offset="1" stop-color="%23ffffff" stop-opacity="0"/></radialGradient></defs><circle cx="20" cy="20" r="20" fill="url(%23g)"/><circle cx="80" cy="80" r="30" fill="url(%23g)"/><circle cx="40" cy="70" r="15" fill="url(%23g)"/></svg>')
    no-repeat;
  background-size: cover;
  opacity: 0.1;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 var(--spacing-lg);
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.login-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color-primary);
  margin: 0 0 var(--spacing-sm);
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-color-tertiary);
  margin: 0;
  font-weight: var(--font-weight-normal);
}

.login-form {
  .el-form-item {
    margin-bottom: var(--spacing-xl);

    :deep(.el-input__inner) {
      height: 48px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: var(--border-radius-medium);
      font-size: var(--font-size-md);
      transition: all var(--transition-normal);

      &:focus {
        background: rgba(255, 255, 255, 1);
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    :deep(.el-input__prefix) {
      color: var(--text-color-tertiary);
    }
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);

  .remember-me {
    :deep(.el-checkbox__label) {
      color: var(--text-color-secondary);
      font-size: var(--font-size-sm);
    }
  }

  .forgot-password {
    font-size: var(--font-size-sm);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-medium);
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  margin-bottom: var(--spacing-xl);
  transition: all var(--transition-normal);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &.is-loading {
    opacity: 0.8;
    transform: none;
  }
}

.register-link {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);

  .el-link {
    margin-left: var(--spacing-xs);
    font-weight: var(--font-weight-medium);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-card {
    margin: var(--spacing-md);
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .login-title {
    font-size: var(--font-size-2xl);
  }
}

// 动画效果
.login-card {
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
