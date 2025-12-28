
import reactLogo from './assets/react.svg'
import { useEffect, useRef } from 'react';
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

  const getBio = async () => {
    const thisArtistData = await getArtist(artistId);
    const thisArtistBio = thisArtistData?.bio || 'No bio available';
    return alert(`Artist: ${artist}\n\nBio: ${thisArtistBio}`);
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
    </div>
  );
}