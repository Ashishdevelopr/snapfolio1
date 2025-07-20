import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Temporarily disabled due to errors
// import { cartographer } from "@replit/vite-plugin-cartographer";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    // Temporarily disabled due to errors
    // cartographer(),
    runtimeErrorModal(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://generatedassets1.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
}); 
