import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node-native / WASM paketleri webpack bundle'ına sokulmaz; çalışma zamanında
  // node_modules'tan yüklenir (pglite WASM dosya yolu sorunu yaşanmaz).
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
