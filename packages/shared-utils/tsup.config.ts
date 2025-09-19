import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // 暂时禁用DTS构建
  clean: true,
  splitting: false,
  sourcemap: true,
});
