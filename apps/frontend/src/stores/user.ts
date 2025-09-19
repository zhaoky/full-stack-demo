import { defineStore } from 'pinia';
import type { IUser, AuthResponse, RefreshTokenResponse, UserState } from '@shared/types';
import type { LoginRequest } from '@/types/api';
import { login, getCurrentUser, refreshToken, logout as logoutApi } from '@api/user';
import { showSuccess } from '@utils/index';

// 使用共享类型中的UserState，但需要扩展以包含token信息
interface ExtendedUserState extends Omit<UserState, 'token'> {
  accessToken: string | null;
  refreshToken: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): ExtendedUserState => ({
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    userInfo: null,
    isLoggedIn: false,
  }),

  getters: {
    // 为了兼容性添加 token getter
    token: (state): string | null => {
      return state.accessToken;
    },

    isAdmin: (state): boolean => {
      return state.userInfo?.role === 'admin';
    },

    isModerator: (state): boolean => {
      return state.userInfo?.role === 'moderator' || state.userInfo?.role === 'admin';
    },

    displayName: (state): string => {
      if (!state.userInfo) return '';
      const { firstName, lastName, username } = state.userInfo;
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      return username;
    },

    hasPermission: (state) => {
      return (roles: string[]): boolean => {
        if (!state.userInfo) return false;
        return roles.includes(state.userInfo.role);
      };
    },
  },

  actions: {
    /**
     * 登录
     */
    async login(loginData: LoginRequest): Promise<boolean> {
      try {
        const response = await login(loginData);
        const { accessToken, refreshToken: refreshTokenValue, user } = response.data as AuthResponse;

        this.accessToken = accessToken;
        this.refreshToken = refreshTokenValue;
        this.userInfo = user;
        this.isLoggedIn = true;

        // 保存 token 到本地存储
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshTokenValue);

        showSuccess('登录成功');
        return true;
      } catch (error) {
        console.error('登录失败:', error);
        return false;
      }
    },

    /**
     * 获取当前用户信息
     */
    async getCurrentUserInfo(): Promise<void> {
      try {
        if (!this.accessToken) return;

        const response = await getCurrentUser();
        this.userInfo = response.data as IUser;
        this.isLoggedIn = true;
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 避免无限循环，直接清除状态而不调用 logout
        this.accessToken = null;
        this.refreshToken = null;
        this.userInfo = null;
        this.isLoggedIn = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },

    /**
     * 刷新访问令牌
     */
    async refreshAccessToken(): Promise<boolean> {
      try {
        if (!this.refreshToken) {
          // 直接清除状态，避免调用 logout 导致循环
          this.accessToken = null;
          this.refreshToken = null;
          this.userInfo = null;
          this.isLoggedIn = false;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return false;
        }
        console.log('要请求refresh-token');
        const response = await refreshToken({ refreshToken: this.refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data as RefreshTokenResponse;

        console.log('refresh-token成功');

        this.accessToken = accessToken;
        this.refreshToken = newRefreshToken;

        // 更新本地存储
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        return true;
      } catch (error) {
        console.error('刷新令牌失败:', error);
        // 直接清除状态，避免调用 logout 导致循环
        this.accessToken = null;
        this.refreshToken = null;
        this.userInfo = null;
        this.isLoggedIn = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return false;
      }
    },

    /**
     * 登出
     */
    async logout(): Promise<void> {
      try {
        // 调用后端登出接口
        if (this.accessToken) {
          await logoutApi();
        }
      } catch (error) {
        console.error('调用登出接口失败:', error);
      } finally {
        // 清除状态和本地存储
        this.accessToken = null;
        this.refreshToken = null;
        this.userInfo = null;
        this.isLoggedIn = false;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        showSuccess('已退出登录');
      }
    },

    /**
     * 更新用户信息
     */
    updateUserInfo(userInfo: Partial<IUser>): void {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...userInfo };
      }
    },

    /**
     * 检查登录状态
     */
    async checkLoginStatus(): Promise<boolean> {
      if (!this.accessToken) {
        return false;
      }

      try {
        await this.getCurrentUserInfo();
        return true;
      } catch (error) {
        return false;
      }
    },

    /**
     * 获取当前访问令牌
     */
    getAccessToken(): string | null {
      return this.accessToken;
    },
  },
});
