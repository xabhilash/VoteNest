import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import { firebase } from '../../lib/firebase';
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
  const [upVotes, setUpVotes] = useState(0);
  const [downVotes, setDownVotes] = useState(0);
  const [upVoted, setUpVoted] = useState(false);
  const [downVoted, setDownVoted] = useState(false);
  const [settingAns, setSettingAns] = useState(false);
  const [shareDrop, setShareDrop] = useState(false);
  const [questData, setQuestData] = useState(EMPTY_QUEST_DATA);

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

    const ref = ctx.db
      .collection('Quest').doc(data.questId)
      .collection('quest_data').doc('ans' + data.questId);

    const questRef = ctx.db.collection('Quest').doc(data.questId);

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

  const removeQuest = (questid) => {
    const batch = ctx.db.batch();
    const questRef = ctx.db.collection('Quest').doc(questid);
    const userQuestRef = ctx.db
      .collection('Users_pvt_data').doc(ctx.auth.currentUser.uid)
      .collection('Quest').doc(`Quest_${ctx.auth.currentUser.uid}`);

    batch.delete(questRef);
    batch.set(userQuestRef, {
      quest: { [questid]: firebase.firestore.FieldValue.delete() },
    }, { merge: true });

    batch.commit()
      .then(() => reloadFunc && reloadFunc())
      .catch((err) => console.log('error in removing ' + err));
  };

  useEffect(() => {
    let unsubscribeAns = null;

    if (signed) {
      const user = ctx.auth.currentUser.uid;
      unsubscribeAns = ctx.db
        .collection('Quest').doc(data.questId)
        .collection('quest_data').doc('ans' + data.questId)
        .onSnapshot((snap) => {
          const d = snap.data();
          const boolview = d.users[user] !== undefined ? true : false;
          const ind = d.users[user] !== undefined ? d.users[user] : -1;
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

  useEffect(() => {
    const unsubscribeUp = ctx.db
      .collection('Quest_data').doc(data.questId)
      .collection('upVotes').doc(`upVote_${data.questId}`)
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
      .collection('Quest_data').doc(data.questId)
      .collection('downVotes').doc(`downVote_${data.questId}`)
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
            <p className="date"><span>&#183;</span>{' ' + data.totalAnswers + ' Voted'}</p>
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
          onClick={() => upVote(ctx, 'Quest', signed ? ctx.auth.currentUser.uid : null, data.questId)}
          viewBox="0 0 24 24"
        >
          <g id="upvote" className={'icon-svg' + (signed && upVoted ? ' upvoted' : '')}>
            <polygon points="12 4 3 15 9 15 9 20 15 20 15 15 21 15"></polygon>
          </g>
        </svg>
        <p>{upVotes - downVotes}</p>
        <svg
          className="svg-icons noselect"
          onClick={() => downVote(ctx, 'Quest', signed ? ctx.auth.currentUser.uid : null, data.questId)}
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
          {showComments ? 'Hide ' : 'Show '}{data.totalComments} comments
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
