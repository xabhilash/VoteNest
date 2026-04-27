import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFirebase, useAuth } from '../context/FirebaseContext';
import Quest from '../components/quest/Quest';
import AddQuest from '../components/quest/AddQuest';
import FollowAndFeed from '../components/feed/FollowAndFeed';
import Ghost from '../components/common/GhostScreen';
import SignUpPage from './SignUpPage';
import './home.css';

function BookmarksPage() {
  const { db } = useFirebase();
  const { user, isSignedIn, ready } = useAuth();
  const [quest, setQuest] = useState([]);
  const [bookmarks, setBookmarks] = useState({});
  const [dataReceived, setDataReceived] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isSignedIn || !user) return;

    db.collection('Users_pvt_data').doc(user.uid)
      .collection('Quest_bookmark').doc(`bookmark_${user.uid}`)
      .get()
      .then((snap) => {
        const data = snap.data();
        if (typeof data !== 'undefined') {
          setBookmarks(data.quest);
          const keys = Object.keys(data.quest);
          if (keys.length === 0) {
            setDataReceived(true);
            return;
          }
          let collected = [];
          keys.forEach((key) => {
            db.collection('Quest').doc(key).get()
              .then((snapDoc) => {
                if (typeof snapDoc.data() === 'undefined') {
                  setDataReceived(true);
                  return;
                }
                collected = collected.concat({ ...snapDoc.data(), questId: snapDoc.id });
                setQuest(collected);
                setDataReceived(true);
              })
              .catch((error) => console.log('error in retriveing data from database ' + error));
          });
        } else {
          setDataReceived(true);
        }
      })
      .catch((err) => console.log(err));
  }, [db, isSignedIn, user, ready]);

  const removeQuestFromBookmark = (questid) => {
    setQuest((prev) => prev.filter((qu) => qu.questId !== questid));
  };

  if (!isSignedIn) return <SignUpPage />;

  const len = quest.length;
  if ((quest.every((e) => typeof e === 'undefined') || len === 0) && dataReceived) {
    return (
      <div>
        <div style={{ color: 'grey' }}>No Saved</div>
        <Link to="/">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="home-box">
      {/* <div className="feed-home">
        <FollowAndFeed />
      </div> */}
      {len > 0 ? (
        <div className="Home">
          {quest.map((qu) => (
            <Quest
              key={qu.questId}
              data={qu}
              signed={isSignedIn}
              bookmarked={Object.prototype.hasOwnProperty.call(bookmarks, qu.questId)}
              funcForBookMarkTab={() => removeQuestFromBookmark(qu.questId)}
              deleteMyQuest={false}
            />
          ))}
        </div>
      ) : (
        <div className="Home">
          <Ghost />
        </div>
      )}
      <div className="add-question-section">
        <AddQuest />
      </div>
    </div>
  );
}

export default BookmarksPage;
