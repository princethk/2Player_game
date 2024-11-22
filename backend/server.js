const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const games = {}; // Store game states

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_game", ({ gameId }) => {
    if (!games[gameId]) {
      // Initialize game if it doesn't exist
      games[gameId] = { players: [], board: Array(9).fill(null), turn: "O" };
    }

    const game = games[gameId];

    // Check if the user is already in the game
    if (game.players.some((player) => player.id === socket.id)) {
      console.log(`User ${socket.id} is already in game ${gameId}`);
      return;
    }

    if (game.players.length >= 2) {
      socket.emit("error_message", "Game is full.");
      return;
    }

    // Assign player type
    const player = game.players.length === 0 ? "O" : "X";
    game.players.push({ id: socket.id, player });

    console.log(`Player ${player} joined game ${gameId}`);

    // Notify the joining player
    socket.emit("start_game", { player, board: game.board, turn: game.turn });

    // Notify both players if both have joined
    if (game.players.length === 2) {
      game.players.forEach(({ id, player }) => {
        io.to(id).emit("start_game", { player, board: game.board, turn: game.turn });
      });
    }
  });

  socket.on("player_move", ({ gameId, move, player }) => {
    const game = games[gameId];
    if (!game) {
      console.log("Invalid game:", gameId);
      return;
    }

    // Validate turn
    if (game.turn !== player) {
      console.log(`Invalid turn: Player ${player} tried to move, but it's ${game.turn}'s turn.`);
      return;
    }

    // Validate move
    if (game.board[move] !== null) {
      console.log("Invalid move: Cell is already occupied.");
      return;
    }

    // Update the board and switch turns
    game.board[move] = player;
    game.turn = player === "O" ? "X" : "O";

    console.log("Updated game state:", game);

    // Notify all players of the updated game state
    game.players.forEach(({ id }) => {
      io.to(id).emit("update_game", { move, player, turn: game.turn });
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from any game
    for (const gameId in games) {
      const game = games[gameId];
      game.players = game.players.filter((p) => p.id !== socket.id);

      if (game.players.length === 0) {
        delete games[gameId];
        console.log(`Game ${gameId} has been deleted.`);
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
