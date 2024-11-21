import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [gameId, setGameId] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div>
      <h1>Two-Player Game</h1>
      <input
        type="text"
        placeholder="Enter Game ID"
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
      />
      <button onClick={handleJoin}>Join Game</button>
    </div>
  );
};

export default Home;
