import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css'
import {registerWithEmail, loginWithEmail, signOutUser, subscribeAuth, sendPasswordReset} from './firebase.js';
import Contact from './contact.jsx';
import About from './about.jsx';
import Home from './home.jsx';

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  // Forgot password state
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState(null);


  const handleSendReset = async () => { 
    setResetStatus(null);
    setAuthError(null);
    const email = resetEmail || authEmail;
    if (!email) {
      setResetStatus('Please enter an email address');
      return;
    }
    try {
      await sendPasswordReset(email);
      setResetStatus('Password reset email sent. Check your inbox.');
    } catch (err) {
      setResetStatus(err.message || 'Error sending reset email');
    }
  }

  useEffect(() => {
    const unsub = subscribeAuth((u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isRegister) {
        await registerWithEmail(authEmail, authPassword);
      } else {
        await loginWithEmail(authEmail, authPassword);
      }
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message || 'Authentication error');
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign out error', err);
    }
  }

  return (
    <BrowserRouter>
    {/* Navigation */}
      <h1>Song chart</h1>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="/about">About</Link> |{" "}
        <Link to="/contact">Contact</Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      {/* Auth UI */}
      <div style={{ marginBottom: 16 }}>
        {user ? (
          <div>
            <p>Signed in as <strong>{user.email}</strong></p>
            <button onClick={handleSignOut}>Sign out</button>
          </div>
        ) : (
          <div>
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email" />
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" />
              <button type="submit">{isRegister ? 'Register' : 'Sign in'}</button>
            </form>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => setIsRegister(prev => !prev)}>{isRegister ? 'Switch to Sign in' : 'Switch to Register'}</button>
              {authError && <p style={{ color: 'red' }}>Error: {authError}</p>}

              <div style={{ marginTop: 8 }}>
                {resetMode ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input placeholder="Email for password reset" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                    <button onClick={handleSendReset}>Send reset email</button>
                    <button onClick={() => { setResetMode(false); setResetStatus(null); setResetEmail(''); }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setResetMode(true)}>Forgot password?</button>
                )}
                {resetStatus && <p style={{ color: resetStatus.startsWith('Password reset email sent') ? 'green' : 'red' }}>{resetStatus}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      
    </BrowserRouter>
  )
}

export default App
