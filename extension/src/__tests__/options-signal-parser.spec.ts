import { parseAlert } from '../libs/signal-parser';
import { Alert } from '../models/models';

type AlertTest = { test: string; expected: Alert };
const tests: AlertTest[] = [
  {
    test: 'BTO AAPL 11/20 125c @ 0.92',
    expected: {
      action: 'BTO',
      symbol: 'AAPL',
      price: 0.92,
      risky: false,
      option: {
        date: '11/20',
        type: 'call',
        strike: 125,
      },
    },
  },
  {
    test: 'BTO OSTK 70C 11/13 @ 2.05',
    expected: {
      action: 'BTO',
      symbol: 'OSTK',
      price: 2.05,
      risky: false,
      option: {
        date: '11/13',
        type: 'call',
        strike: 70,
      },
    },
  },
  {
    test: 'BTO 11/20 PLL 20p @ 0.70',
    expected: {
      action: 'BTO',
      symbol: 'PLL',
      price: 0.7,
      risky: false,
      option: {
        date: '11/20',
        type: 'put',
        strike: 20,
      },
    },
  },
  {
    test: 'BTO AAPL 1/21/22 200c @ 2.66',
    expected: {
      action: 'BTO',
      symbol: 'AAPL',
      price: 2.66,
      risky: false,
      option: {
        date: '1/21/22',
        type: 'call',
        strike: 200,
      },
    },
  },
  {
    test: 'STC KNDI 10c 11/20 @0.95',
    expected: {
      action: 'STC',
      symbol: 'KNDI',
      price: 0.95,
      risky: false,
      option: {
        date: '11/20',
        type: 'call',
        strike: 10,
      },
    },
  },
  {
    test: 'BTO SQ 10/2 157.5C @ 4.45',
    expected: {
      action: 'BTO',
      symbol: 'SQ',
      price: 4.45,
      risky: false,
      option: {
        date: '10/2',
        type: 'call',
        strike: 157.5,
      },
    },
  },
  {
    test: 'BTO SPY 350C 11/6 @ .93 (risky target 352)',
    expected: {
      action: 'BTO',
      symbol: 'SPY',
      price: 0.93,
      risky: true,
      option: {
        date: '11/6',
        type: 'call',
        strike: 350,
      },
    },
  },
  {
    test: 'BTO 11/13 ET 5.5c @ 0.06',
    expected: {
      action: 'BTO',
      symbol: 'ET',
      price: 0.06,
      risky: false,
      option: {
        date: '11/13',
        type: 'call',
        strike: 5.5,
      },
    },
  },
  {
    test: 'BTO 12/18 FB 350C @.99',
    expected: {
      action: 'BTO',
      symbol: 'FB',
      price: 0.99,
      risky: false,
      option: {
        date: '12/18',
        type: 'call',
        strike: 350,
      },
    },
  },
  {
    test: 'BTO 12/18 350C FB @.99',
    expected: {
      action: 'BTO',
      symbol: 'FB',
      price: 0.99,
      risky: false,
      option: {
        date: '12/18',
        type: 'call',
        strike: 350,
      },
    },
  },
  {
    test: 'BTO 11/13 M 7c @ 0.15',
    expected: {
      action: 'BTO',
      symbol: 'M',
      price: 0.15,
      risky: false,
      option: {
        date: '11/13',
        type: 'call',
        strike: 7,
      },
    },
  },
  {
    test: 'BTO SPY 350c 11/6 @ .4 (risky/lotto)',
    expected: {
      action: 'BTO',
      symbol: 'SPY',
      price: 0.4,
      risky: true,
      option: {
        date: '11/6',
        type: 'call',
        strike: 350,
      },
    },
  },
  {
    test: 'BTO F 7.5P 11/13 @.05',
    expected: {
      action: 'BTO',
      symbol: 'F',
      price: 0.05,
      risky: false,
      option: {
        date: '11/13',
        type: 'put',
        strike: 7.5,
      },
    },
  },
  {
    test: 'STC SPY 11/6 350p @ 1',
    expected: {
      action: 'STC',
      symbol: 'SPY',
      price: 1,
      risky: false,
      option: {
        date: '11/6',
        type: 'put',
        strike: 350,
      },
    },
  },
  {
    test: 'BTO WMT 147C 11/13 @1.00',
    expected: {
      action: 'BTO',
      symbol: 'WMT',
      price: 1,
      risky: false,
      option: {
        date: '11/13',
        type: 'call',
        strike: 147,
      },
    },
  },
  {
    test: 'STC SPWR 20c 11/13@1.77',
    expected: {
      action: 'STC',
      symbol: 'SPWR',
      price: 1.77,
      risky: false,
      option: {
        date: '11/13',
        type: 'call',
        strike: 20,
      },
    },
  },
  {
    test: 'STC RKT 20C 11/13 20C @2.00',
    expected: {
      action: 'STC',
      symbol: 'RKT',
      price: 2.0,
      risky: false,
      option: {
        date: '11/13',
        type: 'call',
        strike: 20,
      },
    },
  },
  {
    test: 'STC 20C 11/13 RKT @2.00',
    expected: {
      action: 'STC',
      symbol: 'RKT',
      price: 2.0,
      risky: false,
      option: {
        date: '11/13',
        type: 'call',
        strike: 20,
      },
    },
  },
  {
    test: 'STC 20C 11/13 RKT @$2.00',
    expected: {
      action: 'STC',
      symbol: 'RKT',
      price: 2.0,
      risky: false,
      option: {
        date: '11/13',
        type: 'call',
        strike: 20,
      },
    },
  },
  {
    test: 'STC cron 7p 11/6/21 @.45',
    expected: {
      action: 'STC',
      symbol: 'CRON',
      price: 0.45,
      risky: false,
      option: {
        date: '11/6/21',
        type: 'put',
        strike: 7,
      },
    },
  },
  {
    test: 'BTO AAPL 115p. 11/13 @ 1.06 added. new avg 1.42',
    expected: {
      action: 'BTO',
      symbol: 'AAPL',
      price: 1.06,
      risky: false,
      option: {
        date: '11/13',
        type: 'put',
        strike: 115,
      },
    },
  },
  {
    test: 'BTO 11/13 115p; AAPL @ 1.06 added. new avg 1.42',
    expected: {
      action: 'BTO',
      symbol: 'AAPL',
      price: 1.06,
      risky: false,
      option: {
        date: '11/13',
        type: 'put',
        strike: 115,
      },
    },
  },
  {
    test: 'BTO 11/13 115p.,; AAPL @ 1.06 added. new avg 1.42',
    expected: {
      action: 'BTO',
      symbol: 'AAPL',
      price: 1.06,
      risky: false,
      option: {
        date: '11/13',
        type: 'put',
        strike: 115,
      },
    },
  },
  {
    test: 'PLTR calls up 4.50 from 1.75!',
    expected: null,
  },
  {
    test: 'PLTR BTO calls up 4.50 from 1.75!',
    expected: null,
  },
  {
    test: 'ER Lotto: JD 11/27 BTO 100/110C @1.3',
    expected: null,
  },
  {
    test:
      'I was waiting patiently for this :smile: BTO NIO 11/13 35P @1.08 SL set at 0.7 RISKY',
    expected: {
      action: 'BTO',
      symbol: 'NIO',
      price: 1.08,
      risky: true,
      option: {
        date: '11/13',
        type: 'put',
        strike: 35,
      },
    },
  },
  {
    test: 'BTO LEVI 11/20c 18c @.2 avg .15',
    expected: {
      action: 'BTO',
      symbol: 'LEVI',
      price: 0.2,
      risky: false,
      option: {
        date: '11/20',
        type: 'call',
        strike: 18,
      },
    },
  },
  {
    test: 'BTO TGT 11/27 172.50p @ .14',
    expected: {
      action: 'BTO',
      symbol: 'TGT',
      price: 0.14,
      risky: false,
      option: {
        date: '11/27',
        type: 'put',
        strike: 172.5,
      },
    },
  },
  {
    test: 'BTO LB 11/27 40c .40 (risky)',
    expected: {
      action: 'BTO',
      symbol: 'LB',
      price: 0.4,
      risky: true,
      option: {
        date: '11/27',
        type: 'call',
        strike: 40,
      },
    },
  },
  {
    test:
      'BTO SPCE 12/4 28c @ 1.49 scalp ( might swing this one,large call volume)',
    expected: {
      action: 'BTO',
      symbol: 'SPCE',
      price: 1.49,
      risky: false,
      option: {
        date: '12/4',
        type: 'call',
        strike: 28,
      },
    },
  },
  {
    test: 'BTO AMZN 11/24 3500c @22.50',
    expected: {
      action: 'BTO',
      symbol: 'AMZN',
      price: 22.5,
      risky: false,
      option: {
        date: '11/24',
        type: 'call',
        strike: 3500,
      },
    },
  },
];

tests.map((alertTest) => {
  test(alertTest.test, () => {
    expect(parseAlert(alertTest.test)).toEqual(alertTest.expected);
  });
});
