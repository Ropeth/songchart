import EditableSong from "./editable-song";
import { useEffect, useState, useRef } from 'react';
import {getArtistSongs} from './firebase.js';

export default function ManageSongs({ myArtist }) {
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
        // If artist isn't loaded yet (e.g., on page reload), skip fetching and clear state
        if (!myArtist?.id) {
            setSongs([]);
            setLoading(false);
            setError(null);
            return () => { cancelled = true };
        }

        setLoading(true);
        setError(null);
        getArtistSongs(myArtist.id)
        .then(s => { if (!cancelled) setSongs(s) })
        .catch(err => { if (!cancelled) setError(err.message || 'Error fetching songs') })
        .finally(() => { if (!cancelled) setLoading(false) });

        return () => { cancelled = true };

    }, [myArtist?.id]);

    return(
        <>
        <h1>My Songs</h1>
        {loading && <p>Loading…</p>}
        {error && <p>Error: {error}</p>}
        {!loading && !error && songs.length === 0 && <p>No songs found</p>}
        {!loading && !error && songs.map((song) => (
            <EditableSong
            key={song.id}
            id={song.id}
            audioUrl={song.audioUrl}
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
    )
}