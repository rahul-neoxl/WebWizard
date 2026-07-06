import {defineConfig, loadEnv} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), "");
  const ssl = env.VITE_SSL !== "false";
  const apiHost = env.VITE_API_HOST || "api.orgbeat.com";
  const apiTarget = `${ssl ? "https" : "http"}://${apiHost}`;

  const proxyOptions = {
    target: apiTarget,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: "",
  };

  return {
    plugins: [react()],
    build: {
      outDir: "build",
      // Never ship source maps (deploy gate: scripts/assert-no-sourcemaps.sh).
      sourcemap: false,
      emptyOutDir: true,
    },
    server: {
      // Default 3000 (product requirement); PORT env lets tooling (e.g. the
      // preview harness) run a second instance without conflicting.
      port: Number(process.env.PORT) || 3000,
      strictPort: true,
      proxy: {
        // OTP, user, store, studio create — global entId
        "/global/rpc": proxyOptions,
        // Deploy + status polling — enterprise entId (e-…)
        "^/e-.+/rpc": proxyOptions,
      },
    },
  };
});
