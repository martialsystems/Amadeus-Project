import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@framework": path.resolve(
        __dirname,
        "./cubism/Framework/src"
      ),
    },
  },
});