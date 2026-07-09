import dotenv from "dotenv"
dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development"
export const frontendUrl = nodeEnv === "development" ? "http://localhost:5173" : "http://study-notion.duckdns.org";
