const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_game", ({ gameId, player }) => {
    socket.join(gameId);
    console.log(`${player} joined game ${gameId}`);
    io.to(gameId).emit("start_game", player);
  });

  socket.on("player_move", ({ gameId, move, player }) => {
    console.log(`Player ${player} made move ${move} in game ${gameId}`);
    socket.to(gameId).emit("update_game", { move, player });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
