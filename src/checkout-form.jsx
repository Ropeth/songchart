import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function CheckoutForm({ userId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "http://localhost:5173/payment-success", // Where to go after payment
      },
    });

    if (error) setMessage(error.message);
  };

  return (
    <>
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe} className="buy-button">Pay £1.50</button>
      {message && <div>{message}</div>}
    </form>
    </>
  );
}