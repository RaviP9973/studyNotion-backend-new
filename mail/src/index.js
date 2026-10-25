import express from "express"
import dotenv from 'dotenv'
import { sendOtpConsumer } from "./utils/consumer.js"

dotenv.config();

const app = express();
const port = process.env.PORT || 4001;

app.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        service: "mail",
        status: "ok",
    });
});

sendOtpConsumer();

app.listen(port, () => {
    console.log("mail service is running on port ", port);
})