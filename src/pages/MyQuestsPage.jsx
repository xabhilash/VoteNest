import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFirebase, useAuth } from '../context/FirebaseContext';
import Quest from '../components/quest/Quest';
import Ghost from '../components/common/GhostScreen';
import SignUpPage from './SignUpPage';
import './home.css';

function MyQuestsPage() {
  const { db } = useFirebase();
  const { user, isSignedIn, ready } = useAuth();
  const [quest, setQuest] = useState([]);
  const [bookmarks, setBookmarks] = useState({});
  const [dataReceived, setDataReceived] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isSignedIn || !user) return;

    db.collection('Users_pvt_data').doc(user.uid)
      .collection('Quest').doc(`Quest_${user.uid}`)
      .get()
      .then((snap) => {
        const data = snap.data();
        if (typeof data === 'undefined') {
          setDataReceived(true);
          return;
        }
        const keys = Object.keys(data.quest);
        if (keys.length === 0) {
          setDataReceived(true);
          return;
        }
        let collected = [];
        keys.forEach((key) => {
          db.collection('Quest').doc(key).get()
            .then((snapDoc) => {
              collected = collected.concat({ ...snapDoc.data(), questId: snapDoc.id });
              setQuest(collected);
              setDataReceived(true);
            })
            .catch((error) => console.log('error in retriveing data from database ' + error));
        });
      });

    const unsubscribe = db
      .collection('Users_pvt_data').doc(user.uid)
      .collection('Quest_bookmark').doc(`bookmark_${user.uid}`)
      .onSnapshot((snap) => {
        const data = snap.data();
        if (typeof data !== 'undefined') setBookmarks(data.quest);
      });
    return () => unsubscribe();
  }, [db, isSignedIn, user, ready]);

  const removeQuestFromList = (questid) => {
    setQuest((prev) => prev.filter((qu) => qu.questId !== questid));
  };

  if (!isSignedIn) return <SignUpPage />;

  const len = quest.length;
  if (len === 0 && dataReceived) {
    return (
      <div>
        <div style={{ color: 'grey' }}>No Quest added</div>
        <Link to="/AskQuest">Ask Quest</Link>
      </div>
    );
  }

  return (
    <div className="home-box">
      {len > 0 ? (
        <div className="Home">
          {quest.map((qu) => (
            <Quest
              key={qu.questId}
              data={qu}
              signed={isSignedIn}
              bookmarked={Object.prototype.hasOwnProperty.call(bookmarks, qu.questId)}
              funcForBookMarkTab={() => console.log()}
              deleteMyQuest={true}
              reloadFunc={() => {
                console.log('removed');
                removeQuestFromList(qu.questId);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="Home">
          <Ghost />
        </div>
      )}
    </div>
  );
}

export default MyQuestsPage;
