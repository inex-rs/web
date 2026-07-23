import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import solidRolldown from "rolldown-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  assetsInclude: ["**/*.glb"],
  optimizeDeps: {
    include: ["@tabler/icons-solidjs"],
    rolldownOptions: {
      plugins: [solidRolldown()],
    },
  },
  resolve: {
    alias: {
      "@inex/protobufs": "@jsr/inex__protobufs",
    },
    dedupe: ["@bufbuild/protobuf"],
  },
});
