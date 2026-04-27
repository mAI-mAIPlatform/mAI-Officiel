import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/lib/types"; // we'll create this

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function ioHandler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
      });

      socket.on("send-message", (message) => {
        // Broadcast to the specific room/chat
        io.to(message.roomId).emit("receive-message", message);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });
  }

  res.end();
}
