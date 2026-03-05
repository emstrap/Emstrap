import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Ambulance joins a specific room to receive nearby requests
    socket.on("join_ambulance", (data) => {
      socket.join("ambulance");
      console.log(`Ambulance joined: ${socket.id}`);
    });

    // Hospital joins hospital room
    socket.on("join_hospital", (data) => {
      socket.join("hospital");
      console.log(`Hospital joined: ${socket.id}`);
    });

    // Police joins police room
    socket.on("join_police", (data) => {
      socket.join("police");
      console.log(`Police joined: ${socket.id}`);
    });

    // Ambulance sends live location
    socket.on("update_location", (data) => {
      // Broadcast location to the specific request room
      if (data.requestId) {
        io.to(`request_${data.requestId}`).emit("ambulance_location", data);
      }
    });

    // User sends live location
    socket.on("update_user_location", (data) => {
      if (data.requestId) {
        io.to(`request_${data.requestId}`).emit("user_location", data);
      }
    });

    // User joins a specific request room to track their ambulance
    socket.on("track_request", (data) => {
      if (data.requestId) {
        socket.join(`request_${data.requestId}`);
        console.log(`User tracking request: ${data.requestId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
};
