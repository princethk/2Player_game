import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

const Game = () => {
  const { gameId } = useParams();
  const [player, setPlayer] = useState(null);
  const [turn, setTurn] = useState("O");
  const [board, setBoard] = useState(Array(9).fill(null));
  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    socket.emit("join_game", { gameId });

    socket.on("start_game", ({ player: assignedPlayer, board: currentBoard, turn: currentTurn }) => {
      setPlayer(assignedPlayer);
      setBoard(currentBoard);
      setTurn(currentTurn);
      setMessage(`You are Player ${assignedPlayer}`);
    });

    socket.on("update_game", ({ board: updatedBoard, turn: nextTurn }) => {
      setBoard(updatedBoard);
      setTurn(nextTurn);
    });

    socket.on("game_result", ({ message: resultMessage, board: finalBoard }) => {
      setBoard(finalBoard);
      setMessage(resultMessage);
      setGameOver(true);
    });

    return () => {
      socket.off("start_game");
      socket.off("update_game");
      socket.off("game_result");
    };
  }, [gameId]);

  const handleCellClick = (index) => {
    if (gameOver || !turn || board[index]) return;
    if (player !== turn) {
      alert("It's not your turn!");
      return;
    }

    socket.emit("player_move", { gameId, move: index, player });
  };

  return (
    <div>
      <h1>{message}</h1>
      <h2>{!gameOver && (turn === player ? "Your turn!" : `Waiting for Player ${turn}...`)}</h2>
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
              cursor: gameOver || cell || turn !== player ? "not-allowed" : "pointer",
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
