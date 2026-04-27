import { useState } from 'react';
import { useFirebase, useAuth } from '../../context/FirebaseContext';
import { firebase } from '../../lib/firebase';
import './addcomment.css';

function AddComment({ questId, commentId, type, Toggle }) {
  const { db } = useFirebase();
  const { user } = useAuth();
  const [text, setText] = useState('');

  const submitComment = (event) => {
    event.preventDefault();
    if (text === '') return;
    console.log('submitting ' + type);

    const batch = db.batch();
    let ref = db.collection('Quest').doc(questId).collection('Comments');
    if (type === 'reply') ref = ref.doc(commentId).collection('Replies');
    ref = ref.doc();

    batch.set(ref, {
      user: {
        userId: user.uid,
        userName: user.displayName,
        userProfilePicUrl: user.photoURL,
      },
      timeStamp: firebase.firestore.Timestamp.now(),
      upVotes: 0,
      downVotes: 0,
      questId,
      [type]: text,
      isAnonymous: false,
      ...(type === 'reply' && { commentId }),
      ...(type === 'comment' && { totalReplies: 0 }),
    });

    const increment = firebase.firestore.FieldValue.increment(1);
    let incRef = db.collection('Quest').doc(questId);
    if (type === 'reply') incRef = incRef.collection('Comments').doc(commentId);
    batch.update(incRef, {
      ...(type === 'comment' ? { totalComments: increment } : { totalReplies: increment }),
    });

    batch.commit()
      .then(() => {
        Toggle();
        setText('');
      })
      .catch((err) => console.log('error ' + err));
  };

  const handleChange = (event) => setText(event.target.value);

  return (
    <form onSubmit={submitComment}>
      {user ? (
        <div className="add-input">
          <input
            className={'text-input ' + type + '-input'}
            type="textarea"
            placeholder={'Add public ' + type + ' as ' + user.displayName}
            value={text}
            onChange={handleChange}
          />
          <button
            className={text.trim().length ? 'comment-submit' : 'comment-submit-disabled'}
            type="submit"
            style={type === 'reply' ? { width: '20%' } : { width: 'auto' }}
          >{type.toUpperCase()}</button>
        </div>
      ) : (
        <p>{'Sign in for ' + type}</p>
      )}
    </form>
  );
}

export default AddComment;
