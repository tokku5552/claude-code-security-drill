import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tokku5552.github.io',
  base: '/claude-code-security-drill',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    assets: 'assets',
  },
});
