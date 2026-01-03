import { increment } from "firebase/firestore";
import { useEffect, useRef, useState } from 'react';
import {getArtist, createPlay, updatePlay, updateLikeCount, 
  updateBoughtLikeCount, createLiked, createBoughtLiked, 
  removeLiked} from './firebase.js';
import { useAuth } from "./AuthContext";

export default function Song({ 
  id, title, artist, artistId, audioUrl, imageUrl, 
  isPlaying, onPlay, onPause, registerAudioRef, 
  initialIsFreeLikedToday, initialBoughtLikedToday, 
  initialLikeId}) {
  if (title == null) return <p>Song not found</p>;
  
  const { currentUser } = useAuth();
  const likeCountRef = useRef(currentUser?.likeCount);
  const audioRef = useRef(null);
  const [timeStarted, setTimeStarted] = useState(0);
  const [currentPlayId, setCurrentPlayId] = useState(null);
  const [isFreeLikedToday, setIsFreeLikedToday] = useState(initialIsFreeLikedToday || false);
  const [boughtLikedToday, setBoughtLikedToday] = useState(initialBoughtLikedToday || 0);
  const [likeId, setLikeId] = useState(initialLikeId || null);
  // Create a Ref to keep track of the count without triggering re-renders

  // Keep the Ref in sync whenever the user data changes
  useEffect(() => {
    likeCountRef.current = currentUser?.likeCount;
  }, [currentUser?.likeCount]);

  // Keep local liked state in sync if parent changes initialIsFreeLikedToday
  useEffect(() => {
    setIsFreeLikedToday(initialIsFreeLikedToday || false);
    setBoughtLikedToday(initialBoughtLikedToday || 0);
  }, [initialIsFreeLikedToday, initialBoughtLikedToday]);

  useEffect(() => {
    if (registerAudioRef) registerAudioRef(audioRef.current);
    return () => { if (registerAudioRef) registerAudioRef(null); };
  }, [registerAudioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
      setTimeStarted(Date.now());
      // Create play and store its id (await the promise so we store the actual id)
      (async () => {
        try {
          const playId = await createPlay(id, 0, currentUser?.uid);
          setCurrentPlayId(playId);
        } catch (e) {
          console.error('Failed to create play:', e);
        }
      })();
    } else {
      if (!audio.paused) audio.pause();
      if (timeStarted) {
        const finalDuration = Date.now() - timeStarted;
        console.log({timeStarted}, timeStarted);
        console.log({finalDuration}, finalDuration);
        if (currentPlayId) {
          updatePlay(currentPlayId, finalDuration).catch(err => console.error('Failed to update play duration:', err));
        }
        setTimeStarted(0);
    }
  }
  }, [isPlaying]);

  // Periodically update play duration every 10s while playing
  useEffect(() => {
    if (!isPlaying || !timeStarted || !currentPlayId || !currentUser?.uid) return;

    const intervalId = setInterval(() => {
      const dur = (Date.now() - timeStarted) / 1000;
      
      // Check the REF instead of the STATE
      if (dur % 60 >= 57 || dur % 60 <= 3) {
        if (likeCountRef.current < 100) {
          updateLikeCount(currentUser?.uid, increment(1));
        }
      }
      
      updatePlay(currentPlayId, dur).catch(err => console.error(err));
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isPlaying, timeStarted, currentPlayId, currentUser?.uid]);

  const [showModal, setShowModal] = useState(false);
  const [modalBio, setModalBio] = useState('');
  const [modalImgUrl, setModalImgUrl] = useState('');

  const getBio = async () => {
    try {
      const thisArtistData = await getArtist(artistId);
      const thisArtistBio = thisArtistData?.bio || 'No bio available';
      setModalImgUrl(thisArtistData?.artistImageUrl || '');
      setModalBio(thisArtistBio);
      setShowModal(true);
    } catch (e) {
      setModalBio('Unable to load artist bio.');
      setShowModal(true);
    }
  }

  return (
    <div className={'songbox' + (isPlaying ? ' playing' : '')}>
      <img src={imageUrl} className="songpic" alt={title}/>
      <audio ref={audioRef} controls src={audioUrl} controlsList="nodownload" style={{ width: "100%" }} onPlay={() => onPlay && onPlay()} onPause={() => onPause && onPause()}>
        Your browser does not support the audio element.
      </audio>
      <p className='artist' onClick={getBio}>{artist}</p>
      <p>{title}</p>
      {isPlaying && <span className='playing-badge'>Playing ▶</span>}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()} style={{background:'#fff',padding:20,borderRadius:8,maxWidth:'90%',maxHeight:'80%',overflowY:'auto',whiteSpace:'pre-wrap'}}>
            <button onClick={() => setShowModal(false)} style={{float:'right'}}>Close</button>
            <div>
              {modalImgUrl && <img src={modalImgUrl} alt={artist} style={{maxWidth:'100%',marginBottom:10}} />}
              <p>{modalBio}</p>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => {
        if (!currentUser?.uid) {
          alert("You must be logged in to like songs!");
          return;
        }
        if (isFreeLikedToday) {
          if (!likeId) {
            console.warn('No likeId to remove.');
            return;
          }
            //give user a like back, take it from the song
            removeLiked(likeId).then(() => {
              setIsFreeLikedToday(false);
              setLikeId(null);
              updateLikeCount(currentUser?.uid, currentUser.likeCount + 1).catch(err => console.error('Failed to increment like count:', err));
            }).catch(err => {
              console.error('Failed to unlike song:', err);
              alert('Failed to unlike song.');
            });
        } else {
          
            //take away a like from user, give it to the song
            if(currentUser.likeCount <= 0){
              alert('You do not have enough likes to like this song.');
              return;
            } 
            createLiked(id, currentUser?.uid).then((newLikeId) => {
              setIsFreeLikedToday(true);
              setLikeId(newLikeId);
              console.log('decrementing like count for user', currentUser?.uid);
              updateLikeCount(currentUser?.uid, currentUser.likeCount - 1).catch(err => console.error('Failed to decrement like count:', err));
            }).catch(err => {
              console.error('Failed to like song:', err);
              alert('Failed to like song.');
            });      
        }
      }}
      >
        {isFreeLikedToday ? '❤️' : '🤍'}
      </button>
      <button onClick={()=>{
        if(currentUser?.boughtLikesBalance > 0){
          let newBoughtLikedToday = boughtLikedToday + 1;
          setBoughtLikedToday(newBoughtLikedToday);
          updateBoughtLikeCount(currentUser?.uid, increment(-1));
          createBoughtLiked(id, currentUser?.uid);
        }
      }}>
        {boughtLikedToday}
      </button>
    </div>
  );
}