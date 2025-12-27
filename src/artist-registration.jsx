import { useState, useEffect, use } from 'react';
import { Link } from 'react-router-dom';

import {registerWithEmail, loginWithEmail, subscribeAuth, fanToArtist, getRole} from './firebase.js';



export default function ArtistRegistration() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState(null);
    const [isRegister, setIsRegister] = useState(false);

    useEffect(() => {
        const unsub = subscribeAuth((u) => {
            setUser(u);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchRole = async () => {
            if (user) {
                const userRole = await getRole(user.uid);
                setRole(userRole);
            }
        };
        fetchRole();
    }, [user]);

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

  
  const upgradeToArtist = async () => {
    try {
      await fanToArtist();
        alert('Your account has been upgraded to artist!');
    } catch (err) {
      console.error('Could not upgrade to artist', err);
    }
  }

    return (
    <>
        <h1>Register as an artist</h1>
        <div style={{ marginBottom: 16 }}>
            {user ? (
                role === 'artist' ? (
                <div>
                    <p>Hi <strong>{user.email}</strong></p>
                    <p>You are already signed in as an artist.</p>
                    <Link to="/">Take me back to the chart.</Link>
                </div>
                ):(
                <div>
                    <p>Hi <strong>{user.email}</strong></p>
                    <p>You are currently signed in as a fan.</p>
                    <p>Would you like to upload your own songs? Complete the following info to upgrade to an artist account.</p>
                    <Link to="/">I don't want an artist account. Take me back to the chart.</Link>
                    <button onClick={upgradeToArtist}>Make me an artist</button>
                </div>
                )
            ) : (
            <div>
                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email" />
                <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" />
                <button type="submit">{isRegister ? 'Register' : 'Sign in'}</button>
                </form>
                <div style={{ marginTop: 8 }}>
                {authError && <p style={{ color: 'red' }}>Error: {authError}</p>}
                </div>
            </div>
            )}
        </div>
    </>
    );
}