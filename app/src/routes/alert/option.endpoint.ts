import send from '@polka/send-type';
// import { colors } from '../../models/colors';
import type { Alert } from '../../models/models';

const allowedAlertActions = ['BTO', 'STC'];

export async function post(req, res, next) {
  const alert: Alert = req.body.alert;
  const discriminator: string = req.body.discriminator;

  // console.log(colors.fg.Magenta, 'OPTION ALERT from:', discriminator, alert);

  if (!allowedAlertActions.includes(alert.action)) {
    send(res, 200, { result: 'Alert action not allowed' });
    return;
  }

  console.log('');
  send(res, 200, {});
}
