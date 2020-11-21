export interface ChatMessage {
  username: string;
  text: string;
  discriminator: string;
  alert: Alert;
  userRoles: string[];
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
  option?: {
    date: string;
    type: string; // call/put
    strike: number;
  };
}

export interface RuntimeMessage<T> {
  name: string;
  data: T;
}

export interface RuntimeAlertMessage {
  username: string;
  discriminator: string;
  alert: Alert;
  userRoles: string[];
}
