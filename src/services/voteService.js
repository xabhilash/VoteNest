import { firebase } from '../lib/firebase';

// Reddit-style voting:
//   Click Up
//     - already upvoted   -> remove your up   (toggle off, score -1)
//     - already downvoted -> flip to up       (remove down, add up, score +2)
//     - neutral           -> add up           (score +1)
//   Click Down
//     - already downvoted -> remove your down (toggle off, score +1)
//     - already upvoted   -> flip to down     (remove up, add down, score -2)
//     - neutral           -> add down         (score -1)
export function upVote(ctx, parentRef, uid) {
  if (uid == null) {
    console.log('sign in to upvote');
    return;
  }
  const upRef = parentRef.collection('upVotes').doc(uid);
  const downRef = parentRef.collection('downVotes').doc(uid);

  return ctx.db.runTransaction(async (trans) => {
    const [upSnap, downSnap] = await Promise.all([
      trans.get(upRef),
      trans.get(downRef),
    ]);
    const updates = {};
    if (upSnap.exists) {
      trans.delete(upRef);
      updates.totalUpVotes = firebase.firestore.FieldValue.increment(-1);
    } else {
      trans.set(upRef, { ts: firebase.firestore.Timestamp.now() });
      updates.totalUpVotes = firebase.firestore.FieldValue.increment(1);
      if (downSnap.exists) {
        trans.delete(downRef);
        updates.totalDownVotes = firebase.firestore.FieldValue.increment(-1);
      }
    }
    trans.update(parentRef, updates);
  }).catch((err) => console.log('upVote error: ' + err));
}

export function downVote(ctx, parentRef, uid) {
  if (uid == null) {
    console.log('sign in to downvote');
    return;
  }
  const upRef = parentRef.collection('upVotes').doc(uid);
  const downRef = parentRef.collection('downVotes').doc(uid);

  return ctx.db.runTransaction(async (trans) => {
    const [upSnap, downSnap] = await Promise.all([
      trans.get(upRef),
      trans.get(downRef),
    ]);
    const updates = {};
    if (downSnap.exists) {
      trans.delete(downRef);
      updates.totalDownVotes = firebase.firestore.FieldValue.increment(-1);
    } else {
      trans.set(downRef, { ts: firebase.firestore.Timestamp.now() });
      updates.totalDownVotes = firebase.firestore.FieldValue.increment(1);
      if (upSnap.exists) {
        trans.delete(upRef);
        updates.totalUpVotes = firebase.firestore.FieldValue.increment(-1);
      }
    }
    trans.update(parentRef, updates);
  }).catch((err) => console.log('downVote error: ' + err));
}
