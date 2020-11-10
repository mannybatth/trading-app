import { isInRange } from './utils';

type RangeTest = { test: { date: Date; range: string[] }; expected: boolean };
const tests: RangeTest[] = [
  {
    test: {
      date: new Date('11/10/2020, 8:08:00 AM'),
      range: ['9:30', '16:00'],
    },
    expected: false,
  },
  {
    test: {
      date: new Date('11/10/2020, 9:00:00 AM'),
      range: ['9:30', '16:00'],
    },
    expected: false,
  },
  {
    test: {
      date: new Date('11/10/2020, 9:30:00 AM'),
      range: ['9:30', '16:00'],
    },
    expected: true,
  },
  {
    test: {
      date: new Date('11/10/2020, 9:30:01 AM'),
      range: ['9:30', '16:00'],
    },
    expected: true,
  },
  {
    test: {
      date: new Date('11/10/2020, 10:00:00 AM'),
      range: ['9:30', '16:00'],
    },
    expected: true,
  },
  {
    test: {
      date: new Date('11/10/2020, 1:00:00 PM'),
      range: ['9:30', '16:00'],
    },
    expected: true,
  },
  {
    test: {
      date: new Date('11/10/2020, 3:59:00 PM'),
      range: ['9:30', '16:00'],
    },
    expected: true,
  },
  {
    test: {
      date: new Date('11/10/2020, 3:59:59 PM'),
      range: ['9:30', '16:00'],
    },
    expected: true,
  },
  {
    test: {
      date: new Date('11/10/2020, 4:00:00 PM'),
      range: ['9:30', '16:00'],
    },
    expected: false,
  },
  {
    test: {
      date: new Date('11/10/2020, 5:00:00 PM'),
      range: ['9:30', '16:00'],
    },
    expected: false,
  },
];

tests.map((testItem, i) => {
  test(`${i}: ${testItem.test.date}`, () => {
    expect(isInRange(testItem.test.date, testItem.test.range)).toEqual(testItem.expected);
  });
});
