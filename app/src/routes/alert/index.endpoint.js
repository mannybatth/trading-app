import { db } from '../../firebase-admin';

export async function post(req, res, next) {
  const alert = req.body.alert;
  const username = req.body.username;
  const discriminator = req.body.discriminator;

  console.log('ALERT from:', discriminator, alert);

  const userQuerySnapshot = await db.collection('users').get();
  userQuerySnapshot.forEach((doc) => {
    const user = doc.data();
    if (username === user.username) {
      console.log('ALLOWED alert: ', alert);
    }
  });

  res.end('');
}
