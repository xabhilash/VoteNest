import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { auth, db, uiConfig, firebase } from '../lib/firebase';

const FirebaseContext = createContext(null);
const AuthContext = createContext({ user: null, isSignedIn: false, ready: false });

export function FirebaseProvider({ children }) {
  const value = useMemo(() => ({ auth, db, uiConfig, firebase }), []);
  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u ?? null);
      setReady(true);

      if (!u) return;
      // Create the user's profile document the first time they sign in.
      const isNewUser = u.metadata.creationTime === u.metadata.lastSignInTime;
      if (!isNewUser) return;
      db.collection('Users').doc(u.uid).set({
        userid: u.uid,
        createdDate: firebase.firestore.Timestamp.now(),
        userName: u.displayName,
        userProfilePicUrl: u.photoURL,
        quest: {},
      }, { merge: true })
        .catch((error) => console.log('error creating user doc: ' + error));
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, isSignedIn: !!user, ready }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error('useFirebase must be used within FirebaseProvider');
  return ctx;
}

export function useAuth() {
  return useContext(AuthContext);
}

export { FirebaseContext };
