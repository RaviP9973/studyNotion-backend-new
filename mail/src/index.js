import express from "express"
import dotenv from 'dotenv'
import { sendOtpConsumer } from "./utils/consumer.js"

dotenv.config();

sendOtpConsumer();
const app = express();


app.listen(process.env.PORT, () => {
    console.log("mail service is running on port ",process.env.PORT);
})