import type Alpaca from '@alpacahq/alpaca-trade-api';
import fetch from 'node-fetch';
import {
  ameritradeApiUrl,
  ameritradeClientId,
  finnhubApiKey,
  finnhubApiUrl,
  finnhubSpreadPercent,
} from '../constants';
import { db } from '../firebase-admin';
import type { Quote } from '../models/alpaca-models';
import { colors } from '../models/colors';
import { doRefreshToken } from '../routes/td/refresh-token.endpoint';

export const quoteOption = 'td'; // td, finnhub, alpaca

export interface FinnhubQuote {
  c: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

export const isValidPrice = async (
  symbol: string,
  price: number,
  client: Alpaca
): Promise<{ valid: boolean; bid?: number; ask?: number; mark?: number; spread?: number }> => {
  try {
    const quote = await getQuote(symbol, client);
    const spread = quote.ask - quote.bid;
    const valid = () => {
      if (price > quote.ask) {
        return quote.ask * 1.05 >= price;
      } else if (price < quote.bid) {
        return quote.bid * 0.95 <= price;
      }
      return true;
    };

    return {
      valid: valid(),
      bid: quote.bid,
      ask: quote.ask,
      mark: quote.mark,
      spread,
    };
  } catch (err) {
    const error = err?.error?.message || err?.message || err;
    console.log(colors.fg.Red, `Failed to validate ${quoteOption} quote`, symbol, error);
    return {
      valid: false,
    };
  }
};

export const getQuote = async (
  symbol: string,
  client: Alpaca
): Promise<{ bid: number; ask: number; mark?: number }> => {
  let quote: { bid: number; ask: number };
  if (quoteOption === 'td') {
    try {
      quote = await getTdQuote(symbol);
    } catch (err) {
      // fallback
      console.log(colors.fg.Yellow, 'falling back to alpaca quote');
      quote = await getAlpacaQuote(symbol, client);
    }
  } else if (quoteOption === 'finnhub') {
    quote = await getFinnhubQuote(symbol);
  } else {
    quote = await getAlpacaQuote(symbol, client);
  }

  if (quote.ask <= 0) {
    throw new Error('Symbol quote not found');
  }
  return quote;
};

export const getFinnhubQuote = async (symbol: string): Promise<{ bid: number; ask: number }> => {
  const response = await fetch(`${finnhubApiUrl}/v1/quote?symbol=${symbol}&token=${finnhubApiKey}`);
  const quote: FinnhubQuote = await response.json();
  console.log('finnhubQuote', quote);

  const spread = quote.c * finnhubSpreadPercent;
  const ask = quote.c + spread;
  const bid = quote.c - spread;
  return {
    bid,
    ask,
  };
};

export const getAlpacaQuote = async (
  symbol: string,
  client: Alpaca
): Promise<{ bid: number; ask: number }> => {
  const quote: Quote = await client.lastQuote(symbol);
  console.log('alpacaQuote', quote);

  const bid = quote.last.bidprice;
  const ask = quote.last.askprice;
  return {
    bid,
    ask,
  };
};

export const getTdQuote = async (
  symbol: string
): Promise<{ bid: number; ask: number; mark?: number }> => {
  const tokenDataDoc = await db.doc('app-config/tokens').get();
  const tokenData = tokenDataDoc.data();
  const secondsNow = new Date().getTime() / 1000;
  const tokenSeconds: number = tokenData.token_created.seconds;
  const diff = secondsNow - tokenSeconds;

  let accessToken = tokenData.access_token;
  if (diff > tokenData.expires_in - 100) {
    // Refresh token
    const tokenResponse = await doRefreshToken(tokenData.refresh_token);
    accessToken = tokenResponse.access_token;
  }
  const response = await fetch(
    `${ameritradeApiUrl}/v1/marketdata/${symbol}/quotes?apikey=${ameritradeClientId}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    }
  );
  const json = await response.json();
  const quote = {
    symbol: json[symbol]?.symbol,
    bidPrice: json[symbol]?.bidPrice,
    askPrice: json[symbol]?.askPrice,
    mark: json[symbol]?.mark,
    delayed: json[symbol]?.delayed,
  };
  console.log('tdQuote', quote);

  return {
    bid: quote.bidPrice || 0,
    ask: quote.askPrice || 0,
    mark: quote.mark || 0,
  };
};
