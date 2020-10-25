export interface ChatMessage {
  username: string;
  text: string;
  discriminator: string;
  alert: Alert;
  element: {
    id: string;
    hasXtradeIcon: boolean;
  };
}

export interface Alert {
  action: string;
  symbol: string;
  price?: number | null;
  risky: boolean;
}

export interface RuntimeMessage<T> {
  name: string;
  data: T;
}

export interface RuntimeAlertMessage {
  username: string;
  discriminator: string;
  alert: Alert;
}
