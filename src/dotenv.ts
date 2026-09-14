import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
