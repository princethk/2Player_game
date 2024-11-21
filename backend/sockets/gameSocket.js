const games = {}; // Store games with their states

const gameSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle player joining a game
    socket.on("join_game", ({ gameId }) => {
      console.log(`Player trying to join game: ${gameId}`);

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

      console.log(`Current players in game ${gameId}:`, game.players);

      // Add the player to the game if not already added
      if (game.players.length < 2 && !game.players.find((p) => p.id === socket.id)) {
        const playerType = game.players.length === 0 ? "O" : "X";
        game.players.push({ id: socket.id, player: playerType });

        console.log(`Player ${playerType} joined game ${gameId}`);
        console.log(`Game state after player joined:`, game);

        // Notify player of their role
        socket.emit("start_game", playerType);

        // If both players are connected, start the game
        if (game.players.length === 2) {
          console.log(`Both players connected for game ${gameId}`);
          game.players.forEach(({ id, player }) => {
            io.to(id).emit("start_game", player);
          });
        }
      } else {
        socket.emit("error_message", "Game is full or you are already connected.");
      }
    });

    // Handle player moves
    socket.on("player_move", ({ gameId, move, player }) => {
      const game = games[gameId];
      if (!game) {
        socket.emit("error_message", "Game not found.");
        return;
      }

      console.log(`Player ${player} making move in game ${gameId}:`, { move });

      // Check if it's the player's turn
      if (game.turn !== player) {
        socket.emit("error_message", "Not your turn.");
        return;
      }

      // Validate the move
      if (game.board[move] !== null) {
        socket.emit("error_message", "Invalid move.");
        return;
      }

      // Update the board and switch turns
      game.board[move] = player;
      game.turn = player === "O" ? "X" : "O";

      console.log(`Updated board for game ${gameId}:`, game.board);

      // Notify all players about the updated board
      game.players.forEach(({ id }) => {
        io.to(id).emit("update_game", { move, player });
      });
    });

    // Handle player disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove the player from any game they were part of
      for (const gameId in games) {
        const game = games[gameId];
        game.players = game.players.filter((p) => p.id !== socket.id);

        console.log(`Updated players for game ${gameId}:`, game.players);

        // If no players are left in the game, delete it
        if (game.players.length === 0) {
          delete games[gameId];
          console.log(`Game ${gameId} has been deleted.`);
        }
      }
    });
  });
};

module.exports = gameSocket;
