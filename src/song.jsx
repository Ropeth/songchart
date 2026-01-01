
import { useEffect, useRef, useState } from 'react';
import {getArtist, createPlay, updatePlay, getLikeCount, updateLikeCount, updateBoughtLikeCount, createLiked, removeLiked} from './firebase.js';


export default function Song({ id, userId, title, artist, artistId, audioUrl, imageUrl, isPlaying, onPlay, onPause, registerAudioRef, setLikeCount, setBoughtLikeCount, initialIsFreeLikedToday, initialBoughtLikedToday, initialLikeId }) {
  if (title == null) return <p>Song not found</p>;

  const audioRef = useRef(null);
  const [timeStarted, setTimeStarted] = useState(0);
  const [playedDuration, setPlayedDuration] = useState(0);
  const [currentPlayId, setCurrentPlayId] = useState(null);
  const [isFreeLikedToday, setIsFreeLikedToday] = useState(initialIsFreeLikedToday || false);
  const [boughtLikedToday, setBoughtLikedToday] = useState(initialBoughtLikedToday || 0);
  const [likeId, setLikeId] = useState(initialLikeId || null);

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
            updateLikeCount(userId, likeCount + 1).catch(err => console.error('Failed to add to like count:', err));
            setLikeCount(likeCount + 1);
          } else {
            console.log('User', userId, 'has maxed out like count at', likeCount);
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
        if (isFreeLikedToday) {
          if (!likeId) {
            console.warn('No likeId to remove.');
            return;
          }
            //give user a like back, take it from the song
            getLikeCount(userId).then(likeCount => {

            removeLiked(likeId).then(() => {
              setIsFreeLikedToday(false);
              setLikeId(null);
              updateLikeCount(userId, likeCount + 1).catch(err => console.error('Failed to increment like count:', err));
              setLikeCount(likeCount + 1); 
            }).catch(err => {
              console.error('Failed to unlike song:', err);
              alert('Failed to unlike song.');
            });
          }).catch(err => console.error('Failed to get like count:', err));
        } else {
          
          getLikeCount(userId).then(likeCount => {
            //take away a like from user, give it to the song
            if(likeCount <= 0){
              alert('You do not have enough likes to like this song.');
              return;
            } 
            createLiked(id, userId).then((newLikeId) => {
              setIsFreeLikedToday(true);
              setLikeId(newLikeId);
              console.log('decrementing like count for user', userId);
              updateLikeCount(userId, likeCount - 1).catch(err => console.error('Failed to decrement like count:', err));
              setLikeCount(likeCount - 1);                
            }).catch(err => {
              console.error('Failed to like song:', err);
              alert('Failed to like song.');
            });      
          }).catch(err => console.error('Failed to get like count:', err));
        }
      }}
      >
        {isFreeLikedToday ? '❤️' : '🤍'}
      </button>
      <button onClick={()=>{}}>
        {boughtLikedToday}
      </button>
      {/* <button onClick={() => {
        if (songPaidLikes>0) {
          if (!boughtLikeIds || boughtLikeIds.length === 0) {
            console.warn('No likeId to remove.');
            return;
          }
            //give user a like back, take it from the song
            getBoughtLikeCount(userId).then(boughtLikeCount => {

            removeLiked(likeId).then(() => {
              setIsLiked(false);
              setLikeId(null);
              updateBoughtLikeCount(userId, boughtLikeCount + 1).catch(err => console.error('Failed to increment like count:', err));
              setBoughtLikeCount(boughtLikeCount + 1); 
            }).catch(err => {
              console.error('Failed to unlike song:', err);
              alert('Failed to unlike song.');
            });
          }).catch(err => console.error('Failed to get boughtlike count:', err));
        } else {
          
          getBoughtLikeCount(userId).then(boughtLikeCount => {
            //take away a like from user, give it to the song
            if(boughtLikeCount <= 0){
              alert('You do not have enough likes to like this song.');
              return;
            } 
            createLiked(id, userId).then((newLikeId) => {
              setIsLiked(true);
              setLikeId(newLikeId);
              console.log('decrementing like count for user', userId);
              updateBoughtLikeCount(userId, boughtLikeCount - 1).catch(err => console.error('Failed to decrement like count:', err));
              setBoughtLikeCount(boughtLikeCount - 1);                
            }).catch(err => {
              console.error('Failed to like song:', err);
              alert('Failed to like song.');
            });      
          }).catch(err => console.error('Failed to get bought like count:', err));
        }
      }}
      >
        {songPaidLikes>0 ? '❤️' : '🤍'}
      </button> */}
    </div>
  );
}