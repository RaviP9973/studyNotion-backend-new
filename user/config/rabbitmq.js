import amqp from "amqplib"
import dotenv from 'dotenv'

dotenv.config();

let channel;

export const connectRabbitMq = async () => {
    try {
        const connection = await amqp.connect({
            hostName: process.env.RABBITMQ_HOST,
            protocol: "amqp",
            port: 5672,
            username: process.env.RABBITMQ_USER,
            password: process.env.RABBITMQ_PASS,
        })
        channel = await connection.createChannel();
        console.log("connected to rabbitmq successfully");
    } catch (error) {
        console.log("failed to connect with rabbitmq", error);
    }
}

export const publishToQueue = async (queueName, message) => {
    if (!channel) {
        console.log("RabbitMQ is not initialised");
        return;
    }

    await channel.assertQueue(queueName, {
        durable: true,
    })

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true,
    })

    console.log("message sent to the queue :");
}