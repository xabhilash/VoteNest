import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import { upVote, downVote } from '../../services/voteService';
import { setBookmarkToggle } from '../../services/bookmarkService';
import Onion from './Onion';
import ShareDropdown from './ShareDropdown';
import Bookmark from '../common/Bookmark';
import ProfilePic from '../common/ProfilePic';
import Comments from '../comments/Comments';
import AddComment from '../comments/AddComment';
import './quest.css';

const EMPTY_QUEST_DATA = { answers: [], male: [], female: [], totalAnswers: 0 };

function Quest({
  data,
  signed,
  bookmarked,
  funcForBookMarkTab,
  deleteMyQuest,
  reloadFunc,
}) {
  const ctx = useFirebase();
  const [showComments, setShowComments] = useState(false);
  const [viewAnswer, setViewAnswer] = useState(false);
  const [index, setIndex] = useState(-1);
  const [addComment, setAddComment] = useState(false);
  const [upVoted, setUpVoted] = useState(false);
  const [downVoted, setDownVoted] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const [settingAns, setSettingAns] = useState(false);
  const [shareDrop, setShareDrop] = useState(false);
  const [questData, setQuestData] = useState(EMPTY_QUEST_DATA);
  const [counters, setCounters] = useState({
    totalUpVotes: data.totalUpVotes ?? 0,
    totalDownVotes: data.totalDownVotes ?? 0,
    totalComments: data.totalComments ?? 0,
    totalAnswers: data.totalAnswers ?? 0,
  });

  const upVotes = counters.totalUpVotes;
  const downVotes = counters.totalDownVotes;

  const questRef = ctx.db.collection('Quest').doc(data.questId);

  const commentToggle = (force) => {
    setShowComments((prev) => !prev || force);
  };

  const answerToggle = () => {
    if (!signed) {
      setViewAnswer(false);
      alert('sign in to view answers');
      return;
    }
    setViewAnswer((prev) => !prev);
  };

  const addCommentToggle = () => setAddComment((prev) => !prev);
  const shareDropToggle = () => setShareDrop((prev) => !prev);

  const ansClicked = (ind) => {
    if (ind === index) return;
    setSettingAns(true);

    const ref = questRef.collection('answers').doc('default');

    return ctx.db.runTransaction((trans) => {
      return trans.get(ref).then((doc) => {
        if (!doc.exists) console.log('doc does not exist');

        const answerArray = doc.data().answers;
        let totalAns = doc.data().totalAnswers;
        answerArray[ind] += 1;
        if (index !== -1) {
          answerArray[index] -= 1;
        } else {
          totalAns += 1;
        }
        const user = ctx.auth.currentUser.uid;
        trans.set(
          ref,
          { answers: answerArray, totalAnswers: totalAns, users: { [user]: ind } },
          { merge: true }
        );
        trans.set(questRef, { totalAnswers: totalAns }, { merge: true });
      });
    })
      .then(() => {
        console.log('success in transaction done');
        setSettingAns(false);
      })
      .catch((error) => {
        console.log('error in transaction done ' + error);
        setSettingAns(false);
        alert('try again later');
      });
  };

  const noResponse = () => {
    alert('sign in for answering');
  };

  // Optimistic vote handlers: update the UI synchronously so the click feels
  // instant, then run the Firestore transaction in the background. The
  // onSnapshot listeners below reconcile with the server's truth, and we
  // revert the local state if the write fails.
  const handleUpVoteClick = () => {
    if (!signed) {
      upVote(ctx, questRef, null);
      return;
    }
    if (voteBusy) return;

    const prevUp = upVoted;
    const prevDown = downVoted;
    const prevCounters = counters;

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
    setCounters((c) => ({
      ...c,
      totalUpVotes: c.totalUpVotes + deltaUp,
      totalDownVotes: c.totalDownVotes + deltaDown,
    }));
    setVoteBusy(true);

    Promise.resolve(upVote(ctx, questRef, ctx.auth.currentUser.uid))
      .catch(() => {
        setUpVoted(prevUp);
        setDownVoted(prevDown);
        setCounters(prevCounters);
      })
      .finally(() => setVoteBusy(false));
  };

  const handleDownVoteClick = () => {
    if (!signed) {
      downVote(ctx, questRef, null);
      return;
    }
    if (voteBusy) return;

    const prevUp = upVoted;
    const prevDown = downVoted;
    const prevCounters = counters;

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
    setCounters((c) => ({
      ...c,
      totalUpVotes: c.totalUpVotes + deltaUp,
      totalDownVotes: c.totalDownVotes + deltaDown,
    }));
    setVoteBusy(true);

    Promise.resolve(downVote(ctx, questRef, ctx.auth.currentUser.uid))
      .catch(() => {
        setUpVoted(prevUp);
        setDownVoted(prevDown);
        setCounters(prevCounters);
      })
      .finally(() => setVoteBusy(false));
  };

  const removeQuest = (questid) => {
    const batch = ctx.db.batch();
    const myQuestRef = ctx.db
      .collection('Users').doc(ctx.auth.currentUser.uid)
      .collection('myQuests').doc(questid);

    batch.delete(questRef);
    batch.delete(myQuestRef);

    batch.commit()
      .then(() => reloadFunc && reloadFunc())
      .catch((err) => console.log('error in removing ' + err));
  };

  useEffect(() => {
    let unsubscribeAns = null;

    if (signed) {
      const user = ctx.auth.currentUser.uid;
      unsubscribeAns = questRef
        .collection('answers').doc('default')
        .onSnapshot((snap) => {
          const d = snap.data();
          if (typeof d === 'undefined') return;
          const boolview = d.users && d.users[user] !== undefined;
          const ind = boolview ? d.users[user] : -1;
          setQuestData(d);
          setViewAnswer(boolview);
          setIndex(ind);
        });
    } else {
      setViewAnswer(false);
      setIndex(-1);
      setUpVoted(false);
      setDownVoted(false);
    }

    return () => {
      if (unsubscribeAns) unsubscribeAns();
    };
  }, [ctx, data.questId, signed]);

  // Live counter updates on the quest doc (vote totals, comment count, etc.).
  useEffect(() => {
    const unsubscribe = questRef.onSnapshot((snap) => {
      const d = snap.data();
      if (typeof d === 'undefined') return;
      setCounters({
        totalUpVotes: d.totalUpVotes ?? 0,
        totalDownVotes: d.totalDownVotes ?? 0,
        totalComments: d.totalComments ?? 0,
        totalAnswers: d.totalAnswers ?? 0,
      });
    });
    return () => unsubscribe();
  }, [ctx, data.questId]);

  // Per-user vote indicator (only when signed in).
  useEffect(() => {
    if (!signed) {
      setUpVoted(false);
      setDownVoted(false);
      return undefined;
    }
    const uid = ctx.auth.currentUser.uid;
    const unsubscribeUp = questRef.collection('upVotes').doc(uid)
      .onSnapshot((snap) => setUpVoted(snap.exists));
    const unsubscribeDown = questRef.collection('downVotes').doc(uid)
      .onSnapshot((snap) => setDownVoted(snap.exists));
    return () => {
      unsubscribeUp();
      unsubscribeDown();
    };
  }, [ctx, data.questId, signed]);

  if (typeof data.timeStamp === 'undefined') return null;

  const Date = data.timeStamp.toDate().toDateString().split(' ');
  const allAnsForView = (viewAnswer && signed) ? questData : EMPTY_QUEST_DATA;

  return (
    <div className="quest-box">
      {deleteMyQuest && signed ? (
        <div className="remove noselect" onClick={() => removeQuest(data.questId)}>Remove</div>
      ) : null}
      <Bookmark
        click={() => {
          setBookmarkToggle(
            ctx,
            signed ? ctx.auth.currentUser.uid : null,
            data.questId,
            bookmarked
          );
          funcForBookMarkTab && funcForBookMarkTab();
        }}
        bookmarked={bookmarked}
      />
      <div className={(settingAns ? '' : 'hidden') + ' setting-answer noselect'}>
        <p>Wait your onion is getting peeled...</p>
        <div className="onion-image" />
      </div>
      <ShareDropdown
        shareDrop={shareDrop}
        questId={data.questId}
        onClose={shareDropToggle}
      />
      <div className="profile-box">
        <div style={{ height: '35px', width: '35px' }}>
          <ProfilePic imageUrl={data.isAnonymous ? null : data.user.userProfilePicUrl} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p>{data.isAnonymous ? 'Anonymous' : data.user.userName}</p>
          <span style={{ display: 'flex', flexDirection: 'row' }}>
            <p className="date"><span>&#183;</span>{' ' + Date[2] + ' ' + Date[1] + ' ' + Date[3]}</p>
            <p className="date"><span>&#183;</span>{' ' + counters.totalAnswers + ' Voted'}</p>
          </span>
        </div>
      </div>
      <h3>{data.title}</h3>
      {Array.isArray(data.tags) && data.tags.some((t) => t && t.trim().length) ? (
        <div className="quest-tags">
          {data.tags
            .map((tag) => (
              <span key={tag} className="quest-tag">#{tag.trim()}</span>
            ))}
        </div>
      ) : null}

      {data.options.map((on, i) => (
        <Onion
          key={i}
          signed={signed}
          onion={on}
          ind={i}
          ans={signed ? index : -1}
          allAns={allAnsForView}
          setOnion={signed ? ansClicked : noResponse}
        />
      ))}

      <div className="up-down">
        <svg
          className="svg-icons noselect"
          onClick={handleUpVoteClick}
          viewBox="0 0 24 24"
        >
          <g id="upvote" className={'icon-svg' + (signed && upVoted ? ' upvoted' : '')}>
            <polygon points="12 4 3 15 9 15 9 20 15 20 15 15 21 15"></polygon>
          </g>
        </svg>
        <p>{upVotes === 0 && downVotes === 0 ? '' : upVotes - downVotes}</p>
        <svg
          className="svg-icons noselect"
          onClick={handleDownVoteClick}
          viewBox="0 0 24 24"
        >
          <g id="downvote" className={'icon-svg' + (signed && downVoted ? ' downvoted' : '')}>
            <polygon transform="translate(12.000000, 12.000000) rotate(-180.000000) translate(-12.000000, -12.000000) " points="12 4 3 15 9 15 9 20 15 20 15 15 21 15"></polygon>
          </g>
        </svg>
        <div className="view-answer noselect" onClick={answerToggle}>
          {viewAnswer ? 'Hide Onions' : 'View Onions'}
        </div>
        <svg
          id="share"
          className="svg-icons noselect"
          style={{ marginLeft: 'auto' }}
          onClick={shareDropToggle}
          viewBox="0 0 24 24"
        >
          <g className="icon-svg">
            <path d="M12.0001053,2.99989467 L4.00010533,12.7776724 L9.33343867,12.7776724 C9.78266695,14.7041066 10.5048892,16.2782509 11.5001053,17.5001053 C12.4953215,18.7219597 13.9953215,19.8886264 16.0001053,21.0001053 C15.3415908,19.6668553 14.8428108,18.1668553 14.5037654,16.5001053 C14.16472,14.8333553 14.2190556,13.5925444 14.666772,12.7776724 L20.0001053,12.7776724 L12.0001053,2.99989467 Z" transform="translate(12.000105, 12.000000) rotate(90.000000) translate(-12.000105, -12.000000) "></path>
          </g>
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div className="comment-link noselect" onClick={() => commentToggle(false)}>
          {showComments ? 'Hide ' : 'Show '}{counters.totalComments} comments
        </div>
        <div className="add-comment noselect" onClick={addCommentToggle}>Comment</div>
      </div>
      {addComment ? (
        <div>
          <AddComment
            questId={data.questId}
            type="comment"
            Toggle={() => commentToggle(true)}
          />
          <br />
        </div>
      ) : null}

      {showComments ? <Comments questId={data.questId} /> : null}
    </div>
  );
}

export default Quest;
