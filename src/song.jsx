
import reactLogo from './assets/react.svg'
import { useEffect, useRef } from 'react';

export default function Song({ id, title, artist, audioUrl, isPlaying, onPlay, onPause, registerAudioRef }) {
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

  return (
    <div className={'songbox' + (isPlaying ? ' playing' : '')}>
      <audio ref={audioRef} controls src={audioUrl} style={{ width: "100%" }} onPlay={() => onPlay && onPlay()} onPause={() => onPause && onPause()}>
        Your browser does not support the audio element.
      </audio>
      <img src={reactLogo} className="songpic" alt={title}/>
      <p>{artist}</p>
      <p>{title}</p>
      {isPlaying && <span className='playing-badge'>Playing ▶</span>}
    </div>
  );
}