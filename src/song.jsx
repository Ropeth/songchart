
import { useEffect, useRef, useState } from 'react';
import {getArtist, createPlay, updatePlay, getLikeCount, addToLikeCount, createLiked, removeLiked} from './firebase.js';


export default function Song({ id, userId, title, artist, artistId, audioUrl, imageUrl, isPlaying, onPlay, onPause, registerAudioRef, setLikeCount }) {
  if (title == null) return <p>Song not found</p>;

  const audioRef = useRef(null);
  const [timeStarted, setTimeStarted] = useState(0);
  const [playedDuration, setPlayedDuration] = useState(0);
  const [currentPlayId, setCurrentPlayId] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState(null);

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
          const playId = await createPlay(id, 0, userId);
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
        setPlayedDuration(finalDuration);
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
    if (!isPlaying || !timeStarted || !currentPlayId) return;
    const intervalId = setInterval(() => {
      const dur = (Date.now() - timeStarted)/1000;
      setPlayedDuration(dur);
      //
      if(dur % 60 >= 58 || dur % 60 <= 2){
        getLikeCount(userId).then(likeCount => {
          if(likeCount < 100){
            console.log('Adding to like count for user', userId);
            addToLikeCount(userId, likeCount + 1).catch(err => console.error('Failed to add to like count:', err));
            setLikeCount(likeCount + 1);
          }
        }).catch(err => console.error('Failed to get like count:', err));
      }
      updatePlay(currentPlayId, dur).catch(err => console.error('Failed to periodically update play duration:', err));
    }, 10000);
    return () => clearInterval(intervalId);
  }, [isPlaying, timeStarted, currentPlayId]);

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
      {timeStarted}
      <audio ref={audioRef} controls src={audioUrl} style={{ width: "100%" }} onPlay={() => onPlay && onPlay()} onPause={() => onPause && onPause()}>
        Your browser does not support the audio element.
      </audio>
      <img src={imageUrl} className="songpic" alt={title}/>
      <p onClick={getBio}>{artist}</p>
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
      <button onClick={() => createLiked(userId, id).then(() => {
        alert('You liked this song!');
        setIsLiked(true);
      }).catch(err => {
        console.error('Failed to like song:', err);
        alert('Failed to like song.');
      })}>
        {isLiked ? '❤️' : '🤍'}
      </button>
    </div>
  );
}