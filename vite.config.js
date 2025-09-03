import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/CAPA/", // <<— EXACT repo name with slashes
  server: {
    proxy: {
      "/ollama": {
        target: "http://localhost:11434",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ""),
      },
      "/rag": {
        target: "http://localhost:7070",
        changeOrigin: true,
        // Keep prefix so frontend calls /rag/api/* map to server /api/*
        rewrite: (path) => path.replace(/^\/rag/, ""),
      },
    },
  },
});
