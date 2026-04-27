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

    db.collection('Users').doc(user.uid)
      .collection('bookmarks')
      .get()
      .then((snap) => {
        if (snap.empty) {
          setBookmarks({});
          setDataReceived(true);
          return;
        }
        const map = {};
        snap.docs.forEach((doc) => { map[doc.id] = true; });
        setBookmarks(map);

        let collected = [];
        snap.docs.forEach((doc) => {
          db.collection('Quest').doc(doc.id).get()
            .then((snapDoc) => {
              if (!snapDoc.exists) {
                setDataReceived(true);
                return;
              }
              collected = collected.concat({ ...snapDoc.data(), questId: snapDoc.id });
              setQuest(collected);
              setDataReceived(true);
            })
            .catch((error) => console.log('error in retriveing data from database ' + error));
        });
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
