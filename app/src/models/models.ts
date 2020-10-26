export interface Alert {
  action: string;
  symbol: string;
  price?: number | null;
  risky?: boolean;
}

export interface EntryPositionDoc extends FirebaseFirestore.DocumentData {
  symbol: string;
  quantity: number;
  price: number;
  discriminator: string;
  created: Date;
}
