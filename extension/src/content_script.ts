import { sendAlertMessage } from './libs/communication';
import { MessageWatcher } from './libs/message-watcher';
import { parseAlert } from './libs/signal-parser';
import { ChatMessage } from './models/models';

const onNewMessage = (message: ChatMessage) => {
  const alert = parseAlert(message.text);
  if (alert) {
    sendAlertMessage(message, alert);
  }
};

const watcher = new MessageWatcher(onNewMessage, { onlyNewMessages: false, watchForXtradeIcon: false });

try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action === 'onUrlChange') {
      watcher.reload();
    }
    sendResponse(true);
  });
} catch (error) { }
