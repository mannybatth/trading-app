import { Alert } from '../models/models';

const actions = ['BTO', 'STC', 'STO', 'BTC'];

export const parseAlert = (alertText: string): Alert | null => {
  // remove double spaces
  const text = alertText
    ?.trim()
    ?.replace(/ +(?= )/g, '')
    ?.toLowerCase();
  if (!text) {
    return null;
  }

  const splits = text.split(' ').filter((x) => x);
  const risky = text.includes('risk') || text.includes('lotto');
  const startPos = splits.findIndex((val) =>
    actions.includes(val.toUpperCase())
  );
  if (startPos >= 0) {
    const action = splits[startPos]?.toUpperCase();
    let symbol = splits[startPos + 1]?.toUpperCase();
    let priceStr: string | null = null;
    if (splits[startPos + 2] === '@') {
      priceStr = splits[startPos + 3]?.replace('$', '');
    } else {
      if (symbol.includes('@')) {
        const symbolSplits = symbol.split('@');
        if (!symbolSplits[0]) {
          return null;
        }
        symbol = symbolSplits[0];
        if (!symbolSplits[1]) {
          priceStr = splits[startPos + 2]?.replace('$', '');
        } else {
          priceStr = symbolSplits[1]?.replace('$', '');
        }
      } else {
        priceStr = splits[startPos + 2]?.replace('$', '')?.replace('@', '');
      }
    }

    const price = (priceStr && parseFloat(priceStr)) || null;
    if (price) {
      return {
        action,
        symbol,
        price,
        risky,
      };
    } else if (action === 'STC' || action === 'BTC') {
      return {
        action,
        symbol,
        price: null,
        risky,
      };
    }
  }
  return null;
};
