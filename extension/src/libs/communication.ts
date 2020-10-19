import { ChatMessage, RuntimeAlertMessage, RuntimeMessage } from "../models/models";

export const sendAlertMessage = (message: ChatMessage) => {
  const runtimeMessage: RuntimeMessage<RuntimeAlertMessage> = {
    name: "alert",
    data: {
      username: message.username,
      discriminator: message.discriminator,
      alert: message.alert
    }
  };
  chrome.runtime.sendMessage(runtimeMessage);
}
