import path from "path";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

  base: '/Hot-Cocoa-Tapper/',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [...mochaPlugins(process.env as any), cloudflare()],
  server: {
    allowedHosts: true,
    middlewareMode: false,
    fs: {
      allow: ["src"],
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".mts", ".ts", ".mtsx", ".tsx", ".json"],
  },
});

export default defineConfig({
  base: '/',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [...mochaPlugins(process.env as any), cloudflare()],
  server: {
    allowedHosts: true,
    middlewareMode: false,
    fs: {
      allow: ["src"],
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".mts", ".ts", ".mtsx", ".tsx", ".json"],
  },
});
