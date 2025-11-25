import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type DrawAction = {
    type: 'add' | 'update' | 'delete'| 'batch';
    elements?:any;
    elementId?:number;
}
type DrawCallback = (data: DrawAction) => void;
type PresenceCallback = (users: string[]) => void;

const SOCKET_SERVER_URL = process.env.PORT || "http://localhost:3001";

export function useSocket(
    room: string | null,
    displayName: string | null,
    onDraw?: DrawCallback,
    onPresence?: PresenceCallback
) {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [presence, setPresence] = useState<string[]>([]);
    const onDrawRef = useRef(onDraw);
    const onPresenceRef = useRef(onPresence);

    useEffect(() => {
        onDrawRef.current = onDraw;
        onPresenceRef.current = onPresence;
    }, [onDraw, onPresence]);

    useEffect(() => {
        if (!room || !displayName) return;

        const socket = io(SOCKET_SERVER_URL, {
            transports: ["websocket", "polling"],
            query:{room,displayName}
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected");
            setConnected(true);
            socket.emit("join",{room,displayName})
        });

        socket.on("joined",({room:joinedRoom,users})=>{
            console.log(`Successfully joined room: ${joinedRoom}`);
            setPresence(users);
        });
        //get the initial state from the server
        socket.on("initail_state",(elements)=>{
            console.log("Initial state received:",elements);
            if (onDrawRef.current){
                onDrawRef.current({type:"batch",elements});
            }
        });

        //receive the incremental updates here
        socket.on("draw_action",(action:DrawAction)=>{
            console.log("Draw action received:",action);
            if (onDrawRef.current){
                onDrawRef.current(action);
            }
        });

        socket.on("presence", (users: string[]) => {
            setPresence(users);
            if (onPresenceRef.current) onPresenceRef.current(users);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setConnected(false);
            setPresence([]);
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            setConnected(false);
        });

        const handleBeforeUnload = () => {
            try {
                socket.disconnect();
            } catch (error) {
                console.error("Error disconnecting socket:", error);
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            try {
                socket.disconnect();
            } catch (error) {
                console.error("Error disconnecting socket:", error);
            }
        };
    }, [room, displayName]);

    function emitDrawAction(action: DrawAction) {
        if (socketRef.current && room) {
            socketRef.current.emit("draw_action", { room, action });
        }
    }

    function requestState(){
        if(socketRef.current && room){
            socketRef.current.emit("request_state",{room});
        }
    }

    function leaveRoom() {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setPresence([]);
        setConnected(false);
    }

    return { emitDrawAction, connected, presence, leaveRoom,requestState };
}