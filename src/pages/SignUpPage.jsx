import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useFirebase, useAuth } from '../context/FirebaseContext';
import FirebaseAuthUI from '../components/common/FirebaseAuthUI';
import './signup.css';
import '../styles/firebaseUI.css';

function SignUpPage() {
  const { auth, uiConfig } = useFirebase();
  const { isSignedIn, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && isSignedIn) {
      navigate('/', { replace: true });
    }
  }, [ready, isSignedIn, navigate]);

  if (ready && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="sign">
      <div className="sign-transparent-div">
        <h1>VoteNest</h1>
        <p>A place to share your onion on some weird stuff</p>
        <FirebaseAuthUI uiConfig={uiConfig} firebaseAuth={auth} />
      </div>
    </div>
  );
}

export default SignUpPage;
