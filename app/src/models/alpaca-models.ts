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
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  qty: string;
  avg_entry_price: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface Order {
  id: string;
  asset_class: string;
  asset_id: string;
  canceled_at?: Date;
  client_order_id: string;
  created_at: Date;
  expired_at?: Date;
  extended_hours: boolean;
  failed_at?: Date;
  filled_at: Date;
  filled_avg_price: string;
  filled_qty: string;
  hwm?: any;
  legs?: Order[];
  limit_price: string;
  order_class: string;
  order_type: string;
  qty: string;
  replaced_at?: Date;
  replaced_by?: any;
  replaces?: any;
  side: string;
  status: string;
  stop_price?: any;
  submitted_at: Date;
  symbol: string;
  time_in_force: string;
  trail_percent?: any;
  trail_price?: any;
  type: string;
  updated_at: Date;
}

export interface OrderUpdateMessage {
  event: string;
  price?: string;
  timestamp?: string;
  position_qty?: string; // Total qty of position for symbol
  qty?: string; // Only qty for this order
  order: Order;
}

export interface Clock {
  timestamp: string;
  is_open: boolean;
  next_open: Date;
  next_close: Date;
}

export interface CreateOrderResponse {
  ok: boolean;
  addedToQueue?: boolean;
  reason?: string;
}
