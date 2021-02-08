import * as React from 'react';
import { SocketClient, SocketMessageReceived } from './SocketClient';
import InitGameModal from './Ui/InitGameModal';
import { GameServerClient } from './GameServerClient';
import { useEffect, useState } from 'react';
import { BoardScene } from './BoardScene';
import { GameState, Board } from './Board';
import NightOverlay from './Ui/NightOverlay';
import { InputManager } from './InputManager';
import { CharacterController } from './CharacterController';

const App = ({ app }: { app: PIXI.Application }) => {
  const [user, setUser] = useState<{ username: string, password: string }>(null);
  const [boardScene, setBoardScene] = useState<BoardScene>(null);
  const [gameServerClient] = useState<GameServerClient | null>(new GameServerClient());
  const [socketClient] = useState<SocketClient | null>(new SocketClient());
  const [inputManager] = useState<InputManager | null>(new InputManager());
  const [characterController, setCharacterController] = useState<CharacterController | null>(null);
  const [showGameModal, setShowGameModal] = useState<boolean>(true);
  const [showNightOverlay, setShowNightOverlay] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [board] = useState<Board>(new Board());

  useEffect(() => {
    async function fetchUser() {
      let res = await gameServerClient.authenticate();
      if (res)
        setUser(res);
    };
    // Fetch the user and init game Client
    fetchUser();

    const characterController = new CharacterController(socketClient);
    const boardScene = new BoardScene(app, gameServerClient, socketClient, inputManager, characterController, board, { setShowGameModal, setShowNightOverlay });

    setCharacterController(characterController);
    setBoardScene(boardScene);
  }, [])

  useEffect(() => {
    if (!boardScene || !user) return;

    socketClient.init(user);

    // Called once for init
    socketClient.registerListener(SocketMessageReceived.InitBoardState, (gameState: GameState) => {
      board.init(gameState, user.username);
      boardScene.postMapInit(board.cells);
      setShowGameModal(false);
    });

    // Init canvas game
    boardScene.init();

    document.getElementById('game').appendChild(app.view);
    //app.renderer.resize(window.innerWidth, window.innerHeight);

    setLoading(false)
  }, [user, boardScene])

  return (
    <div className="game-container">
      <div className="game" id="game"></div>
      {!loading ?
        <div>
          {showGameModal ? <InitGameModal gameServerClient={gameServerClient}></InitGameModal> : null}
          {showNightOverlay ? <NightOverlay inputManager={inputManager} characterController={characterController} board={board}></NightOverlay> : null}
        </div> : <div>Loading ...</div>}
    </div>
  )
}

export default App