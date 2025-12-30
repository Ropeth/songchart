import { useEffect, useState, useRef } from 'react';
import {getAllSongs} from './firebase.js';

import Song from './song.jsx';

export default function Home({userId, setLikeCount, likedSongs}) {
  const [songs, setSongs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [likedSongIds, setLikedSongIds] = useState([]);
  // const [likedBySong, setLikedBySong] = useState({});

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
    //console.log('handlePlay called for id', id);
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
    console.log(likedSongs);
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAllSongs()
      .then(s => { if (!cancelled) setSongs(s) })
      .catch(err => { if (!cancelled) setError(err.message || 'Error fetching songs') })
      .finally(() => { if (!cancelled) setLoading(false) });

    return () => { cancelled = true };

  }, [likedSongs]);

  // Normalize liked songs into an array of song IDs for quick lookups
  const likedSongIds = (likedSongs || []).map(l => {
    if (!l) return null;
    if (typeof l === 'string') return l;
    // l may be an object like { id, songId, userId }
    return l.songId ?? l.id ?? null;
  }).filter(Boolean);

  // Map songId -> likeId (if available)
  const likedBySong = (likedSongs || []).reduce((acc, l) => {
    if (!l || typeof l === 'string') return acc;
    const songId = l.songId ?? l.song?.id ?? null;
    const likeId = l.id ?? l.likeId ?? null;
    if (songId) acc[songId] = likeId ?? acc[songId] ?? null;
    return acc;
  }, {});

  return (
    <>
  <h1>Chart</h1>
  {/* <h3>Total time played this session: {timePlayed/60000}</h3> */}
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
          userId={userId}
          title={song.title ?? 'Unknown title'}
          isPlaying={playingSongId === song.id}
          onPlay={() => handlePlay(song.id)}
          onPause={() => handlePause(song.id)}
          registerAudioRef={(el) => registerAudioRef(song.id, el)}
          setLikeCount={setLikeCount}
          initialIsLiked={Boolean(likedBySong[song.id]) || likedSongIds.includes(song.id)}
          initialLikeId={likedBySong[song.id] ?? null}
        />
      ))}
      </>
);

}