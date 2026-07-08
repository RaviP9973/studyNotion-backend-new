import { createClient } from "redis";

import dotenv from "dotenv";
dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL,
});

export default redisClient;