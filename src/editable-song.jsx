
import { useEffect, useRef, useState } from 'react';
import {updateSong, deleteSong} from './firebase.js';


export default function EditableSong({ id, title, artist, artistId, audioUrl, isPlaying, onPlay, onPause, registerAudioRef, imageUrl, onDelete }) {
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

  // Editable fields
  const [editMode, setEditMode] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateSong(id, { title: localTitle });
      setMessage('Saved');
      setEditMode(false);
    } catch (e) {
      setMessage('Save failed: ' + (e.message || String(e)));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, audioUrl, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this song? This action cannot be undone.')) return; 
    try {
      await deleteSong(id, audioUrl, imageUrl);
      alert('Song deleted', id);
      // add a callback to inform the parent component about the deletion
      if (typeof onDelete === 'function') onDelete(id);
    } catch (e) {
      alert('Delete failed: ' + (e.message || String(e)));
    }
  };

  return (
    <div className={'songbox' + (isPlaying ? ' playing' : '')}>
      <audio ref={audioRef} controls src={audioUrl} style={{ width: "100%" }} onPlay={() => onPlay && onPlay()} onPause={() => onPause && onPause()}>
        Your browser does not support the audio element.
      </audio>
      <img src={imageUrl} className="songpic" alt={localTitle}/>
      {!editMode ? (
        <>
          <p>{localTitle}</p>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setEditMode(true)}>Edit title</button>
          </div>
        </>
      ) : (
        <>
          <input value={localTitle} onChange={e => setLocalTitle(e.target.value)} style={{ width: '100%', marginBottom:8 }} />
          <div>
            <button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => { setEditMode(false); setLocalTitle(title); }} style={{ marginLeft:8 }}>Cancel</button>
            {message && <span style={{ marginLeft: 8 }}>{message}</span>}
          </div>
        </>
      )}
      <button onClick={() => { handleDelete(id, audioUrl, imageUrl) }}>Delete song</button>
      {isPlaying && <span className='playing-badge'>Playing ▶</span>}
    </div>
  );
}