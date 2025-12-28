import { useState, useEffect } from 'react';
import { uploadImage, updateArtist } from './firebase.js';

export default function ArtistAccount({ myArtist }) {
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(myArtist?.name || '');
    const [location, setLocation] = useState(myArtist?.location || '');
    const [bio, setBio] = useState(myArtist?.bio || '');
    const [imageUrl, setImageUrl] = useState(myArtist?.artistImageUrl || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        setName(myArtist?.name || '');
        setLocation(myArtist?.location || '');
        setBio(myArtist?.bio || '');
        setImageUrl(myArtist?.artistImageUrl || '');
        setImageFile(null);
        setImagePreview('');
        setMessage('');
        setEditMode(false);
    }, [myArtist]);

    useEffect(() => {
      return () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
      };
    }, [imagePreview]);

    const onFileChange = (e) => {
        const file = e.target.files[0];
        setImageFile(file || null);
        if (file) setImagePreview(URL.createObjectURL(file));
        else setImagePreview('');
    };

    const onSave = async () => {
        if (!myArtist) return setMessage('No artist to update');
        const artistId = myArtist.id || myArtist.userId;
        if (!artistId) return setMessage('No artist id available');
        setSaving(true);
        setMessage('');
        try {
            let finalImageUrl = imageUrl;
            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile, `artists/${artistId}/${Date.now()}_${imageFile.name}`);
                setImageUrl(finalImageUrl);
                setImagePreview('');
                setImageFile(null);
            }
            await updateArtist(artistId, { name, location, bio, artistImageUrl: finalImageUrl });
            setMessage('Artist updated successfully');
            setEditMode(false);
        } catch (err) {
            console.error('Failed to update artist', err);
            setMessage(err.message || 'Error updating artist');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <h1>Artist Account</h1>
            {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
            {myArtist ? (
                !editMode ? (
                    <>
                        <h2>{name || 'Artist'}</h2>
                        <p><strong>Location:</strong> {location || 'Not specified'}</p>
                        <p><strong>Bio:</strong> {bio ? bio : 'No bio available'}</p>
                        {imageUrl ? <img src={imageUrl} alt={name || 'Artist Image'} style={{ maxWidth: '300px' }} /> : <div style={{ width: 300, height: 300, background: '#eee' }} />}
                        <div style={{ marginTop: 12 }}>
                            <button onClick={() => setEditMode(true)}>Edit</button>
                        </div>
                    </>
                ) : (
                    <>
                        <label>
                            Name
                            <input value={name} onChange={(e) => setName(e.target.value)} />
                        </label>
                        <br />
                        <label>
                            Location
                            <input value={location} onChange={(e) => setLocation(e.target.value)} />
                        </label>
                        <br />
                        <label>
                            Bio
                            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} cols={50} />
                        </label>
                        <br />
                        <label>
                            Image
                            <input type="file" accept="image/*" onChange={onFileChange} />
                        </label>
                        <br />
                        {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', display: 'block', marginTop: 8 }} />}
                        {!imagePreview && imageUrl && <img src={imageUrl} alt="Artist" style={{ maxWidth: '200px', display: 'block', marginTop: 8 }} />}
                        <div style={{ marginTop: 12 }}>
                            <button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                            <button onClick={() => { setEditMode(false); setMessage(''); }} disabled={saving} style={{ marginLeft: 8 }}>Cancel</button>
                        </div>
                    </>
                )
            ) : (
                <p>You are not currently logged in as an artist.</p>
            )}
        </div>
    );
}