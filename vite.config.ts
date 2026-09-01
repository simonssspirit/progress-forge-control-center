import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/progress-forge-control-center/",
  plugins: [react()],
});
