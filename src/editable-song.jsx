
import { useEffect, useRef, useState } from 'react';
import {getArtist, updateSong, deleteSong} from './firebase.js';


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

  const [showModal, setShowModal] = useState(false);
  const [modalBio, setModalBio] = useState('');
  const [modalImgUrl, setModalImgUrl] = useState('');

  // Editable fields
  const [editMode, setEditMode] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localAudioUrl, setLocalAudioUrl] = useState(audioUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLocalTitle(title);
    setLocalAudioUrl(audioUrl);
  }, [title, audioUrl]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateSong(id, { title: localTitle, audioUrl: localAudioUrl });
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
      // Optionally, you can add a callback here to inform the parent component about the deletion
      if (typeof onDelete === 'function') onDelete(id);
    } catch (e) {
      alert('Delete failed: ' + (e.message || String(e)));
    }
  };

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
      <audio ref={audioRef} controls src={localAudioUrl} style={{ width: "100%" }} onPlay={() => onPlay && onPlay()} onPause={() => onPause && onPause()}>
        Your browser does not support the audio element.
      </audio>
      <img src={imageUrl} className="songpic" alt={localTitle}/>
      <p onClick={getBio}>{artist}</p>
      {!editMode ? (
        <>
          <p>{localTitle}</p>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setEditMode(true)}>Edit</button>
          </div>
        </>
      ) : (
        <>
          <input value={localTitle} onChange={e => setLocalTitle(e.target.value)} style={{ width: '100%', marginBottom:8 }} />
          <input value={localAudioUrl} onChange={e => setLocalAudioUrl(e.target.value)} style={{ width: '100%', marginBottom:8 }} />
          <div>
            <button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => { setEditMode(false); setLocalTitle(title); setLocalAudioUrl(audioUrl); }} style={{ marginLeft:8 }}>Cancel</button>
            {message && <span style={{ marginLeft: 8 }}>{message}</span>}
          </div>
        </>
      )}
      <button onClick={() => { handleDelete(id, audioUrl, imageUrl) }}>Delete</button>
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