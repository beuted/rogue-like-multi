import './InitGameModal.css';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { GameServerClient } from './GameServerClient';
import { EntityType } from './Entity';
import { ItemType } from './Cell';

const InitGameModal = ({ gameServerClient }: { gameServerClient: GameServerClient }) => {
  const [gameHash, setGameHash] = useState<string>("");
  const [playerList, setPlayerList] = useState<string[]>([]);
  const [timePerCycle, setTimePerCycle] = useState<number>(120);
  const [timeToDiscuss, setTimeToDiscuss] = useState<number>(12);
  const [badGuyVision, setBadGuyVision] = useState<number>(1.0);
  const [nbMaterialToWin, setNbMaterialToWin] = useState<number>(30);
  const [playerSpeed, setPlayerSpeed] = useState<number>(1);
  const [entitySpeed, setEntitySpeed] = useState<number>(1);
  const [dogSpawn, setDogSpawn] = useState<number>(3);
  const [ratSpawn, setRatSpawn] = useState<number>(3);
  const [snakeSpawn, setSnakeSpawn] = useState<number>(3);
  const [woodSpawn, setWoodSpawn] = useState<number>(5);
  const [foodSpawn, setFoodSpawn] = useState<number>(10);
  const [keySpawn, setKeySpawn] = useState<number>(3);
  const [swordSpawn, setSwordSpawn] = useState<number>(3);
  const [backpackSpawn, setBackpackSpawn] = useState<number>(0);
  const [healthPotionSpawn, setHealthPotionSpawn] = useState<number>(1);


  const [showLobbyModal, setShowLobbyModal] = useState<boolean>(true);
  const [charId, setCharId] = useState<number>(0);

  // Skin Id matched to the spriteId of the char
  const SkinMap: { [key: number]: number } = { 0: 4, 1: 5, 2: 6, 3: 7 };

  let interval: NodeJS.Timeout = null;

  useEffect(() => {
    if (!showLobbyModal) {
      if (interval) clearInterval(interval);
    } else {
      if (interval) clearInterval(interval);
      interval = setInterval(async () => {
        if (!gameHash)
          return;
        var players = await gameServerClient.getPlayers(gameHash);
        setPlayerList(players);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [showLobbyModal])

  useEffect(() => {
    setShowLobbyModal(false);
  }, [])

  const canCreateGame = () => {
    return timePerCycle != null && timeToDiscuss != null && badGuyVision != null && nbMaterialToWin != null && playerSpeed != null && entitySpeed != null
      && dogSpawn != null && ratSpawn != null && snakeSpawn != null
      && woodSpawn != null && foodSpawn != null && keySpawn != null && swordSpawn != null && backpackSpawn != null && healthPotionSpawn != null;
  }

  // Create game button
  const clickCreateGame = async () => {
    if (canCreateGame()) {
      let hash = await createGame();
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

  const prevChar = async () => {
    let newCharId: number = charId == 0 ? 3 : charId - 1;
    setCharId(newCharId);
    await gameServerClient.setPlayerSkinId(gameHash, gameServerClient.username, SkinMap[newCharId]);
  };

  const nextChar = async () => {
    let newCharId: number = charId == 3 ? 0 : charId + 1
    setCharId(newCharId);
    await gameServerClient.setPlayerSkinId(gameHash, gameServerClient.username, SkinMap[newCharId]);
  };

  async function createGame(): Promise<string> {
    return await gameServerClient.createGame({
      nbSecsPerCycle: Number(timePerCycle),
      nbSecsDiscuss: Number(timeToDiscuss),
      badGuyVision: Number(badGuyVision),
      nbMaterialToWin: Number(nbMaterialToWin),
      playerSpeed: Number(playerSpeed),
      entitySpeed: Number(entitySpeed),
      entitySpawn: {
        [EntityType.Dog]: Number(dogSpawn),
        [EntityType.Rat]: Number(ratSpawn),
        [EntityType.Snake]: Number(snakeSpawn),
      },
      itemSpawn: {
        [ItemType.Empty]: 0,
        [ItemType.Blood]: 0,
        [ItemType.DeadBody1]: 0,
        [ItemType.DeadBody2]: 0,
        [ItemType.DeadBody3]: 0,
        [ItemType.Wood]: Number(woodSpawn),
        [ItemType.Food]: Number(foodSpawn),
        [ItemType.Key]: Number(keySpawn),
        [ItemType.Sword]: Number(swordSpawn),
        [ItemType.Backpack]: Number(backpackSpawn),
        [ItemType.HealthPotion]: Number(healthPotionSpawn),
      }
    });
  }

  async function joinGame(gameHash: string): Promise<string> {
    return await gameServerClient.joinGame(gameHash);
  }

  async function startGame(gameHash: string) {
    await gameServerClient.startGame(gameHash);
  }

  return (
    <div className="init-game">
      <div className="modal" style={{ display: showLobbyModal ? 'none' : 'flex' }}>
        <div className="modal-block">
          <div>Time per Cycle (secs): <input type="number" placeholder="120" value={timePerCycle} onChange={(e: any) => setTimePerCycle(e.target.value)}></input></div>
          <div>Time To Discuss (secs): <input type="number" placeholder="20" value={timeToDiscuss} onChange={(e: any) => setTimeToDiscuss(e.target.value)}></input></div>
          <div>Bad Guy Vision (Between 0 and 1.0): <input type="number" min="0" max="1" placeholder="1" value={badGuyVision} onChange={(e: any) => setBadGuyVision(e.target.value)}></input></div>
          <div>Nb material needed to win: <input type="number" min="1" placeholder="30" value={nbMaterialToWin} onChange={(e: any) => setNbMaterialToWin(e.target.value)}></input></div>
          <div>Player speed factor: <input type="number" placeholder="1" value={playerSpeed} onChange={(e: any) => setPlayerSpeed(e.target.value)}></input></div>
          <div>Entity speed factor: <input type="number" placeholder="1" value={entitySpeed} onChange={(e: any) => setEntitySpeed(e.target.value)}></input></div>
          <div>
            <div>Nb Mob spawn per day:</div>
            <ul>
              <li><div>Wood: <input type="number" placeholder="5" value={woodSpawn} onChange={(e: any) => setWoodSpawn(e.target.value)}></input></div></li>
              <li><div>Food: <input type="number" placeholder="10" value={foodSpawn} onChange={(e: any) => setFoodSpawn(e.target.value)}></input></div></li>
              <li><div>Key: <input type="number" placeholder="3" value={keySpawn} onChange={(e: any) => setKeySpawn(e.target.value)}></input></div></li>
              <li><div>Sword: <input type="number" placeholder="3" value={swordSpawn} onChange={(e: any) => setSwordSpawn(e.target.value)}></input></div></li>
              <li><div>Backpack: <input type="number" placeholder="0" value={backpackSpawn} onChange={(e: any) => setBackpackSpawn(e.target.value)}></input></div></li>
              <li><div>HealthPotion: <input type="number" placeholder="1" value={healthPotionSpawn} onChange={(e: any) => setHealthPotionSpawn(e.target.value)}></input></div></li>
            </ul>
          </div>
          <div>
            <div>Nb Item spawn per day:</div>
            <ul>
              <li><div>Dog: <input type="number" placeholder="3" value={dogSpawn} onChange={(e: any) => setDogSpawn(e.target.value)}></input></div></li>
              <li><div>Rat: <input type="number" placeholder="3" value={ratSpawn} onChange={(e: any) => setRatSpawn(e.target.value)}></input></div></li>
              <li><div>Snake: <input type="number" placeholder="3" value={snakeSpawn} onChange={(e: any) => setSnakeSpawn(e.target.value)}></input></div></li>
            </ul>
          </div>
          <div><button disabled={!canCreateGame()} onClick={clickCreateGame}>Create Game</button></div>
        </div>
        <div className="modal-block">
          <div><input type="text" placeholder="Game id" value={gameHash} onChange={(e: any) => setGameHash(e.target.value)}></input> <button disabled={!gameHash} onClick={clickJoinGame}>Join
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
        <div className="modal-block choose-char">
          <button onClick={prevChar}>◀</button>
          <img className="character-img" src={`./assets/char${charId}.png`}></img>
          <button onClick={nextChar}>▶</button>
        </div>
        <div className="modal-block">
          <div><button onClick={clickStartGame}>Start Game</button></div>
        </div>
      </div>
    </div>
  )
}


export default InitGameModal
