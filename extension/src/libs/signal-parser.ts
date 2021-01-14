import { Alert } from '../models/models';

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
      /(BTO|STC|STO|BTC)\s+([A-Z]+)(?:.*(?=@))?\@?(?:\s+)?(\d+\b(?:\.\d+\b)?|\.\d+\b)/i
    )
    ?.filter((x) => x);

  // console.log('parseStockAlert resultOne', resultOne);

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
  alertText = removeWords(alertText);

  const text = alertText
    ?.trim()
    ?.replace(/ +(?= )|\$/g, '') // remove double spaces and dollar signs
    ?.toUpperCase();
  const risky = text.includes('RISK') || text.includes('LOTTO');

  const resultOne = text
    ?.match(
      /(BTO|STC|STO|BTC)\s+(.+)(?:\s+)?(\@|\d*[CP])(?:\s+)?(\d+\b(?:\.\d+\b)?|\.\d+\b)/i
    )
    ?.filter((x) => x);

  if (!resultOne || resultOne.length < 5) {
    return parseStockAlert(alertText);
  }
  resultOne.shift();

  if (resultOne[2] !== '@') {
    resultOne[1] = `${resultOne[1]}${resultOne[2]}`;
    resultOne[2] = '@';
  }
  const action = resultOne[0];
  const price = +resultOne[3];

  // console.log('resultOne', resultOne);
  const regex = new RegExp(
    [
      /([A-Z]+)\s+(?:.*\s+)?(\d+\/\d+(?:\/\d+)?)(?:.*)?\s+(\d+(?:\.\d+)?|\.\d+)(?:\s+)?([CP]\b)|/,
      /([A-Z]+)\s+(\d+(?:\.\d+)?|\.\d+)(?:\s+)?([CP]\b)(?:.*)?\s+(\d+\/\d+(?:\/\d+)?)|/,
      /(\d+\/\d+(?:\/\d+)?)(?:.*)?\s+([A-Z]+)\s+(\d+(?:\.\d+)?|\.\d+)(?:\s+)?([CP]\b)|/,
      /(\d+(?:\.\d+)?|\.\d+)(?:\s+)?([CP]\b)(?:.*)?\s+(\d+\/\d+(?:\/\d+)?)(?:.*)?\s+([A-Z]+)|/,
      /(\d+\/\d+(?:\/\d+)?)(?:.*)?\s+(\d+(?:\.\d+)?|\.\d+)(?:\s+)?([CP]\b)(?:.*)?\s+([A-Z]+)/i,
    ]
      .map((r: RegExp) => r.source)
      .join('')
  );

  const resultTwo = resultOne && regex.exec(resultOne?.[1])?.filter((x) => x);

  // console.log('resultTwo', resultTwo);
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

const removeWordsList = [
  'remainder',
  'full',
  'half',
  'all',
  'some',
  'partial',
  'out',
  'sold',
  'stopped',
  'loss',
  'for',
  'long',
  'short',
];

const removeWords = (text: string) => {
  const expStr = removeWordsList.join('|');
  return text
    .replace(new RegExp('\\b(' + expStr + ')\\b', 'gi'), ' ')
    .replace(/\s{2,}/g, ' ');
};

/**

 Long: XL @ 21.85  |  current : $21.93
Partial exit accepted @ $2.42
Closed long: ED @ 67.25 | current : $67.29
Short: BIOL @ 0.97 | current : $0.953
Closed short: BIOL @ 0.881 | current : $0.9172

 */
export const parseXCaptureAlert = (
  alertText: string,
  previousMsgText: string
): Alert | null => {
  const text = alertText
    ?.trim()
    ?.replace(/ +(?= )|\$/g, '') // remove double spaces and dollar signs
    ?.toUpperCase();

  const resultOne = text
    ?.match(
      /(LONG|PARTIAL EXIT ACCEPTED|CLOSED LONG|SHORT|CLOSED SHORT)\:?\s([A-Z]+)?\s?@\s(\d+\b(?:\.\d+\b)?|\.\d+\b)/i
    )
    ?.filter((x) => x);

  if (!resultOne || resultOne.length < 3) {
    return null;
  }

  resultOne.shift();

  let action: string;
  let symbol: string;
  let price: number;
  let partial = false;
  switch (resultOne[0]) {
    case 'LONG':
      action = 'BTO';
      symbol = resultOne[1];
      price = +resultOne[2];
      break;
    case 'PARTIAL EXIT ACCEPTED':
      const parsedAlert = parseAlert(previousMsgText);
      action = parsedAlert.action;
      symbol = parsedAlert.symbol;
      price = parsedAlert.price;
      partial = true;
      break;
    case 'CLOSED LONG':
      action = 'STC';
      symbol = resultOne[1];
      price = +resultOne[2];
      break;
    case 'SHORT':
      action = 'STO';
      symbol = resultOne[1];
      price = +resultOne[2];
      break;
    case 'CLOSED SHORT':
      action = 'BTC';
      symbol = resultOne[1];
      price = +resultOne[2];
      break;
  }

  const alert: Alert = {
    action: action,
    symbol: symbol,
    price: price,
    risky: false,
    partial,
  };

  return alert;
};
