import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {subscribeAuth, fanToArtist, createArtist, uploadImage} from './firebase.js';
import { useAuth } from "./AuthContext";


export default function ArtistRegistration({setUser}) {
    const { currentUser } = useAuth();
    const [artistName, setArtistName] = useState('');
    const [artistLocation, setArtistLocation] = useState('');
    const [artistImageUrl, setArtistImageUrl] = useState(''); // final uploaded URL
    const [artistImageFile, setArtistImageFile] = useState(null);
    const [artistImagePreview, setArtistImagePreview] = useState('');
    const [artistBio, setArtistBio] = useState('');
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
      const unsub = subscribeAuth((u) => {
          setUser(u);
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      return () => {
        if (artistImagePreview) {
          URL.revokeObjectURL(artistImagePreview);
        }
      };
    }, [artistImagePreview]);


    // useEffect(() => {
    //   fetchRole();
    // }, [user]);

  
    const upgradeToArtist = async (e) => {
    e.preventDefault();
    setAuthError(null);
      try {
        await fanToArtist();
        let uploadedImageUrl = '';
        if (artistImageFile) {
          // upload to Firebase Storage
          uploadedImageUrl = await uploadImage(artistImageFile, `artists/${currentUser?.uid}/${Date.now()}_${artistImageFile.name}`);
          setArtistImageUrl(uploadedImageUrl);
          setArtistImagePreview('');
        }
        // Note: createArtist expects (name, bio, location, imageUrl, uid)
        await createArtist(artistName, artistBio, artistLocation, uploadedImageUrl, currentUser?.uid);
        //fetchRole();
        alert('Your account has been upgraded to an artist account!');
      } catch (err) {
        console.error('Could not upgrade to artist', err);
        setAuthError(err.message || 'Error upgrading to artist');
      }
    }


    return (
    <>
        <h1>Register as an artist</h1>
        <div style={{ marginBottom: 16 }}>
          {/* already an artist */}
            {currentUser ? (
                currentUser?.role === 'artist' ? (
                <div>
                    <p>Hi <strong>{currentUser?.email}</strong></p>
                    <p>You are already signed in as an artist.</p>
                    <Link to="/">Take me back to the chart.</Link>
                </div>
                ):(
                  <div>
                  {/* currently a signed-in fan */}
                    <p>Hi <strong>{currentUser?.email}</strong></p>
                    <p>You are currently signed in as a fan.</p>
                    <p>Would you like to upload your own songs? Complete the following info to upgrade to an artist account.</p>
                    <Link to="/">I don't want an artist account. Take me back to the chart.</Link>
                      <form onSubmit={upgradeToArtist}>
                        <input value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Artist name *" required/>
                        <p>Select a UK county if you'd like to appear in regional searches</p>
                        {/* <input value={artistLocation} onChange={(e) => setArtistLocation(e.target.value)} placeholder="Artist location"/> */}
                        <select value={artistLocation} onChange={(e) => {setArtistLocation(e.target.value);console.log("selected location", e.target.value);}}>
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
                        <textarea value={artistBio} onChange={(e) => setArtistBio(e.target.value)} placeholder="Artist bio *" rows="7" cols="50" required/>
                        <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            setArtistImageFile(file);
                            if (file) {
                              const preview = URL.createObjectURL(file);
                              setArtistImagePreview(preview);
                              setArtistImageUrl('');
                            } else {
                              setArtistImagePreview('');
                            }
                          }} />
                          {artistImagePreview && <img src={artistImagePreview} alt="Preview" style={{maxWidth: '200px', display:'block', marginTop:8}} />}
                          {artistImageUrl && !artistImagePreview && <img src={artistImageUrl} alt="Artist" style={{maxWidth: '200px', display:'block', marginTop:8}} />}
                        <button type="submit">Make me an artist</button>
                      </form>
                      {authError && <p style={{ color: 'red' }}>Error: {authError}</p>}

                </div>
                )
            ) : (
            <div>
                {/* not signed in */}
                <p>Please sign in or register below before you can upgrade to an artist account.</p>
            </div>
            )}
        </div>
    </>
    );
}