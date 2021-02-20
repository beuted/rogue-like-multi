import './InitGameModal.css';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { GameServerClient } from '../GameServerClient';
import { EntityType } from '../Entity';
import { ItemType } from '../Cell';
import SpriteImage from './SpriteImage';
import CustomInput from './CustomInput';
import { Player, GameConfig, GameConfigStringPpties } from '../Board';
import Spinner from './Spinner';
import InformationModal from './InformationModal';

const InitGameModal = ({ gameServerClient }: { gameServerClient: GameServerClient }) => {
  const DefaultGameConfig: GameConfig = {
    nbSecsPerCycle: 120,
    nbSecsDiscuss: 60,
    badGuyVision: 1.0,
    playerSpeed: 1.0,
    entitySpeed: 1.0,
    nbMaterialToWin: 15,
    entityAggroDistance: 4,
    nbBadGuys: 1,
    itemSpawn: {
      [ItemType.Empty]: 0,
      [ItemType.Blood]: 0,
      [ItemType.DeadBody1]: 0,
      [ItemType.DeadBody2]: 0,
      [ItemType.DeadBody3]: 0,
      [ItemType.Wood]: 0,
      [ItemType.Emerald]: 5,
      [ItemType.Food]: 10,
      [ItemType.Key]: 3,
      [ItemType.Sword]: 3,
      [ItemType.Backpack]: 0,
      [ItemType.HealthPotion]: 1,
    } as any,
    entitySpawn: {
      [EntityType.Dog]: 3,
      [EntityType.Rat]: 3,
      [EntityType.Snake]: 3,
    },
    entityLoot: {
      [EntityType.Rat]: {
        loot: {
          [ItemType.Empty]: 0,
          [ItemType.Blood]: 0,
          [ItemType.DeadBody1]: 0,
          [ItemType.DeadBody2]: 0,
          [ItemType.DeadBody3]: 0,
          [ItemType.Wood]: 0,
          [ItemType.Food]: 50,
          [ItemType.Emerald]: 25,
          [ItemType.Sword]: 40,
          [ItemType.Key]: 10,
          [ItemType.Armor]: 10,
          [ItemType.HealthPotion]: 10,
          [ItemType.Backpack]: 5,
        }
      },
      [EntityType.Dog]: {
        loot: {
          [ItemType.Empty]: 0,
          [ItemType.Blood]: 0,
          [ItemType.DeadBody1]: 0,
          [ItemType.DeadBody2]: 0,
          [ItemType.DeadBody3]: 0,
          [ItemType.Wood]: 0,
          [ItemType.Food]: 50,
          [ItemType.Emerald]: 40,
          [ItemType.Sword]: 40,
          [ItemType.Key]: 60,
          [ItemType.Armor]: 10,
          [ItemType.HealthPotion]: 10,
          [ItemType.Backpack]: 25,
        }
      },
      [EntityType.Snake]: {
        loot: {
          [ItemType.Empty]: 0,
          [ItemType.Blood]: 0,
          [ItemType.DeadBody1]: 0,
          [ItemType.DeadBody2]: 0,
          [ItemType.DeadBody3]: 0,
          [ItemType.Wood]: 0,
          [ItemType.Food]: 50,
          [ItemType.Emerald]: 60,
          [ItemType.Sword]: 25,
          [ItemType.Key]: 80,
          [ItemType.Armor]: 5,
          [ItemType.HealthPotion]: 60,
          [ItemType.Backpack]: 50,
        }
      }
    },
    chestLoot: {
      loot: {
        [ItemType.Empty]: 0,
        [ItemType.Blood]: 0,
        [ItemType.DeadBody1]: 0,
        [ItemType.DeadBody2]: 0,
        [ItemType.DeadBody3]: 0,
        [ItemType.Wood]: 0,
        [ItemType.Food]: 50,
        [ItemType.Emerald]: 60,
        [ItemType.Sword]: 25,
        [ItemType.Key]: 10,
        [ItemType.Armor]: 25,
        [ItemType.HealthPotion]: 25,
        [ItemType.Backpack]: 20,
      }
    }
  }

  const [gameHash, setGameHash] = useState<string>("");
  const [playerList, setPlayerList] = useState<{ [name: string]: Player }>({});

  const [gameConfig, setGameConfig] = useState<GameConfig>(DefaultGameConfig);
  const [gameConfigJson, setGameConfigJson] = useState<string>(JSON.stringify(DefaultGameConfig, undefined, 2));

  const [showLobbyModal, setShowLobbyModal] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [showJsonConfig, setShowJsonConfig] = useState<boolean>(false);


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
    setGameConfigJson(JSON.stringify(gameConfig));
  }, [gameConfig])

  useEffect(() => {
    setShowLobbyModal(false);
  }, [])

  const canCreateGame = () => {
    return gameConfig.nbSecsPerCycle != null && gameConfig.badGuyVision != null && gameConfig.nbMaterialToWin != null
      && gameConfig.playerSpeed != null && gameConfig.entitySpeed != null && gameConfig.nbBadGuys != null && gameConfig.entityAggroDistance != null
      && gameConfig.entitySpawn[EntityType.Dog] != null && gameConfig.entitySpawn[EntityType.Rat] != null && gameConfig.entitySpawn[EntityType.Snake] != null
      && gameConfig.itemSpawn[ItemType.Emerald] != null && gameConfig.itemSpawn[ItemType.Food] != null && gameConfig.itemSpawn[ItemType.Key] != null
      && gameConfig.itemSpawn[ItemType.Sword] != null && gameConfig.itemSpawn[ItemType.Backpack] != null && gameConfig.itemSpawn[ItemType.HealthPotion] != null;
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
      let gameState = await gameServerClient.getState(gameHash);
      if (!gameState) {
        alert(`We could not find a game with id ${gameHash}`)
        return;
      }
      await gameServerClient.joinGame(gameHash);
      setShowLobbyModal(true);
    }
  };

  const prevChar = async () => {
    let newCharId: number = charId == 0 ? 2 : charId - 1;
    setCharId(newCharId);
    await gameServerClient.setPlayerSkinId(gameHash, gameServerClient.username, SkinMap[newCharId]);
  };

  const nextChar = async () => {
    let newCharId: number = charId == 2 ? 0 : charId + 1
    setCharId(newCharId);
    await gameServerClient.setPlayerSkinId(gameHash, gameServerClient.username, SkinMap[newCharId]);
  };

  async function createGame(): Promise<string> {
    return await gameServerClient.createGame(gameConfig);
  }

  async function updateGameConfig() {
    let gameConfigNew: GameConfig;
    try {
      gameConfigNew = JSON.parse(gameConfigJson);
      await gameServerClient.updateGameConfig(gameHash, gameConfigNew);
    } catch (e) {
      return; // If we can't parse or if backend return error just return
    }
    // Esle set the config with new value
    setGameConfig(gameConfigNew);
  }

  async function fetchGameConfig() {
    let game = await gameServerClient.fetchGameConfig(gameHash);
    setGameConfig(game);
  }

  async function startGame() {
    await gameServerClient.startGame(gameHash);
  }

  function backToMainMenu() {
    setShowLobbyModal(false);
  }

  function setGameConfigPpty(ppty: GameConfigStringPpties, value: number) {
    let gameConfigCopy = Object.assign({}, gameConfig);
    gameConfigCopy[ppty] = value;
    setGameConfig(gameConfigCopy);
  }

  function setGameConfigItemSpawn(itemType: ItemType, value: number) {
    let gameConfigCopy = Object.assign({}, gameConfig);
    gameConfigCopy.itemSpawn[itemType] = value;
    setGameConfig(gameConfigCopy);
  }

  function setGameConfigEntitySpawn(entityType: EntityType, value: number) {
    let gameConfigCopy = Object.assign({}, gameConfig);
    gameConfigCopy.entitySpawn[entityType] = value;
    setGameConfig(gameConfigCopy);
  }

  function canStartGame() {
    return Object.values(playerList).length <= 1;
  }

  return (
    <div className="init-game">

      <div className="modal main-menu" style={{ display: !showLobbyModal && !showConfig && !showInfo ? 'flex' : 'none' }}>
        <div className="info-button" onClick={() => setShowInfo(true)}><SpriteImage sprite={74} size={4}></SpriteImage></div>
        <h1>Leave the woods</h1>
        <button className="button" disabled={!canCreateGame()} onClick={clickCreateGame}>Create Game</button>
        <div className="join-game-group">
          <CustomInput type="text" name="Game id" placeholder="Game id" value={gameHash} onChange={(e: any) => setGameHash(e.target.value)} light></CustomInput>
          <button disabled={!gameHash} onClick={clickJoinGame} className="button">Join Game</button>
        </div>
      </div>

      <div style={{ display: showInfo ? 'flex' : 'none' }}>
        <InformationModal hideModal={() => setShowInfo(false)}></InformationModal>
      </div>

      <div className="modal" style={{ display: showConfig ? 'flex' : 'none' }}>
        <div className="modal-block">
          <h1>Game configuration</h1>
          <div className="info-button" onClick={() => setShowJsonConfig(!showJsonConfig)}><SpriteImage sprite={39} size={4}></SpriteImage></div>
          <div className="standard-config">
            <div>
              <CustomInput name="Time per Cycle (secs)" value={gameConfig.nbSecsPerCycle} placeholder={120} onChange={(e: any) => setGameConfigPpty("nbSecsPerCycle", e.target.value)}></CustomInput>
              <CustomInput name="Time To Discuss (secs)" placeholder={20} value={gameConfig.nbSecsDiscuss} onChange={(e: any) => setGameConfigPpty("nbSecsDiscuss", e.target.value)}></CustomInput>
              <CustomInput name="Mirkwood's minions Vision (0 to 1)" placeholder={1} value={gameConfig.badGuyVision} onChange={(e: any) => setGameConfigPpty("badGuyVision", e.target.value)}></CustomInput>
              <CustomInput name="Number of Mirkwood's minions" placeholder={1} value={gameConfig.nbBadGuys} onChange={(e: any) => setGameConfigPpty("nbBadGuys", e.target.value)}></CustomInput>
            </div>
            <div>
              <CustomInput name="Emeralds needed to win" placeholder={30} value={gameConfig.nbMaterialToWin} onChange={(e: any) => setGameConfigPpty("nbMaterialToWin", e.target.value)}></CustomInput>
              <CustomInput name="Player speed factor" placeholder={1} value={gameConfig.playerSpeed} onChange={(e: any) => setGameConfigPpty("playerSpeed", e.target.value)}></CustomInput>
              <CustomInput name="Mobs speed factor" placeholder={1} value={gameConfig.entitySpeed} onChange={(e: any) => setGameConfigPpty("entitySpeed", e.target.value)}></CustomInput>
              <CustomInput name="Mob aggro distance" placeholder={1} value={gameConfig.entityAggroDistance} onChange={(e: any) => setGameConfigPpty("entityAggroDistance", e.target.value)}></CustomInput>

            </div>
          </div>

          {!showJsonConfig ? (<div className="advanced-config">
            <h2>Advanced</h2>
            <div className="advanced-config-container">
              <div>
                <div className="list-item">
                  <div>Item spawn:</div>
                  <div className="item">
                    <SpriteImage sprite={ItemType.Emerald}></SpriteImage>
                    <CustomInput name="" placeholder={5} value={gameConfig.itemSpawn[ItemType.Emerald]} onChange={(e: any) => setGameConfigItemSpawn(ItemType.Emerald, e.target.value)} light></CustomInput>
                  </div>
                  <div className="item">
                    <SpriteImage sprite={ItemType.Food}></SpriteImage>
                    <CustomInput name="" placeholder={10} value={gameConfig.itemSpawn[ItemType.Food]} onChange={(e: any) => setGameConfigItemSpawn(ItemType.Food, e.target.value)} light></CustomInput>
                  </div>
                  <div className="item">
                    <SpriteImage sprite={ItemType.Key}></SpriteImage>
                    <CustomInput name="" placeholder={3} value={gameConfig.itemSpawn[ItemType.Key]} onChange={(e: any) => setGameConfigItemSpawn(ItemType.Key, e.target.value)} light></CustomInput>
                  </div>
                  <div className="item">
                    <SpriteImage sprite={ItemType.Sword}></SpriteImage>
                    <CustomInput name="" placeholder={3} value={gameConfig.itemSpawn[ItemType.Sword]} onChange={(e: any) => setGameConfigItemSpawn(ItemType.Sword, e.target.value)} light></CustomInput>
                  </div>
                  <div className="item">
                    <SpriteImage sprite={ItemType.Backpack}></SpriteImage>
                    <CustomInput name="" placeholder={0} value={gameConfig.itemSpawn[ItemType.Backpack]} onChange={(e: any) => setGameConfigItemSpawn(ItemType.Backpack, e.target.value)} light></CustomInput>
                  </div>
                  <div className="item">
                    <SpriteImage sprite={ItemType.HealthPotion}></SpriteImage>
                    <CustomInput name="" placeholder={1} value={gameConfig.itemSpawn[ItemType.HealthPotion]} onChange={(e: any) => setGameConfigItemSpawn(ItemType.HealthPotion, e.target.value)} light></CustomInput>
                  </div>
                </div>
              </div>
              <div>
                <div className="list-item">
                  <div>Mob spawn:</div>
                  <div className="item">
                    <SpriteImage sprite={EntityType.Dog}></SpriteImage>
                    <CustomInput name="" placeholder={3} value={gameConfig.entitySpawn[EntityType.Dog]} onChange={(e: any) => setGameConfigEntitySpawn(EntityType.Dog, e.target.value)} light></CustomInput>
                  </div>
                  <div className="item">
                    <SpriteImage sprite={EntityType.Rat}></SpriteImage>
                    <CustomInput name="" placeholder={3} value={gameConfig.entitySpawn[EntityType.Rat]} onChange={(e: any) => setGameConfigEntitySpawn(EntityType.Rat, e.target.value)} light></CustomInput>
                  </div>
                  <div className="item">
                    <SpriteImage sprite={EntityType.Snake}></SpriteImage>
                    <CustomInput name="" placeholder={3} value={gameConfig.entitySpawn[EntityType.Snake]} onChange={(e: any) => setGameConfigEntitySpawn(EntityType.Snake, e.target.value)} light></CustomInput>
                  </div>
                </div>
              </div>
            </div>
          </div>) :
            (<div>
              <textarea name="" value={gameConfigJson} onChange={(e: any) => setGameConfigJson(e.target.value)}></textarea>
            </div>)}
        </div>
        <div className="config-button" onClick={() => { setShowConfig(false); updateGameConfig() }}>
          <SpriteImage sprite={66} size={4}></SpriteImage>
        </div>
      </div>

      <div className="modal" style={{ display: showLobbyModal && !showConfig ? 'flex' : 'none' }}>
        <div className="config-button" onClick={async () => { await fetchGameConfig(); setShowConfig(true) }}>
          <SpriteImage sprite={ItemType.Backpack} size={5}></SpriteImage>
        </div>
        <div className="modal-block">
          <div className="player-list">
            {Object.values(playerList).map(p => (
              <div className="player" key={p.entity.name}>
                <div className="player-name">{p.entity.name}</div>
                <div className="player-img">
                  <SpriteImage sprite={p.entity.spriteId} size={5}></SpriteImage>
                </div>
              </div>
            ))}
            <div className="player">
              <Spinner />
            </div>
          </div>
        </div>

        <div className="modal-block choose-char">
          <button className="button" onClick={prevChar}>◀</button>
          <img className="character-img" src={`./assets/char${charId}.png`}></img>
          <button className="button" onClick={nextChar}>▶</button>
        </div>

        <div className="modal-block init-game-controls">
          <div><button className="button" onClick={() => backToMainMenu()}>Back</button></div>
          <div><button disabled={canStartGame()} className="button" onClick={() => startGame()}>Start Game</button></div>
        </div>
      </div>
    </div >
  )
}


export default InitGameModal
