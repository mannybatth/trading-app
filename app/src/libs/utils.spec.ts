import { marketOpenHours } from '../constants';
import { isInRange } from './utils';

function todayDateStr() {
  return new Date().toLocaleDateString('en-US');
}

type RangeTest = { test: { date: Date; range: string[] }; expected: boolean };
const tests: RangeTest[] = [
  {
    test: {
      date: new Date(`${todayDateStr()}, 8:08:00 AM`),
      range: marketOpenHours,
    },
    expected: false,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 9:00:00 AM`),
      range: marketOpenHours,
    },
    expected: false,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 9:30:00 AM`),
      range: marketOpenHours,
    },
    expected: true,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 9:30:01 AM`),
      range: marketOpenHours,
    },
    expected: true,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 10:00:00 AM`),
      range: marketOpenHours,
    },
    expected: true,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 1:00:00 PM`),
      range: marketOpenHours,
    },
    expected: true,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 3:59:00 PM`),
      range: marketOpenHours,
    },
    expected: true,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 3:59:59 PM`),
      range: marketOpenHours,
    },
    expected: true,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 4:00:00 PM`),
      range: marketOpenHours,
    },
    expected: false,
  },
  {
    test: {
      date: new Date(`${todayDateStr()}, 5:00:00 PM`),
      range: marketOpenHours,
    },
    expected: false,
  },
];

tests.map((testItem, i) => {
  test(`${i}: ${testItem.test.date}`, () => {
    expect(isInRange(testItem.test.date, testItem.test.range)).toEqual(testItem.expected);
  });
});
