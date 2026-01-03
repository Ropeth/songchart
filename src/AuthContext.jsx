import { createContext, useContext, useState, useEffect } from "react";
import { auth, subscribeToUserDoc } from "./firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Start real-time sync with Firestore
        unsubscribeSnapshot = subscribeToUserDoc(user.uid, (userData) => {
          setCurrentUser({ ...user, ...userData });
          setLoading(false);
        });
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);