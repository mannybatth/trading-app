import { db, firebaseAdmin } from '../../firebase-admin';

export async function put(req, res) {
  const authors = req.body['data'].reduce(function (map, obj) {
    map[obj.author.id] = obj.author;
    return map;
  }, {});

  const usersChanged = [];
  const userQuerySnapshot = await db.collection('users').get();
  userQuerySnapshot.forEach((doc) => {
    const user = doc.data();

    const author = authors[user.userid];
    if (author) {
      if (author.username !== user.username) {
        usersChanged.push({
          userid: user.userid,
          newUsername: author.username,
          oldUsername: user.username
        })
        doc.ref.update({
          username: author.username
        })
        db.collection('usernameChanges').add({
          userid: user.userid,
          newUsername: author.username,
          oldUsername: user.username,
          created: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        })
      }
    }
  });

  res.end(JSON.stringify({
    success: true,
    usersChanged
  }));
}
