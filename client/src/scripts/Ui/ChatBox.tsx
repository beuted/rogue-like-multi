import './ChatBox.css';
import * as React from 'react';
import { useState } from 'react';
import { SocketClient, SocketMessageReceived } from '../SocketClient';

type Message = {
  message: string,
  author: string,
  time: string,
  color: string | null
};

const ChatBox = ({ socketClient }: { socketClient: SocketClient }) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  React.useEffect(() => {
    socketClient.registerListener(SocketMessageReceived.NewMessage, (playerName, message) => {
      addMessageDiv(playerName, message);
    });

    return () => { socketClient.unregisterListener(SocketMessageReceived.NewMessage) }
  }, [])


  const addMessageDiv = (playerName: string, messageString: string, color?: string) => {
    let message: Message = {
      message: messageString,
      author: playerName,
      time: String((new Date()).getHours()).padStart(2, '0') + ':' + String((new Date()).getMinutes()).padStart(2, '0'),
      color: color
    }
    messages.push(message);
    setMessages(messages.concat(message));
    //TODO: this.chatMessageBox.scrollTop = this.chatMessageBox.scrollHeight;
  }

  const handleChangeText = (event: any) => {
    setText(event.target.value);
  };

  const addCurrentMessage = () => {
    addMessageDiv('You', text, '#3ca370');
    setText('');
    sendMessage(text);
  }

  const sendMessage = (text: string) => {
    console.log('TODO' + text); // TODO
  }

  //    chatController.init(document.getElementById('chat-box'), (message) => this.characterController.talk(message));

  return (
    <div className="chat-box">
      <div className="chat-box-messages">
        {messages.map(m => <div className="chat-box-message" color={m.color}><span className="chat-box-messages-date">[{m.time}]</span> <span className="chat-box-messages-author">{m.author}</span>: {m.message}</div>)}
      </div>
      <div className="chat-box-input">
        <textarea className="chat-box-input-text" value={text} onChange={handleChangeText}></textarea>
        <div className="chat-box-input-btn" onClick={addCurrentMessage}>Shout!</div>
      </div>
    </div>
  )
}


export default ChatBox
