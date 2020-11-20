export const isInRange = (date: Date, range: string[]) => {
  const minSplit = range[0].split(':');
  const minHour = +minSplit?.[0] || 0;
  const minMinutes = +minSplit?.[1] || 0;
  const minSeconds = +minSplit?.[2] || 0;
  const minMilliseconds = +minSplit?.[3] || 0;

  const maxSplit = range[1].split(':');
  const maxHour = +maxSplit?.[0] || 0;
  const maxMinutes = +maxSplit?.[1] || 0;
  const maxSeconds = +minSplit?.[2] || 0;
  const maxMilliseconds = +maxSplit?.[3] || 0;

  const rangeDateMin = new Date();
  rangeDateMin.setHours(minHour);
  rangeDateMin.setMinutes(minMinutes);
  rangeDateMin.setSeconds(minSeconds);
  rangeDateMin.setMilliseconds(minMilliseconds);

  const rangeDateMax = new Date();
  rangeDateMax.setHours(maxHour);
  rangeDateMax.setMinutes(maxMinutes);
  rangeDateMax.setSeconds(maxSeconds);
  rangeDateMax.setMilliseconds(maxMilliseconds);

  return date >= rangeDateMin && date < rangeDateMax;
};

export const round = (value: number, decimals: number = 2) => {
  return Number(Math.round((value + 'e' + decimals) as any) + 'e-' + decimals);
};

export const roundToFraction = (value: number, abs = true) => {
  return round(abs ? Math.abs(value) : value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const roundStrToFraction = (value: string, abs = true) => {
  return roundToFraction(Number(value), abs);
};

export const timeSince = (seconds: number) => {
  var seconds = Math.floor(new Date().getTime() / 1000 - seconds);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + ' years';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes';
  }
  return Math.floor(seconds) + ' seconds';
};

export const sleep = (ms: number) => {
  return new Promise((r) => setTimeout(r, ms));
};
