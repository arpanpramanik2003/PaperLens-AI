import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("jspdf") || id.includes("docx") || id.includes("html2canvas") || id.includes("file-saver")) {
              return "vendor-export";
            }
            if (id.includes("@clerk")) {
              return "vendor-clerk";
            }
            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("@tanstack") || id.includes("react-router-dom")) {
              return "vendor-core";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
          }
        },
      },
    },
  },
}));
