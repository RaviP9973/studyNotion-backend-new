import amqp from "amqplib"
import dotenv from "dotenv"

dotenv.config();

export const connectRabbitMq = async () => {
    try {
        const connection = await amqp.connect({
            hostname: process.env.RABBITMQ_HOST,
            protocol: "amqp",
            port: 5672,
            username: process.env.RABBITMQ_USER,
            password: process.env.RABBITMQ_PASS,
        })

        const channel = await connection.createChannel();
        console.log("connected  to rabbitmq successfully");
        return channel;
    } catch (error) {
        console.log("failed to connect with rabbitmq");
        throw error;
    }
}