import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Adjust this in production for security
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        socket.on('join_auction', (auctionId) => {
            socket.join(auctionId);
            console.log(`User ${socket.id} joined auction room: ${auctionId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

// Helper function to get the IO instance globally
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }

    return io;
};