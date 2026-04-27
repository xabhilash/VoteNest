import { useEffect, useState } from 'react';
import { useFirebase, useAuth } from '../../context/FirebaseContext';
import { firebase } from '../../lib/firebase';
import { upVote, downVote } from '../../services/voteService';
import ProfilePic from '../common/ProfilePic';
import Replies from './Replies';
import AddComment from './AddComment';
import './comnt.css';

function Comment({ data, questId, signed }) {
  const ctx = useFirebase();
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [addReply, setAddReply] = useState(false);
  const [upVotes, setUpVotes] = useState(0);
  const [downVotes, setDownVotes] = useState(0);
  const [upVoted, setUpVoted] = useState(false);
  const [downVoted, setDownVoted] = useState(false);

  const repliesToggle = (force) => {
    setShowReplies((prev) => !prev || force);
  };

  const addReplyToggle = () => setAddReply((prev) => !prev);

  useEffect(() => {
    const unsubscribeUp = ctx.db
      .collection('Quest_data').doc(data.commentId)
      .collection('upVotes').doc(`upVote_${data.commentId}`)
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
      .collection('Quest_data').doc(data.commentId)
      .collection('downVotes').doc(`downVote_${data.commentId}`)
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
      unsubscribeUp();
      unsubscribeDown();
    };
  }, [ctx, data.commentId, signed]);

  const deleteComment = () => {
    const batch = ctx.db.batch();
    const ref = ctx.db
      .collection('Quest').doc(questId)
      .collection('Comments').doc(data.commentId);

    batch.delete(ref);
    const incRef = ctx.db.collection('Quest').doc(questId);
    batch.update(incRef, {
      totalComments: firebase.firestore.FieldValue.increment(-1),
    });

    batch.commit()
      .then(() => console.log('deleted'))
      .catch((err) => console.log(err + ' in deletion'));
  };

  const Date = data.timeStamp.toDate().toString().split(' ');
  return (
    <div className="comment-box">
      <div className="profile-box-comment">
        <div style={{ height: '20px', width: '20px' }}>
          <ProfilePic imageUrl={data.user.userProfilePicUrl} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p>{data.user.userName}</p>
            <p className="date">
              <span style={{ fontWeight: 'bold' }}>&#183;</span>{' ' + Date[2] + ' ' + Date[1] + ' ' + Date[3] + ' '}
              <span style={{ fontWeight: 'bold' }}>&#183;</span>{' ' + Date[4].split(':')[0] + ':' + Date[4].split(':')[1]}
            </p>
          </div>
          {user && user.uid === data.user.userId ? (
            <div className="delete-button" onClick={deleteComment} />
          ) : null}
        </div>
      </div>
      <p>{data.comment}</p>
      <div className="up-down-comment noselect">
        <svg
          width="20px" height="20px"
          onClick={() => upVote(ctx, 'Comment', signed ? ctx.auth.currentUser.uid : null, data.commentId)}
          viewBox="0 0 24 24"
        >
          <g id="upvote" className={'icon-svg' + (signed && upVoted ? ' upvoted' : '')}>
            <polygon points="12 4 3 15 9 15 9 20 15 20 15 15 21 15"></polygon>
          </g>
        </svg>
        <p>{upVotes - downVotes}</p>
        <svg
          width="20px" height="20px"
          onClick={() => downVote(ctx, 'Comment', signed ? ctx.auth.currentUser.uid : null, data.commentId)}
          viewBox="0 0 24 24"
        >
          <g id="downvote" className={'icon-svg' + (signed && downVoted ? ' downvoted' : '')}>
            <polygon transform="translate(12.000000, 12.000000) rotate(-180.000000) translate(-12.000000, -12.000000) " points="12 4 3 15 9 15 9 20 15 20 15 15 21 15"></polygon>
          </g>
        </svg>
        <div className="view-replies noselect" onClick={() => repliesToggle(false)}>
          {showReplies ? 'Hide ' : 'View '}{data.totalReplies} replies
        </div>
        <div className="reply noselect" onClick={addReplyToggle}>Reply</div>
      </div>

      {addReply ? (
        <div>
          <AddComment
            questId={questId}
            commentId={data.commentId}
            type="reply"
            Toggle={() => repliesToggle(true)}
          />
          <br />
        </div>
      ) : null}
      {showReplies ? (
        <Replies
          commentId={data.commentId}
          questId={questId}
          addReply={addReply}
        />
      ) : null}
      <hr />
    </div>
  );
}

export default Comment;
