import type { NextConfig } from "next";

// cacheComponents fica desligado: o app é todo autenticado e dinâmico (ver docs/DECISOES.md, D03).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
