import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './checkout-form';


// Replace with your actual Publishable Key from Stripe Dashboard
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function Shop({ userId }) {
  const [clientSecret, setClientSecret] = useState('');

useEffect(() => {
  // Get the URL from your environment variables
  const functionUrl = import.meta.env.VITE_STRIPE_FUNCTION_URL;

  if (!functionUrl || functionUrl.includes("YOUR_CLOUD_FUNCTION_URL")) {
    console.error("Error: The Cloud Function URL is not set in .env.local");
    return;
  }

  fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: userId }),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => setClientSecret(data.clientSecret))
    .catch((err) => console.error("Fetch error:", err));
}, [userId]);

  const appearance = { theme: 'stripe' };
  const options = { clientSecret, appearance };

  return (
    <div className="shop-container">
      <h2>Support Artists on IndyBop</h2>
      <p>Buy 10 Likes for £1.50</p>
      
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm userId={userId} />
        </Elements>
      )}
    </div>
  );
}