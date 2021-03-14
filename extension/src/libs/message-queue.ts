import { ChatMessage } from '../models/models';
import { waitForElementToBeVisible } from './helpers';
import { parseAlert, parseXCaptureAlert } from './signal-parser';

export class MessageQueue {
  public callback: (message: ChatMessage) => void;
  private previousMessageText: string;

  public addTask = (() => {
    let pending: Promise<ChatMessage | null> = Promise.resolve(null);

    const run = async (node: HTMLElement) => {
      try {
        await pending;
      } finally {
        return this.buildMessageFromXCaptureNode(node);
      }
    };

    // update pending promise so that next task could await for it
    return (node: HTMLElement) => (pending = run(node));
  })();

  private async buildMessageFromXCaptureNode(
    node: HTMLElement
  ): Promise<ChatMessage | null> {
    const embedWrapper: HTMLElement = node.querySelector(
      '[class*="embedWrapper-"]'
    );

    const usernameSpan: HTMLElement = node.querySelector(
      '[class*="username-"]'
    );
    const username = usernameSpan?.textContent;

    if (username !== 'Xcapture') {
      const textDiv = node.querySelector('[class*="messageContent-"]');
      textDiv?.querySelector('blockquote')?.remove();
      this.previousMessageText = textDiv?.textContent;

      return null;
    }

    const embedLink: HTMLAnchorElement = embedWrapper.querySelector(
      '[class*="embedAuthorNameLink-"]'
    );
    const userId = embedLink.href.replace(
      'https://app.xtrades.net/#/profile/',
      ''
    );

    const embedDescription = embedWrapper.querySelector(
      '[class*="embedDescription-"]'
    );
    const text = embedDescription.textContent;
    const alert = parseXCaptureAlert(text, this.previousMessageText);

    const message: ChatMessage = {
      username,
      discriminator: userId,
      text,
      alert,
      userRoles: [],
      element: {
        id: node.id,
      },
    };
    this.callback(message);
    return message;
  }

  private async buildMessageFromNode(
    node: HTMLElement
  ): Promise<ChatMessage | null> {
    const usernameSpan: HTMLElement = node.querySelector(
      '[class*="username-"]'
    );
    const textDiv = node.querySelector('[class*="messageContent-"]');
    textDiv?.querySelector('blockquote')?.remove();
    const username = usernameSpan?.textContent;
    const text = textDiv?.textContent;

    const alert = parseAlert(text);
    if (!alert) {
      return null;
    }

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

    const rolesListTag = userPopout.querySelector('[class*="rolesList-"]');
    const userRoles = Array.from(
      rolesListTag.querySelectorAll('[class*="role-"]')
    ).map((tag) => tag.getAttribute('aria-label'));

    usernameSpan.click();

    const message: ChatMessage = {
      username,
      discriminator,
      text,
      alert,
      userRoles,
      element: {
        id: node.id,
      },
    };
    this.callback(message);
    return message;
  }
}
