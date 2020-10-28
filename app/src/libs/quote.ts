import type Alpaca from '@alpacahq/alpaca-trade-api';
import fetch from 'node-fetch';
import type { Quote } from '../models/alpaca-models';
import { colors } from '../models/colors';

export const useFinnhubQuotes = true;

const finnhubApiUrl = 'https://finnhub.io/api';
const finnhubApiKey = 'bucfnin48v6t51vhnr20';

const margin = 0.015;

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
): Promise<{ valid: boolean; bid?: number; ask?: number; spread?: number }> => {
  if (useFinnhubQuotes) {
    try {
      const finnhubQuote = await getFinnhubQuote(symbol);
      console.log('finnhubQuote', finnhubQuote);

      if (finnhubQuote.c <= 0) {
        return {
          valid: false,
        };
      }
      const spread = finnhubQuote.c * margin;
      const ask = finnhubQuote.c + spread;
      const bid = finnhubQuote.c - spread;
      const valid = price < ask && price > bid;

      return {
        valid,
        bid,
        ask,
        spread,
      };
    } catch (error) {
      console.log(colors.fg.Red, 'Failed to get finnhub quote', symbol, error);
      return {
        valid: false,
      };
    }
  }

  let quote: Quote;
  try {
    quote = await client.lastQuote(symbol);
  } catch (err) {
    console.log(colors.fg.Red, 'Failed to get quote', symbol);
    return {
      valid: false,
    };
  }

  const bid = quote.last.bidprice;
  const ask = quote.last.askprice;
  const spread = ask - bid;
  const valid = price < ask + spread * 2 && price > bid - spread * 2;

  console.log('quote', quote);
  return {
    valid,
    bid,
    ask,
    spread,
  };
};

export const getFinnhubQuote = async (
  symbol: string
): Promise<FinnhubQuote> => {
  const response = await fetch(
    `${finnhubApiUrl}/v1/quote?symbol=${symbol}&token=${finnhubApiKey}`
  );
  const json = await response.json();
  return json;
};
