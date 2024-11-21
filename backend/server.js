const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const gameSocket = require("./sockets/gameSocket");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

gameSocket(io);

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
