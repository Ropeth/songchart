import EditableSong from "./editable-song";
import {useEffect, useState, useRef } from 'react';
import {uploadImage, getArtistSongs, createSong} from './firebase.js';

export default function ManageSongs({ myArtist, user }) {
    const [songs, setSongs] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
    const [songImageUrl, setSongImageUrl] = useState(''); // final uploaded URL
    const [songImageFile, setSongImageFile] = useState(null);
    const [songImagePreview, setSongImagePreview] = useState('');
    const [songAudioUrl, setSongAudioUrl] = useState(''); // final uploaded audio URL
    const [songAudioFile, setSongAudioFile] = useState(null);
    const [songAudioPreview, setSongAudioPreview] = useState('');
    const [songAudioError, setSongAudioError] = useState(null);
    const [newSongTitle, setNewSongTitle] = useState('');
    const [addingSong, setAddingSong] = useState(false);
    const [addSongError, setAddSongError] = useState(null);
    

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

    // Clean up any created object URLs for previews to avoid memory leaks
    useEffect(() => {
        return () => {
            if (songImagePreview) URL.revokeObjectURL(songImagePreview);
            if (songAudioPreview) URL.revokeObjectURL(songAudioPreview);
        };
    }, [songImagePreview, songAudioPreview]);

    const handleAddSong = async (e) => {
        setAddSongError(null);
        setAddingSong(true);
        try {
            let uploadedImageUrl = '';  
            let uploadedAudioUrl = '';
            if (songImageFile) {
                // upload image to Firebase Storage
                console.log(`songs/${user.uid}/${Date.now()}_${songImageFile.name}`);
                uploadedImageUrl = await uploadImage(songImageFile, `songs/${user.uid}/${Date.now()}_${songImageFile.name}`);
                setSongImageUrl(uploadedImageUrl);
                setSongImagePreview('');
            }
            // Defensive check: ensure audio file still meets size constraints
            if (songAudioFile && songAudioFile.size > MAX_AUDIO_SIZE) {
                setSongAudioError('Audio file must be 10MB or smaller');
                setAddingSong(false);
                return;
            }
            if (songAudioFile) {
                // upload audio to Firebase Storage
                console.log(`songs/${user.uid}/audio_${Date.now()}_${songAudioFile.name}`);
                uploadedAudioUrl = await uploadImage(songAudioFile, `songs/${user.uid}/audio_${Date.now()}_${songAudioFile.name}`);
                setSongAudioUrl(uploadedAudioUrl);
                setSongAudioPreview('');
            }
            await createSong({
                title: newSongTitle,
                artistId: myArtist.id,
                audioUrl: uploadedAudioUrl,
                imageUrl: uploadedImageUrl,
            });
            // Clear form
            setSongImageFile(null);
            setSongImagePreview('');
            setSongImageUrl('');
            setSongAudioFile(null);
            setSongAudioPreview('');
            setSongAudioUrl('');
            setNewSongTitle('');
            // Refresh song list
            const updatedSongs = await getArtistSongs(myArtist.id);
            setSongs(updatedSongs);
        } catch (e) {
            setAddSongError(e.message || 'Error adding song');
        } finally {
            setAddingSong(false);
        }
    };



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
            imageUrl={song.imageUrl}
            artist={song.artist ?? 'Unknown artist'}
            artistId={song.artistId}
            title={song.title ?? 'Unknown title'}
            isPlaying={playingSongId === song.id}
            onPlay={() => handlePlay(song.id)}
            onPause={() => handlePause(song.id)}
            registerAudioRef={(el) => registerAudioRef(song.id, el)}
            onDelete={() => setSongs(prev => prev.filter(s => s.id !== song.id))}
            />
        ))}
        <form action={handleAddSong}>
            <h2>Add New Song</h2>
            <label style={{display:'block', marginTop:8}}>
            Upload image — max 5MB:
            <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                setSongImageFile(file);
                if (file) {
                    const preview = URL.createObjectURL(file);
                    setSongImagePreview(preview);
                    setSongImageUrl('');
                } else {
                    setSongImagePreview('');
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image file must be 5MB or smaller');
                    setSongImageFile(null);
                    setSongImagePreview('');
                }
            }} required/>
            </label>

            {songImagePreview && <img src={songImagePreview} alt="Preview" style={{maxWidth: '200px', display:'block', marginTop:8}} />}
            {songImageUrl && !songImagePreview && <img src={songImageUrl} alt={myArtist.artistId} style={{maxWidth: '200px', display:'block', marginTop:8}} />}

            <label style={{display:'block', marginTop:8}}>
              Upload audio (mp3, wav) — max 10MB:
              <input type="file" accept="audio/*" onChange={(e) => {
                  setSongAudioError(null);
                  const file = e.target.files[0];
                  if (!file) {
                      setSongAudioFile(null);
                      if (songAudioPreview) { URL.revokeObjectURL(songAudioPreview); setSongAudioPreview(''); }
                      return;
                  }
                  if (file.size > MAX_AUDIO_SIZE) {
                      setSongAudioError('Audio file must be 10MB or smaller');
                      setSongAudioFile(null);
                      if (songAudioPreview) { URL.revokeObjectURL(songAudioPreview); setSongAudioPreview(''); }
                      return;
                  }
                  if (songAudioPreview) { URL.revokeObjectURL(songAudioPreview); }
                  setSongAudioFile(file);
                  const preview = URL.createObjectURL(file);
                  setSongAudioPreview(preview);
                  setSongAudioUrl('');
              }} required/>
            </label>
            {songAudioError && <p style={{color:'red', marginTop:4}}>{songAudioError}</p>}
            {songAudioPreview && <audio controls src={songAudioPreview} style={{display:'block', marginTop:8}} />}
            {songAudioUrl && !songAudioPreview && <audio controls src={songAudioUrl} style={{display:'block', marginTop:8}} />}

            <input type="text" placeholder="Song Title" value={newSongTitle} onChange={(e) => setNewSongTitle(e.target.value)} required/>
            <button type="submit" disabled={addingSong || !!songAudioError}>{addingSong ? 'Adding…' : 'Add Song'}</button>
            {addSongError && <p style={{color:'red'}}>Error: {addSongError}</p>}    
        </form>
        </>
    )
}