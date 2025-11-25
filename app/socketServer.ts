import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

interface DrawingElement {
    id: string;
    [key: string]: any;
}

interface DrawAction {
    type: "add" | "update" | "delete";
    element?: DrawingElement;
    elementId?: string;
}

interface RoomState {
    [room: string]: DrawingElement[];
}

interface RoomUsers {
    [room: string]: { [socketId: string]: string };
}

const roomStates: RoomState = {};
const roomUsers: RoomUsers = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    let joinedRoom: string | null = null;

    socket.on("join", ({ room, displayName }) => {
        joinedRoom = room;
        socket.join(room);

        if (!roomStates[room]) roomStates[room] = [];
        if (!roomUsers[room]) roomUsers[room] = {};

        roomUsers[room][socket.id] = displayName;

        socket.emit("initial_state", roomStates[room]);
        io.to(room).emit("presence", Object.values(roomUsers[room]));

        socket.emit("joined", {
            room,
            users: Object.values(roomUsers[room]),
        });

        console.log(`${displayName} joined room ${room}`);
    });

    socket.on("draw_action", ({ room, action }: { room: string; action: DrawAction }) => {
        if (!roomStates[room]) roomStates[room] = [];
        const state = roomStates[room];

        switch (action.type) {
            case "add":
                if (action.element) state.push(action.element);
                break;

            case "update":
                if (action.element) {
                    const index = state.findIndex(el => el.id === action.element!.id);
                    if (index !== -1) state[index] = action.element;
                }
                break;

            case "delete":
                if (action.elementId) {
                    const index = state.findIndex(el => el.id === action.elementId);
                    if (index !== -1) state.splice(index, 1);
                }
                break;
        }

        roomStates[room] = state;

        socket.to(room).emit("draw_action", action);
    });

    socket.on("request_state", ({ room }) => {
        socket.emit("initial_state", roomStates[room] || []);
    });

    socket.on("disconnect", () => {
        if (!joinedRoom) return;

        const users = roomUsers[joinedRoom];
        const displayName = users?.[socket.id];

        if (users && users[socket.id]) {
            delete users[socket.id];

            io.to(joinedRoom).emit("presence", Object.values(users));
            console.log(`${displayName} left room ${joinedRoom}`);
        }
        if (users && Object.keys(users).length === 0) {
            delete roomUsers[joinedRoom];
            delete roomStates[joinedRoom];
        }
    });
});

const PORT = process.env.SERVER_PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
