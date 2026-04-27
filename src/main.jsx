import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FirebaseProvider, AuthProvider } from './context/FirebaseContext';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FirebaseProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FirebaseProvider>
    </BrowserRouter>
  </StrictMode>
);
