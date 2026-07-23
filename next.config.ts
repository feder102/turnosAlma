import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone: server + dependencias mínimas, usado por el
  // Dockerfile para una imagen de runtime liviana (Coolify / docker-compose).
  output: "standalone",
};

export default nextConfig;
