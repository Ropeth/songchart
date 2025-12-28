import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {subscribeAuth, fanToArtist, getRole, createArtist, uploadImage} from './firebase.js';



export default function ArtistRegistration({role, setRole, user, setUser}) {
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

    const fetchRole = async () => {
        if (user) {
            const userRole = await getRole(user.uid);
            setRole(userRole);
        }
    };

    useEffect(() => {
      fetchRole();
    }, [user]);

  
    const upgradeToArtist = async (e) => {
    e.preventDefault();
    setAuthError(null);
      try {
        await fanToArtist();
        let uploadedImageUrl = '';
        if (artistImageFile) {
          // upload to Firebase Storage
          uploadedImageUrl = await uploadImage(artistImageFile, `artists/${user.uid}/${Date.now()}_${artistImageFile.name}`);
          setArtistImageUrl(uploadedImageUrl);
          setArtistImagePreview('');
        }
        // Note: createArtist expects (name, bio, location, imageUrl, uid)
        await createArtist(artistName, artistBio, artistLocation, uploadedImageUrl, user.uid);
        fetchRole();
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
            {user ? (
                role === 'artist' ? (
                <div>
                    <p>Hi <strong>{user.email}</strong></p>
                    <p>You are already signed in as an artist.</p>
                    <Link to="/">Take me back to the chart.</Link>
                </div>
                ):(
                  <div>
                  {/* currently a signed-in fan */}
                    <p>Hi <strong>{user.email}</strong></p>
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