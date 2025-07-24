import dotenv from "dotenv";
import { resolve } from "path";

const env = process.env.NODE_ENV || "local";
dotenv.config({ path: resolve(process.cwd(), `.env.${env}`) });
