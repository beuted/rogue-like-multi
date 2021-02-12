import "./NightOverlay.css";
import * as React from 'react';
import SpriteImage from "./SpriteImage";

const InformationModal = ({ hideModal }: { hideModal: () => void }) => {


  return (
    <div className="modal">

      <div className="modal-block">
        <h1>The story</h1>
        <p>You are a group of wizard, banished from your kingdom for stealing gold from the king.
        As a punishment you've been sent to the black forest of Mirkwood.</p>
        <p>The only way out is to gather enough Emeralds to cast a group teleportation spell.
        That could take days so you better try to find food as well.</p>
        <p>This sound doable but there is hitch, the black forest don't want you here, and it can take the appearance of your friends to lure you into death...</p>
      </div>

      <div className="modal-block">
        <h1>How to play</h1>
        <p>You are a group of wizard, banished from your kingdom for stealing gold from the king.
        As a punishment you've been sent to the black forest of Mirkwood.</p>
        <p>The only way out is to gather enough Emeralds to cast a group teleportation spell.
        That could take days so you better try to find food as well.</p>
        <p>This sound doable but there is hitch, the black forest don't want you here, and it can take the appearance of your friends to lure you into death...</p>
      </div>
      <div className="config-button">
        <div onClick={() => hideModal()}><SpriteImage sprite={74}></SpriteImage></div>
      </div>
    </div>
  )
}

export default InformationModal