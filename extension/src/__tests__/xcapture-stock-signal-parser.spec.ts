import { parseXCaptureAlert } from '../libs/signal-parser';
import { Alert } from '../models/models';

type AlertTest = { test: string; previousText: string; expected: Alert };
const tests: AlertTest[] = [
  {
    test: ' Long: XL @ 21.85  |  current : $21.93',
    previousText: '',
    expected: {
      action: 'BTO',
      symbol: 'XL',
      price: 21.85,
      risky: false,
      partial: false,
    },
  },
  {
    test: ' Partial exit accepted @ $2.42',
    previousText:
      'STC YJ @ 2.42 partial from 2.10 (15%) - 1st PT reached. Sold 1/3rd here.',
    expected: {
      action: 'STC',
      symbol: 'YJ',
      price: 2.42,
      risky: false,
      partial: true,
    },
  },
  {
    test: ' Closed long: ED @ 67.25 | current : $67.29',
    previousText: '',
    expected: {
      action: 'STC',
      symbol: 'ED',
      price: 67.25,
      risky: false,
      partial: false,
    },
  },
  {
    test: ' Short: BIOL @ 0.97 | current : $0.953',
    previousText: '',
    expected: {
      action: 'STO',
      symbol: 'BIOL',
      price: 0.97,
      risky: false,
      partial: false,
    },
  },
  {
    test: ' Partial exit accepted @ $0.881',
    previousText: 'BTC BIOL @ 0.881',
    expected: {
      action: 'BTC',
      symbol: 'BIOL',
      price: 0.881,
      risky: false,
      partial: true,
    },
  },
  {
    test: ' Closed short: BIOL @ 0.881 | current : $0.9172',
    previousText: '',
    expected: {
      action: 'BTC',
      symbol: 'BIOL',
      price: 0.881,
      risky: false,
      partial: false,
    },
  },
];

tests.map((alertTest) => {
  test(alertTest.test, () => {
    expect(parseXCaptureAlert(alertTest.test, alertTest.previousText)).toEqual(
      alertTest.expected
    );
  });
});
