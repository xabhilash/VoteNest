import { useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import './questsearch.css';

function QuestSearch({ onResults, onClear }) {
  const { db } = useFirebase();
  const [tag, setTag] = useState('');
  const [active, setActive] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = tag.trim();
    if (!trimmed) return;

    db.collection('Quest')
      .where('tags', 'array-contains', trimmed)
      .get()
      .then((snap) => {
        const data = snap.docs.map((doc) => ({ ...doc.data(), questId: doc.id }));
        setActive(true);
        onResults(data, trimmed);
      })
      .catch((err) => console.log('search error: ' + err));
  };

  const handleClear = () => {
    setTag('');
    setActive(false);
    onClear();
  };

  return (
    <form className="quest-search" onSubmit={handleSubmit}>
      <input
        type="text"
        className="quest-search-input"
        placeholder="Search by tag"
        value={tag}
        onChange={(event) => setTag(event.target.value)}
      />
      <button type="submit" className="quest-search-button">Search</button>
      {active ? (
        <button type="button" className="quest-search-clear" onClick={handleClear}>Clear</button>
      ) : null}
    </form>
  );
}

export default QuestSearch;
