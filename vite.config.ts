import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  server: {
    proxy: {
      "/api/": {
        target: "http://0.0.0.0:8787/",
      },
    },
  },
});
