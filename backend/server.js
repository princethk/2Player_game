const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const games = {}; // Store game states

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Helper functions to check for win or draw
const checkWin = (board) => {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6],            // Diagonals
  ];

  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Return the winner ('O' or 'X')
    }
  }
  return null; // No winner
};

const checkDraw = (board) => board.every((cell) => cell !== null);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_game", ({ gameId }) => {
    if (!games[gameId]) {
      games[gameId] = { players: [], board: Array(9).fill(null), turn: "O" };
    }

    const game = games[gameId];

    if (game.players.some((player) => player.id === socket.id)) {
      console.log(`User ${socket.id} is already in game ${gameId}`);
      return;
    }

    if (game.players.length >= 2) {
      socket.emit("error_message", "Game is full.");
      return;
    }

    const player = game.players.length === 0 ? "O" : "X";
    game.players.push({ id: socket.id, player });

    console.log(`Player ${player} joined game ${gameId}`);

    socket.emit("start_game", { player, board: game.board, turn: game.turn });

    if (game.players.length === 2) {
      game.players.forEach(({ id, player }) => {
        io.to(id).emit("start_game", { player, board: game.board, turn: game.turn });
      });
    }
  });

  socket.on("player_move", ({ gameId, move, player }) => {
    const game = games[gameId];
    if (!game) return;

    if (game.turn !== player) {
      console.log(`Invalid turn: Player ${player} tried to move, but it's ${game.turn}'s turn.`);
      return;
    }

    if (game.board[move] !== null) {
      console.log("Invalid move: Cell is already occupied.");
      return;
    }

    game.board[move] = player;

    const winner = checkWin(game.board);
    if (winner) {
      game.players.forEach(({ id, player: playerType }) => {
        const resultMessage = winner === playerType ? "You Win!" : "You Lose!";
        io.to(id).emit("game_result", { message: resultMessage, board: game.board });
      });
      delete games[gameId];
      return;
    }

    if (checkDraw(game.board)) {
      game.players.forEach(({ id }) => {
        io.to(id).emit("game_result", { message: "It's a draw!", board: game.board });
      });
      delete games[gameId];
      return;
    }

    game.turn = player === "O" ? "X" : "O";

    game.players.forEach(({ id }) => {
      io.to(id).emit("update_game", { move, player, turn: game.turn, board: game.board });
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

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
