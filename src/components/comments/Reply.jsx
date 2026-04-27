import { useEffect, useState } from 'react';
import { useFirebase, useAuth } from '../../context/FirebaseContext';
import { firebase } from '../../lib/firebase';
import { upVote, downVote } from '../../services/voteService';
import ProfilePic from '../common/ProfilePic';
import './reply.css';

function Reply({ data, questId, commentId, signed }) {
  const ctx = useFirebase();
  const { user } = useAuth();
  const [upVotes, setUpVotes] = useState(0);
  const [downVotes, setDownVotes] = useState(0);
  const [upVoted, setUpVoted] = useState(false);
  const [downVoted, setDownVoted] = useState(false);

  useEffect(() => {
    const unsubscribeUp = ctx.db
      .collection('Quest_data').doc(data.replyId)
      .collection('upVotes').doc(`upVote_${data.replyId}`)
      .onSnapshot((snap) => {
        const raw = snap.data();
        if (typeof raw !== 'undefined') {
          const userMap = raw.user;
          const lenData = typeof userMap !== 'undefined' ? Object.getOwnPropertyNames(userMap).length : 0;
          if (signed) {
            const uid = ctx.auth.currentUser.uid;
            if (lenData !== 0 && Object.prototype.hasOwnProperty.call(userMap, uid)) {
              setUpVoted(true);
              setDownVoted(false);
            }
          }
          setUpVotes(lenData);
        }
      });

    const unsubscribeDown = ctx.db
      .collection('Quest_data').doc(data.replyId)
      .collection('downVotes').doc(`downVote_${data.replyId}`)
      .onSnapshot((snap) => {
        const raw = snap.data();
        if (typeof raw !== 'undefined') {
          const userMap = raw.user;
          const lenData = typeof userMap !== 'undefined' ? Object.getOwnPropertyNames(userMap).length : 0;
          if (signed) {
            const uid = ctx.auth.currentUser.uid;
            if (lenData !== 0 && Object.prototype.hasOwnProperty.call(userMap, uid)) {
              setUpVoted(false);
              setDownVoted(true);
            }
          }
          setDownVotes(lenData);
        }
      });

    return () => {
      unsubscribeDown();
      unsubscribeUp();
    };
  }, [ctx, data.replyId, signed]);

  const deleteReply = () => {
    const batch = ctx.db.batch();
    const ref = ctx.db
      .collection('Quest').doc(questId)
      .collection('Comments').doc(commentId)
      .collection('Replies').doc(data.replyId);

    batch.delete(ref);
    const incRef = ctx.db
      .collection('Quest').doc(questId)
      .collection('Comments').doc(commentId);
    batch.update(incRef, {
      totalReplies: firebase.firestore.FieldValue.increment(-1),
    });

    batch.commit()
      .then(() => console.log('deleted'))
      .catch((err) => console.log(err + ' in deletion'));
  };

  const Date = data.timeStamp.toDate().toString().split(' ');
  return (
    <div className="reply-box">
      <div className="profile-box-reply">
        <div style={{ height: '18px', width: '18px' }}>
          <ProfilePic imageUrl={data.user.userProfilePicUrl} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <p>{data.user.userName}</p>
          <p className="date">
            <span style={{ fontWeight: 'bold' }}>&#183;</span>{' ' + Date[2] + ' ' + Date[1] + ' ' + Date[3] + ' '}
            <span style={{ fontWeight: 'bold' }}>&#183;</span>{' ' + Date[4].split(':')[0] + ':' + Date[4].split(':')[1]}
          </p>
        </div>
        {user && user.uid === data.user.userId ? (
          <div className="delete-button" onClick={deleteReply} />
        ) : null}
      </div>
      <p>{data.reply}</p>
      <div className="up-down-reply noselect">
        <svg
          width="18px" height="18px"
          onClick={() => upVote(ctx, 'Reply', signed ? ctx.auth.currentUser.uid : null, data.replyId)}
          viewBox="0 0 24 24"
        >
          <g id="upvote" className={'icon-svg' + (signed && upVoted ? ' upvoted' : '')}>
            <polygon points="12 4 3 15 9 15 9 20 15 20 15 15 21 15"></polygon>
          </g>
        </svg>
        <p>{upVotes - downVotes}</p>
        <svg
          width="18px" height="18px"
          onClick={() => downVote(ctx, 'Reply', signed ? ctx.auth.currentUser.uid : null, data.replyId)}
          viewBox="0 0 24 24"
        >
          <g id="downvote" className={'icon-svg' + (signed && downVoted ? ' downvoted' : '')}>
            <polygon transform="translate(12.000000, 12.000000) rotate(-180.000000) translate(-12.000000, -12.000000) " points="12 4 3 15 9 15 9 20 15 20 15 15 21 15"></polygon>
          </g>
        </svg>
      </div>

      <hr />
    </div>
  );
}

export default Reply;
