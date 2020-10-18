import { ChatMessage } from "../models/models";

export interface MessageWatcherConfig {
  watchForXtradeIcon?: boolean,
  iconWaitTime?: number,
  onlyNewMessages?: boolean
}

export class MessageWatcher {
  private bodyObserver: MutationObserver;
  private chatObserver: MutationObserver;

  private chatMessagesElement: HTMLElement;
  private config: MessageWatcherConfig;

  constructor(
    public callback: (message: ChatMessage) => void,
    {
      watchForXtradeIcon = true,
      iconWaitTime = 7000,
      onlyNewMessages = true
    }: MessageWatcherConfig = {
        watchForXtradeIcon: true,
        iconWaitTime: 7000,
        onlyNewMessages: true
      }
  ) {
    this.config = {
      watchForXtradeIcon,
      iconWaitTime,
      onlyNewMessages
    };
    this.start();
  }

  public reload() {
    this.chatMessagesElement = null;
    this.stop();
    this.start();
  }

  public stop() {
    if (this.bodyObserver) {
      this.bodyObserver.disconnect();
      this.bodyObserver = null;
    }

    if (this.chatObserver) {
      this.chatObserver.disconnect();
      this.chatObserver = null;
    }
  }

  private start() {
    if (this.config.onlyNewMessages) {
      setTimeout(() => {
        this.watchForChannel();
      }, 3000);
    } else {
      this.watchForChannel();
    }
  }

  private watchForChannel() {
    this.stop();

    const body = document.documentElement || document.body;
    this.bodyObserver = new MutationObserver((mutationsList, observer) => {
      const chatMessagesElement = document.getElementById('chat-messages');
      if (chatMessagesElement) {
        this.chatMessagesElement = chatMessagesElement;
        this.watchChatMessages();
      }
    });
    this.bodyObserver.observe(body, { attributes: false, childList: true, subtree: true });
  }

  private watchChatMessages() {
    this.stop();

    this.chatObserver = new MutationObserver((mutationsList, observer) => {
      // console.log('mutationsList', mutationsList);
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node: HTMLElement) => {
          if (!node?.id?.includes('chat-messages')) {
            return;
          }

          if (this.config.watchForXtradeIcon) {
            this.watchMessageForXtradeIcon(node);
          } else {
            const message = this.buildMessageFromNode(node);
            if (message.username && message.text) {
              this.callback(message);
            }
          }
        })
      })
    });
    this.chatObserver.observe(this.chatMessagesElement, { attributes: false, childList: true, subtree: true });
  }

  private watchMessageForXtradeIcon(messageNode: HTMLElement) {
    let timeout: NodeJS.Timeout;
    const messageObserver = new MutationObserver((mutationsList, observer) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node: HTMLElement) => {
          if (this.containsXtradeIcon(messageNode)) {
            observer.disconnect();

            if (timeout) {
              clearTimeout(timeout);
              timeout = null;
            }

            const message = this.buildMessageFromNode(messageNode);
            if (message.username && message.text) {
              this.callback(message);
            }
          }
        });
      });
    });
    messageObserver.observe(messageNode, { attributes: false, childList: true, subtree: true });

    timeout = setTimeout(() => {
      messageObserver.disconnect();
    }, this.config.iconWaitTime);
  }

  private containsXtradeIcon(node: HTMLElement): boolean {
    const reactionsDiv = node.querySelector('[class*="reactions-"]');
    return reactionsDiv?.querySelector('img[alt="Xtrades"]') ? true : false;
  }

  private buildMessageFromNode(node: HTMLElement) {
    const usernameSpan = node.querySelector('[class*="username-"]');
    const textDiv = node.querySelector('[class*="messageContent-"]');
    textDiv?.querySelector("blockquote")?.remove();
    const username = usernameSpan?.textContent;
    const text = textDiv?.textContent?.trim();

    return {
      username,
      text,
      element: {
        id: node.id,
        hasXtradeIcon: this.containsXtradeIcon(node)
      }
    };
  }
}
