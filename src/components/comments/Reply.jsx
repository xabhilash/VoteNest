import { useEffect, useState } from 'react';
import { useFirebase, useAuth } from '../../context/FirebaseContext';
import { firebase } from '../../lib/firebase';
import { upVote, downVote } from '../../services/voteService';
import ProfilePic from '../common/ProfilePic';
import './reply.css';

function Reply({ data, questId, commentId, signed }) {
  const ctx = useFirebase();
  const { user } = useAuth();
  const [upVoted, setUpVoted] = useState(false);
  const [downVoted, setDownVoted] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  // Local mirror of the vote counts so the UI can update optimistically on
  // click. The parent listener (in Replies.jsx) refreshes data via props,
  // which we sync into local state below.
  const [counts, setCounts] = useState({
    totalUpVotes: data.totalUpVotes ?? 0,
    totalDownVotes: data.totalDownVotes ?? 0,
  });

  const upVotes = counts.totalUpVotes;
  const downVotes = counts.totalDownVotes;

  const replyRef = ctx.db
    .collection('Quest').doc(questId)
    .collection('Comments').doc(commentId)
    .collection('Replies').doc(data.replyId);

  useEffect(() => {
    setCounts({
      totalUpVotes: data.totalUpVotes ?? 0,
      totalDownVotes: data.totalDownVotes ?? 0,
    });
  }, [data.totalUpVotes, data.totalDownVotes]);

  useEffect(() => {
    if (!signed) {
      setUpVoted(false);
      setDownVoted(false);
      return undefined;
    }
    const uid = ctx.auth.currentUser.uid;
    const unsubscribeUp = replyRef.collection('upVotes').doc(uid)
      .onSnapshot((snap) => setUpVoted(snap.exists));
    const unsubscribeDown = replyRef.collection('downVotes').doc(uid)
      .onSnapshot((snap) => setDownVoted(snap.exists));
    return () => {
      unsubscribeDown();
      unsubscribeUp();
    };
  }, [ctx, data.replyId, questId, commentId, signed]);

  const handleUpVoteClick = () => {
    if (!signed) {
      upVote(ctx, replyRef, null);
      return;
    }
    if (voteBusy) return;

    const prevUp = upVoted;
    const prevDown = downVoted;
    const prevCounts = counts;

    let deltaUp = 0;
    let deltaDown = 0;
    let nextUp;
    let nextDown;
    if (prevUp) {
      nextUp = false;
      nextDown = prevDown;
      deltaUp = -1;
    } else {
      nextUp = true;
      nextDown = false;
      deltaUp = 1;
      if (prevDown) deltaDown = -1;
    }

    setUpVoted(nextUp);
    setDownVoted(nextDown);
    setCounts((c) => ({
      totalUpVotes: c.totalUpVotes + deltaUp,
      totalDownVotes: c.totalDownVotes + deltaDown,
    }));
    setVoteBusy(true);

    Promise.resolve(upVote(ctx, replyRef, ctx.auth.currentUser.uid))
      .catch(() => {
        setUpVoted(prevUp);
        setDownVoted(prevDown);
        setCounts(prevCounts);
      })
      .finally(() => setVoteBusy(false));
  };

  const handleDownVoteClick = () => {
    if (!signed) {
      downVote(ctx, replyRef, null);
      return;
    }
    if (voteBusy) return;

    const prevUp = upVoted;
    const prevDown = downVoted;
    const prevCounts = counts;

    let deltaUp = 0;
    let deltaDown = 0;
    let nextUp;
    let nextDown;
    if (prevDown) {
      nextDown = false;
      nextUp = prevUp;
      deltaDown = -1;
    } else {
      nextDown = true;
      nextUp = false;
      deltaDown = 1;
      if (prevUp) deltaUp = -1;
    }

    setUpVoted(nextUp);
    setDownVoted(nextDown);
    setCounts((c) => ({
      totalUpVotes: c.totalUpVotes + deltaUp,
      totalDownVotes: c.totalDownVotes + deltaDown,
    }));
    setVoteBusy(true);

    Promise.resolve(downVote(ctx, replyRef, ctx.auth.currentUser.uid))
      .catch(() => {
        setUpVoted(prevUp);
        setDownVoted(prevDown);
        setCounts(prevCounts);
      })
      .finally(() => setVoteBusy(false));
  };

  const deleteReply = () => {
    const batch = ctx.db.batch();
    batch.delete(replyRef);
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
          onClick={handleUpVoteClick}
          viewBox="0 0 24 24"
        >
          <g id="upvote" className={'icon-svg' + (signed && upVoted ? ' upvoted' : '')}>
            <polygon points="12 4 3 15 9 15 9 20 15 20 15 15 21 15"></polygon>
          </g>
        </svg>
        <p>{upVotes === 0 && downVotes === 0 ? '' : upVotes - downVotes}</p>
        <svg
          width="18px" height="18px"
          onClick={handleDownVoteClick}
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
