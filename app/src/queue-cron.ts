import schedule from 'node-schedule';
import { db } from './firebase-admin';
import { alpaca } from './libs/alpaca';
import { colors } from './models/colors';
import type { Alert } from './models/models';

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = new schedule.Range(1, 5);
// rule.hour = 19;
// rule.minute = 46;
rule.hour = new schedule.Range(9, 15);
rule.minute = [0, 30];
rule.second = 1;

schedule.scheduleJob(rule, async () => {
  console.log(colors.fg.Green, 'CHECKING QUEUE', new Date().toLocaleTimeString());

  const snapshot = await db.collection('queue').get();
  snapshot.forEach(async (doc) => {
    const data = doc.data();
    const alert: Alert = {
      action: data.action,
      symbol: data.symbol,
      price: data.price,
    };
    const discriminator: string = data.discriminator;
    try {
      console.log(colors.fg.Magenta, 'Sending order from queue:', discriminator, alert);
      await alpaca.sendOrder(alert, discriminator);
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'Failed to send order in queue', alert, discriminator, error);
    }
  });
});
