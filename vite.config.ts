import { defineConfig } from "vite";
import vinext from "vinext";
import { nitro } from "nitro/vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "1" ? "/fengsheng-field/" : "/",
  plugins: [vinext(), nitro()],
});
