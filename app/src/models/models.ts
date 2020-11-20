export interface Alert {
  action: string;
  symbol: string;
  price?: number | null;
  risky?: boolean;
}

export interface EntryPosition {
  symbol: string;
  quantity: number;
  price: number;
  discriminator: string;
  created: any;
}

export interface EntryPositionDoc extends FirebaseFirestore.DocumentData, EntryPosition {}
