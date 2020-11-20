import send from '@polka/send-type';
import { alpaca } from '../../libs/alpaca';
import { colors } from '../../models/colors';
import type { Alert } from '../../models/models';

const allowedAlertActions = ['BTO', 'STC'];

export async function post(req, res, next) {
  const alert: Alert = req.body.alert;
  const discriminator: string = req.body.discriminator;

  console.log(colors.fg.Magenta, 'ALERT from:', discriminator, alert);

  if (!allowedAlertActions.includes(alert.action)) {
    send(res, 200, { result: 'Alert action not allowed' });
    return;
  }

  const result = await alpaca.sendOrder(alert, discriminator);

  console.log('');
  send(res, 200, result);
}
