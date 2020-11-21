import { allowedUserRoles } from './allowed-traders';
import { RuntimeAlertMessage, RuntimeMessage } from './models/models';

const API_URL = 'https://localhost:3000';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo?.url && changeInfo?.url.includes('discord')) {
    chrome.tabs.sendMessage(
      tabId,
      { action: 'onUrlChange', changeInfo },
      function (response) {}
    );
  }
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage<any>) => {
  if (message.name === 'alert') {
    const alertMessage = message as RuntimeMessage<RuntimeAlertMessage>;
    console.log(
      'Alert received',
      new Date().toLocaleString(),
      alertMessage.data
    );

    // const discriminator = alertMessage.data?.discriminator;
    // if (!allowedTraders.includes(discriminator)) {
    //   return;
    // }

    const userRoles = alertMessage.data?.userRoles;
    if (!userRoles.some((role) => allowedUserRoles.includes(role))) {
      return;
    }

    if (allowedUserRoles)
      if (alertMessage.data?.alert?.option) {
        fetch(`${API_URL}/alert/option.endpoint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertMessage.data),
        });
      } else {
        fetch(`${API_URL}/alert.endpoint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertMessage.data),
        });
      }
  }
});
