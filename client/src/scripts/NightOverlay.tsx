import "./NightOverlay.css";
import * as React from 'react';
import { InputManager } from './InputManager';
import { CharacterController } from './CharacterController';
import { useState } from 'react';
import { Gift, Board } from './Board';
import { ItemType } from "./Cell";

const NightOverlay = ({ inputManager, characterController, board }: NightOverlayProps) => {

  const [playerDisplays, setPlayerDisplays] = useState<PlayerDisplay[]>([]);
  const [nbPass, setNbPass] = useState<number>(0);
  const [playerVote, setPlayerVote] = useState<string>("");
  const [foodGiven, setFoodGiven] = useState<Gift[]>([]);
  const [materialGiven, setMaterialGiven] = useState<Gift[]>([]);
  const [hash, setHash] = useState<string>(null);
  const [hasMaterial, setHasMaterial] = useState<boolean>(false);
  const [hasFood, setHasFood] = useState<boolean>(false);

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

      const playerDisplays: PlayerDisplay[] = [];
      let playerVote = nightState.votes.find(x => x.from == playerName)?.for;

      for (const player of players) {
        const hasVoted = nightState.votes.findIndex(x => x.from == player.name) != -1;

        playerDisplays.push({
          name: player.name,
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
      <div className="modal">
        <div className="modal-block">
          <b>Players:</b>
          <div className="players-alive">
            {playerDisplays.map(p => (
              <div key={p.name} className="vote-line">
                <div style={{ fontWeight: p.playerVote ? 'bold' : 'normal' }}>{p.name} {p.alive ? '😎' : '💀'} {p.hasVoted ? '✔' : ''} [{p.nbVotes}]</div>
                <button disabled={!p.alive || p.isPlayer || playerVote != null} onClick={() => vote(p.name)}>vote</button>
              </div>
            ))}
            <div className="vote-line">
              <div style={{ fontWeight: playerVote == 'pass' ? 'bold' : 'normal' }}>Pass [{nbPass}]</div>
              <button disabled={playerVote != null} onClick={() => vote('pass')}>vote</button>
            </div>
          </div>
        </div>
        <div className="modal-block">
          <b>Available food today: {foodGiven.length} / {playerDisplays.filter(p => p.alive).length}</b>
          <div>
            {foodGiven.map((f, i) => (
              <div key={i}>{f.from} : 1 food given</div>
            ))}
          </div>
          <button disabled={!hasFood} onClick={() => giveFood()}>Give 1 food</button>
        </div>

        <div className="modal-block">
          <b>Collected wood today: {materialGiven.length} / XXX</b>
          <div>
            {materialGiven.map((m, i) => (
              <div key={i}>{m.from} : 1 wood given</div>
            ))}
          </div>
          <button disabled={!hasMaterial} onClick={() => giveMaterial()}>Give 1 material</button>
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
}

interface NightOverlayProps {
  inputManager: InputManager,
  characterController: CharacterController,
  board: Board;
}

export default NightOverlay