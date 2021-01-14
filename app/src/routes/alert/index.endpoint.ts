import send from '@polka/send-type';
import { secondaryTradingStrategy } from '../../core/secondary-trading-strategy';
import { simpleTradingStrategy } from '../../core/simple-trading-strategy';
import type { CreateOrderResponse } from '../../models/alpaca-models';
import { colors } from '../../models/colors';
import type { Alert } from '../../models/models';

const allowedAlertActions = ['BTO', 'STC'];

export async function post(req, res, next) {
  const alert: Alert = req.body.alert;
  const discriminator: string = req.body.discriminator;
  const strategy: string = req.body.strategy || '0';

  console.log(colors.fg.Magenta, 'ALERT from:', discriminator, alert);

  if (!allowedAlertActions.includes(alert.action)) {
    send(res, 200, { result: 'Alert action not allowed' });
    return;
  }

  let result: CreateOrderResponse = { ok: false, reason: 'Invalid strategy' };
  if (strategy === '0') {
    result = await simpleTradingStrategy.sendOrder(alert, discriminator);
  } else if (strategy === '1') {
    result = await secondaryTradingStrategy.sendOrder(alert, discriminator);
  }

  console.log('');
  send(res, 200, result);
}
