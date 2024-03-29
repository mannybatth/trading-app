import { ChatMessage } from '../models/models';
import { waitForElementToBeVisible } from './helpers';
import { MessageQueue } from './message-queue';

export interface MessageWatcherConfig {
  onlyNewMessages?: boolean;
}

export class MessageWatcher {
  private bodyObserver: MutationObserver;
  private chatObserver: MutationObserver;
  private lastMessageId: number;

  private config: MessageWatcherConfig;

  private queue = new MessageQueue();

  constructor(
    public callback: (message: ChatMessage) => void,
    { onlyNewMessages = true }: MessageWatcherConfig = {
      onlyNewMessages: true,
    }
  ) {
    this.queue.callback = callback;
    this.config = {
      onlyNewMessages,
    };
    this.start();
  }

  public reload() {
    this.lastMessageId = undefined;
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
    this.watchForChannel();
  }

  private watchForChannel() {
    this.stop();

    const body = document.documentElement || document.body;
    this.bodyObserver = new MutationObserver((mutationsList, observer) => {
      // const chatMessagesElement = document.getElementById('chat-messages');
      const chatMessagesElement: HTMLElement = document.querySelector(
        '[data-list-id="chat-messages"]'
      );
      if (chatMessagesElement) {
        this.watchChatMessages(chatMessagesElement);
      }
    });
    this.bodyObserver.observe(body, {
      attributes: false,
      childList: true,
      subtree: true,
    });
  }

  private async watchChatMessages(chatMessagesElement: HTMLElement) {
    this.stop();

    if (this.config.onlyNewMessages) {
      await waitForElementToBeVisible((node: HTMLElement) => {
        return chatMessagesElement.querySelector('[id*="---new-messages-bar"]')
          ? true
          : false;
      }, chatMessagesElement);
    }

    this.chatObserver = new MutationObserver((mutationsList, observer) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach(async (node: HTMLElement) => {
          if (!node?.id?.includes('chat-messages')) {
            return;
          }

          const nodeIdSplits = node?.id.split('-');
          const messageIdStr = nodeIdSplits[nodeIdSplits.length - 1];
          const messageId = messageIdStr && parseInt(messageIdStr);

          if (
            !messageId ||
            (this.lastMessageId && messageId < this.lastMessageId)
          ) {
            // must be a old message
            return;
          }

          this.lastMessageId = messageId;

          this.queue.addTask(node);
        });
      });
    });
    this.chatObserver.observe(chatMessagesElement, {
      attributes: false,
      childList: true,
      subtree: true,
    });
  }
}
