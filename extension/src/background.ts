import { RuntimeAlertMessage, RuntimeMessage } from "./models/models";

const API_URL = 'http://localhost:3000';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo?.url && changeInfo?.url.includes('discord')) {
    chrome.tabs.sendMessage(tabId, { action: "onUrlChange", changeInfo }, function (response) { });
  }
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage<any>) => {
  if (message.name === "alert") {
    const alertMessage = message as RuntimeMessage<RuntimeAlertMessage>;
    console.log('chrome.runtime.onMessage.addListener', alertMessage.data);

    fetch(`${API_URL}/alert.endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertMessage.data),
    })
  }
});
