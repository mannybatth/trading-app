import { Alert } from '../models/models';

// const actions = ['BTO', 'STC', 'STO', 'BTC'];
// export const parseStockAlert = (alertText: string): Alert | null => {
//   // remove double spaces
//   const text = alertText
//     ?.trim()
//     ?.replace(/ +(?= )/g, '')
//     ?.toLowerCase();
//   if (!text) {
//     return null;
//   }

//   const splits = text.split(' ').filter((x) => x);
//   const risky = text.includes('risk') || text.includes('lotto');
//   const startPos = splits.findIndex((val) =>
//     actions.includes(val.toUpperCase())
//   );
//   if (startPos >= 0) {
//     const action = splits[startPos]?.toUpperCase();
//     let symbol = splits[startPos + 1]?.toUpperCase();
//     let priceStr: string | null = null;
//     if (splits[startPos + 2] === '@') {
//       priceStr = splits[startPos + 3]?.replace('$', '');
//     } else {
//       if (symbol.includes('@')) {
//         const symbolSplits = symbol.split('@');
//         if (!symbolSplits[0]) {
//           return null;
//         }
//         symbol = symbolSplits[0];
//         if (!symbolSplits[1]) {
//           priceStr = splits[startPos + 2]?.replace('$', '');
//         } else {
//           priceStr = symbolSplits[1]?.replace('$', '');
//         }
//       } else {
//         priceStr = splits[startPos + 2]?.replace('$', '')?.replace('@', '');
//       }
//     }

//     const price = (priceStr && parseFloat(priceStr)) || null;
//     if (price) {
//       return {
//         action,
//         symbol,
//         price,
//         risky,
//       };
//     } else if (action === 'STC' || action === 'BTC') {
//       return {
//         action,
//         symbol,
//         price: null,
//         risky,
//       };
//     }
//   }
//   return null;
// };

const parseNakedCloseAlert = (text: string): Alert | null => {
  const resultOne = text?.match(/(STC|BTC)\s+([A-Z]+)\b/i)?.filter((x) => x);

  if (!resultOne || resultOne.length < 3) {
    return null;
  }
  resultOne.shift();

  const action = resultOne[0];
  const symbol = resultOne[1];

  const alert: Alert = {
    action,
    symbol,
    price: null,
    risky: false,
  };

  return alert;
};

export const parseStockAlert = (alertText: string): Alert | null => {
  const text = alertText
    ?.trim()
    ?.replace(/ +(?= )|\$/g, '') // remove double spaces and dollar signs
    ?.toUpperCase();
  const risky = text.includes('RISK') || text.includes('LOTTO');

  const resultOne = text
    ?.match(
      /(BTO|STC|STO|BTC)\s+([A-Z]+)(?:.*(?=@))?\@?(?:\s+)?(\d+(?:\.\d+)?|\.\d+)/i
    )
    ?.filter((x) => x);

  if (!resultOne || resultOne.length < 4) {
    return parseNakedCloseAlert(text);
  }
  resultOne.shift();

  const action = resultOne[0];
  const symbol = resultOne[1];
  const price = +resultOne[2];

  const alert: Alert = {
    action,
    symbol,
    price,
    risky,
  };

  return alert;
};

export const parseAlert = (alertText: string): Alert | null => {
  const text = alertText
    ?.trim()
    ?.replace(/ +(?= )|\$/g, '') // remove double spaces and dollar signs
    ?.toUpperCase();
  const risky = text.includes('RISK') || text.includes('LOTTO');

  const resultOne = text
    ?.match(/(BTO|STC|STO|BTC)\s+(.+)(?:\s+)?\@(?:\s+)?(\d+(?:\.\d+)?|\.\d+)/i)
    ?.filter((x) => x);

  if (!resultOne || resultOne.length < 4) {
    return parseStockAlert(alertText);
  }
  resultOne.shift();

  const action = resultOne[0];
  const price = +resultOne[2];

  const resultTwo =
    resultOne &&
    resultOne[1]
      ?.match(
        /([A-Z]+)\s+(\d+\/\d+(?:\/\d+)?)\s+(\d+(?:\.\d+)?|\.\d+)([CP])|([A-Z]+)\s+(\d+(?:\.\d+)?|\.\d+)([CP])\s+(\d+\/\d+(?:\/\d+)?)|(\d+\/\d+(?:\/\d+)?)\s+([A-Z]+)\s+(\d+(?:\.\d+)?|\.\d+)([CP])|(\d+(?:\.\d+)?|\.\d+)([CP])\s+(\d+\/\d+(?:\/\d+)?)\s+([A-Z]+)|(\d+\/\d+(?:\/\d+)?)\s+(\d+(?:\.\d+)?|\.\d+)([CP])\s+([A-Z]+)/i
      )
      ?.filter((x) => x);

  if (!resultTwo || resultTwo.length < 5) {
    return parseStockAlert(alertText);
  }
  resultTwo.shift();

  const typeIndex = resultTwo.findIndex((x) => x === 'C' || x === 'P');
  if (typeIndex === -1) {
    return parseStockAlert(alertText);
  }
  const type = resultTwo[typeIndex] === 'C' ? 'call' : 'put';
  const strike = +resultTwo[typeIndex - 1];

  resultTwo.splice(typeIndex - 1, 2);

  const dateIndex = resultTwo.findIndex((x) => x.includes('/'));
  if (dateIndex === -1) {
    return parseStockAlert(alertText);
  }
  const date = resultTwo[dateIndex];

  resultTwo.splice(dateIndex, 1);

  const symbol = resultTwo[0];

  const alert: Alert = {
    action,
    symbol,
    price,
    risky,
    option: {
      date,
      strike,
      type,
    },
  };

  return alert;
};
