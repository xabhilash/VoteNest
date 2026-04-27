import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.REACT_APP_API_KEY ?? import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.REACT_APP_AUTH_DOMAIN ?? import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.REACT_APP_DATABASE_URL ?? import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.REACT_APP_PROJECT_ID ?? import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.REACT_APP_STORAGE_BUCKET ?? import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.REACT_APP_MESSAGING_SENDER_ID ?? import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.REACT_APP_APP_ID ?? import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.REACT_APP_MEASUREMENT_ID ?? import.meta.env.VITE_MEASUREMENT_ID,
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

export const uiConfig = {
  signInFlow: 'popup',
  signInSuccessUrl: '/',
  callbacks: {
    // Let React Router handle post-sign-in navigation via <Navigate> in SignUpPage.
    // Returning false prevents FirebaseUI from doing its own window.location redirect,
    // which can race with React Router and leave the URL stuck at /signup.
    signInSuccessWithAuthResult: () => false,
  },
  signInOptions: [
    {
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      customParameters: {
        prompt: 'select_account',
      },
    },
  ],
};

export { firebase };
export default { auth, db, uiConfig };
