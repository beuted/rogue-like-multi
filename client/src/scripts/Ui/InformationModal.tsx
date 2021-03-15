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
        <div>You are a group of wizard, banished from your kingdom for stealing gold from the king.
        As a punishment you've been sent to the black forest of Mirkwood.</div>
        <div>The only way out is to gather enough Emeralds to cast a group teleportation spell.
        That could take days so you better try to find food as well.</div>
        <div>This sound doable but there is hitch, Mirkwood don't want you here, and it can take the appearance of your friends to lure you into death... <SpriteImage sprite={ItemType.Blood}></SpriteImage></div>
      </div>

      <div className="modal-block">
        <h1>How to play</h1>
        <div>When starting the game you'll be assigned a role, you'll either be a Wizard <SpriteImage sprite={129}></SpriteImage>or a desguised minion of the black forest <SpriteImage sprite={128}></SpriteImage>.</div>
      </div>
      <div className="modal-block">
        <h2><SpriteImage sprite={129} size={4}></SpriteImage> <u>As a Wizard</u></h2>
        <div>Each day you have to find food <SpriteImage sprite={ItemType.Food}></SpriteImage>for you and your group, but also collect Emeralds <SpriteImage sprite={ItemType.Emerald}></SpriteImage></div>
        <div>You will find other objects on your journey that will help you:</div>
        <ul>
          <li>Swords <SpriteImage sprite={ItemType.Sword}></SpriteImage>allow you to deal more damage</li>
          <li>Armors <SpriteImage sprite={ItemType.Armor}></SpriteImage>allow you to negate the damage of one hit</li>
          <li>Potions <SpriteImage sprite={ItemType.HealthPotion}></SpriteImage>make you gain one pv back</li>
          <li>Keys <SpriteImage sprite={ItemType.Key}></SpriteImage>let you open <SpriteImage sprite={39}></SpriteImage>chests</li>
          <li>Finally Backpacks <SpriteImage sprite={ItemType.Backpack}></SpriteImage>let you carry more items</li>
        </ul>
        <div><SpriteImage sprite={EntityType.Snake}></SpriteImage>You will find some creatures in the forest, some more dangerous than others, if you manage to defeat them not only they
          are a reliable source of food <SpriteImage sprite={ItemType.Food}></SpriteImage>but they could also drop objects <SpriteImage sprite={ItemType.HealthPotion}></SpriteImage>they swallowed.</div>
        <div>At the end of each day the group will put in common the food and emerald they found during the day. Be careful is some food are missing the wizards
          unable to eat will loose HP. You will also have the possibility to execute someone they believe is sent by the back forest. Be careful not to execute an innocent/</div>
      </div>
      <div className="modal-block">
        <h2><SpriteImage sprite={128} size={4}></SpriteImage> <u>As a minion of Mirkwood</u></h2>
        <div>Your goal is to eliminated each and every Wizard that dared enter Mirkwood. <SpriteImage sprite={ItemType.Blood}></SpriteImage></div>
        <div>For this you're granted a greater vision by Mirkwood and a sword every day if you don't have one.</div>
      </div>
      <div className="modal-block">
        <h2><u>Keyboard</u></h2>
        <div>​Use the arrows or WASD  or ​ZQSD to move around the map.</div>
        <div>Use space to swing your sword.</div>
        <div>Use enter to flash through walls or to catch-up a wizard if you are a minion or Mirkwood.</div>
        <div>Use 1,2,3,4,... to use or drop items. Or just click on them.</div>
        <div>During the night use your mouse to vote or give items to the group.</div>
      </div>





      <div className="config-button">
        <div onClick={() => hideModal()}><SpriteImage sprite={66} size={4}></SpriteImage></div>
      </div>
    </div>
  )
}

export default InformationModal