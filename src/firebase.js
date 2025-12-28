
import { initializeApp } from "firebase/app";
import { getFirestore, doc, collection, setDoc, getDoc, updateDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

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
            artist: await getArtist(song.artistId)
        }))
    );
    return songListWithArtists; return songList;
  } catch (err) {
    console.error('Error fetching songs:', err);
    throw err;
  }
}

const getArtist = async (artistId) => {
  const artistRef = doc(db, "artists", artistId);
  const artistSnap = await getDoc(artistRef);
  if (artistSnap.exists()) {
    return artistSnap.data().name ?? "";
  } else {
    return null;
  }
}

export const storage = getStorage(app);

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
const getArtistByUser = async (uid) => {
  const artistCol = collection(db, 'artists');
  const artistSnapshot = await getDocs(artistCol);
  const artistList = artistSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return artistList.find(artist => artist.userId === uid);
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
        createdAt: serverTimestamp()
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

export { getSong, getAllSongs, getArtist, createArtist, getRole, getArtistByUser, uploadImage, db, auth, registerWithEmail, loginWithEmail, signOutUser, subscribeAuth, sendPasswordReset, fanToArtist };
