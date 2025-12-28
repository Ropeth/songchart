import { useEffect, useState, useRef } from 'react';
import {getAllSongs} from './firebase.js';

import Song from './song.jsx';

export default function Home() {
  const [songs, setSongs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Playing state and audio refs (ensure only one song plays at a time)
  const [playingSongId, setPlayingSongId] = useState(null);
  const audioRefs = useRef({});

  const registerAudioRef = (id, el) => {
    if (el) {
      audioRefs.current[id] = el;
    } else {
      delete audioRefs.current[id];
    }
  };

  const handlePlay = (id) => {
    setPlayingSongId(id);
    // pause any other audio elements
    Object.entries(audioRefs.current).forEach(([key, audioEl]) => {
      if (String(key) !== String(id) && audioEl && !audioEl.paused) {
        audioEl.pause();
      }
    });
  };

  const handlePause = (id) => {
    setPlayingSongId(prev => (prev === id ? null : prev));
  };


  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAllSongs()
      .then(s => { if (!cancelled) setSongs(s) })
      .catch(err => { if (!cancelled) setError(err.message || 'Error fetching songs') })
      .finally(() => { if (!cancelled) setLoading(false) });

    return () => { cancelled = true };

  }, []);


  return (
    <>
  <h1>Chart</h1>
  {loading && <p>Loading…</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && songs.length === 0 && <p>No songs found</p>}
      {!loading && !error && songs.map((song) => (
        <Song
          key={song.id}
          id={song.id}
          audioUrl={song.audioUrl}
          imageUrl={song.imageUrl ?? ''}
          artist={song.artist ?? 'Unknown artist'}
          artistId={song.artistId}
          title={song.title ?? 'Unknown title'}
          isPlaying={playingSongId === song.id}
          onPlay={() => handlePlay(song.id)}
          onPause={() => handlePause(song.id)}
          registerAudioRef={(el) => registerAudioRef(song.id, el)}
        />
      ))}
      </>
);

}