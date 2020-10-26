export interface Quote {
  status: string;
  symbol: string;
  last: {
    askprice: number;
    asksize: number;
    askexchange: number;
    bidprice: number;
    bidsize: number;
    bidexchange: number;
    timestamp: number;
  };
}

export interface StockPosition {
  symbol: string;
  qty: string;
}

export interface Order {
  id: string;
  symbol: string;
  qty: string;
  client_order_id: string;
}

export interface TradeUpdateMessage {
  event: string;
  price: string;
  timestamp: string;
  position_qty: string;
  order: Order;
}

export interface Clock {
  is_open: boolean;
}
