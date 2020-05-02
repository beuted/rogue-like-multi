import { SocketClient, SocketMessageReceived } from './SocketClient';

export class ChatController {
  private chatMessageBox: Element;

  constructor(private socketClient: SocketClient) {

  }

  public init(chatElt: HTMLElement, messageSentCb: (message: string) => void) {
    this.chatMessageBox = chatElt.getElementsByClassName('chat-box-messages')[0];

    this.socketClient.registerListener(SocketMessageReceived.NewMessage, (playerName, message) => {
      this.addMessageDiv(playerName, message)
    });

    chatElt.getElementsByClassName('chat-box-input-btn')[0].addEventListener('click', () => {
      let message = (<any>chatElt.getElementsByClassName('chat-box-input-text')[0]).value;
      if (!message || message == '')
        return;
      this.addMessageDiv('You', message, '#3ca370');
      messageSentCb(message);
      (<any>chatElt.getElementsByClassName('chat-box-input-text')[0]).value = '';
    });
  }

  private addMessageDiv(playerName: string, message: string, color?: string) {
    let messageDiv = document.createElement('div');
    messageDiv.className = 'chat-box-message';
    if (color)
      messageDiv.style.color = color
    let timeDiv = document.createElement('span');
    timeDiv.className = 'chat-box-messages-date';
    timeDiv.textContent = '['+String((new Date()).getHours()).padStart(2, '0') + ':' + String((new Date()).getMinutes()).padStart(2, '0')+']';
    let authorDiv = document.createElement('span');
    authorDiv.className = 'chat-box-messages-author';
    authorDiv.textContent = playerName+':';
    let textDiv = document.createElement('span');
    textDiv.textContent = message;
    messageDiv.appendChild(timeDiv);
    messageDiv.appendChild(authorDiv);
    messageDiv.appendChild(textDiv);
    this.chatMessageBox.appendChild(messageDiv);
    this.chatMessageBox.scrollTop = this.chatMessageBox.scrollHeight;
  }
}