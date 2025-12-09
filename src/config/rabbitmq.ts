import amqp, { Channel, ChannelModel } from 'amqplib';

let connection: ChannelModel;
let channel: Channel;

const QUEUE_NAME = 'auction_notifications';

export const connectRabbitMQ = async () => {
    try{
        connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();

        // Assert Queues: Creates the queue if it doesn't exist
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        console.log('Connected to RabbitMQ successfully.');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

// Function to push message to queue
export const publishToQueue = async (data: object) => {
    if (!channel) {
        await connectRabbitMQ();
    }

    //Convert Object to buffer
    // Persistent makes sure message is not lost if RabbitMQ crashes
    // Even if durable is true, messages are not persisted unless marked persistent
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(data)), { persistent: true });
    console.log("Sent to RabbitMQ:", data);
};

// Function for the Worker to consume message
export const consumeQueue = async () => {
    if (!channel) {
        await connectRabbitMQ();
    }

    //BEST PRACTICE: Prefetch
    // Only process 1 message at a time per consumer
    // This ensures load balancing if you have ultiple server instance
    await channel.prefetch(1);

    console.log(`Waiting for messages in ${QUEUE_NAME}...`);

    channel.consume(QUEUE_NAME, (msg) => {
        if (msg) {
            try{
                const data = JSON.parse(msg.content.toString());
                console.log("Received Task:", data);
                
                // SIMULATE WORK (e.g., Sending Email)
                // In real life, await sendEmail(data.email, ...);
                
                // BEST PRACTICE 2: Manual Acknowledgement
                // We only Ack AFTER the work is actually done.
                channel.ack(msg);
            } catch (error) {
                console.error("Error processing message:", error);

                // BEST PRACTICE 3: Negative Acknowledgement
                // params: (message, allUpToThis?, requeue?)
                // true = put it back in the queue to try again
                // false = delete it (if it's a bad JSON that will never work)
                
                // For now, we requeue. In prod, you'd use a Dead Letter Queue after 3 retries.
                channel.nack(msg, false, true);
            }
        }
    });
};