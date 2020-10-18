import { Alert } from "../models/models";

const actions = ['BTO', 'STC', 'STO', 'BTC'];

export const parseAlert = (alertText: string): Alert | null => {
  const splits = alertText.split(" ").filter(x => x);
  const lowerCasedText = alertText.toLowerCase();
  const risky = lowerCasedText.includes('risk') || lowerCasedText.includes('lotto');
  const startPos = splits.findIndex(val => actions.includes(val.toUpperCase()));
  if (startPos >= 0) {
    const action = splits[startPos]?.toUpperCase();
    const symbol = splits[startPos + 1]?.toUpperCase();
    let priceStr: string | null = null;
    if (splits[startPos + 2] === "@") {
      priceStr = splits[startPos + 3]?.replace('$', '');
    } else {
      priceStr = splits[startPos + 2]?.replace('$', '')?.replace('@', '');
    }
    if (priceStr) {
      const price = parseFloat(priceStr) || null;
      return {
        action, symbol, price, risky
      };
    } else if (action === "STC" || action === "BTC") {
      return {
        action, symbol, price: null, risky
      };
    }
  }
  return null;
}
