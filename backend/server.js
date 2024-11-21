const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const gameSocket = require("./sockets/gameSocket"); // Import the gameSocket module

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
  },
});

gameSocket(io); // Pass the socket instance to the gameSocket module

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
