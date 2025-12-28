import { useState, useEffect, use } from 'react';
import { Link } from 'react-router-dom';
import {subscribeAuth, fanToArtist, getRole, createArtist} from './firebase.js';



export default function ArtistRegistration({role, setRole, user, setUser}) {
    const [artistName, setArtistName] = useState('');
    const [artistBio, setArtistBio] = useState('');
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
      const unsub = subscribeAuth((u) => {
          setUser(u);
      });
      return () => unsub();
    }, []);

    const fetchRole = async () => {
        if (user) {
            const userRole = await getRole(user.uid);
            setRole(userRole);
        }
    };

    useEffect(() => {
      fetchRole();
    }, [user]);

  
    const upgradeToArtist = async (e) => {
    e.preventDefault();
    setAuthError(null);
      try {
        await fanToArtist();
        await createArtist(artistName, artistBio , user.uid);
        fetchRole();
        alert('Your account has been upgraded to an artist account!');
      } catch (err) {
        console.error('Could not upgrade to artist', err);
        setAuthError(err.message || 'Error upgrading to artist');
      }
    }


    return (
    <>
        <h1>Register as an artist</h1>
        <div style={{ marginBottom: 16 }}>
          {/* already an artist */}
            {user ? (
                role === 'artist' ? (
                <div>
                    <p>Hi <strong>{user.email}</strong></p>
                    <p>You are already signed in as an artist.</p>
                    <Link to="/">Take me back to the chart.</Link>
                </div>
                ):(
                  <div>
                  {/* currently a signed-in fan */}
                    <p>Hi <strong>{user.email}</strong></p>
                    <p>You are currently signed in as a fan.</p>
                    <p>Would you like to upload your own songs? Complete the following info to upgrade to an artist account.</p>
                    <Link to="/">I don't want an artist account. Take me back to the chart.</Link>
                      <form onSubmit={upgradeToArtist}>
                        <input value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Artist name" required/>
                        <textarea value={artistBio} onChange={(e) => setArtistBio(e.target.value)} placeholder="Artist bio" rows="7" cols="50" required/>
                        <button type="submit">Make me an artist</button>
                      </form>
                      {authError && <p style={{ color: 'red' }}>Error: {authError}</p>}

                </div>
                )
            ) : (
            <div>
                {/* not signed in */}
                <p>Please sign in or register below before you can upgrade to an artist account.</p>
            </div>
            )}
        </div>
    </>
    );
}