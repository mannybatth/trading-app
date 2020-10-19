export async function post(req, res, next) {
  const alert = req.body.alert;
  const discriminator = req.body.discriminator;

  console.log('ALERT from:', discriminator, alert);

  res.end('');
}
