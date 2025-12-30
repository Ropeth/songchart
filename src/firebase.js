
import { initializeApp } from "firebase/app";
import { getFirestore, doc, collection, setDoc, getDoc, deleteDoc, updateDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { duration } from "@mui/material";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Read config from Vite environment variables (VITE_ prefix)
const env = import.meta.env;
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
];
const missing = requiredVars.filter(k => !env[k]);
if (missing.length) {
  console.warn(`Missing Firebase environment variables: ${missing.join(', ')}. Create a .env.local using .env.local.example or set them in your host environment.`);
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
const db = getFirestore(app);

export const storage = getStorage(app);

const getSong = async (songId) => {
  const songRef = doc(db, "songs", songId);
  const songSnap = await getDoc(songRef);
  if (songSnap.exists()) {
    return songSnap.data().title ?? "";
  } else {
    return null;
  }
}

const getAllSongs = async () => {
  try {
    const songsCol = collection(db, "songs");
    const songSnapshot = await getDocs(songsCol);
    const songList = songSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const songListWithArtists = await Promise.all(
        songList.map(async (song) => ({
            ...song,
            artist: await getArtistName(song.artistId)
        }))
    );
    return songListWithArtists; return songList;
  } catch (err) {
    console.error('Error fetching songs:', err);
    throw err;
  }
}

const getArtistSongs = async (artistId) => {
  try {
    const songsCol = collection(db, "songs");
    const songSnapshot = await getDocs(songsCol);
    const songList = songSnapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(song => song.artistId === artistId);
    const songListWithArtists = await Promise.all(
        songList.map(async (song) => ({
            ...song,
            artist: await getArtistName(song.artistId)
        }))
    );
    return songListWithArtists; 
  } catch (err) {
    console.error('Error fetching songs:', err);
    throw err;
  }
}

const getArtistName = async (artistId) => {
  const artistRef = doc(db, "artists", artistId);
  const artistSnap = await getDoc(artistRef);
  if (artistSnap.exists()) {
    return artistSnap.data().name ?? "";
  } else {
    return null;
  }
}

const getArtist = async (artistId) => {
  const artistRef = doc(db, "artists", artistId);
  const artistSnap = await getDoc(artistRef);
  if (artistSnap.exists()) {
    return artistSnap.data();
  } else {
    return null;
  }
}

const getArtistByUser = async (uid) => {
  const artistCol = collection(db, 'artists');
  const artistSnapshot = await getDocs(artistCol);
  const artistList = artistSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return artistList.find(artist => artist.userId === uid);
}

const uploadImage = async (file, path) => {
  if (!file) throw new Error('No file provided for upload');
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (err) {
    console.error('Error uploading file to storage:', err);
    throw err;
  }
};

const getRole = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data().role;
  } else {
    return null;
  }
}

const fanToArtist = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  const userRef = doc(db, 'users', user.uid);
  try {
    await updateDoc(userRef, { role: 'artist' });
  } catch (err) {
    console.error('Error upgrading user to artist:', err);
    throw err;
  }
}

const createArtist = async (artistName, bio, artistLocation, artistImageUrl, uid) => {
  console.log("create artist for user", uid);
  console.log(artistName, bio, artistLocation);
  try {
    const artistRef = await setDoc(doc(db, 'artists', uid), {
      name: artistName,
      location: artistLocation,
      bio: bio,
      artistImageUrl: artistImageUrl,
      userId: uid,
      createdAt: serverTimestamp()
    });
    return artistRef;
  } catch (err) {
    console.error('Error creating artist document:', err);
    throw err;
  }
}

const updateArtist = async (artistId, data) => {
  const artistRef = doc(db, 'artists', artistId); 
  try {
    await updateDoc(artistRef, data);
  } catch (err) {
    console.error('Error updating artist document:', err);
    throw err;
  }
}

const createSong = async ({ title, artistId, audioUrl, imageUrl } = {}) => {
  if (!artistId) throw new Error('Missing artistId when creating song');
  if (!title) throw new Error('Missing title when creating song');
  try {
    const songsCol = collection(db, 'songs');
    // Create a new document with an auto-generated ID
    const newSongRef = doc(songsCol);
    await setDoc(newSongRef, {
      title: title,
      artistId: artistId,
      audioUrl: audioUrl || '',
      imageUrl: imageUrl || '',
      createdAt: serverTimestamp()
    });
    return newSongRef.id;
  } catch (err) {
    console.error('Error creating song document:', err);
    throw err;
  }
}

const updateSong = async (songId, data) => {
  const songRef = doc(db, 'songs', songId);
  try {
    await updateDoc(songRef, data);
  } catch (err) {
    console.error('Error updating song document:', err);
    throw err;
  }
} 

const deleteSong = async (songId, audioUrl, imageUrl) => {
  const songRef = doc(db, 'songs', songId);
  try {
    // Delete the audio and image files from storage
    if (audioUrl) {
      const audioRef = ref(storage, audioUrl);
      try {
        await deleteObject(audioRef);
        // console.log("Audio deleted successfully");
      } catch (err) {
        console.error('Error deleting audio file:', err);
      }
    }
    if (imageUrl) {
      const imageRef = ref(storage, imageUrl);
      try {
        await deleteObject(imageRef);
        // console.log("Image deleted successfully");
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }
    await deleteDoc(songRef);
    console.log("Song document deleted successfully");
  } catch (err) {
    console.error('Error deleting song document:', err);
    throw err;
  }
}

const createPlay = async (songId, duration, userId) => {
  const playsCol = collection(db, 'plays');
  try {
    const newPlayRef = doc(playsCol);
    await setDoc(newPlayRef, {
      songId: songId,
      playedAt: serverTimestamp(),
      duration: duration,
      userId: userId,
    });
    return newPlayRef.id;
  } catch (err) {
    console.error('Error creating play document:', err);
    throw err;
  }
}

const updatePlay = async (playId, duration) => {
  const playRef = doc(db, 'plays', playId);
  try {
    await updateDoc(playRef, { duration: duration });
  } catch (err) {
    console.error('Error updating play document:', err);
    throw err;
  }
}

const createLiked = async (songId, userId) => {
  const likesCol = collection(db, 'likes');
  try {
    const newLikeRef = doc(likesCol);
    await setDoc(newLikeRef, {
      songId: songId,
      likedAt: serverTimestamp(),
      userId: userId,
    });
    return newLikeRef.id;
  } catch (err) {
    console.error('Error creating like document:', err);
    throw err;
  }
}

const removeLiked = async (likeId) => {
  const likeRef = doc(db, 'likes', likeId); 
  try {
    await deleteDoc(likeRef);
  } catch (err) {
    console.error('Error deleting like document:', err);
    throw err;
  }
}

const getLikedByUser = async (userId) => {
  try {
    const likesCol = collection(db, "likes");
    const likeSnapshot = await getDocs(likesCol);
    const likeList = likeSnapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(like => like.userId === userId);
    return likeList; 
  } catch (err) {
    console.error('Error fetching likes:', err);
    throw err;
  }
}

// const getLikedByUserToday = async (userId) => {
//   try {
//     const likesCol = collection(db, "likes");
//     const likeSnapshot = await getDocs(likesCol);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const likeList = likeSnapshot.docs
//       .map(d => ({ id: d.id, ...d.data() }))
//       .filter(like => like.userId === userId && like.likedAt.toDate() >= today);
//     return likeList; 
//   } catch (err) {
//     console.error('Error fetching likes:', err);
//     throw err;
//   }
// }    

const getLikedByUserToday = async (userId) => {
  try {
    const likesCol = collection(db, "likes");
    const likeSnapshot = await getDocs(likesCol);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter the docs first to keep the logic efficient
    const filteredDocs = likeSnapshot.docs.filter(d => {
      const data = d.data();
      return data.userId === userId && data.likedAt.toDate() >= today;
    });

    // Reduce the array into a single object: { songId: likeId }
    const likeMap = filteredDocs.reduce((acc, d) => {
      const data = d.data();
      acc[data.songId] = d.id; 
      return acc;
    }, {});

    return likeMap; 
  } catch (err) {
    console.error('Error fetching likes:', err);
    throw err;
  }
}

const updateLikeCount =async (userId, newLikeCount) => {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      likeCount: newLikeCount
    });
  } catch (err) {
    console.error('Error adding to newLikeCount to user', err);
    throw err;
  }
}

const getLikeCount = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data().likeCount || 0;  
  }
}

// Firebase Authentication helpers
const auth = getAuth(app);

const registerWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // create user document in users collection with role 'fan'
    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'fan',
        createdAt: serverTimestamp(),
        likeCount: 0,
      });
    } catch (err) {
      console.error('Error creating user document:', err);
      throw err;
    }
    return user;
  } catch (err) {
    console.error('Registration error:', err.code, err.message);
    throw err;
  }
}

const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

const signOutUser = async () => {
  await signOut(auth);
}

const subscribeAuth = (cb) => onAuthStateChanged(auth, cb);

const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (err) {
    console.error('Password reset error:', err);
    throw err;
  }
}

export { 
  db, 
  getSong, 
  getAllSongs, 
  getArtistSongs, 
  //
  getArtistName, 
  getArtist, getArtistByUser, 
  uploadImage, 
  getRole, 
  fanToArtist, 
  createArtist, 
  updateArtist, 
  //
  createSong, 
  updateSong, 
  deleteSong, 
  //
  createPlay, 
  updatePlay, 
  //
  createLiked,
  removeLiked,
  getLikedByUser,
  getLikedByUserToday,
  updateLikeCount,
  getLikeCount,
  auth, 
  registerWithEmail, 
  loginWithEmail, 
  signOutUser, 
  subscribeAuth, 
  sendPasswordReset, 
};
