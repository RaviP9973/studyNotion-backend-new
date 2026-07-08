import redisClient from "./config/redis.js";
import express from "express";
const app = express();

import userRoutes from "./routes/User.js";
import profileRoutes from "./routes/Profile.js";
import paymentRoutes from "./routes/Payments.js";
import courseRoutes from "./routes/Course.js";
import contactUsRoutes from "./routes/ContactUs.js";

redisClient
  .connect()
  .then(() => {
    console.log("Connected to Redis");
  })
  .catch((error) => {
    console.error("error ", error);
  });

import * as db from "./config/database.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { cloudinaryConnect } from "./config/cloudinary.js";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import { frontendUrl } from "./constants.js/url.js";
import { connectRabbitMq } from "./config/rabbitmq.js";
dotenv.config();
const port = process.env.PORT || 4000;

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
);

db.connect();
connectRabbitMq();
cloudinaryConnect();

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/contact", contactUsRoutes);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running.....",
  });
});

app.listen(port, () => {
  console.log(`app is running at ${port}`);
});
