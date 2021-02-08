import "./NightOverlay.css";
import * as React from 'react';
import { InputManager } from '../InputManager';
import { CharacterController } from '../CharacterController';
import { useState } from 'react';
import { Gift, Board } from '../Board';
import { ItemType } from "../Cell";
import SpriteImage from "./SpriteImage";

const NightOverlay = ({ inputManager, characterController, board }: NightOverlayProps) => {

  const [playerDisplays, setPlayerDisplays] = useState<PlayerDisplay[]>([]);
  const [nbPass, setNbPass] = useState<number>(0);
  const [playerVote, setPlayerVote] = useState<string>("");
  const [foodGiven, setFoodGiven] = useState<Gift[]>([]);
  const [materialGiven, setMaterialGiven] = useState<Gift[]>([]);
  const [hash, setHash] = useState<string>(null);
  const [hasMaterial, setHasMaterial] = useState<boolean>(false);
  const [hasFood, setHasFood] = useState<boolean>(false);
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [nbMaterialToWin, setNbMaterialToWin] = useState<number>(0);


  React.useEffect(() => {
    const inter = setInterval(() => {
      const newHash = JSON.stringify(board);
      if (hash == newHash)
        return;

      setHash(newHash);
      const playerName = board.player.entity.name;
      const nightState = board.nightState;
      const players = Object.values(board.players).map(x => x.entity);
      const hasMaterial = board.player.entity.inventory.includes(ItemType.Wood);
      const hasFood = board.player.entity.inventory.includes(ItemType.Food);
      const isAlive = board.player.entity.pv > 0;

      const playerDisplays: PlayerDisplay[] = [];
      let playerVote = nightState.votes.find(x => x.from == playerName)?.for;

      for (const player of players) {
        const hasVoted = nightState.votes.findIndex(x => x.from == player.name) != -1;

        playerDisplays.push({
          name: player.name,
          spriteId: player.spriteId,
          alive: player.pv > 0,
          playerVote: playerVote == player.name,
          hasVoted: hasVoted,
          isPlayer: playerName == player.name,
          nbVotes: nightState.votes.filter(x => x.for == player.name).length
        });
      }
      const nbPass = nightState.votes.filter(x => x.for == 'pass').length;

      setPlayerDisplays(playerDisplays);
      setNbPass(nbPass);
      setPlayerVote(playerVote);
      setFoodGiven(Array.from(nightState.foodGiven));
      setMaterialGiven(Array.from(nightState.materialGiven));
      setHasMaterial(hasMaterial);
      setHasFood(hasFood);
      setIsAlive(isAlive)
      setNbMaterialToWin(board.gameConfig.nbMaterialToWin);
    }, 300)

    return () => {
      clearInterval(inter);
    }
  }, [])

  const vote = (name: string) => {
    console.log("voted for " + name);
    let inputVote = inputManager.getVote(name);
    characterController.sendInput(inputVote);
    return false;
  }

  const giveFood = () => {
    let inputVote = inputManager.getGiveFood();
    characterController.sendInput(inputVote);
  }

  const giveMaterial = () => {
    let inputVote = inputManager.getGiveMaterial();
    characterController.sendInput(inputVote);
  }

  return (
    <div className="night-overlay">
      <div className="night-overlay-modal">
        <h1 className="mt-2 mb-2">The night is upon us.</h1>
        <div className="modal-block players-vote">
          <h2>Players:</h2>
          <div className="players-alive">
            {playerDisplays.map(p => (
              <div key={p.name} className="vote-line">
                <div style={{ fontWeight: p.playerVote ? 'bold' : 'normal' }}>{p.name} {p.alive ? <SpriteImage sprite={p.spriteId}></SpriteImage> : <SpriteImage sprite={19}></SpriteImage>} {p.hasVoted ? '✔' : ''} [{p.nbVotes}]</div>
                {!isAlive || !p.alive || p.isPlayer || playerVote != null ? null : <button className="button" onClick={() => vote(p.name)}>vote</button>}
              </div>
            ))}
            <div className="vote-line">
              <div style={{ fontWeight: playerVote == 'pass' ? 'bold' : 'normal' }}>Pass [{nbPass}]</div>
              {!isAlive ? null : <button className="button" disabled={playerVote != null} onClick={() => vote('pass')}>vote</button>}
            </div>
          </div>
        </div>
        <div className="modal-block collect">
          <div className="collect-item">
            <div>Available food today: {foodGiven.length} / {playerDisplays.filter(p => p.alive).length}</div>
            <div className="collect-item-list">
              {foodGiven.map((f, i) => (
                <div key={i}>
                  <div className="player-name mb-1 mr-1">{f.from}</div>
                  <SpriteImage sprite={ItemType.Food}></SpriteImage>
                </div>
              ))}
            </div>
            <button className="button" disabled={!hasFood} onClick={() => giveFood()}>Give 1 food</button>
          </div>

          <div className="collect-item">
            <div>Collected wood today: {materialGiven.length} / {nbMaterialToWin}</div>
            <div className="collect-item-list">
              {materialGiven.map((m, i) => (
                <div key={i}>
                  <div className="player-name mb-1 mr-1">{m.from}</div>
                  <SpriteImage sprite={ItemType.Wood}></SpriteImage>
                </div>
              ))}
            </div>
            <button className="button" disabled={!hasMaterial} onClick={() => giveMaterial()}>Give 1 material</button>
          </div>

        </div>
      </div>
    </div>
  )
}

interface PlayerDisplay {
  name: string;
  alive: boolean;
  playerVote: boolean;
  hasVoted: boolean;
  isPlayer: boolean;
  nbVotes: number;
  spriteId: number;
}

interface NightOverlayProps {
  inputManager: InputManager,
  characterController: CharacterController,
  board: Board;
}

export default NightOverlay