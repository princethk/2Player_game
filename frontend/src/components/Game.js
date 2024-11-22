import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"], // Ensures the use of WebSocket over polling
});

const Game = () => {
  const { gameId } = useParams();
  const [player, setPlayer] = useState(null); // Current player's role ('O' or 'X')
  const [turn, setTurn] = useState("O"); // Default turn is 'O'
  const [board, setBoard] = useState(Array(9).fill(null)); // 3x3 grid
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Emit the join_game event
    socket.emit("join_game", { gameId });

    // Listen for game start
    socket.on("start_game", ({ player: assignedPlayer, board: currentBoard, turn: currentTurn }) => {
      setPlayer(assignedPlayer); // Assign the current player role
      setBoard(currentBoard); // Sync the board
      setTurn(currentTurn); // Sync the turn
      setMessage(`You are Player ${assignedPlayer}`);
    });

    // Listen for board updates
    socket.on("update_game", ({ move, player, turn: nextTurn }) => {
      setBoard((prevBoard) => {
        const updatedBoard = [...prevBoard];
        updatedBoard[move] = player; // Update the cell with the player's move
        return updatedBoard;
      });
      setTurn(nextTurn); // Update turn
    });

    return () => {
      socket.off("start_game");
      socket.off("update_game");
    };
  }, [gameId]);

  const handleCellClick = (index) => {
    if (!turn || board[index]) return; // Prevent invalid moves

    if (player !== turn) {
      alert("It's not your turn!");
      return;
    }

    // Update board locally and emit move
    const updatedBoard = [...board];
    updatedBoard[index] = player;
    setBoard(updatedBoard);

    socket.emit("player_move", { gameId, move: index, player });
  };

  return (
    <div>
      <h1>{message}</h1>
      <h2>{turn === player ? "Your turn!" : `Waiting for Player ${turn}...`}</h2>
      <div className="board" style={{ display: "grid", gridTemplateColumns: "repeat(3, 100px)", gap: "10px" }}>
        {board.map((cell, index) => (
          <div
            key={index}
            className="cell"
            style={{
              width: "100px",
              height: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid black",
              fontSize: "24px",
              cursor: cell || turn !== player ? "not-allowed" : "pointer",
            }}
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
