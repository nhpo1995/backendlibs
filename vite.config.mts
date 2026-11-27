import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root: path.join(root, "frontend"),
  base: process.env.PUBLIC_BASE || "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 8765,
    strictPort: true,
    fs: { allow: [root] },
  },
  preview: { host: "127.0.0.1", port: 5174, strictPort: true },
  build: { outDir: path.join(root, "dist"), emptyOutDir: true },
});
