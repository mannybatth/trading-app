import { ChatMessage } from '../models/models';
import { containsXtradeIcon, waitForElementToBeVisible } from './helpers';
import { parseAlert } from './signal-parser';

export class MessageQueue {
  public callback: (message: ChatMessage) => void;

  public addTask = (() => {
    let pending: Promise<ChatMessage | null> = Promise.resolve(null);

    const run = async (node: HTMLElement) => {
      try {
        await pending;
      } finally {
        return this.buildMessageFromNode(node);
      }
    };

    // update pending promise so that next task could await for it
    return (node: HTMLElement) => (pending = run(node));
  })();

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
        hasXtradeIcon: containsXtradeIcon(node),
      },
    };
    this.callback(message);
    return message;
  }
}
