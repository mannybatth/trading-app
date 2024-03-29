import send from '@polka/send-type';
import { db } from '../../firebase-admin';

export async function get(req, res, next) {
  try {
    const symbol: string = req.query.symbol;
    const returnQueue: boolean = req.query.queue == true;
    const queue = {};

    const positionsSnapshot = symbol
      ? await db.collection('positions').where('symbol', '==', symbol).get()
      : await db.collection('positions').get();
    const positions = positionsSnapshot.docs.map((doc) => doc.data());

    if (returnQueue) {
      await Promise.all(
        positions.map(async (pos) => {
          const discriminator = pos.discriminator;
          const queueDoc = await db.doc(`queue/STC-${discriminator}-${symbol}`).get();
          if (queueDoc.exists) {
            queue[`STC-${discriminator}-${symbol}`] = queueDoc.data();
          }
        })
      );

      if (positions.length === 0) {
        const queueDoc = await db.doc(`queue/STC-self-${symbol}`).get();
        if (queueDoc.exists) {
          queue[`STC-self-${symbol}`] = queueDoc.data();
        }
      }
    }

    send(res, 200, {
      positions,
      queue,
    });
  } catch (err) {
    console.error(err);
    send(res, 400, { error: JSON.stringify(err) });
  }
}
