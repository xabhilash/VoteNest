import { firebase } from '../lib/firebase';

export function upVote(ctx, type, userId, id) {
  if (userId == null) {
    console.log('sign in to upvote ' + type);
    return;
  }
  const batch = ctx.db.batch();
  const upVoteRefUser = ctx.db
    .collection('Users_pvt_data').doc(userId)
    .collection(`${type}_upVote`).doc('upVote_' + userId);
  const downVoteRefUser = ctx.db
    .collection('Users_pvt_data').doc(userId)
    .collection(`${type}_downVote`).doc('downVote_' + userId);
  const questUpVote = ctx.db
    .collection('Quest_data').doc(id)
    .collection('upVotes').doc(`upVote_${id}`);
  const questDownVote = ctx.db
    .collection('Quest_data').doc(id)
    .collection('downVotes').doc(`downVote_${id}`);

  batch.set(upVoteRefUser, {
    [type.toLowerCase()]: { [id]: firebase.firestore.Timestamp.now() },
  }, { merge: true });
  batch.set(downVoteRefUser, {
    [type.toLowerCase()]: { [id]: firebase.firestore.FieldValue.delete() },
  }, { merge: true });
  batch.set(questUpVote, {
    user: { [userId]: firebase.firestore.Timestamp.now() },
  }, { merge: true });
  batch.set(questDownVote, {
    user: { [userId]: firebase.firestore.FieldValue.delete() },
  }, { merge: true });

  batch.commit()
    .then(() => console.log('upvoted'))
    .catch((err) => console.log(err));
}

export function downVote(ctx, type, userId, id) {
  if (userId == null) {
    console.log('sign in to downVote ' + type);
    return;
  }
  const batch = ctx.db.batch();
  const upVoteRefUser = ctx.db
    .collection('Users_pvt_data').doc(userId)
    .collection(`${type}_upVote`).doc('upVote_' + userId);
  const downVoteRefUser = ctx.db
    .collection('Users_pvt_data').doc(userId)
    .collection(`${type}_downVote`).doc('downVote_' + userId);
  const questUpVote = ctx.db
    .collection('Quest_data').doc(id)
    .collection('upVotes').doc(`upVote_${id}`);
  const questDownVote = ctx.db
    .collection('Quest_data').doc(id)
    .collection('downVotes').doc(`downVote_${id}`);

  batch.set(upVoteRefUser, {
    quest: { [id]: firebase.firestore.FieldValue.delete() },
  }, { merge: true });
  batch.set(downVoteRefUser, {
    quest: { [id]: firebase.firestore.Timestamp.now() },
  }, { merge: true });
  batch.set(questUpVote, {
    user: { [userId]: firebase.firestore.FieldValue.delete() },
  }, { merge: true });
  batch.set(questDownVote, {
    user: { [userId]: firebase.firestore.Timestamp.now() },
  }, { merge: true });

  batch.commit()
    .then(() => console.log('downvoted'))
    .catch((err) => console.log(err));
}
