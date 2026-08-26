import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	base: process.env.GITHUB_PAGES ? "/builder-scaffold/" : "/",
	plugins: [react()],
	resolve: {
		dedupe: [
			"react",
			"react-dom",
			"react/jsx-runtime",
			"@mysten/dapp-kit-core",
			"@mysten/dapp-kit-react",
		],
	},
});
