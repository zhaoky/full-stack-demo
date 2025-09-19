import { defineStore } from 'pinia';

interface AppState {
  title: string;
  language: string;
  theme: 'light' | 'dark';
  collapsed: boolean;
  device: 'desktop' | 'mobile';
  loading: boolean;
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    title: import.meta.env.VITE_APP_TITLE || 'MA良医后台',
    language: localStorage.getItem('language') || 'zh-cn',
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    collapsed: localStorage.getItem('sidebar-collapsed') === 'true',
    device: 'desktop',
    loading: false,
  }),

  getters: {
    isMobile: (state): boolean => {
      return state.device === 'mobile';
    },

    isDark: (state): boolean => {
      return state.theme === 'dark';
    },
  },

  actions: {
    /**
     * 设置页面标题
     */
    setTitle(title: string): void {
      this.title = title;
      document.title = title;
    },

    /**
     * 切换语言
     */
    setLanguage(language: string): void {
      this.language = language;
      localStorage.setItem('language', language);
    },

    /**
     * 切换主题
     */
    toggleTheme(): void {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', this.theme);
      this.applyTheme();
    },

    /**
     * 应用主题
     */
    applyTheme(): void {
      const html = document.documentElement;
      if (this.theme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    },

    /**
     * 切换侧边栏折叠状态
     */
    toggleSidebar(): void {
      this.collapsed = !this.collapsed;
      localStorage.setItem('sidebar-collapsed', String(this.collapsed));
    },

    /**
     * 设置设备类型
     */
    setDevice(device: 'desktop' | 'mobile'): void {
      this.device = device;

      // 移动端自动折叠侧边栏
      if (device === 'mobile') {
        this.collapsed = true;
      }
    },

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean): void {
      this.loading = loading;
    },

    /**
     * 初始化应用
     */
    initApp(): void {
      // 应用主题
      this.applyTheme();

      // 检测设备类型
      this.detectDevice();

      // 监听窗口大小变化
      window.addEventListener('resize', this.detectDevice);
    },

    /**
     * 检测设备类型
     */
    detectDevice(): void {
      const width = window.innerWidth;
      this.setDevice(width < 768 ? 'mobile' : 'desktop');
    },
  },
});
