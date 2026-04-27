import { firebase } from '../lib/firebase';

// Bookmarks live as one doc per quest under the user's profile:
//   /Users/{uid}/bookmarks/{questId} = { ts: Timestamp }
// This avoids the 1MB cap of a single growing map field and lets rules
// scope bookmarks to the owning user.
export function setBookmarkToggle(ctx, userId, questId, bookmarked) {
  if (userId == null) {
    console.log('sign in to bookmark');
    return;
  }

  const ref = ctx.db
    .collection('Users').doc(userId)
    .collection('bookmarks').doc(questId);

  if (!bookmarked) {
    ref.set({ ts: firebase.firestore.Timestamp.now() })
      .catch((er) => console.log('error in bookmark ' + er));
  } else {
    ref.delete()
      .catch((er) => console.log('error in removing bookmark ' + er));
  }
}
