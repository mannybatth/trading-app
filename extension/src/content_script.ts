import { sendAlertMessage } from './libs/communication';
import { MessageWatcher } from './libs/message-watcher';
import { ChatMessage } from './models/models';

const onNewMessage = (message: ChatMessage) => {
  if (message?.alert) {
    console.log(message);
    sendAlertMessage(message);
  }
};

const watcher = new MessageWatcher(onNewMessage, { waitForXtradeIcon: false });

try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action === 'onUrlChange') {
      watcher.reload();
    }
    sendResponse(true);
  });
} catch (error) {}
