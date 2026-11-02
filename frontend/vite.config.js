import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: frontendRoot,

  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/test/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  },
});
