import { connectRabbitMq } from "../config/rabbitMQ.js";
import mailSender from "./mailSender.js";


export const sendOtpConsumer = async () => {
    try {
        const channel = await connectRabbitMq();   

        const queueName = "email-queue";

        await channel.assertQueue(queueName, {
            durable: true,
        })

        console.log("mail service consumer started listening for emails");

        channel.consume(queueName, async (msg) => {

            if (!msg) {
                return;
            }

            const { email, title, body } = JSON.parse(msg.content.toString());

            await mailSender(email, title, body);

            console.log("mail sent successfully")
            channel.ack(msg);
        })
    } catch (error) {
        console.error("failed to  start rabbitmq consumer", error);
    }
}