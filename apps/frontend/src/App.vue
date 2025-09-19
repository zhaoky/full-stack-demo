<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue';
import { useAppStore } from '@stores/app';
console.log('App.vue');
const appStore = useAppStore();

onMounted(async () => {
  // 初始化应用
  appStore.initApp();

  // 确保 DOM 更新完成后移除加载动画
  await nextTick();
  const loadingElement = document.querySelector('.loading');
  if (loadingElement) {
    loadingElement.remove();
  }
});
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
