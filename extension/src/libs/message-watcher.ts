import { ChatMessage } from "../models/models";

export interface MessageWatcherConfig {
  watchForXtradeIcon?: boolean,
  iconWaitTime?: number,
  onlyNewMessages?: boolean
}

const containsXtradeIcon = (node: HTMLElement): boolean => {
  const reactionsDiv = node.querySelector('[class*="reactions-"]');
  return reactionsDiv?.querySelector('img[alt="Xtrades"]') ? true : false;
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
      watchForXtradeIcon = true,
      iconWaitTime = 7000,
      onlyNewMessages = true
    }: MessageWatcherConfig = {
        watchForXtradeIcon: true,
        iconWaitTime: 7000,
        onlyNewMessages: true
      }
  ) {
    this.queue.callback = callback;
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
        mutation.addedNodes.forEach(async (node: HTMLElement) => {
          if (!node?.id?.includes('chat-messages')) {
            return;
          }

          if (this.config.watchForXtradeIcon) {
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
      return containsXtradeIcon(node);
    }, messageNode, this.config.iconWaitTime);

    if (foundNode) {
      this.queue.addTask(messageNode);
    }
  }
}

function waitForElementToBeVisible(
  condition: (node: HTMLElement) => boolean,
  inParent = document.documentElement || document.body,
  waitTime = 3000
): Promise<HTMLElement | null> {
  return new Promise((resolve, reject) => {

    if (condition(inParent)) {
      resolve(inParent);
      return;
    }

    let timeout: NodeJS.Timeout;
    const messageObserver = new MutationObserver((mutationsList, observer) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node: HTMLElement) => {
          if (condition(node)) {
            observer.disconnect();
            resolve(node);

            if (timeout) {
              clearTimeout(timeout);
              timeout = null;
            }
          }
        });
      });
    });
    messageObserver.observe(inParent, { attributes: false, childList: true, subtree: true });

    timeout = setTimeout(() => {
      messageObserver.disconnect();
      resolve(null);
    }, waitTime);
  });
}

class MessageQueue {
  public callback: (message: ChatMessage) => void;

  public addTask = (() => {
    let pending: Promise<ChatMessage | null> = Promise.resolve(null);

    const run = async (node: HTMLElement) => {
      try {
        await pending;
      } finally {
        return this.buildMessageFromNode(node);
      }
    }

    // update pending promise so that next task could await for it
    return (node: HTMLElement) => (pending = run(node))
  })();

  private async buildMessageFromNode(node: HTMLElement): Promise<ChatMessage | null> {
    const usernameSpan: HTMLElement = node.querySelector('[class*="username-"]');
    const textDiv = node.querySelector('[class*="messageContent-"]');
    textDiv?.querySelector("blockquote")?.remove();
    const username = usernameSpan?.textContent;
    const text = textDiv?.textContent?.trim();

    usernameSpan.click();

    const foundNode = await waitForElementToBeVisible((ele) => {
      const result = ele.querySelector('[class*="userPopout-"]');
      return result !== undefined && result !== null;
    });

    if (!foundNode) {
      return null;
    }

    const userPopout = foundNode.querySelector('[class*="userPopout-"]');
    const headerTag = userPopout.querySelector('[class*="headerTag-"]');
    const headerTagSplits = headerTag.textContent.split('#');
    const discriminator = headerTagSplits[headerTagSplits.length - 1];

    usernameSpan.click();

    const message: ChatMessage = {
      username,
      discriminator,
      text,
      element: {
        id: node.id,
        hasXtradeIcon: containsXtradeIcon(node)
      }
    };
    this.callback(message);
    return message;
  }
}
