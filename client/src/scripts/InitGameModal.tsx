import './InitGameModal.css';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { GameServerClient } from './GameServerClient';

const InitGameModal = ({ gameServerClient }: { gameServerClient: GameServerClient }) => {
  const [gameHash, setGameHash] = useState<string>("");
  const [playerList, setPlayerList] = useState<string[]>([]);
  const [timePerCycle, setTimePerCycle] = useState<number>(12);
  const [timeToDiscuss, setTimeToDiscuss] = useState<number>(12);
  const [showLobbyModal, setShowLobbyModal] = useState<boolean>(true);

  let interval: NodeJS.Timeout = null;

  useEffect(() => {
    if (!showLobbyModal) {
      if (interval) clearInterval(interval);
    } else {
      interval = setInterval(async () => {
        if (!gameHash)
          return;
        var players = await gameServerClient.getPlayers(gameHash);
        setPlayerList(players);
      }, 2000);
    }

  }, [showLobbyModal])

  useEffect(() => {
    setShowLobbyModal(false);

    return () => {
      if (interval) clearInterval(interval);
    }
  }, [])

  // Create game button
  const clickCreateGame = async () => {
    if (timePerCycle && timeToDiscuss) {
      let hash = await createGame(Number(timePerCycle), Number(timeToDiscuss));
      if (!hash) {
        alert('There is already a game running, one game at a time !');
        return;
      }
      setGameHash(hash);
      setShowLobbyModal(true);
    }
  };

  // Join game button
  const clickJoinGame = async () => {
    if (gameHash) {
      await joinGame(gameHash);
      setShowLobbyModal(true);
    }
  };

  // Start game button
  const clickStartGame = () => {
    startGame(gameHash);
  };

  async function createGame(timePerCycle: number, timeToDiscuss: number): Promise<string> {
    return await gameServerClient.createGame(timePerCycle, timeToDiscuss);
  }

  async function joinGame(gameHash: string): Promise<string> {
    return await gameServerClient.joinGame(gameHash);
  }

  async function startGame(gameHash: string) {
    await gameServerClient.startGame(gameHash);
  }

  const handleTimePerCycle = (event: any) => {
    setTimePerCycle(event.target.value);
  }

  const handleTimeToDiscuss = (event: any) => {
    setTimeToDiscuss(event.target.value);
  }

  const handleGameHash = (event: any) => {
    setGameHash(event.target.value);
  }

  return (
    <div className="init-game">
      <div className="modal" style={{ display: showLobbyModal ? 'none' : 'flex' }}>
        <div className="modal-block">
          <div>Time per Cycle (secs): <input type="number" placeholder="120" value={timePerCycle} onChange={handleTimePerCycle}></input></div>
          <div>Time To Discuss (secs): <input type="number" placeholder="20" value={timeToDiscuss} onChange={handleTimeToDiscuss}></input></div>
          <div><button disabled={!timeToDiscuss || !timePerCycle} onClick={clickCreateGame}>Create Game</button></div>
        </div>
        <div className="modal-block">
          <div><input type="text" placeholder="Game id" value={gameHash} onChange={handleGameHash}></input> <button disabled={!gameHash} onClick={clickJoinGame}>Join
              Game</button></div>
        </div>
      </div>

      <div className="modal" style={{ display: showLobbyModal ? 'flex' : 'none' }}>
        <div className="modal-block">
          <div>Players:</div>
          <ul className="player-list">
            {playerList.map(p => (<li key={p}>{p}</li>))}
          </ul>
        </div>
        <div className="modal-block">
          <div><button onClick={clickStartGame}>Start Game</button></div>
        </div>
      </div>
    </div>
  )
}


export default InitGameModal
