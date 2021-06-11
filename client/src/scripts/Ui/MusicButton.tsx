import './MusicButton.css';
import * as React from 'react';
import { SoundManager } from '../SoundManager';
import SpriteImage from './SpriteImage';

const MusicButton = ({ soundManager }: { soundManager: SoundManager },) => {

  const [musicPlaying, setMusicPlaying] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMusicPlaying(true);
  }, []);

  let click = () => {
    // syncing is ugly because only half the game is in react
    if (soundManager.isMusicPlaying) {
      setMusicPlaying(false);
      soundManager.stopMusic();
    } else {
      setMusicPlaying(true);
      soundManager.playMusic();
    }
  }

  return (
    <div className="" onClick={click}>
      { musicPlaying ?
        <div><SpriteImage sprite={107} size={4}></SpriteImage></div> :
        <div><SpriteImage sprite={108} size={4}></SpriteImage></div>}
    </div>
  )
}

export default MusicButton
