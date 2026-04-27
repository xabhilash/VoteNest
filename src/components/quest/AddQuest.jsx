import { useState } from 'react';
import { useFirebase, useAuth } from '../../context/FirebaseContext';
import { firebase } from '../../lib/firebase';
import './addquest.css';

const INITIAL_QUEST = {
  title: '',
  options: ['', ''],
  upvotes: 0,
  downvotes: 0,
  isAnonymous: false,
  tags: [],
  comments: 0,
};

function AddQuest() {
  const { db } = useFirebase();
  const { user } = useAuth();
  const [quest, setQuest] = useState(INITIAL_QUEST);
  const [classNameHidden, setClassNameHidden] = useState(true);
  const [addOnSuccess, setAddOnSuccess] = useState(false);
  const [explicitButtonDisable, setExplicitButtonDisable] = useState(true);
  const [settingQuest, setSettingQuest] = useState(false);

  const updateInput = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setQuest((prev) => ({ ...prev, [name]: value }));
  };

  const updateTagsArray = (event) => {
    const name = event.target.name;
    const value = event.target.value.split(', ');
    setQuest((prev) => ({ ...prev, [name]: value }));
  };

  const updateInputArrayOptions = (idx, event) => {
    const value = event.target.value;
    setQuest((prev) => {
      const options = [...prev.options];
      options[idx] = value;
      return { ...prev, options };
    });
  };

  const addOptionFromButton = () => {
    setQuest((prev) => {
      if (prev.options.length >= 5) return prev;
      return { ...prev, options: [...prev.options, ''] };
    });
  };

  const removeOptionFromButton = (idx) => {
    setQuest((prev) => {
      if (prev.options.length < 3) return prev;
      const options = [...prev.options];
      options.splice(idx, 1);
      return { ...prev, options };
    });
  };

  const openSelectMenu = () => setClassNameHidden((prev) => !prev);

  const changeStateIsAnonymous = (value) => {
    setQuest((prev) => ({ ...prev, isAnonymous: value }));
    setClassNameHidden(true);
  };

  const okaySuccess = () => setAddOnSuccess(false);

  const formIsValid =
    quest.options.length < 6 &&
    quest.options.every((op) => op.trim().length > 0) &&
    quest.title.trim().length &&
    explicitButtonDisable;

  const addQuestion = (event) => {
    event.preventDefault();
    if (!formIsValid) return;
    if (user == null) return;
    setExplicitButtonDisable(false);
    setSettingQuest(true);

    db.collection('Quest')
      .add({
        ...quest,
        totalAnswers: 0,
        timeStamp: firebase.firestore.Timestamp.now(),
        user: {
          userId: quest.isAnonymous ? 'Anon' : user.uid,
          userName: quest.isAnonymous ? 'Anon' : user.displayName,
          userProfilePicUrl: quest.isAnonymous ? 'Anon' : user.photoURL,
        },
        totalComments: 0,
      })
      .then((snap) => {
        const batch = db.batch();
        const ansref = db
          .collection('Quest').doc(snap.id)
          .collection('quest_data').doc('ans' + snap.id);
        const userpvtref = db
          .collection('Users_pvt_data').doc(user.uid)
          .collection('Quest').doc(`Quest_${user.uid}`);

        batch.set(ansref, {
          totalAnswers: 0,
          answers: new Array(quest.options.length).fill(0),
          male: new Array(quest.options.length).fill(0),
          female: new Array(quest.options.length).fill(0),
          quest_id: snap.id,
          users: {},
        });

        batch.set(
          userpvtref,
          { quest: { [snap.id]: firebase.firestore.Timestamp.now() } },
          { merge: true }
        );

        batch.commit()
          .then(() => {
            console.log('success');
            setQuest(INITIAL_QUEST);
            setAddOnSuccess(true);
            setExplicitButtonDisable(true);
            setSettingQuest(false);
          })
          .catch((error) => console.log('error in answers ans pvt data' + error));
      })
      .catch((error) => console.log('error in submitting ' + error));
  };

  return (
    <div className="add-question">
      <div className={(addOnSuccess ? '' : 'hidden') + ' success-add-question noselect'}>
        <p>question submitted successfully</p>
        <div className="okay-success-prompt" onClick={okaySuccess}>OK</div>
      </div>
      <div className={(settingQuest ? '' : 'hidden') + ' setting-answer noselect'}>
        <p>Wait your quest is getting planted...</p>
        <div className="onion-image" />
      </div>
      <h2>Add question</h2> 
      <form onSubmit={addQuestion}>
        <div className="box-state-change">
          <button
            className="button-state-change"
            type="button"
            onClick={openSelectMenu}
          >
            {quest.isAnonymous ? 'Anonymous' : 'Public'}
            <svg width="15px" height="15px" viewBox="0 0 24 24">
              <g className="icon_svg-stroke">
                <polyline
                  className={classNameHidden ? '' : 'transform-arrow'}
                  points="5 8.5 12 15.5 19.0048307 8.5"
                />
              </g>
            </svg>
          </button>
          <div className={'menu-box ' + (classNameHidden ? 'hidden' : '')}>
            <div className="menu-box-option" onClick={() => changeStateIsAnonymous(false)}>
              <h3>Public</h3>
              <p>display your name and profile image</p>
            </div>
            <hr />
            <div className="menu-box-option" onClick={() => changeStateIsAnonymous(true)}>
              <h3>Anonymous</h3>
              <p>you will be Anonymous and nothing is revealed</p>
            </div>
          </div>
        </div>
        <textarea
          className="question-input"
          type="text"
          placeholder="Write your question"
          name="title"
          value={quest.title}
          onChange={updateInput}
        />
        <br />
        <div className="options-box-add">
          {quest.options.map((op, id) => (
            <div key={id} className="option-and-remove">
              <textarea
                required={true}
                value={quest.options[id]}
                className="option-input"
                type="text"
                placeholder={`option ${id + 1}`}
                name="options"
                onChange={(e) => updateInputArrayOptions(id, e)}
              />
              <button
                type="button"
                className="remove-option-button"
                onClick={() => removeOptionFromButton(id)}
              >-</button>
            </div>
          ))}
          <button
            type="button"
            className="add-option-button"
            onClick={addOptionFromButton}
          > + </button>
        </div>
        <br /><br />

        <textarea
          className="tags-input"
          type="text"
          placeholder="tags (seperated by comma) tag1, tag2"
          name="tags"
          onChange={updateTagsArray}
        />
        <br />
        {user ? (
          <button
            className="submit-button"
            disabled={!formIsValid}
            type="submit"
          >Submit</button>
        ) : (
          <p style={{ margin: 0 }}>Sign in to ask</p>
        )}
      </form>
    </div>
  );
}

export default AddQuest;
