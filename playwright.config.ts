// playwright.config.ts
import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
	use: {
		// All requests we send go to this API endpoint.
		baseURL: "http://localhost:4040",
		extraHTTPHeaders: {},
		trace: "on-first-retry",
	},
};
export default config;
