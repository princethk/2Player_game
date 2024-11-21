import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Game = () => {
  const { gameId } = useParams();
  const [player, setPlayer] = useState(null);
  const [turn, setTurn] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [message, setMessage] = useState("");

  useEffect(() => {
    const playerType = gameId.slice(-1) === "1" ? "O" : "X";
    setPlayer(playerType);

    socket.emit("join_game", { gameId, player: playerType });

    socket.on("start_game", (assignedTurn) => {
      setTurn(assignedTurn === playerType);
      setMessage(`You are Player ${assignedTurn}`);
    });

    socket.on("update_game", ({ move, player }) => {
      setTurn(true);
      const updatedBoard = [...board];
      updatedBoard[move] = player;
      setBoard(updatedBoard);
    });
  }, [gameId, player, board]);

  const handleCellClick = (index) => {
    if (!turn || board[index]) return;

    const updatedBoard = [...board];
    updatedBoard[index] = player;
    setBoard(updatedBoard);

    socket.emit("player_move", { gameId, move: index, player });
    setTurn(false);
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
