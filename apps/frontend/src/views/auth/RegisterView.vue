<template>
  <div class="register-container">
    <div class="register-background"></div>

    <div class="register-card">
      <div class="register-header">
        <h1 class="register-title">创建账户</h1>
        <p class="register-subtitle">加入我们，开始您的旅程</p>
      </div>

      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="register-form" size="large" @submit.prevent="handleRegister">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item prop="firstName">
              <el-input v-model="registerForm.firstName" placeholder="名字" prefix-icon="User" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="lastName">
              <el-input v-model="registerForm.lastName" placeholder="姓氏" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="用户名（可选）" prefix-icon="Avatar" clearable />
        </el-form-item>

        <el-form-item prop="email">
          <el-input v-model="registerForm.email" placeholder="邮箱地址（可选）" prefix-icon="Message" clearable />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="密码（可选）" prefix-icon="Lock" show-password clearable @input="checkPasswordStrength" />
          <div v-if="passwordStrength.message" class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :class="passwordStrength.level" :style="{ width: passwordStrength.width }"></div>
            </div>
            <span class="strength-text" :class="passwordStrength.level">
              {{ passwordStrength.message }}
            </span>
          </div>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" prefix-icon="Lock" show-password clearable @keyup.enter="handleRegister" />
        </el-form-item>

        <div class="terms-agreement">
          <el-checkbox v-model="agreeTerms" class="agree-checkbox">
            我已阅读并同意
            <el-link type="primary" class="terms-link">服务条款</el-link>
            和
            <el-link type="primary" class="privacy-link">隐私政策</el-link>
          </el-checkbox>
        </div>

        <el-button type="primary" class="register-button" :loading="loading" :disabled="!agreeTerms" @click="handleRegister">
          {{ loading ? '注册中...' : '创建账户' }}
        </el-button>

        <div class="login-link">
          <span>已有账户？</span>
          <el-link type="primary" @click="goToLogin"> 立即登录 </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElForm, ElMessage } from 'element-plus';
import type { CreateUserRequest } from '@types/api';
import { register } from '@api/user';
import { isValidEmail, validatePassword } from '@utils/index';

const router = useRouter();

const registerFormRef = ref<InstanceType<typeof ElForm>>();
const loading = ref(false);
const agreeTerms = ref(false);

const registerForm = reactive<CreateUserRequest & { confirmPassword: string }>({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const passwordStrength = ref({
  level: '',
  message: '',
  width: '0%',
});

const registerRules = {
  firstName: [
    // 无验证模式：移除必填验证
  ],
  lastName: [
    // 无验证模式：移除验证
  ],
  username: [
    // 无验证模式：移除所有验证规则
  ],
  email: [
    // 无验证模式：移除所有验证规则
  ],
  password: [
    // 无验证模式：移除所有验证规则
  ],
  confirmPassword: [
    // 无验证模式：移除所有验证规则
  ],
};

const checkPasswordStrength = (password: string) => {
  if (!password) {
    passwordStrength.value = { level: '', message: '', width: '0%' };
    return;
  }

  let score = 0;
  let message = '';
  let level = '';

  // 长度检查
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;

  // 复杂度检查
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score <= 2) {
    level = 'weak';
    message = '密码强度：弱';
  } else if (score <= 4) {
    level = 'medium';
    message = '密码强度：中等';
  } else {
    level = 'strong';
    message = '密码强度：强';
  }

  passwordStrength.value = {
    level,
    message,
    width: `${(score / 6) * 100}%`,
  };
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;

  if (!agreeTerms.value) {
    ElMessage.warning('请先同意服务条款和隐私政策');
    return;
  }

  try {
    const valid = await registerFormRef.value.validate();
    if (!valid) return;

    loading.value = true;

    const { confirmPassword, ...registerData } = registerForm;

    const response = await register(registerData);

    ElMessage.success('注册成功！请登录您的账户');
    router.push('/login');
  } catch (error: any) {
    console.error('注册失败:', error);
    ElMessage.error(error.response?.data?.message || '注册失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped lang="scss">
.register-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  padding: var(--spacing-lg) 0;
}

.register-background {
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

.register-card {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 var(--spacing-lg);
  padding: var(--spacing-2xl) var(--spacing-xl);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.register-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.register-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color-primary);
  margin: 0 0 var(--spacing-sm);
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-color-tertiary);
  margin: 0;
  font-weight: var(--font-weight-normal);
}

.register-form {
  .el-form-item {
    margin-bottom: var(--spacing-lg);

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

.password-strength {
  margin-top: var(--spacing-xs);

  .strength-bar {
    height: 4px;
    background: #e5e5ea;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: var(--spacing-xs);

    .strength-fill {
      height: 100%;
      border-radius: 2px;
      transition: all var(--transition-normal);

      &.weak {
        background: var(--color-error);
      }

      &.medium {
        background: var(--color-warning);
      }

      &.strong {
        background: var(--color-success);
      }
    }
  }

  .strength-text {
    font-size: var(--font-size-xs);

    &.weak {
      color: var(--color-error);
    }

    &.medium {
      color: var(--color-warning);
    }

    &.strong {
      color: var(--color-success);
    }
  }
}

.terms-agreement {
  margin-bottom: var(--spacing-xl);

  .agree-checkbox {
    :deep(.el-checkbox__label) {
      color: var(--text-color-secondary);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
    }
  }

  .terms-link,
  .privacy-link {
    font-size: var(--font-size-sm);
    text-decoration: none;
    margin: 0 2px;

    &:hover {
      text-decoration: underline;
    }
  }
}

.register-button {
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

  &:hover:not(.is-disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active:not(.is-disabled) {
    transform: translateY(0);
  }

  &.is-loading,
  &.is-disabled {
    opacity: 0.6;
    transform: none;
    cursor: not-allowed;
  }
}

.login-link {
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
  .register-card {
    margin: var(--spacing-md);
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .register-title {
    font-size: var(--font-size-2xl);
  }

  .register-form {
    .el-col {
      margin-bottom: var(--spacing-sm);
    }
  }
}

// 动画效果
.register-card {
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
