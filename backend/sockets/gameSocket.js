const gameSocket = (io) => {
    const games = {};
  
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);
  
      socket.on("join_game", ({ gameId, player }) => {
        if (!games[gameId]) {
          games[gameId] = { players: [], turns: [] };
        }
        games[gameId].players.push({ id: socket.id, player });
  
        if (games[gameId].players.length === 2) {
          io.to(games[gameId].players[0].id).emit("start_game", "O");
          io.to(games[gameId].players[1].id).emit("start_game", "X");
        }
      });
  
      socket.on("player_move", ({ gameId, move, player }) => {
        games[gameId].turns.push({ move, player });
  
        const nextPlayer = games[gameId].players.find((p) => p.player !== player);
        io.to(nextPlayer.id).emit("update_game", { move, player });
      });
  
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  };
  
  module.exports = gameSocket;
  