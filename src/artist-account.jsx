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
                            <select value={location} onChange={(e) => setLocation(e.target.value)}>
                            <option value="">--Select County--</option>
                            <optgroup label="England">
                                <option>Avon</option>
                                <option>Bedfordshire</option>
                                <option>Berkshire</option>
                                <option>Buckinghamshire</option>
                                <option>Cambridgeshire</option>
                                <option>Cheshire</option>
                                <option>Cleveland</option>
                                <option>Cornwall</option>
                                <option>County Durham</option>
                                <option>Cumbria</option>
                                <option>Derbyshire</option>
                                <option>Devon</option>
                                <option>Dorset</option>
                                <option>East Sussex</option>
                                <option>Essex</option>
                                <option>Gloucestershire</option>
                                <option>Hampshire</option>
                                <option>Herefordshire</option>
                                <option>Hertfordshire</option>
                                <option>Isle of Wight</option>
                                <option>Kent</option>
                                <option>Lancashire</option>
                                <option>Leicestershire</option>
                                <option>Lincolnshire</option>
                                <option>London</option>
                                <option>Merseyside</option>
                                <option>Middlesex</option>
                                <option>Norfolk</option>
                                <option>North Humberside</option>
                                <option>North Yorkshire</option>
                                <option>Northamptonshire</option>
                                <option>Northumberland</option>
                                <option>Nottinghamshire</option>
                                <option>Oxfordshire</option>
                                <option>Shropshire</option>
                                <option>Somerset</option>
                                <option>South Humberside</option>
                                <option>South Yorkshire</option>
                                <option>Staffordshire</option>
                                <option>Suffolk</option>
                                <option>Surrey</option>
                                <option>Tyne and Wear</option>
                                <option>Warwickshire</option>
                                <option>West Midlands</option>
                                <option>West Sussex</option>
                                <option>West Yorkshire</option>
                                <option>Wiltshire</option>
                                <option>Worcestershire</option>
                            </optgroup>
                            <optgroup label="Scotland">
                                <option>Aberdeenshire</option>
                                <option>Angus</option>
                                <option>Argyll</option>
                                <option>Ayrshire</option>
                                <option>Banffshire</option>
                                <option>Berwickshire</option>
                                <option>Caithness</option>
                                <option>Clackmannanshire</option>
                                <option>Dumfriesshire</option>
                                <option>Dunbartonshire</option>
                                <option>East Lothian</option>
                                <option>Fife</option>
                                <option>Inverness-shire</option>
                                <option>Isle of Arran</option>
                                <option>Isle of Barra</option>
                                <option>Isle of Benbecula</option>
                                <option>Isle of Bute</option>
                                <option>Isle of Canna</option>
                                <option>Isle of Coll</option>
                                <option>Isle of Colonsay</option>
                                <option>Isle of Cumbrae</option>
                                <option>Isle of Eigg</option>
                                <option>Isle of Gigha</option>
                                <option>Isle of Harris</option>
                                <option>Isle of Iona</option>
                                <option>Isle of Islay</option>
                                <option>Isle of Jura</option>
                                <option>Isle of Lewis</option>
                                <option>Isle of Mull</option>
                                <option>Isle of North Uist</option>
                                <option>Isle of Rhum</option>
                                <option>Isle of Scalpay</option>
                                <option>Isle of Skye</option>
                                <option>Isle of South Uist</option>
                                <option>Isle of Tiree</option>
                                <option>Kincardineshire</option>
                                <option>Kinross-shire</option>
                                <option>Kirkcudbrightshire</option>
                                <option>Lanarkshire</option>
                                <option>Midlothian</option>
                                <option>Morayshire</option>
                                <option>Nairnshire</option>
                                <option>Orkney</option>
                                <option>Peeblesshire</option>
                                <option>Perthshire</option>
                                <option>Renfrewshire</option>
                                <option>Ross-shire</option>
                                <option>Roxburghshire</option>
                                <option>Selkirkshire</option>
                                <option>Shetland</option>
                                <option>Stirlingshire</option>
                                <option>Sutherland</option>
                                <option>West Lothian</option>
                                <option>Wigtownshire</option>
                            </optgroup>
                            <optgroup label="Wales">
                                <option>Clwyd</option>
                                <option>Dyfed</option>
                                <option>Gwent</option>
                                <option>Gwynedd</option>
                                <option>Mid Glamorgan</option>
                                <option>South Glamorgan</option>
                                <option>Powys</option>
                                <option>West Glamorgan</option>
                            </optgroup>
                            <optgroup label="Northern Ireland">
                                <option>County Antrim</option>
                                <option>County Armagh</option>
                                <option>County Down</option>
                                <option>County Fermanagh</option>
                                <option>County Londonderry</option>
                                <option>County Tyrone</option>
                            </optgroup>
                            </select>
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