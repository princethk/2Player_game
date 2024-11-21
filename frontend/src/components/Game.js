import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"], // Ensures the use of WebSocket over polling
});

const Game = () => {
  const { gameId } = useParams();
  const [player, setPlayer] = useState(null);
  const [turn, setTurn] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Determine player type based on gameId
    const playerType = gameId.slice(-1) === "1" ? "O" : "X";
    setPlayer(playerType);
  
    // Emit the join_game event after ensuring `playerType` is set
    if (playerType) {
      socket.emit("join_game", { gameId, player: playerType });
    }
  
    // Listen for game events
    socket.on("start_game", (assignedTurn) => {
      setTurn(assignedTurn === playerType);
      setMessage(`You are Player ${playerType}`);
    });
  
    socket.on("update_game", ({ move, player }) => {
      const updatedBoard = [...board];
      updatedBoard[move] = player;
      setBoard(updatedBoard);
      setTurn(true);
    });
  
    return () => {
      // Cleanup listeners on component unmount
      socket.off("start_game");
      socket.off("update_game");
    };
  }, [gameId, board]); // Add dependencies to avoid stale state
  

  // Handle Cell Click
  const handleCellClick = (index) => {
    if (!turn || board[index]) return; // Prevent moves when it's not the player's turn
  
    const updatedBoard = [...board];
    updatedBoard[index] = player;
    setBoard(updatedBoard);
  
    socket.emit("player_move", { gameId, move: index, player });
    setTurn(false); // Disable further moves until backend updates the turn
  };
  

  return (
    <div>
      <h1>{message}</h1>
      <div className="board">
        {board.map((cell, index) => (
          <div
            key={index}
            className="cell"
            onClick={() => handleCellClick(index)}
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game;
