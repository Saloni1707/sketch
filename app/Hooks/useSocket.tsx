import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ElementType } from "../store/useSketchStore";

export type DrawAction =
  | { type: 'add'; elements: ElementType }
  | { type: 'update'; elements: ElementType }
  | { type: 'delete'; elementId: number }
  | { type: 'batch'; elements: ElementType[] };

type DrawCallback = (data: DrawAction) => void;
type PresenceCallback = (users: string[]) => void;

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

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
            transports: ["websocket", "polling"]
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            socket.emit("join", { room, displayName });
        });

        socket.on("joined", ({ users }) => {
            setPresence(users);
        });

        socket.on("initial_state", (elements: ElementType[]) => {
            if (onDrawRef.current) {
                onDrawRef.current({ type: "batch", elements });
            }
        });

        socket.on("draw_action", (action: DrawAction) => {
            if (onDrawRef.current) {
                onDrawRef.current(action);
            }
        });

        socket.on("presence", (users: string[]) => {
            setPresence(users);
            if (onPresenceRef.current) onPresenceRef.current(users);
        });

        socket.on("disconnect", () => {
            setConnected(false);
            setPresence([]);
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            setConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [room, displayName]);

    function emitDrawAction(action: DrawAction) {
        if (socketRef.current && room) {
            socketRef.current.emit("draw_action", { room, action });
        }
    }

    function requestState() {
        if (socketRef.current && room) {
            socketRef.current.emit("request_state", { room });
        }
    }

    function leaveRoom() {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setPresence([]);
        setConnected(false);
    }

    return { emitDrawAction, connected, presence, leaveRoom, requestState };
}
