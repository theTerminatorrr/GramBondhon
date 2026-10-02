import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        homepage: resolve(__dirname, 'homepage.html'),
        investor: resolve(__dirname, 'investor.html'),
        investor_airisk: resolve(__dirname, 'investor_airisk.html'),
        investor_dashboard: resolve(__dirname, 'investor_dashboard.html'),
        investor_financials: resolve(__dirname, 'investor_financials.html'),
        investor_marketplace: resolve(__dirname, 'investor_marketplace.html'),
        investor_profile: resolve(__dirname, 'investor_profile.html'),
        investor_projects: resolve(__dirname, 'investor_projects.html'),
        login: resolve(__dirname, 'login.html'),
        marketplace: resolve(__dirname, 'marketplace.html'),
        orders: resolve(__dirname, 'orders.html'),
        register: resolve(__dirname, 'register.html'),
        admin: resolve(__dirname, 'Admin/admin.html'),
        farmer: resolve(__dirname, 'Farmer/farmer.html'),
      }
    }
  }
});
