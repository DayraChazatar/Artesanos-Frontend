import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
// @ts-ignore
import './styles/index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <GoogleOAuthProvider clientId="845925419316-dnpgshd089pchteb2pvt2b5u55t96cn9.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
  </React.StrictMode>
);

