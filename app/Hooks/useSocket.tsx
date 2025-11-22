import {useEffect,useRef} from "react";
import {io,Socket} from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:3001";

export function useSocket(onDraw:(data:any)=>void){
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL);
        socketRef.current = socket ;

        socket.on("draw",(data)=>{
            onDraw(data);
        });
        return() => {
            socket.disconnect();
        };
    },[onDraw]);

    function emitDraw(data:any){
        socketRef.current?.emit("draw",data);
    }

    return {emitDraw};

}