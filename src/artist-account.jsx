import { useState, useEffect } from 'react';
import { uploadImage, updateArtist } from './firebase.js';
import GiftsPanel from './gifts-panel.jsx';

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
                        <GiftsPanel artistData={myArtist} userId={myArtist.userId}/>

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
                                <option>Bedfordshire</option>
                                <option>Berkshire</option>
                                <option>Bristol</option>
                                <option>Buckinghamshire</option>
                                <option>Cambridgeshire</option>
                                <option>Cheshire</option>
                                <option>Cornwall</option>
                                <option>County Durham</option>
                                <option>Cumbria</option>
                                <option>Derbyshire</option>
                                <option>Devon</option>
                                <option>Dorset</option>
                                <option>East Riding of Yorkshire</option>
                                <option>East Sussex</option>
                                <option>Essex</option>
                                <option>Gloucestershire</option>
                                <option>Greater London</option>
                                <option>Greater Manchester</option>
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
                                <option>Norfolk</option>
                                <option>North Somerset</option>
                                <option>North Humberside</option>
                                <option>North Yorkshire</option>
                                <option>Northamptonshire</option>
                                <option>Northumberland</option>
                                <option>Nottinghamshire</option>
                                <option>Oxfordshire</option>
                                <option>Rutland</option>
                                <option>Shropshire</option>
                                <option>Somerset</option>
                                <option>South Gloucestershire</option>
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
                                <option>Argyll and Bute</option>
                                <option>Ayrshire</option>
                                <option>Banffshire</option>
                                <option>Berwickshire</option>
                                <option>Caithness</option>
                                <option>Clackmannanshire</option>
                                <option>Dumfries and Galloway</option>
                                <option>East Ayrshire</option>
                                <option>East Dunbartonshire</option>
                                <option>East Lothian</option>
                                <option>East Renfrewshire</option>
                                <option>Fife</option>
                                <option>Highland</option>
                                <option>Inverclyde</option>
                                <option>Kincardineshire</option>
                                <option>Lanarkshire</option>
                                <option>Midlothian</option>
                                <option>Moray</option>
                                <option>North Ayrshire</option>
                                <option>North Lanarkshire</option>
                                <option>Orkney</option>
                                <option>Perth and Kinross</option>
                                <option>Renfrewshire</option>
                                <option>Scottish Borders</option>
                                <option>Shetland</option>
                                <option>South Ayrshire</option>
                                <option>Stirlingshire</option>
                                <option>West Dunbartonshire</option>
                                <option>West Lothian</option>
                                <option>Western Isles</option>
                            </optgroup>
                            <optgroup label="Wales">
                                <option>Blaenau Gwent</option>
                                <option>Bridgend</option>
                                <option>Caerphilly</option>
                                <option>Cardiff</option>
                                <option>Carmarthenshire</option>
                                <option>Ceredigion</option>
                                <option>Conwy</option>
                                <option>Denbighshire</option>
                                <option>Flintshire</option>
                                <option>Gwynedd</option>
                                <option>Isle of Anglesey</option>
                                <option>Merthyr Tydfil</option>
                                <option>Monmouthshire</option>
                                <option>Neath Port Talbot</option>
                                <option>Newport</option>
                                <option>Pembrokeshire</option>
                                <option>Powys</option>
                                <option>Rhondda Cynon Taff</option>
                                <option>Swansea</option>
                                <option>Torfaen</option>
                                <option>Vale of Glamorgan</option>
                                <option>Wrexham</option>
                            </optgroup>
                            <optgroup label="Northern Ireland">
                                <option>Antrim</option>
                                <option>Armagh</option>
                                <option>County Down</option>
                                <option>Fermanagh</option>
                                <option>Londonderry</option>
                                <option>Tyrone</option>
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