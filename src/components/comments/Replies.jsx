import { useEffect, useState } from 'react';
import { useFirebase, useAuth } from '../../context/FirebaseContext';
import Reply from './Reply';
import './replies.css';

function Replies({ questId, commentId }) {
  const { db } = useFirebase();
  const { isSignedIn } = useAuth();
  const [replies, setReplies] = useState([]);
  const [userReplies, setUserReplies] = useState([]);
  const [loadingDiv] = useState(false);

  useEffect(() => {
    const ref = db
      .collection('Quest').doc(questId)
      .collection('Comments').doc(commentId)
      .collection('Replies');

    const unsubscribe = ref.onSnapshot((snap) => {
      const data = [];
      const userdata = [];
      const currentUser = db.app.auth().currentUser;
      snap.docs.forEach((doc) => {
        if (currentUser && doc.data().user.userId === currentUser.uid) {
          userdata.push({ ...doc.data(), replyId: doc.id });
        } else {
          data.push({ ...doc.data(), replyId: doc.id });
        }
      });
      setReplies(data);
      setUserReplies(userdata);
    });

    return () => unsubscribe();
  }, [db, questId, commentId]);

  if (loadingDiv) {
    return <div style={{ width: '100%', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <div className="single-reply-box">
        {userReplies.map((reply) => (
          <Reply
            key={reply.replyId}
            data={reply}
            questId={questId}
            commentId={commentId}
            signed={isSignedIn}
          />
        ))}
        {replies.map((reply) => (
          <Reply
            key={reply.replyId}
            data={reply}
            questId={questId}
            commentId={commentId}
            signed={isSignedIn}
          />
        ))}
      </div>
    </div>
  );
}

export default Replies;
