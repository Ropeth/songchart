import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css'
import {registerWithEmail, loginWithEmail, signOutUser, 
  subscribeAuth, sendPasswordReset, getArtistByUser,  
  getFreeLikedByUserToday, getBoughtLikedByUserToday} from './firebase.js';
import Contact from './contact.jsx';
import Shop from './shop.jsx';
import ArtistRegistration from './artist-registration.jsx';
import About from './about.jsx';
import ArtistAccount from './artist-account.jsx';
import ManageSongs from './manage-songs.jsx';
import Home from './home.jsx';
import PaymentSuccess from './payment-success.jsx';
import { useAuth } from "./AuthContext";


function App() {
  // Auth state
  const {currentUser} = useAuth();
  const role = currentUser?.role || "not signed in";
  const likeCount = currentUser?.likeCount || 0;
  const [user, setUser] = useState(null);
  const [myArtist, setMyArtist] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [myFreeLikedSongsToday, setMyFreeLikedSongsToday] = useState([]);
  const [myBoughtLikedSongsToday, setMyBoughtLikedSongsToday] = useState([]);
  
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
    if (user) {
        getFreeLikedByUserToday(user.uid).then(myFreeLikedSongsToday => {
            setMyFreeLikedSongsToday(myFreeLikedSongsToday || []);
        }).catch(err => console.error('Failed to fetch liked songs for user:', err)); 
        getBoughtLikedByUserToday(user.uid).then(myBoughtLikedSongsToday => {
            setMyBoughtLikedSongsToday(myBoughtLikedSongsToday || []);
        }).catch(err => console.error('Failed to fetch bought liked songs for user:', err)); 
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
        <Route path="/" element={<Home userId={user?.uid} myFreeLikedSongsToday={myFreeLikedSongsToday} myBoughtLikedSongsToday={myBoughtLikedSongsToday} />} />
        <Route path="/about" element={<About />} />
        <Route path="/artist-registration" element={<ArtistRegistration user={user} />} />
        <Route path="/shop" element={<Shop userId={user?.uid} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/artist-account" element={<ArtistAccount myArtist={myArtist} />} />
        <Route path="/manage-songs" element={<ManageSongs myArtist={myArtist} user={user} />} />
        <Route path="/payment-success" element={<PaymentSuccess/>} />
      </Routes>

      {/* Auth UI */}
      <div style={{ marginBottom: 16 }}>
        {myArtist && <p>Artist: {myArtist.name}</p>}
        {user && <p>Like Count: {likeCount}</p>}
        {user && <p>Bought Like Count: {currentUser?.boughtLikesBalance}</p>}
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
