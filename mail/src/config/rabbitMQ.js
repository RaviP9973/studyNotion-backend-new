import amqp from "amqplib"
import dotenv from "dotenv"

dotenv.config();

export const connectRabbitMq = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL)

        const channel = await connection.createChannel();
        console.log("connected  to rabbitmq successfully");
        return channel;
    } catch (error) {
        console.log("failed to connect with rabbitmq");
        throw error;
    }
}