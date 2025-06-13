import { createRequire } from "module";

const require = createRequire(import.meta.url);

let io;

const socketIO = {
    init: httpServer => {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: ["http://localhost:5173"],
                methods: ["GET", "POST", "PUT", "DELETE"]
            }
        });
        
        // Optional: Add connection listener
        io.on('connection', socket => {
            console.log('Client connected:', socket.id);
        });
        
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};

export default socketIO;