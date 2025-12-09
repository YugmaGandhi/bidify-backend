import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { prisma } from './config/db';
import { initSocket } from './socket';
import { connectRabbitMQ, consumeQueue } from './config/rabbitmq';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try{

        // Connect to RabbitMQ
        await connectRabbitMQ();

        // Initialize consumer for RabbitMQ
        consumeQueue();

        // Create the Raw HTTP server using Express
        const server = http.createServer(app);

        // Initialize WebSocket (Socket.io)
        initSocket(server);

        // Connect DB
        await prisma.$connect();
        console.log('Database connected successfully');

        // Listen on server and not on APP
        // app.listen(PORT, () => {
        //     console.log(`Server is running on port ${PORT}`);
        // });

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();