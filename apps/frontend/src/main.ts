import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './stores';

// Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 样式
import '@styles/variables.scss';
import '@styles/global.scss';

// NProgress
import 'nprogress/nprogress.css';

// 创建应用实例
const app = createApp(App);

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 使用插件
app.use(router);
app.use(pinia);
app.use(ElementPlus);

// 挂载应用
app.mount('#app');
