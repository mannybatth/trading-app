import { Alert, ChatMessage, RuntimeAlertMessage, RuntimeMessage } from "../models/models";

export const sendAlertMessage = (message: ChatMessage, alert: Alert) => {
  const runtimeMessage: RuntimeMessage<RuntimeAlertMessage> = {
    name: "alert",
    data: {
      username: message.username,
      discriminator: message.discriminator,
      alert
    }
  };
  chrome.runtime.sendMessage(runtimeMessage);
}
