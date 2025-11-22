import express from "express";
import http from "http";
import {Server} from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin:"*",
    }
});

io.on("connection",(socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("draw",(data:any) => {
        socket.broadcast.emit("draw",data);
    });
    socket.on("disconnect",() => {
        console.log(`User disconnected: ${socket.id}`);
    })
});

const PORT = process.env.SERVER_PORT;
server.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
});