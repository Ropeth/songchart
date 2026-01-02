import { useEffect, useState } from 'react';
import { db, auth } from './firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const [status, setStatus] = useState('processing'); // 'processing' | 'confirmed'
  const navigate = useNavigate();

 useEffect(() => {
  // Use onAuthStateChanged to ensure we have a valid session first
  const authUnsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("Auth confirmed, starting listener for:", user.uid);
      
      const docRef = doc(db, "users", user.uid);
      
      const snapUnsubscribe = onSnapshot(docRef, (docSnap) => {
        const data = docSnap.data();
        if (data && data.boughtLikesBalance > 0) {
          setStatus('confirmed');
        }
      }, (error) => {
        // This catches the permission error specifically
        console.error("Snapshot failed:", error);
      });

      return () => snapUnsubscribe();
    }
  });

  return () => authUnsubscribe();
}, []);

  return (
    <div className="payment-status-container" style={{ textAlign: 'center', padding: '50px' }}>
      {status === 'processing' ? (
        <>
          <div className="spinner"></div> {/* Add your CSS spinner here */}
          <h2>Verifying your payment...</h2>
          <p>We're just waiting for Stripe to confirm your likes. Don't refresh the page.</p>
        </>
      ) : (
        <>
          <h2 style={{ color: 'green' }}>Success!</h2>
          <p>Your 10 Likes have been added to your account.</p>
          <button onClick={() => navigate('/')}>Back to Music</button>
        </>
      )}
    </div>
  );
}