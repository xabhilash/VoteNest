import { useEffect, useState } from 'react';
import { useFirebase, useAuth } from '../../context/FirebaseContext';
import Comment from './Comment';

function Comments({ questId }) {
  const { db, auth } = useFirebase();
  const { isSignedIn } = useAuth();
  const [comments, setComments] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [loadingDiv, setLoadingDiv] = useState(true);

  useEffect(() => {
    const ref = db.collection('Quest').doc(questId).collection('Comments');

    const unsubscribe = ref.onSnapshot((snap) => {
      const data = [];
      const userdata = [];
      snap.docs.forEach((doc) => {
        if (auth.currentUser && doc.data().user.userId === auth.currentUser.uid) {
          userdata.push({ ...doc.data(), commentId: doc.id });
        } else {
          data.push({ ...doc.data(), commentId: doc.id });
        }
      });
      setComments(data);
      setUserComments(userdata);
      setLoadingDiv(false);
    });

    return () => unsubscribe();
  }, [db, auth, questId]);

  if (loadingDiv) {
    return <div style={{ width: '100%', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <div>
        {userComments.map((comment) => (
          <Comment
            key={comment.commentId}
            data={comment}
            questId={questId}
            signed={isSignedIn}
          />
        ))}
      </div>
      <div>
        {comments.map((comment) => (
          <Comment
            key={comment.commentId}
            data={comment}
            questId={questId}
            signed={isSignedIn}
          />
        ))}
      </div>
    </div>
  );
}

export default Comments;
