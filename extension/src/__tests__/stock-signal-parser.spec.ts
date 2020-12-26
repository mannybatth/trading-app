import { parseAlert } from '../libs/signal-parser';
import { Alert } from '../models/models';

type AlertTest = { test: string; expected: Alert };
const tests: AlertTest[] = [
  {
    test: 'BTO HTZ',
    expected: null,
  },
  {
    test: 'BTO HTZ@2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: 'BTO @2.50',
    expected: null,
  },
  {
    test: 'BTO   @2.50',
    expected: null,
  },
  {
    test: 'BTO   @   2.50',
    expected: null,
  },
  {
    test: 'BTO HTZ@ 2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: 'BTO HTZ@  2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: '  BTO  HTZ@  2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: ' BTO       HTZ@   2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: '  BTO  HTZ@ hk 2.50',
    expected: null,
  },
  {
    test: '  STC  HTZ@ hk 2.50',
    expected: {
      action: 'STC',
      symbol: 'HTZ',
      price: null,
      risky: false,
    },
  },
  {
    test: '    STC  HTZ@    $2.50',
    expected: {
      action: 'STC',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: '  BTO  HTZ@ $2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: 'risky BTO  HTZ @$2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: true,
    },
  },
  {
    test: 'BTO HTZ @2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: 'bto HTZ @2.50',
    expected: {
      action: 'BTO',
      symbol: 'HTZ',
      price: 2.5,
      risky: false,
    },
  },
  {
    test: 'Stc NIO @29 from 26',
    expected: {
      action: 'STC',
      symbol: 'NIO',
      price: 29,
      risky: false,
    },
  },
  {
    test: 'STO ATVI @ 80.91',
    expected: {
      action: 'STO',
      symbol: 'ATVI',
      price: 80.91,
      risky: false,
    },
  },
  {
    test: 'BTO CTT @ 8.36 ( swing PT 8.75)',
    expected: {
      action: 'BTO',
      symbol: 'CTT',
      price: 8.36,
      risky: false,
    },
  },
  {
    test: 'STC SPI @ 8.90 (remaining). Didnt get the second run as expected',
    expected: {
      action: 'STC',
      symbol: 'SPI',
      price: 8.9,
      risky: false,
    },
  },
  {
    test:
      'BTO WKHS @ 22.67 (PT 1 - 24.88, PT 2- 25.41, PT 3 - 25.89, SL break of 20.81 support)',
    expected: {
      action: 'BTO',
      symbol: 'WKHS',
      price: 22.67,
      risky: false,
    },
  },
  {
    test: 'BTO SRNE @ 9.5 avg 9.509',
    expected: {
      action: 'BTO',
      symbol: 'SRNE',
      price: 9.5,
      risky: false,
    },
  },
  {
    test: 'BTO SPI @ 9.06. SL 8.90',
    expected: {
      action: 'BTO',
      symbol: 'SPI',
      price: 9.06,
      risky: false,
    },
  },
  {
    test: 'BTO ENIA @ 6.45  Swing SL 6.21 PT 6.79',
    expected: {
      action: 'BTO',
      symbol: 'ENIA',
      price: 6.45,
      risky: false,
    },
  },
  {
    test: 'STC ACB SL hit',
    expected: {
      action: 'STC',
      symbol: 'ACB',
      price: null,
      risky: false,
    },
  },
  {
    test: 'BTO fsly 87',
    expected: {
      action: 'BTO',
      symbol: 'FSLY',
      price: 87,
      risky: false,
    },
  },
  {
    test: 'STC ORGO $4.82',
    expected: {
      action: 'STC',
      symbol: 'ORGO',
      price: 4.82,
      risky: false,
    },
  },
  {
    test: 'BTO ORGO @4.65 (Good guidance) stoploss under 4.50',
    expected: {
      action: 'BTO',
      symbol: 'ORGO',
      price: 4.65,
      risky: false,
    },
  },
  {
    test: 'BTC REPL 35.46',
    expected: {
      action: 'BTC',
      symbol: 'REPL',
      price: 35.46,
      risky: false,
    },
  },
  {
    test: 'BTO HYLN @26.6 (small pos)',
    expected: {
      action: 'BTO',
      symbol: 'HYLN',
      price: 26.6,
      risky: false,
    },
  },
  {
    test: 'BTO AMC @ 3.73 avg 3.87 (HIGH RISK)',
    expected: {
      action: 'BTO',
      symbol: 'AMC',
      price: 3.73,
      risky: true,
    },
  },
  {
    test: 'BTO PSHG .60',
    expected: {
      action: 'BTO',
      symbol: 'PSHG',
      price: 0.6,
      risky: false,
    },
  },
  {
    test: 'STO PTON @ 126.88 avg $126.48',
    expected: {
      action: 'STO',
      symbol: 'PTON',
      price: 126.88,
      risky: false,
    },
  },
  {
    test: 'Risky STO PTON @ 126.88 avg $126.48',
    expected: {
      action: 'STO',
      symbol: 'PTON',
      price: 126.88,
      risky: true,
    },
  },
  {
    test: '[algo] STO PTON @ 126.88 avg $126.48',
    expected: {
      action: 'STO',
      symbol: 'PTON',
      price: 126.88,
      risky: false,
    },
  },
  {
    test: 'lotto BTO AMC @$4.82',
    expected: {
      action: 'BTO',
      symbol: 'AMC',
      price: 4.82,
      risky: true,
    },
  },
  {
    test: 'STC CGEN partial 1/2 @ 12.85',
    expected: {
      action: 'STC',
      symbol: 'CGEN',
      price: 12.85,
      risky: false,
    },
  },
  {
    test:
      'BABA recovered most of the gains .... Right at resistance and we will be super bullish if it can close above @ 300 today..',
    expected: null,
  },
  {
    test: 'STC remainder NNOX @ 54',
    expected: {
      action: 'STC',
      symbol: 'NNOX',
      price: 54,
      risky: false,
    },
  },
  {
    test: 'BTO GOLD @ 22.51 (swing) per @007of𝒲𝒶𝓁𝓁𝓈𝓉(𝘌𝘙 𝘚𝘈𝘎𝘌)',
    expected: {
      action: 'BTO',
      symbol: 'GOLD',
      price: 22.51,
      risky: false,
    },
  },
];

tests.map((alertTest) => {
  test(alertTest.test, () => {
    expect(parseAlert(alertTest.test)).toEqual(alertTest.expected);
  });
});
