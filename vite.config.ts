import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname, 'frontend'),
  publicDir: resolve(__dirname, 'frontend/public'),
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/dist/**', '**/.git/**']
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
        homepage: resolve(__dirname, 'frontend/homepage.html'),
        investor: resolve(__dirname, 'frontend/investor.html'),
        investor_airisk: resolve(__dirname, 'frontend/investor_airisk.html'),
        investor_dashboard: resolve(__dirname, 'frontend/investor_dashboard.html'),
        investor_financials: resolve(__dirname, 'frontend/investor_financials.html'),
        investor_marketplace: resolve(__dirname, 'frontend/investor_marketplace.html'),
        investor_profile: resolve(__dirname, 'frontend/investor_profile.html'),
        investor_projects: resolve(__dirname, 'frontend/investor_projects.html'),
        login: resolve(__dirname, 'frontend/login.html'),
        marketplace: resolve(__dirname, 'frontend/marketplace.html'),
        orders: resolve(__dirname, 'frontend/orders.html'),
        register: resolve(__dirname, 'frontend/register.html'),
        admin: resolve(__dirname, 'frontend/Admin/admin.html'),
        farmer: resolve(__dirname, 'frontend/Farmer/farmer.html'),
      }
    }
  }
});
