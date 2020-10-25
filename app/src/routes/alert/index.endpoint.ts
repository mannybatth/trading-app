/*
ALERT from: 0283 { action: 'BTO', symbol: 'RKT', price: 20.05, risky: false }
ALERT from: 1740 { action: 'STC', symbol: 'SPAQ', price: 12.28, risky: false }
*/

import send from '@polka/send-type';
import { alpaca } from "../../libs/alpaca";

const allowedAlertActions = ['BTO', 'STC'];

export async function post(req, res) {
  const alert = req.body.alert;
  const discriminator = req.body.discriminator;

  console.log('ALERT from:', discriminator, alert);

  if (!allowedAlertActions.includes(alert.action)) {
    send(res, 200, { result: 'Alert action not allowed' });
    return;
  }

  await alpaca.sendOrder(alert, discriminator);

  console.log('');
  send(res, 200, {});
}
