import { useCallback, useEffect, useRef, useState } from 'react';
import { useFirebase, useAuth } from '../context/FirebaseContext';
import Quest from '../components/quest/Quest';
import AddQuest from '../components/quest/AddQuest';
import QuestSearch from '../components/quest/QuestSearch';
import FollowAndFeed from '../components/feed/FollowAndFeed';
import Ghost from '../components/common/GhostScreen';
import MyQuestsPage from './MyQuestsPage';
import './home.css';

function shuffle(array) {
  let m = array.length;
  let t;
  let i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

function HomePage({ url = null }) {
  const { db } = useFirebase();
  const { user, isSignedIn } = useAuth();

  const [quest, setQuest] = useState([]);
  const [questUrl, setQuestUrl] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const [showMyQuestHome, setShowMyQuestHome] = useState(false);
  const [loadingUiBottom, setLoadingUiBottom] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchTag, setSearchTag] = useState('');

  const lastDocRef = useRef(undefined);
  const getMoreDataRef = useRef(false);
  const initialFetchedRef = useRef(false);

  const getQuest = useCallback((scroll) => {
    let ref;
    if (scroll) ref = db.collection('Quest').startAfter(lastDocRef.current).limit(5);
    else ref = db.collection('Quest').limit(5);
    ref.get()
      .then((snap) => {
        let data = snap.docs.map((doc) => ({ ...doc.data(), questId: doc.id }));
        data = shuffle(data);
        lastDocRef.current = snap.docs[snap.docs.length - 1];
        getMoreDataRef.current = true;
        setQuest((prev) => prev.concat(data));
        setLoadingUiBottom(false);
        setInitialLoaded(true);
        setFetchError(null);
      })
      .catch((error) => {
        console.log('error in retriveing data from database ' + error);
        setFetchError(error.message || String(error));
        setLoadingUiBottom(false);
        setInitialLoaded(true);
      });
  }, [db]);

  const getRequiredQuest = useCallback(() => {
    db.collection('Quest').doc(url.toString()).get()
      .then((snap) => {
        const data = { ...snap.data(), questId: snap.id };
        if (typeof data !== 'undefined') setQuestUrl(data);
        else setQuestUrl(null);
      })
      .catch((err) => console.log('error while fetching ' + err));
  }, [db, url]);

  const bottomOfPage = useCallback(() => {
    if (searchResults != null) return;
    if (
      window.innerHeight + window.scrollY + 100 >= document.body.offsetHeight &&
      getMoreDataRef.current &&
      typeof lastDocRef.current !== 'undefined'
    ) {
      getMoreDataRef.current = false;
      setLoadingUiBottom(true);
      getQuest(true);
    }
    if (typeof lastDocRef.current === 'undefined') setLoadingUiBottom(false);
  }, [getQuest, searchResults]);

  useEffect(() => {
    window.addEventListener('scroll', bottomOfPage);
    return () => window.removeEventListener('scroll', bottomOfPage);
  }, [bottomOfPage]);

  useEffect(() => {
    if (initialFetchedRef.current) return;
    initialFetchedRef.current = true;
    if (url != null) getRequiredQuest();
    getQuest(false);
  }, [url, getRequiredQuest, getQuest]);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    const unsubscribe = db
      .collection('Users').doc(user.uid)
      .collection('bookmarks')
      .onSnapshot((snap) => {
        const map = {};
        snap.docs.forEach((doc) => { map[doc.id] = true; });
        setBookmarks(map);
      });
    return () => unsubscribe();
  }, [db, isSignedIn, user]);

  const isSearching = searchResults != null;
  const list = isSearching ? searchResults : quest;
  const len = list.length;
  const showEmptyState = !isSearching && initialLoaded && len === 0 && questUrl == null;
  const showSearchEmpty = isSearching && len === 0;
  const showHomeContainer =
    len > 0 || showEmptyState || showSearchEmpty || questUrl != null || isSignedIn;

  const handleSearchResults = (results, tag) => {
    setSearchResults(results);
    setSearchTag(tag);
  };

  const handleSearchClear = () => {
    setSearchResults(null);
    setSearchTag('');
  };

  return (
    <div className="home-box">
      {/* <div className="feed-home">
        <FollowAndFeed />
      </div> */}
      {showHomeContainer ? (
        <div className="Home">
          {isSignedIn ? (
            <QuestSearch
              onResults={handleSearchResults}
              onClear={handleSearchClear}
            />
          ) : (
            <div className="Signin-box-text">Sign in to view onions and adding quest</div>
          )}
          {fetchError && !isSearching ? (
            <div style={{ background: '#ffe5e5', color: '#12426d', padding: '10px', marginTop: '15px', textAlign: 'left', boxShadow: '0 1px 5px 0 #00000085' }}>
              <strong>Could not load quests.</strong>
              <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>{fetchError}</div>
              <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#666' }}>
                Check your Firestore security rules allow reads, and that the <code>Quest</code> collection exists.
              </div>
            </div>
          ) : null}
          {!isSearching && questUrl != null ? (
            <div>
              <Quest
                data={questUrl}
                key={questUrl.questId}
                signed={isSignedIn}
                bookmarked={Object.prototype.hasOwnProperty.call(bookmarks, questUrl.questId)}
                funcForBookMarkTab={() => console.log(questUrl.questId)}
                deleteMyQuest={false}
              />
              <br /><br />Other Quests<hr />
            </div>
          ) : null}
          {list.map((qu) => (
            <Quest
              data={qu}
              key={qu.questId}
              signed={isSignedIn}
              bookmarked={Object.prototype.hasOwnProperty.call(bookmarks, qu.questId)}
              funcForBookMarkTab={() => console.log(qu.questId)}
              deleteMyQuest={false}
            />
          ))}
          {showSearchEmpty ? (
            <div style={{ color: '#929292', marginTop: '20px', padding: '20px', background: 'white', boxShadow: '0 1px 5px 0 #00000085' }}>
              No quests found for tag &ldquo;{searchTag}&rdquo;.
            </div>
          ) : null}
          {showEmptyState && !fetchError ? (
            <div style={{ color: '#929292', marginTop: '20px', padding: '20px', background: 'white', boxShadow: '0 1px 5px 0 #00000085' }}>
              <div>No quests yet.</div>
              <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>Be the first &mdash; add a question to fill the database.</div>
            </div>
          ) : null}
          {!isSearching && len > 0 ? (
            <div style={{ color: '#929292', marginTop: '5px' }}>
              {loadingUiBottom ? (
                <div>Loading...</div>
              ) : (
                <div>That&apos;s it, add questions to fill the database</div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="Home">
          <Ghost />
        </div>
      )}
      <div className="add-question-section">
        <AddQuest />
        <div
          className="show-myquest-toggle noselect"
          onClick={() => setShowMyQuestHome((prev) => !prev)}
        >My questions</div>
        {showMyQuestHome && isSignedIn ? <MyQuestsPage className="Myquesthome" /> : null}
      </div>
    </div>
  );
}

export default HomePage;
