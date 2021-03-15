import "./NightOverlay.css";
import * as React from 'react';
import SpriteImage from "./SpriteImage";
import { ItemType } from "../Cell";
import { EntityType } from "../Entity";

const InformationModal = ({ hideModal }: { hideModal: () => void }) => {


  return (
    <div className="modal">

      <div className="modal-block">
        <h1>The story</h1>
        <p>You are a group of wizard, banished from your kingdom for stealing gold from the king.
        As a punishment you've been sent to the black forest of Mirkwood.</p>
        <p>The only way out is to gather enough Emeralds to cast a group teleportation spell.
        That could take days so you better try to find food as well.</p>
        <p>This sound doable but there is hitch, Mirkwood don't want you here, and it can take the appearance of your friends to lure you into death... <SpriteImage sprite={ItemType.Blood}></SpriteImage></p>
      </div>

      <div className="modal-block">
        <h1>How to play</h1>
        <p>When starting the game you'll be assigned a role, you'll either be a Wizard <SpriteImage sprite={129}></SpriteImage>or a desguised minion of the black forest <SpriteImage sprite={128}></SpriteImage>.</p>
      </div>
      <div className="modal-block">
        <h2><SpriteImage sprite={129} size={4}></SpriteImage> <u>As a Wizard</u></h2>
        <p>Each day you have to find food <SpriteImage sprite={ItemType.Food}></SpriteImage>for you and your group, but also collect Emeralds <SpriteImage sprite={ItemType.Emerald}></SpriteImage></p>
        <p>You will find other objects on your journey that will help you:</p>
        <ul>
          <li>Swords <SpriteImage sprite={ItemType.Sword}></SpriteImage>allow you to deal more damage</li>
          <li>Armors <SpriteImage sprite={ItemType.Armor}></SpriteImage>allow you to negate the damage of one hit</li>
          <li>Potions <SpriteImage sprite={ItemType.HealthPotion}></SpriteImage>make you gain one pv back</li>
          <li>Keys <SpriteImage sprite={ItemType.Key}></SpriteImage>let you open <SpriteImage sprite={39}></SpriteImage>chests</li>
          <li>Finally Backpacks <SpriteImage sprite={ItemType.Backpack}></SpriteImage>let you carry more items</li>
        </ul>
        <p><SpriteImage sprite={EntityType.Snake}></SpriteImage>You will find some creatures in the forest, some more dangerous than others, if you manage to defeat them not only they
          are a reliable source of food <SpriteImage sprite={ItemType.Food}></SpriteImage>but they could also drop objects <SpriteImage sprite={ItemType.HealthPotion}></SpriteImage>they swallowed.</p>
        <p>At the end of each day the group will put in common the food and emerald they found during the day. Be careful is some food are missing the wizards
          unable to eat will loose HP. You will also have the possibility to execute someone they believe is sent by the back forest. Be careful not to execute an innocent/</p>
      </div>
      <div className="modal-block">
        <h2><SpriteImage sprite={128} size={4}></SpriteImage> <u>As a minion of Mirkwood</u></h2>
        <p>Your goal is to eliminated each and every Wizard that dared enter Mirkwood. <SpriteImage sprite={ItemType.Blood}></SpriteImage></p>
        <p>For this you're granted a greater vision by Mirkwood and a sword every day if you don't have one.</p>
      </div>
      <div className="modal-block">
        <h2><u>Keyboard</u></h2>
        <p>​Use the arrows or WASD  or ​ZQSD to move around the map.</p>
        <p>Use space to swing your sword.</p>
        <p>Use 1,2,3,4,... to use or drop items. Or just click on them.</p>
        <p>During the night use your mouse to vote or give items to the group.</p>
      </div>





      <div className="config-button">
        <div onClick={() => hideModal()}><SpriteImage sprite={66} size={4}></SpriteImage></div>
      </div>
    </div>
  )
}

export default InformationModal