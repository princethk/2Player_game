const games = {}; // Store games with their states

const gameSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle player joining a game
    socket.on("join_game", ({ gameId, player }) => {
      console.log(`Player ${player} trying to join game: ${gameId}`);

      // Initialize the game if it doesn't exist
      if (!games[gameId]) {
        games[gameId] = {
          players: [],
          board: Array(9).fill(null), // Tic-tac-toe board
          turn: "O", // Player O always starts first
        };
        console.log(`Created new game with ID: ${gameId}`);
      }

      const game = games[gameId];

      // Check if the game is full or the player is already connected
      if (game.players.length >= 2) {
        socket.emit("error_message", "Game is full.");
        return;
      }

      if (game.players.find((p) => p.id === socket.id)) {
        socket.emit("error_message", "You are already in this game.");
        return;
      }

      // Add the player to the game
      game.players.push({ id: socket.id, player });
      socket.join(gameId);
      console.log(`${player} joined game ${gameId}`);

      // Notify all players if the game starts
      if (game.players.length === 2) {
        io.to(gameId).emit("start_game", game.turn);
      }
    });

    // Handle player moves
    socket.on("player_move", ({ gameId, move, player }) => {
      const game = games[gameId];

      if (!game) {
        socket.emit("error_message", "Game not found.");
        return;
      }

      // Validate the move
      if (game.board[move] !== null || game.turn !== player) {
        socket.emit("error_message", "Invalid move or not your turn.");
        return;
      }

      // Update the game state
      game.board[move] = player;
      game.turn = player === "O" ? "X" : "O";

      console.log(`Game ${gameId} board:`, game.board);

      // Notify all players about the updated board
      io.to(gameId).emit("update_game", { move, player });
    });

    // Handle player disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove the player from any game they were part of
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
};

module.exports = gameSocket;
