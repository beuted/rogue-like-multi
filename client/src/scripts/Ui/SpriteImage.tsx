import './InitGameModal.css';
import * as React from 'react';
import { ItemType, FloorType } from '../Cell';
import { EntityType } from '../Entity';

const SpriteImage = ({ sprite, size }: { sprite: ItemType | FloorType | EntityType, size?: number }) => {
  size = size || 3;
  const spriteY = Math.floor(Number(sprite) / 10);
  const spriteX = sprite - spriteY * 10;

  return (
    <div className="img" style={{ backgroundPositionX: -spriteX * 8, backgroundPositionY: -spriteY * 8, transform: `scale(${size})` }}></div>
  )
}


export default SpriteImage
