import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css'
import {registerWithEmail, loginWithEmail, signOutUser, subscribeAuth, sendPasswordReset, getRole, getArtistByUser, getLikeCount, getLikedByUserToday} from './firebase.js';
import Contact from './contact.jsx';
import Shop from './shop.jsx';
import ArtistRegistration from './artist-registration.jsx';
import About from './about.jsx';
import ArtistAccount from './artist-account.jsx';
import ManageSongs from './manage-songs.jsx';
import Home from './home.jsx';

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [myArtist, setMyArtist] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likedSongs, setLikedSongs] = useState([]);
  
  // const [timePlayed, setTimePlayed] = useState(0);

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

  useEffect(() => {
      const fetchRole = async () => {
          if (user) {
              const userRole = await getRole(user.uid);
              setRole(userRole);
              checkLikeCount(user.uid);
          }
      };
      fetchRole();
  }, [user, myArtist]);

  useEffect(() => {
    console.log('Like count updated:', likeCount);
    console.log('User is:', user);
    if (user) {
        checkLikeCount(user.uid);
        getLikedByUserToday(user.uid).then(likedSongs => {
            setLikedSongs(likedSongs || []);
            console.log('Fetched liked songs for user', user.uid, likedSongs);
        }).catch(err => console.error('Failed to fetch liked songs for user:', err)); 
    }
  }, [user]);

  useEffect(() => {
    const fetchMyArtist = async () => {
      if(user){
        const myArtistData = await getArtistByUser(user.uid);
        setMyArtist(myArtistData || null);
      }else{
        setMyArtist(null);
      }
    }
    fetchMyArtist();
  }, [user]);

  const checkLikeCount = async (userId) => {
    try {
      const likeCount = await getLikeCount(userId);
      if (likeCount === null || likeCount === undefined) {
        await updateLikeCount(userId, 0);
        setLikeCount(0);
      } else {
        setLikeCount(likeCount);
      }
    } catch (err) {
      console.error('Failed to check or update like count:', err);
    }
  };

  // Auth form submit handler
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
      <nav>
        <Link to="/">Song Chart</Link> |{" "}
        <Link to="/about">About</Link> |{" "}
        {role != 'artist' && <><Link to="/artist-registration">Artist Registration</Link> |{" "}</>}
        {role === 'artist' && <><Link to="/artist-account">My Account</Link> |{" "}</>}
        {role === 'artist' && <><Link to="/manage-songs">Manage Songs</Link> |{" "}</>}
        <Link to="/shop">Shop</Link> |{" "}
        <Link to="/contact">Contact</Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home userId={user?.uid} setLikeCount={setLikeCount} likedSongs={likedSongs} />} />
        <Route path="/about" element={<About />} />
        <Route path="/artist-registration" element={<ArtistRegistration role={role} setRole={setRole} user={user} setUser={setUser} />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/artist-account" element={<ArtistAccount myArtist={myArtist} />} />
        <Route path="/manage-songs" element={<ManageSongs myArtist={myArtist} user={user} />} />
      </Routes>

      {/* Auth UI */}
      <div style={{ marginBottom: 16 }}>
        {myArtist && <p>Artist: {myArtist.name}</p>}
        {user && <p>Like Count: {likeCount}</p>}
        {user ? (
          <div>
            <p>Signed in as <strong>{user.email}</strong></p>
            <p>Role: {role}</p>
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
