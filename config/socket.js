import { Server } from "socket.io";

let io;
const connectedUsers = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // allow frontend origin
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"], // fallback
  });

  io.on("connection", (socket) => {
    // console.log("User connected:", socket.id);

    socket.on("register", (userId) => {
      if (!connectedUsers[userId]) connectedUsers[userId] = [];
      connectedUsers[userId].push(socket.id);
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      for (const userId in connectedUsers) {
        connectedUsers[userId] = connectedUsers[userId].filter(
          (id) => id !== socket.id
        );
        if (connectedUsers[userId].length === 0) delete connectedUsers[userId];
      }
      // console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

export const notifyLoveNote = (receiverId, note) => {
  const sockets = connectedUsers[receiverId] || [];
  sockets.forEach((socketId) => io.to(socketId).emit("newLoveNote", note));
};
