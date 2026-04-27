import { useEffect, useRef } from 'react';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

function FirebaseAuthUI({ uiConfig, firebaseAuth }) {
  const containerRef = useRef(null);
  const uiRef = useRef(null);

  useEffect(() => {
    uiRef.current = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebaseAuth);
    uiRef.current.start(containerRef.current, uiConfig);
    return () => {
      if (uiRef.current) uiRef.current.reset();
    };
  }, [uiConfig, firebaseAuth]);

  return <div className="firebaseui-auth-container" ref={containerRef} />;
}

export default FirebaseAuthUI;
