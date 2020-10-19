import { ChatMessage } from "../models/models";
import { containsXtradeIcon, waitForElementToBeVisible } from "./helpers";
import { MessageQueue } from "./message-queue";

export interface MessageWatcherConfig {
  waitForXtradeIcon?: boolean,
  iconWaitTime?: number,
  onlyNewMessages?: boolean
}

export class MessageWatcher {
  private bodyObserver: MutationObserver;
  private chatObserver: MutationObserver;

  private chatMessagesElement: HTMLElement;
  private config: MessageWatcherConfig;

  private queue = new MessageQueue();

  constructor(
    public callback: (message: ChatMessage) => void,
    {
      waitForXtradeIcon = true,
      iconWaitTime = 7000,
      onlyNewMessages = true
    }: MessageWatcherConfig = {
        waitForXtradeIcon: true,
        iconWaitTime: 7000,
        onlyNewMessages: true
      }
  ) {
    this.queue.callback = callback;
    this.config = {
      waitForXtradeIcon,
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
        mutation.addedNodes.forEach(async (node: HTMLElement) => {
          if (!node?.id?.includes('chat-messages')) {
            return;
          }

          if (this.config.waitForXtradeIcon) {
            this.watchMessageForXtradeIcon(node);
          } else {
            this.queue.addTask(node);
          }
        })
      })
    });
    this.chatObserver.observe(this.chatMessagesElement, { attributes: false, childList: true, subtree: true });
  }

  private async watchMessageForXtradeIcon(messageNode: HTMLElement) {
    const foundNode = await waitForElementToBeVisible((node) => {
      return containsXtradeIcon(messageNode);
    }, messageNode, this.config.iconWaitTime);

    if (foundNode) {
      this.queue.addTask(messageNode);
    }
  }
}
