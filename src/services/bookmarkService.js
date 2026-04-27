import { firebase } from '../lib/firebase';

export function setBookmarkToggle(ctx, userId, questId, bookmarked) {
  console.log('setbbo');
  if (userId == null) {
    console.log('sigin to bookmark');
    return;
  }

  const ref = ctx.db
    .collection('Users_pvt_data').doc(userId)
    .collection('Quest_bookmark').doc(`bookmark_${userId}`);

  if (!bookmarked) {
    ref.set({
      quest: { [questId]: firebase.firestore.Timestamp.now() },
    }, { merge: true })
      .then(() => console.log('success in bookmark'))
      .catch((er) => console.log('error in bookmark' + er));
  } else {
    ref.set({
      quest: { [questId]: firebase.firestore.FieldValue.delete() },
    }, { merge: true })
      .then(() => console.log('success in removing bookmark'))
      .catch((er) => console.log('error in bookmark' + er));
  }
}
