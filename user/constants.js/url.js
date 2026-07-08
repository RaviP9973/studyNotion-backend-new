import dotenv from "dotenv"
dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development"
export const frontendUrl = nodeEnv === "development" ? "http://localhost:5173" : "https://study-notion-frontend-two-olive.vercel.app";
