
import reactLogo from './assets/react.svg'
import { useEffect, useRef, useState } from 'react';
import {getArtist} from './firebase.js';


export default function Song({ id, title, artist, artistId, audioUrl, isPlaying, onPlay, onPause, registerAudioRef }) {
  if (title == null) return <p>Song not found</p>;

  const audioRef = useRef(null);

  useEffect(() => {
    if (registerAudioRef) registerAudioRef(audioRef.current);
    return () => { if (registerAudioRef) registerAudioRef(null); };
  }, [registerAudioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      if (!audio.paused) audio.pause();
    }
  }, [isPlaying]);

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
      <audio ref={audioRef} controls src={audioUrl} style={{ width: "100%" }} onPlay={() => onPlay && onPlay()} onPause={() => onPause && onPause()}>
        Your browser does not support the audio element.
      </audio>
      <img src={reactLogo} className="songpic" alt={title}/>
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
    </div>
  );
}