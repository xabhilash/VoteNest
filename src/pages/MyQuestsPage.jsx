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

    db.collection('Users').doc(user.uid)
      .collection('myQuests')
      .get()
      .then((snap) => {
        if (snap.empty) {
          setDataReceived(true);
          return;
        }
        let collected = [];
        snap.docs.forEach((doc) => {
          db.collection('Quest').doc(doc.id).get()
            .then((snapDoc) => {
              if (!snapDoc.exists) return;
              collected = collected.concat({ ...snapDoc.data(), questId: snapDoc.id });
              setQuest(collected);
              setDataReceived(true);
            })
            .catch((error) => console.log('error in retriveing data from database ' + error));
        });
      });

    const unsubscribe = db
      .collection('Users').doc(user.uid)
      .collection('bookmarks')
      .onSnapshot((snap) => {
        const map = {};
        snap.docs.forEach((doc) => { map[doc.id] = true; });
        setBookmarks(map);
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
