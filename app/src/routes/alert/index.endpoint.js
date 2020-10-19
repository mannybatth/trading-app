import { db } from '../../firebase-admin';

export async function post(req, res, next) {
  const alert = req.body.alert;
  const username = req.body.username;

  const userQuerySnapshot = await db.collection('users').get();
  userQuerySnapshot.forEach((doc) => {
    const user = doc.data();
    if (username === user.username) {
      console.log('FOUND alert: ', username, alert);
    }
  });

  res.end('');
}
