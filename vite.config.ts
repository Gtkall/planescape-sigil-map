import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/planescape-sigil-map.ts"),
      formats: ["es"],
      fileName: "planescape-sigil-map",
    },
    rollupOptions: {
      // Foundry VTT globals — don't bundle these
      external: [/^foundry/, /^pixi/],
    },
    watch: process.argv.includes("--watch") ? {
      include: ["src/**", "module.json"],
    } : null,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "module.json", dest: "." },
        { src: "src/artwork/*", dest: "artwork" },
        { src: "src/icons/*", dest: "icons" },
        { src: "src/packs/*", dest: "packs" },
        { src: "src/dataset/*", dest: "dataset" },
        { src: "LICENSE", dest: "." },
      ],
    }),
  ],
});
