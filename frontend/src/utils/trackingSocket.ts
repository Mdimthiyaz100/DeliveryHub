import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getTrackingSocket(): Socket {
  if (!socketInstance) {
    const socketUrl = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL.replace(/\/api\/?$/, "")
      : "http://localhost:5000";

    const token = localStorage.getItem("token");

    socketInstance = io(socketUrl, {
      auth: {
        token: token || "",
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("Connected to DeliveryHub Live Tracking Socket.IO server");
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Tracking socket disconnected:", reason);
    });
  }

  return socketInstance;
}

